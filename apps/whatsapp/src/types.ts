export interface IncomingMessagePayload {
  chatId: string;
  platform: 'whatsapp';
  messageText?: string;
  fileBytes?: string;
  fileType?: string;
  pushname?: string;
  isGroup?: boolean;
}

export interface SendMessageBody {
  chatId: string;
  text: string;
}

export interface SendFileBody {
  chatId: string;
  base64File: string;
  filename: string;
  caption?: string;
}

export interface HealthResponse {
  status: string;
  service: string;
  timestamp: string;
}
