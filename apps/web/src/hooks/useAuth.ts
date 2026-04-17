import { useState } from "react";
import { apiService } from "@/services/api";

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectPlatform = async (platform: "whatsapp" | "telegram") => {
    setIsLoading(true);
    setError(null);

    try {
      const { token } = await apiService.preRegister();

      if (platform === "whatsapp") {
        const phoneNumber = "5527928341723";
        const message = `Send this message to connect and start chatting!\n\nActivation code: ${token}`;
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
        window.open(whatsappUrl, "_blank");
      } else {
        const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "BagcoinBot";
        const telegramUrl = `https://t.me/${botUsername}?start=${token}`;
        window.open(telegramUrl, "_blank");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro inesperado";
      setError(message);
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  return { connectPlatform, isLoading, error };
}
