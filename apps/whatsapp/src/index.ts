import 'dotenv/config';
import Fastify from 'fastify';
import { initialize, destroy } from './client';
import { registerRoutes } from './api';

const PORT = parseInt(process.env.PORT || '3002', 10);

const app = Fastify({
  logger: false,
  bodyLimit: 50 * 1024 * 1024, // 50mb
});

async function start(): Promise<void> {
  try {
    await registerRoutes(app);

    await app.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`🚀 WhatsApp bridge listening on port ${PORT}`);

    await initialize();
  } catch (err: any) {
    console.error('Failed to start:', err.message);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown(signal: string): Promise<void> {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  try {
    await destroy();
    await app.close();
    console.log('✅ Server closed gracefully');
    process.exit(0);
  } catch (err: any) {
    console.error('Error during shutdown:', err.message);
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start();
