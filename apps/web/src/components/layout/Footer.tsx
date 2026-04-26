import React from "react";
import { Button } from "../ui/Button";
import Link from "next/link";

interface FooterProps {
  onConnect: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onConnect }) => {
  return (
    <>
      <section className="bg-light-surface py-32 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <blockquote className="font-display font-black text-4xl md:text-6xl tracking-tight text-near-black leading-[0.9]">
            "NÃO ESTAMOS CONSTRUINDO UM BANCO. ESTAMOS CONSTRUINDO O{" "}
            <span className="bg-wise-green px-3 py-1">SISTEMA OPERACIONAL</span>{" "}
            PARA VALOR GLOBAL."
          </blockquote>
          <cite className="block mt-12 font-semibold uppercase tracking-widest text-gray not-italic text-sm">
            — O Manifesto Bagcoin
          </cite>
        </div>
      </section>

      <section className="px-6 py-32">
        <div className="max-w-6xl mx-auto bg-near-black rounded-[40px] p-12 md:p-20 text-center relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="font-display font-black text-5xl md:text-7xl text-white tracking-tight mb-10 leading-[0.9]">
              PRONTO PARA
              <br />
              COMEÇAR?
            </h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto mb-12 font-medium">
              Junte-se à lista de espera ou acesse o app para começar a mover
              capital na velocidade da luz.
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
              <Link href="/app/dashboard">
                <Button size="xl" variant="primary">
                  Acessar o App
                </Button>
              </Link>
              <Button size="xl" variant="outline" onClick={onConnect} className="!text-white !border-white/20 hover:!bg-white hover:!text-near-black">
                <span className="material-symbols-outlined">chat</span>
                Conectar WhatsApp
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-white">
        <div className="flex flex-col md:flex-row justify-between items-center px-12 py-14 w-full max-w-screen-2xl mx-auto border-t border-light-surface">
          <div className="flex flex-col gap-3 mb-8 md:mb-0">
            <div className="font-display font-black text-near-black text-3xl tracking-tight">
              Bagcoin
            </div>
            <p className="text-xs uppercase tracking-widest text-gray font-semibold">
              © 2026 Bagcoin. Todos os direitos reservados.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-10 text-xs uppercase tracking-widest font-semibold">
            <a className="text-gray hover:text-near-black transition-all" href="#">
              Termos de Serviço
            </a>
            <a className="text-gray hover:text-near-black transition-all" href="#">
              Política de Privacidade
            </a>
            <a className="text-gray hover:text-near-black transition-all" href="#">
              Segurança
            </a>
          </div>
          <div className="mt-8 md:mt-0 flex gap-4">
            <a className="w-10 h-10 rounded-full border border-light-surface flex items-center justify-center hover:bg-wise-green transition-colors" href="#">
              <span className="material-symbols-outlined text-near-black text-sm">public</span>
            </a>
            <a className="w-10 h-10 rounded-full border border-light-surface flex items-center justify-center hover:bg-wise-green transition-colors" href="#">
              <span className="material-symbols-outlined text-near-black text-sm">alternate_email</span>
            </a>
          </div>
        </div>
      </footer>
    </>
  );
};
