// ──────────────────────────────────────────
// Utilitários do WhatsApp Bridge
// ──────────────────────────────────────────

import fs from 'fs';
import path from 'path';
import { config } from './config';

const LOCK_FILES = ['SingletonLock', 'SingletonCookie', 'SingletonSocket'] as const;

/**
 * Remove arquivos de lock do Chromium que ficam pendentes quando
 * o container é recriado. Busca recursivamente em todas as subpastas.
 */
export function cleanupChromiumLocks(): void {
  const sessionPath = './whatsapp-session';

  function walk(dir: string): void {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath);
        } else if ((LOCK_FILES as readonly string[]).includes(entry.name)) {
          try {
            fs.unlinkSync(fullPath);
            console.log(`🔓 Lock removido: ${fullPath}`);
          } catch (err: unknown) {
            if (err instanceof Error) {
              console.warn(`⚠️ Falha ao remover lock ${fullPath}: ${err.message}`);
            }
          }
        }
      }
    } catch {
      // diretório pode não existir — ignorar
    }
  }

  walk(sessionPath);
}

/**
 * Normaliza um número de telefone para o formato do WhatsApp.
 * Se já contiver @c.us, retorna como está.
 */
export function normalizeChatId(phoneNumber: string): string {
  return phoneNumber.includes('@c.us')
    ? phoneNumber
    : `${phoneNumber}@c.us`;
}

/**
 * Divide mensagens muito longas em chunks para envio.
 */
export function splitMessage(text: string, maxLength: number = config.maxReplyLength): string[] {
  if (text.length <= maxLength) return [text];

  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += maxLength) {
    chunks.push(text.slice(i, i + maxLength));
  }
  return chunks;
}
