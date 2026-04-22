import { Client, MessageMedia, WAState } from 'whatsapp-web.js';
import type { Message } from 'whatsapp-web.js';
import qrcodeTerminal from 'qrcode-terminal';
import QRCode from 'qrcode';
import axios from 'axios';
import type { IncomingMessagePayload } from './types';
import { MongoAuth } from './auth/MongoAuth';

const API_URL = process.env.API_URL || 'http://localhost:8001';
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY_MS = 5000;

let readyResolve: (() => void) | null = null;
const readyPromise = new Promise<void>((resolve) => {
  readyResolve = resolve;
});

let reconnectAttempts = 0;
let isShuttingDown = false;

// Store the latest QR code for remote access
let currentQrData: { qr: string; base64Image: string | null; generatedAt: string } | null = null;

const mongoAuth = new MongoAuth();

const client = new Client({
  authStrategy: mongoAuth as any,
  puppeteer: {
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu',
    ],
  },
});

client.on('qr', async (qr: string) => {
  console.log('\n⚡ Scan the QR code below to authenticate WhatsApp:\n');
  qrcodeTerminal.generate(qr, { small: true });

  // Generate base64 PNG image for remote access
  try {
    const base64Image = await QRCode.toDataURL(qr, { width: 400, margin: 2 });
    currentQrData = {
      qr,
      base64Image,
      generatedAt: new Date().toISOString(),
    };
    console.log('📱 QR Code saved for remote access at GET /qr');
  } catch (err: any) {
    console.error('Failed to generate QR image:', err.message);
    currentQrData = { qr, base64Image: null, generatedAt: new Date().toISOString() };
  }
});

client.on('ready', () => {
  console.log('✅ WhatsApp client is ready!');
  reconnectAttempts = 0;
  if (readyResolve) {
    readyResolve();
    readyResolve = null;
  }
});

client.on('authenticated', async (session: any) => {
  console.log('🔐 WhatsApp authenticated');
  currentQrData = null; // Clear QR code after auth
  // Save session to MongoDB
  await mongoAuth.save(session);
});

client.on('auth_failure', (msg: string) => {
  console.error('❌ WhatsApp authentication failure:', msg);
});

client.on('disconnected', async (reason: WAState | string) => {
  console.log('⚠️ WhatsApp disconnected:', reason);

  if (isShuttingDown) {
    console.log('🛑 Shutdown in progress, skipping reconnection');
    return;
  }

  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error(`❌ Max reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Giving up.`);
    process.exit(1);
  }

  reconnectAttempts++;
  const delay = RECONNECT_DELAY_MS * reconnectAttempts;
  console.log(`🔄 Reconnecting in ${delay}ms... (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);

  setTimeout(async () => {
    try {
      await client.initialize();
    } catch (err: any) {
      console.error('Reconnection failed:', err.message);
    }
  }, delay);
});

client.on('message_create', async (msg: Message) => {
  if (msg.fromMe) return;
  await handleIncomingMessage(msg);
});

async function handleIncomingMessage(msg: Message): Promise<void> {
  try {
    const chatId = msg.from;
    const isGroup = chatId.endsWith('@g.us');
    const chat = await msg.getChat();
    const contact = await msg.getContact();
    const pushname = contact.pushname || chat.name || 'Usuário';

    let messageText: string | null = msg.body || null;
    let fileBytes: string | null = null;
    let fileType: string | null = null;

    if (msg.hasMedia) {
      const media = await msg.downloadMedia();
      if (media && media.data) {
        fileBytes = media.data;
        const mimetype = media.mimetype || '';

        if (mimetype.startsWith('image/')) {
          fileType = 'image';
        } else if (mimetype.startsWith('audio/')) {
          fileType = 'audio';
        } else if (mimetype === 'application/pdf') {
          fileType = 'pdf';
        } else {
          fileType = 'document';
        }
      }
    }

    if (messageText || fileBytes) {
      const payload: IncomingMessagePayload = {
        chatId,
        platform: 'whatsapp',
        messageText: messageText ?? undefined,
        fileBytes: fileBytes ?? undefined,
        fileType: fileType ?? undefined,
        pushname,
        isGroup,
      };

      console.log(`📥 Incoming ${fileType || 'text'} from ${chatId}`);
      
      // Retry with backoff for server availability
      let lastError: any;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await axios.post(`${API_URL}/webhook/whatsapp`, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 120000,
          });
          break;
        } catch (err: any) {
          lastError = err;
          if (attempt < 3) {
            const delay = attempt * 2000;
            console.log(`⚠️  Attempt ${attempt} failed, retrying in ${delay}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }
      
      if (lastError) {
        throw lastError;
      }
    }
  } catch (err: any) {
    console.error('Error handling incoming message:', err.message);
  }
}

export async function sendMessage(chatId: string, text: string): Promise<void> {
  await readyPromise;
  try {
    await client.sendMessage(chatId, text);
    console.log(`📤 Text sent to ${chatId}`);
  } catch (err: any) {
    console.error('Error sending message:', err.message);
    throw err;
  }
}

export async function sendFile(chatId: string, base64File: string, filename: string, caption?: string): Promise<void> {
  await readyPromise;
  try {
    const media = new MessageMedia('application/pdf', base64File, filename);
    await client.sendMessage(chatId, media, { caption: caption || '' });
    console.log(`📤 File sent to ${chatId}`);
  } catch (err: any) {
    console.error('Error sending file:', err.message);
    throw err;
  }
}

export function getCurrentQrData(): typeof currentQrData {
  return currentQrData;
}

export async function initialize(): Promise<void> {
  try {
    await client.initialize();
  } catch (err: any) {
    console.error('Failed to initialize WhatsApp client:', err.message);
    throw err;
  }
}

export async function destroy(): Promise<void> {
  isShuttingDown = true;
  console.log('🛑 Shutting down WhatsApp client...');
  try {
    await client.destroy();
    await mongoAuth.disconnect();
    console.log('✅ WhatsApp client destroyed');
  } catch (err: any) {
    console.error('Error destroying client:', err.message);
  }
}

export { client, readyPromise };
