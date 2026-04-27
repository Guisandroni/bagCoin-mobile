declare module 'qrcode-terminal' {
  interface QRCodeOptions {
    small?: boolean;
  }
  function generate(qr: string, options?: QRCodeOptions): void;
  export = { generate };
}

declare module 'whatsapp-web.js' {
  export class Client {
    constructor(options: ClientOptions);
    on(event: string, listener: (...args: any[]) => void): void;
    initialize(): Promise<void>;
    destroy(): Promise<void>;
    sendMessage(chatId: string, content: string | MessageMedia, options?: any): Promise<Message>;
    state: WAState;
  }

  export class LocalAuth {
    constructor(options?: { dataPath?: string; clientId?: string });
  }

  export class MessageMedia {
    constructor(mimetype: string, data: string, filename?: string);
    mimetype: string;
    data: string;
    filename?: string;
  }

  export interface ClientOptions {
    authStrategy: LocalAuth | NoAuth | RemoteAuth;
    puppeteer?: PuppeteerOptions;
    webVersionCache?: WebVersionCacheOptions;
  }

  export interface PuppeteerOptions {
    headless?: boolean;
    executablePath?: string;
    args?: string[];
    userDataDir?: string;
  }

  export interface WebVersionCacheOptions {
    type: 'none' | 'local' | 'remote';
    path?: string;
  }

  export class NoAuth {
    constructor();
  }

  export class RemoteAuth {
    constructor(options: { store: any; backupSyncIntervalMs?: number });
  }

  export interface MessageId {
    fromMe: boolean;
    remote: string;
    id: string;
    _serialized: string;
  }

  export interface Message {
    id: MessageId;
    from: string;
    to: string;
    body: string;
    fromMe: boolean;
    hasMedia: boolean;
    downloadMedia(): Promise<MessageMedia | null>;
    getChat(): Promise<Chat>;
    getContact(): Promise<Contact>;
  }

  export interface Chat {
    id: { _serialized: string };
    name: string;
    isGroup: boolean;
    sendMessage(content: string | MessageMedia, options?: any): Promise<Message>;
  }

  export interface Contact {
    id: { _serialized: string };
    pushname: string;
    name: string;
    number: string;
  }

  export enum WAState {
    CONFLICT = 'CONFLICT',
    CONNECTED = 'CONNECTED',
    DEPRECATED_VERSION = 'DEPRECATED_VERSION',
    OPENING = 'OPENING',
    PAIRING = 'PAIRING',
    PROXYBLOCK = 'PROXYBLOCK',
    SMB_TOS_BLOCK = 'SMB_TOS_BLOCK',
    TIMEOUT = 'TIMEOUT',
    TOS_BLOCK = 'TOS_BLOCK',
    UNLAUNCHED = 'UNLAUNCHED',
    UNPAIRED = 'UNPAIRED',
    UNPAIRED_IDLE = 'UNPAIRED_IDLE',
  }
}
