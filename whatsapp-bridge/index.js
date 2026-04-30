const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const express = require('express');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';
const API_KEY = process.env.WHATSAPP_API_KEY || 'bagcoin_webhook_secret_123';
const PORT = process.env.PORT || 3001;

// Deduplicação em memória (message_id -> timestamp)
const processedMessages = new Map();
const DEDUP_TTL_MS = 30 * 1000; // 30 segundos

function isDuplicate(msgId) {
    if (!msgId) return false;
    const now = Date.now();
    // Limpa entradas antigas
    for (const [id, ts] of processedMessages.entries()) {
        if (now - ts > DEDUP_TTL_MS) {
            processedMessages.delete(id);
        }
    }
    if (processedMessages.has(msgId)) {
        return true;
    }
    processedMessages.set(msgId, now);
    return false;
}

/**
 * Remove arquivos de lock do Chromium que ficam pendentes quando
 * o container é destruído e recriado. Evita o erro:
 * "The profile appears to be in use by another Chromium process"
 * 
 * Busca recursivamente em todas as subpastas do profile.
 */
function cleanupChromiumLocks() {
    const sessionPath = './whatsapp-session';
    const lockFiles = ['SingletonLock', 'SingletonCookie', 'SingletonSocket'];

    function walk(dir) {
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    walk(fullPath);
                } else if (lockFiles.includes(entry.name)) {
                    try {
                        fs.unlinkSync(fullPath);
                        console.log(`🔓 Lock removido: ${fullPath}`);
                    } catch (err) {
                        console.warn(`⚠️ Não consegui remover lock ${fullPath}:`, err.message);
                    }
                }
            }
        } catch (err) {
            // Diretório pode não existir
        }
    }

    walk(sessionPath);
}

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './whatsapp-session' }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-gpu',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-background-networking',
            '--disable-background-timer-throttling',
            '--disable-renderer-backgrounding',
            '--disable-backgrounding-occluded-windows',
            '--disable-breakpad',
            '--disable-client-side-phishing-detection',
            '--disable-component-update',
            '--disable-default-apps',
            '--disable-hang-monitor',
            '--disable-popup-blocking',
            '--disable-prompt-on-repost',
            '--disable-sync',
            '--force-color-profile=srgb',
            '--metrics-recording-only',
            '--safebrowsing-disable-auto-update',
            '--enable-automation',
            '--password-store=basic',
            '--use-mock-keychain'
        ]
    }
});

client.on('qr', (qr) => {
    console.log('\n🔄 Escaneie o QR Code abaixo para conectar:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('\n✅ WhatsApp client conectado e pronto!');
    console.log(`📱 Bridge rodando na porta ${PORT}`);
});

// Usa 'message' em vez de 'message_create' para evitar duplicatas de mensagens do próprio bot
client.on('message', async (msg) => {
    // Ignora mensagens do próprio bot ou de grupos
    if (msg.fromMe || msg.from.includes('@g.us')) return;
    
    // Deduplicação por message_id
    const msgId = msg.id?._serialized || msg.id;
    if (isDuplicate(msgId)) {
        console.log(`⏭️ Mensagem ${msgId} já processada recentemente. Ignorando.`);
        return;
    }
    
    try {
        console.log(`\n📩 Mensagem recebida de ${msg.from}: ${msg.body || '(mídia)'}`);
        
        const payload = {
            phone_number: msg.from.replace('@c.us', ''),
            message: msg.body || '',
            type: msg.type,
            timestamp: msg.timestamp,
            hasMedia: msg.hasMedia,
            raw_data: {
                id: msgId,
                from: msg.from,
                to: msg.to,
                deviceType: msg.deviceType,
                ack: msg.ack
            }
        };
        
        // Se tiver mídia, faz download e envia como base64
        if (msg.hasMedia) {
            try {
                const media = await msg.downloadMedia();
                if (media) {
                    payload.media = {
                        mimetype: media.mimetype,
                        data: media.data,
                        filename: media.filename
                    };
                    console.log(`📎 Mídia anexada: ${media.mimetype}`);
                }
            } catch (mediaError) {
                console.error('Erro ao baixar mídia:', mediaError.message);
            }
        }
        
        // Envia para a API FastAPI
        const response = await axios.post(`${FASTAPI_URL}/webhook/whatsapp`, payload, {
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY
            },
            timeout: 120000 // 2 minutos para operações complexas
        });
        
        console.log(`✅ Resposta da API: ${response.status}`);
        
        // Se a API retornar uma resposta para enviar ao usuário
        if (response.data && response.data.reply) {
            await sendReply(msg.from, response.data.reply);
        }

        // Se a API retornar um documento (ex: PDF de relatório), envia como mídia
        if (response.data && response.data.document) {
            try {
                const doc = response.data.document;
                const media = new MessageMedia(doc.mimetype, doc.data, doc.filename);
                await client.sendMessage(msg.from, media, { caption: 'Seu relatório PDF 📊' });
                console.log(`📄 Documento enviado: ${doc.filename}`);
            } catch (docError) {
                console.error('Erro ao enviar documento:', docError.message);
            }
        }
        
    } catch (error) {
        console.error('❌ Erro ao processar mensagem:', error.message);
        if (error.response) {
            console.error('Detalhes:', error.response.data);
        }
        // Envia mensagem de erro amigável ao usuário
        await sendReply(msg.from, 'Ops! Tive um problema ao processar sua mensagem. Pode tentar novamente?');
    }
});

async function sendReply(to, text) {
    try {
        // Divide mensagens muito longas
        const maxLength = 4000;
        if (text.length > maxLength) {
            const chunks = text.match(new RegExp(`.{1,${maxLength}}`, 'g')) || [text];
            for (const chunk of chunks) {
                await client.sendMessage(to, chunk);
            }
        } else {
            await client.sendMessage(to, text);
        }
        console.log(`📤 Resposta enviada para ${to}`);
    } catch (error) {
        console.error('Erro ao enviar resposta:', error.message);
    }
}

// Endpoint para enviar mensagens manualmente (usado pela API FastAPI)
app.post('/send', async (req, res) => {
    try {
        const { phone_number, message } = req.body;
        if (!phone_number || !message) {
            return res.status(400).json({ error: 'phone_number e message são obrigatórios' });
        }
        
        const chatId = phone_number.includes('@c.us') ? phone_number : `${phone_number}@c.us`;
        await client.sendMessage(chatId, message);
        
        res.json({ success: true, message: 'Mensagem enviada' });
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        connected: client.info ? true : false,
        uptime: process.uptime()
    });
});

// Limpa locks pendentes do Chromium antes de inicializar
console.log('🧹 Limpando locks do Chromium...');
cleanupChromiumLocks();

client.initialize();

app.listen(PORT, () => {
    console.log(`🚀 WhatsApp Bridge rodando em http://localhost:${PORT}`);
    console.log('Aguardando conexão com WhatsApp...');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n👋 Desconectando...');
    await client.destroy();
    process.exit(0);
});
