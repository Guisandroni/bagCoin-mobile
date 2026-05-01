// ──────────────────────────────────────────
// Client HTTP para comunicação com a API FastAPI
// ──────────────────────────────────────────

import axios, { AxiosError } from 'axios';
import { config } from './config';
import type { WebhookPayload, WebhookResponse } from './types';

export async function sendToFastApi(payload: WebhookPayload): Promise<WebhookResponse | null> {
  try {
    const response = await axios.post<WebhookResponse>(
      `${config.fastApiUrl}/webhook/whatsapp`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': config.apiKey,
        },
        timeout: config.webhookTimeout,
      },
    );

    console.log(`✅ API respondeu: ${response.status}`);
    return response.data;
  } catch (error: unknown) {
    if (error instanceof AxiosError && error.response) {
      console.error(`❌ API error ${error.response.status}:`, JSON.stringify(error.response.data));
    } else if (error instanceof Error) {
      console.error('❌ Erro ao chamar API:', error.message);
    }
    return null;
  }
}

export function isDocumentResponse(data: WebhookResponse | null): data is WebhookResponse & { document: NonNullable<WebhookResponse['document']> } {
  return data !== null && 'document' in data && data.document !== undefined;
}

export function hasReply(data: WebhookResponse | null): data is WebhookResponse & { reply: string } {
  return data !== null && typeof data.reply === 'string' && data.reply.length > 0;
}
