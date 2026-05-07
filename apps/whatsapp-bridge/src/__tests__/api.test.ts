// ──────────────────────────────────────────
// Testes: api.ts – sendToFastApi, hasReply, isDocumentResponse
// ──────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { WebhookResponse } from '../types';

// ── Mock do axios ──
class MockAxiosError extends Error {
  constructor(
    message: string,
    public response?: { status: number; data: unknown },
  ) {
    super(message);
    this.name = 'AxiosError';
  }
}

vi.mock('axios', () => {
  const mockAxiosInstance = {
    post: vi.fn(),
  };
  return {
    default: mockAxiosInstance,
    AxiosError: MockAxiosError,
  };
});

const axios = (await import('axios')).default;

// ── Mock do config ──
vi.mock('../config', () => ({
  config: {
    fastApiUrl: 'http://test-api:8000',
    apiKey: 'test-key-123',
    webhookTimeout: 5000,
  },
}));

const { sendToFastApi, hasReply, isDocumentResponse } = await import('../api');

describe('sendToFastApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('envia payload para a FastAPI com headers corretos', async () => {
    const payload = {
      phone_number: '5511999999999',
      message: 'Olá',
    };

    const mockResponseData: WebhookResponse = { reply: 'Oi!' };
    (axios.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      status: 200,
      data: mockResponseData,
    });

    const result = await sendToFastApi(payload);

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.post).toHaveBeenCalledWith(
      'http://test-api:8000/webhook/whatsapp',
      payload,
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'test-key-123',
        },
        timeout: 5000,
      }),
    );
    expect(result).toEqual(mockResponseData);
  });

  it('retorna null quando a requisição falha', async () => {
    (axios.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

    const result = await sendToFastApi({
      phone_number: '5511999999999',
      message: 'teste',
    });

    expect(result).toBeNull();
  });
});

describe('hasReply', () => {
  it('retorna true quando reply existe (string não vazia)', () => {
    const data: WebhookResponse = { reply: 'Resposta' };
    expect(hasReply(data)).toBe(true);
  });

  it('retorna false quando reply não existe', () => {
    const data: WebhookResponse = {};
    expect(hasReply(data)).toBe(false);
  });

  it('retorna false quando reply é undefined', () => {
    const data: WebhookResponse = { reply: undefined };
    expect(hasReply(data)).toBe(false);
  });

  it('retorna false quando data é null', () => {
    expect(hasReply(null)).toBe(false);
  });
});

describe('isDocumentResponse', () => {
  it('retorna true quando document existe', () => {
    const data: WebhookResponse = {
      document: {
        mimetype: 'application/pdf',
        data: 'base64...',
        filename: 'relatorio.pdf',
      },
    };
    expect(isDocumentResponse(data)).toBe(true);
  });

  it('retorna false quando document não existe', () => {
    const data: WebhookResponse = { reply: 'ok' };
    expect(isDocumentResponse(data)).toBe(false);
  });

  it('retorna false quando data é null', () => {
    expect(isDocumentResponse(null)).toBe(false);
  });
});
