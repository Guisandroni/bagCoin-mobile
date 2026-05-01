// ──────────────────────────────────────────
// Deduplicação em memória de message_ids
// ──────────────────────────────────────────

import { config } from './config';

const processedMessages = new Map<string, number>();

export function isDuplicate(msgId: string): boolean {
  const now = Date.now();

  // Expurga entradas antigas
  for (const [id, ts] of processedMessages.entries()) {
    if (now - ts > config.dedupTtlMs) {
      processedMessages.delete(id);
    }
  }

  if (processedMessages.has(msgId)) return true;

  processedMessages.set(msgId, now);
  return false;
}
