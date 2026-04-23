import React from "react";
import { Button } from "../ui/Button";

interface HeroProps {
  onConnect: (platform: "whatsapp" | "telegram") => void;
  isLoading: boolean;
}

export const Hero: React.FC<HeroProps> = ({ onConnect, isLoading }) => {
  return (
    <section className="relative min-h-[921px] flex flex-col items-center justify-center text-center px-6 py-24 overflow-hidden">
      <div className="relative z-10 max-w-6xl mx-auto">
        <h1 className="text-6xl md:text-[10rem] font-bold leading-[0.85] tracking-tighter text-on-background mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          MONEY FOR
          <br />
          HERE, THERE
          <br />
          AND EVERYWHERE
        </h1>
        <div className="flex flex-col md:flex-row items-center justify-between gap-12 mt-20">
          <p className="text-xl md:text-2xl text-on-surface-variant max-w-xl text-left leading-relaxed">
            Redefining capital through technology, transparency, and
            clinical design.
          </p>
          <div className="flex flex-col gap-4 w-full md:w-auto">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => onConnect("whatsapp")}
                disabled={isLoading}
                size="lg"
                className="group"
              >
                WhatsApp
                <span className="material-symbols-outlined text-3xl">chat</span>
              </Button>
              {/* <Button
                onClick={() => onConnect("telegram")}
                disabled={isLoading}
                variant="secondary"
                size="lg"
                className="group"
              >
                Telegram coming soon
                <span className="material-symbols-outlined text-3xl">send</span>
              </Button> */}
            </div>
            <span className="text-sm font-label uppercase tracking-widest opacity-60">
              No downloads. No complicated setups.
            </span>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary-container/10 rounded-full blur-3xl"></div>
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-surface-container-highest/30 rounded-full blur-3xl"></div>
    </section>
  );
};
