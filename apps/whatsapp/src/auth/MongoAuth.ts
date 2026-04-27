import { MongoClient, Db, Collection } from 'mongodb';
import { lookup } from 'dns/promises';

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/whatsapp_sessions';
const SESSION_COLLECTION = 'whatsapp_sessions';
const SESSION_KEY = 'whatsapp_session_default';
const MAX_CONNECT_RETRIES = 5;
const CONNECT_RETRY_DELAY_MS = 2000;

let client: MongoClient | null = null;
let db: Db | null = null;

async function resolveMongoUrl(): Promise<string> {
  try {
    const urlObj = new URL(MONGO_URL);
    const hostname = urlObj.hostname;
    // Skip if already an IP address
    if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return MONGO_URL;
    // Resolve hostname to IP
    const addresses = await lookup(hostname);
    console.log(`[MongoAuth] Resolved ${hostname} to ${addresses.address}`);
    urlObj.hostname = addresses.address;
    return urlObj.toString();
  } catch (err) {
    console.error('[MongoAuth] DNS resolution failed, using original URL:', (err as Error).message);
    return MONGO_URL;
  }
}

async function connectWithRetry(): Promise<void> {
  const resolvedUrl = await resolveMongoUrl();
  console.log('[MongoAuth] URL type:', typeof resolvedUrl);
  console.log('[MongoAuth] URL value:', resolvedUrl.replace(/:\/\/[^:]+:[^@]+@/, '://****:****@'));
  let lastError: any;
  for (let attempt = 1; attempt <= MAX_CONNECT_RETRIES; attempt++) {
    try {
      console.log(`[MongoAuth] Connecting to MongoDB (attempt ${attempt}/${MAX_CONNECT_RETRIES})...`);
      client = new MongoClient(resolvedUrl);
      await client.connect();
      const urlObj = new URL(resolvedUrl);
      const dbName = urlObj.pathname.replace(/^\//, '') || 'whatsapp_sessions';
      db = client.db(dbName);
      console.log(`[MongoAuth] Connected to MongoDB database: ${dbName}`);
      return;
    } catch (err: any) {
      lastError = err;
      console.error(`[MongoAuth] Connection attempt ${attempt} failed:`, err.message);
      if (attempt < MAX_CONNECT_RETRIES) {
        const delay = CONNECT_RETRY_DELAY_MS * attempt;
        console.log(`[MongoAuth] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

async function getCollection(): Promise<Collection> {
  if (!db) {
    await connectWithRetry();
  }
  return db!.collection(SESSION_COLLECTION);
}

export class MongoAuth {
  clientId: string;
  dataPath: string;

  constructor(options?: { clientId?: string; dataPath?: string }) {
    this.clientId = options?.clientId || 'default';
    this.dataPath = options?.dataPath || './.wwebjs_auth';
  }

  async setup(clientInstance: any): Promise<void> {
    console.log('[MongoAuth] Setup');
  }

  async beforeBrowserInitialized(): Promise<void> {}

  async afterBrowserInitialized(): Promise<void> {}

  async onAuthenticationNeeded(): Promise<boolean> {
    try {
      const collection = await getCollection();
      const doc = await collection.findOne({ _id: SESSION_KEY as any });
      return !doc;
    } catch (err) {
      console.error('[MongoAuth] Error checking session:', (err as Error).message);
      return true;
    }
  }

  async getAuthEventPayload(): Promise<any> {
    try {
      const collection = await getCollection();
      const doc = await collection.findOne({ _id: SESSION_KEY as any });
      if (doc && doc.session) {
        console.log('[MongoAuth] Restoring session from MongoDB');
        return doc.session;
      }
      return null;
    } catch (err) {
      console.error('[MongoAuth] Error getting session:', (err as Error).message);
      return null;
    }
  }

  async afterAuthReady(): Promise<void> {}

  async disconnect(): Promise<void> {
    if (client) {
      await client.close();
      client = null;
      db = null;
      console.log('[MongoAuth] Disconnected from MongoDB');
    }
  }

  async destroy(): Promise<void> {
    try {
      const collection = await getCollection();
      await collection.deleteOne({ _id: SESSION_KEY as any });
      console.log('[MongoAuth] Session destroyed in MongoDB');
    } catch (err) {
      console.error('[MongoAuth] Error destroying session:', (err as Error).message);
    }
    await this.disconnect();
  }

  async logout(): Promise<void> {
    await this.destroy();
  }

  async save(session: any): Promise<void> {
    try {
      const collection = await getCollection();
      await collection.updateOne(
        { _id: SESSION_KEY as any },
        { $set: { session, updatedAt: new Date() } },
        { upsert: true }
      );
      console.log('[MongoAuth] Session saved to MongoDB');
    } catch (err) {
      console.error('[MongoAuth] Error saving session:', (err as Error).message);
    }
  }

  async extractSession(session: any): Promise<any> {
    return session;
  }
}

export { getCollection };
