import { MongoClient, Db, Collection } from 'mongodb';

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/whatsapp_sessions';
const SESSION_COLLECTION = 'whatsapp_sessions';
const SESSION_KEY = 'backcoin_session';

let db: Db | null = null;
let client: MongoClient | null = null;

async function getCollection(): Promise<Collection> {
  if (!db) {
    client = new MongoClient(MONGO_URL);
    await client.connect();
    db = client.db();
    console.log('✅ Connected to MongoDB for session storage');
  }
  return db.collection(SESSION_COLLECTION);
}

export class MongoAuth {
  clientId: string;
  dataPath: string;

  constructor(options?: { clientId?: string; dataPath?: string }) {
    this.clientId = options?.clientId || 'default';
    this.dataPath = options?.dataPath || './.wwebjs_auth';
  }

  async setup(clientInstance: any): Promise<void> {
    // Called during Client construction
    console.log('[MongoAuth] Setup');
  }

  async beforeBrowserInitialized(): Promise<void> {
    // No setup needed before browser
  }

  async afterBrowserInitialized(): Promise<void> {
    // No setup needed after browser
  }

  async onAuthenticationNeeded(): Promise<boolean> {
    // Check if session exists
    try {
      const collection = await getCollection();
      const doc = await collection.findOne({ _id: SESSION_KEY });
      return !doc; // Return true if auth IS needed (no session found)
    } catch (err) {
      console.error('Error checking session:', err);
      return true; // Assume auth needed on error
    }
  }

  async getAuthEventPayload(): Promise<any> {
    // Return stored session
    try {
      const collection = await getCollection();
      const doc = await collection.findOne({ _id: SESSION_KEY });
      if (doc && doc.session) {
        console.log('🔐 Restoring session from MongoDB');
        return doc.session;
      }
      return null;
    } catch (err) {
      console.error('Error getting session:', err);
      return null;
    }
  }

  async afterAuthReady(): Promise<void> {
    // Session is ready
  }

  async disconnect(): Promise<void> {
    // Close MongoDB connection
    if (client) {
      await client.close();
      client = null;
      db = null;
      console.log('🔌 Disconnected from MongoDB');
    }
  }

  async destroy(): Promise<void> {
    // Remove session from MongoDB
    try {
      const collection = await getCollection();
      await collection.deleteOne({ _id: SESSION_KEY });
      console.log('🗑️  Session destroyed in MongoDB');
    } catch (err) {
      console.error('Error destroying session:', err);
    }
    await this.disconnect();
  }

  async logout(): Promise<void> {
    await this.destroy();
  }

  async save(session: any): Promise<void> {
    // Save session to MongoDB
    try {
      const collection = await getCollection();
      await collection.updateOne(
        { _id: SESSION_KEY },
        { $set: { session, updatedAt: new Date() } },
        { upsert: true }
      );
      console.log('💾 Session saved to MongoDB');
    } catch (err) {
      console.error('Error saving session:', err);
    }
  }

  async extractSession(session: any): Promise<any> {
    // Extract session data from authentication event
    return session;
  }
}

export { getCollection };
