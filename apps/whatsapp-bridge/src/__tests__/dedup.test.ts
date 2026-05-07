// ──────────────────────────────────────────
// Testes: dedup.ts – isDuplicate
// ──────────────────────────────────────────

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Mock do config antes de importar o dedup ──
vi.mock('../config', () => ({
  config: {
    dedupTtlMs: 60_000, // 60s para o teste conforme especificação
  },
}));

const { isDuplicate } = await import('../dedup');

describe('isDuplicate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('retorna false na primeira vez com um ID', () => {
    expect(isDuplicate('msg-1')).toBe(false);
  });

  it('retorna true na segunda vez com o mesmo ID (dentro do TTL)', () => {
    expect(isDuplicate('msg-2')).toBe(false);
    expect(isDuplicate('msg-2')).toBe(true);
  });

  it('valores expiram após 60s', () => {
    const id = 'msg-expire';

    // primeira chamada → false
    expect(isDuplicate(id)).toBe(false);

    // avança 59s → ainda dentro do TTL
    vi.advanceTimersByTime(59_000);
    expect(isDuplicate(id)).toBe(true);

    // avança mais 2s → ultrapassou 60s
    vi.advanceTimersByTime(2_000);
    expect(isDuplicate(id)).toBe(false);
  });
});
