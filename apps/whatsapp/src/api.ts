import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { sendMessage, sendFile, getCurrentQrData } from './client';
import type { SendMessageBody, SendFileBody, HealthResponse } from './types';

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: SendMessageBody }>('/send-message', async (request: FastifyRequest<{ Body: SendMessageBody }>, reply: FastifyReply) => {
    const { chatId, text } = request.body;

    if (!chatId || !text) {
      return reply.status(400).send({ error: 'chatId and text are required' });
    }

    try {
      await sendMessage(chatId, text);
      return reply.send({ status: 'sent' });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  app.post<{ Body: SendFileBody }>('/send-file', async (request: FastifyRequest<{ Body: SendFileBody }>, reply: FastifyReply) => {
    const { chatId, base64File, filename, caption } = request.body;

    if (!chatId || !base64File || !filename) {
      return reply.status(400).send({ error: 'chatId, base64File and filename are required' });
    }

    try {
      await sendFile(chatId, base64File, filename, caption);
      return reply.send({ status: 'sent' });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  app.get('/qr', async (_request, reply: FastifyReply) => {
    const qrData = getCurrentQrData();

    if (!qrData) {
      return reply.status(404).send({
        status: 'not_found',
        message: 'No QR code available. WhatsApp may already be authenticated or not yet initialized.',
      });
    }

    return reply.send({
      status: 'ok',
      qr: qrData.qr,
      base64Image: qrData.base64Image,
      generatedAt: qrData.generatedAt,
      instructions: 'Scan the QR code with your WhatsApp app (Linked Devices) to authenticate.',
    });
  });

  app.get('/health', async (_request, reply: FastifyReply) => {
    const response: HealthResponse = {
      status: 'ok',
      service: 'whatsapp-bridge',
      timestamp: new Date().toISOString(),
    };
    return reply.send(response);
  });
}
