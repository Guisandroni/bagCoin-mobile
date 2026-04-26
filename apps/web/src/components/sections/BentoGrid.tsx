import React from "react";
import Link from "next/link";

export const BentoGrid: React.FC = () => {
  return (
    <section id="features" className="px-6 py-32 max-w-screen-2xl mx-auto">
      <div className="mb-16">
        <h2 className="section-heading text-near-black max-w-3xl">
          CONSTRUÍDO PARA A PRÓXIMA GERAÇÃO DE RIQUEZA
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8 bg-light-surface rounded-[30px] p-10 md:p-14 flex flex-col justify-between min-h-[480px]">
          <div>
            <span className="inline-block px-4 py-1.5 bg-wise-green/15 rounded-full text-xs font-bold uppercase tracking-widest mb-8 text-dark-green">
              Dashboard
            </span>
            <h3 className="font-display font-black text-4xl md:text-5xl tracking-tight text-near-black mb-6 leading-[0.9]">
              Transparência
              <br />
              Absoluta.
              <br />
              Alcance Global.
            </h3>
            <p className="text-lg text-warm-dark max-w-md font-medium">
              Cada transação, cada movimento de capital é verificado com
              a simplicidade de uma mensagem de texto.
            </p>
          </div>
          <div className="flex gap-4 mt-8 items-center">
            <div className="flex -space-x-3">
              <div className="w-10 h-10 rounded-full border-2 border-light-surface bg-wise-green flex items-center justify-center overflow-hidden">
                <span className="text-dark-green font-bold text-xs">JD</span>
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-light-surface bg-pastel-green flex items-center justify-center overflow-hidden">
                <span className="text-dark-green font-bold text-xs">MA</span>
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-light-surface bg-light-mint flex items-center justify-center font-bold text-xs text-dark-green">
                +2k
              </div>
            </div>
            <div className="text-sm font-medium text-warm-dark">
              Confiança de inovadores de alto patrimônio globalmente.
            </div>
          </div>
        </div>

        <div className="md:col-span-4 bg-near-black rounded-[30px] p-10 flex flex-col gap-8 text-white">
          <span className="material-symbols-outlined text-5xl text-wise-green">bolt</span>
          <div>
            <h3 className="font-display font-black text-3xl tracking-tight mb-4 leading-[0.9]">
              LIQUIDAÇÕES
              <br />
              EM TEMPO REAL
            </h3>
            <p className="text-white/60 text-sm font-medium">
              Acabaram-se os dias de espera de 3-5 dias úteis. Velocidade cinética é nosso protocolo base.
            </p>
          </div>
        </div>

        <div className="md:col-span-4 bg-wise-green rounded-[30px] p-10 flex flex-col gap-8 text-dark-green">
          <h3 className="font-display font-black text-3xl tracking-tight leading-[0.9]">
            CONTROLE
            <br />
            TOTAL
          </h3>
          <div className="aspect-square w-full rounded-2xl bg-dark-green/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-6xl opacity-40">dashboard</span>
          </div>
          <p className="text-sm opacity-70 font-medium">
            Uma ponte perfeita entre comunicação tradicional e
            protocolos de finanças descentralizadas.
          </p>
        </div>

        <div className="md:col-span-8 bg-white rounded-[30px] p-10 md:p-14 min-h-[400px] flex items-center ring-shadow">
          <div className="max-w-lg">
            <h3 className="font-display font-black text-4xl md:text-5xl tracking-tight text-near-black mb-6 leading-[0.9]">
              FLUXO DE
              <br />
              CAPITAL
            </h3>
            <p className="text-warm-dark mb-8 font-medium">
              Movimente liquidez através de fronteiras com 0.1% de overhead. Nosso protocolo
              otimiza para eficiência, removendo o inchaço dos bancos legados.
            </p>
            <Link
              href="/app/dashboard"
              className="font-bold text-dark-green bg-wise-green px-6 py-3 rounded-full inline-flex items-center gap-2 btn-scale"
            >
              Explorar App
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
