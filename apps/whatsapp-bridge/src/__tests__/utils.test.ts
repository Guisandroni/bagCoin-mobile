// ──────────────────────────────────────────
// Testes: utils.ts – normalizeChatId e splitMessage
// ──────────────────────────────────────────

import { describe, it, expect } from 'vitest';

// Usamos o import dinâmico para garantir que o config mock não
// interfira (utils não depende de config nos testes abaixo).
const { normalizeChatId, splitMessage } = await import('../utils');

describe('normalizeChatId', () => {
  it('adiciona sufixo @c.us quando não presente', () => {
    expect(normalizeChatId('5511999999999')).toBe('5511999999999@c.us');
  });

  it('mantém o valor original quando @c.us já está presente', () => {
    expect(normalizeChatId('5511888888888@c.us')).toBe('5511888888888@c.us');
  });
});

describe('splitMessage', () => {
  it('retorna array com 1 item para texto curto', () => {
    const result = splitMessage('Hello, world!');
    expect(result).toEqual(['Hello, world!']);
    expect(result).toHaveLength(1);
  });

  it('quebra texto longo em chunks do tamanho especificado', () => {
    const text = 'A'.repeat(100);
    const maxLength = 30;

    const result = splitMessage(text, maxLength);

    expect(result).toHaveLength(4); // 100 ÷ 30 = 3.33 → 4 chunks
    expect(result[0]).toBe('A'.repeat(30));
    expect(result[1]).toBe('A'.repeat(30));
    expect(result[2]).toBe('A'.repeat(30));
    expect(result[3]).toBe('A'.repeat(10)); // último chunk menor
    // verifica que a junção reconstitui o texto original
    expect(result.join('')).toBe(text);
  });

  it('usa maxLength padrão quando não informado', () => {
    // O default é config.maxReplyLength (4000)
    const text = 'B'.repeat(5000);
    const result = splitMessage(text);
    expect(result.length).toBeGreaterThan(1);
    expect(result.join('')).toBe(text);
  });
});
