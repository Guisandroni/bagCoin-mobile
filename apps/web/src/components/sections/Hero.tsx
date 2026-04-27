import React from "react";
import { Button } from "../ui/Button";
import Link from "next/link";

interface HeroProps {
  onConnect: (platform: "whatsapp" | "telegram") => void;
  isLoading: boolean;
}

export const Hero: React.FC<HeroProps> = ({ onConnect, isLoading }) => {
  return (
    <section className="relative min-h-[85vh] flex flex-col items-center justify-center text-center px-6 py-24 overflow-hidden gradient-mesh">
      <div className="relative z-10 max-w-5xl mx-auto">
        <h1 className="display-hero text-near-black mb-8 animate-fade-in-up">
          DINHEIRO PARA
          <br />
          AQUI, ALI
          <br />
          E EM TODO LUGAR
        </h1>
        <div className="flex flex-col md:flex-row items-center justify-between gap-12 mt-16 max-w-4xl mx-auto">
          <p className="text-lg md:text-xl text-warm-dark max-w-lg text-left leading-relaxed font-body font-medium">
            Redefinindo capital através de tecnologia, transparência e design
            preciso. Controle suas finanças com elegância.
          </p>
            <div className="flex flex-col gap-4 w-full md:w-auto">
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/app/dashboard">
                  <Button size="lg" className="group">
                    Começar Agora
                    <span className="material-symbols-outlined text-2xl">arrow_forward</span>
                  </Button>
                </Link>
                <Button size="lg" variant="outline" onClick={() => onConnect("whatsapp")} className="group">
                  <span className="material-symbols-outlined text-xl">chat</span>
                  Conectar WhatsApp
                </Button>
              </div>
              <span className="text-xs font-semibold uppercase tracking-widest text-gray">
                Sem downloads. Sem complicações.
              </span>
            </div>
        </div>
      </div>
    </section>
  );
};
