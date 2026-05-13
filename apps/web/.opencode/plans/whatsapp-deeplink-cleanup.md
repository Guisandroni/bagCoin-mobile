# Plano: Ajustar deeplink WhatsApp

## Contexto
O usuário exigiu que o deeplink WhatsApp **nunca exponha o token** ao usuário e **sempre abra o WhatsApp** com o token pré-preenchido no chat. A seção de "Copiar comando" que exibia o token manualmente deve ser removida.

## Backend
- `BOT_WHATSAPP_NUMBER=5527928341723` já configurado no `.env`
- Para `channel=whatsapp`, o backend **sempre** retorna `deeplink_whatsapp` (formato: `https://wa.me/5527928341723?text=%23bagcoin+link+<token>`)
- Se `BOT_WHATSAPP_NUMBER` estiver vazio, o backend retorna **422 ValidationError** — nunca `deeplink_whatsapp: null`
- Portanto, o path `deeplink === null` no frontend é **inalcançável** para WhatsApp

## Mudanças frontend

### 1. `src/components/integrations/connect-modal.tsx` — `ChannelPanel`

**Remover:**
- Prop `manual` e todo o conteúdo relacionado a comando manual
- Seção `<code>` + botão "Copiar comando" (linhas ~187-197)
- Fallback de label do botão: nunca mostrar "Copiar comando"

**Ajustar:**
- Botão sempre diz "Abrir WhatsApp" / "Abrir Telegram"
- `openApp` sempre tenta abrir o deeplink (priorizar `window.location.href` sobre `window.open` para evitar popup blockers)
- Se `deeplink` for null (erro de rede ou config), mostrar mensagem informativa em vez de botão de copiar

### 2. `src/hooks/use-integrations.ts` — `openIntegrationChat`

**Remover:**
- Fallthrough silencioso (linhas ~109-111: `// No deeplink / manual fallback — silent (no toast).`)

**Ajustar:**
- Se `deeplink` for null após `fetchIntegrationLinkToken`, lançar erro explícito
- Isso faz com que o `catch` em `useOpenIntegrationChat` capture e mostre o erro no console (dev)

## Arquivos afetados
- `src/components/integrations/connect-modal.tsx`
- `src/hooks/use-integrations.ts`
