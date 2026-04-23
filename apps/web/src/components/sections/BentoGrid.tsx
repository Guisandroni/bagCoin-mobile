import React from "react";

export const BentoGrid: React.FC = () => {
  return (
    <section className="px-6 py-32 max-w-screen-2xl mx-auto">
      {/* <div className="mb-24 flex flex-col md:flex-row justify-between items-end gap-8">
        <h2 className="text-5xl md:text-8xl font-bold tracking-tighter max-w-2xl">
          BUILT FOR THE NEXT GENERATION OF WEALTH
        </h2>
        <div className="h-1 w-32 bg-primary-container mb-6"></div>
      </div> */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-8 bg-surface-container-low rounded-xl p-12 flex flex-col justify-between min-h-[500px]">
          <div>
            <span className="inline-block px-4 py-1 bg-surface-container-highest rounded-full text-xs font-bold uppercase tracking-widest mb-8">
              Infrastructure
            </span>
            <h3 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Absolute Transparency. Global Reach.
            </h3>
            <p className="text-lg text-on-surface-variant max-w-md">
              Every transaction, every movement of capital is verified on-chain,
              yet managed with the simplicity of a text message.
            </p>
          </div>
          <div className="flex gap-4 mt-8">
            <div className="flex -space-x-4">
              <div className="w-12 h-12 rounded-full border-4 border-surface-container-low bg-surface-container-highest flex items-center justify-center overflow-hidden">
                <img
                  alt="user"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDssVhtXHkC4Ggzq1x5eO8vXRJAHaJi6z9q1mHUTGs2EgYlRsFbaWOxr2mtTsCFfXk_4Nwt42r0q7a5SzP7v5KyFYm8HI1_IxDkLh4zDN3wJvLFN2cOcGpkUwUoDuIKsf3gFizs1mlBtfhYkKjAq3AktXR9okimDhSo6V4D1t1R84E38vKx5F8IdKaLdVdytJnWNWpAcQjle8Rh93KERAdCtyI2REQ3xFAiDv3JfmGOe2AkxbrG_0_FkJSUI3H8YV1jEqzFI4uKC4GU"
                />
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-surface-container-low bg-surface-container-high flex items-center justify-center overflow-hidden">
                <img
                  alt="user"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDkACZ0PRV-XD-4Ut5gEQHVSPDZyz2qGxky8tJIYtqAH7NC4tKVP6xPosdoN3Cu_YiwcLFmWpoXBvLUjnLyMBshEc1v2k1FD0-ArvYgDnXPYzPtL0xRScxpn5VzI0o_0oL3BVmDAE5VXmTA9fg5RvVs3GGpIwoifg1VXMvsQZRlPXhIzr6SU3A7UVpyoAXGMVkZk-3ZeFpP-dNuEYLPL8SewQcOKgsnWns6EbBvTGrHqcQRMCzrGr4gFiZu1Oq4HewPFOM0CNKQKSxK"
                />
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-surface-container-low bg-primary-container flex items-center justify-center font-bold text-xs">
                +2k
              </div>
            </div>
            <div className="text-sm self-center">
              Trusted by high-net-worth innovators globally.
            </div>
          </div>
        </div>
        {/* <div className="md:col-span-4 bg-on-background text-background rounded-xl p-10 flex flex-col justify-between">
          <span
            className="material-symbols-outlined text-6xl text-primary-container"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            bolt
          </span>
          <div>
            <h3 className="text-3xl font-bold tracking-tight mb-4 leading-none uppercase">
              Real-time Settlements
            </h3>
            <p className="text-background/60 text-sm">
              Gone are the days of 3-5 business day waits. Kinetic speed is our
              baseline protocol.
            </p>
          </div>
        </div> */}
        <div className="md:col-span-4 bg-surface-container-highest rounded-xl p-10 flex flex-col gap-8">
          <h3 className="text-3xl font-bold tracking-tight leading-none uppercase">
            Everything happens on WhatsApp
          </h3>
          <div className="aspect-square w-full rounded-lg bg-surface flex items-center justify-center overflow-hidden">
            <img
              className="w-full h-full object-cover grayscale"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC5nIl6Z7vrf2ZFvoEzSlies-EhnujDnL8tKj2dojAIQ9mMml8l2frwBq_IJcEdtVu7DWHiTzDTsNSdq-UyTSarZNRMZC2607Ll0JV7JmDBl-sP3lpSuw9a2TdDioznFP0byWJRdZd3X6nUZFhPtyJXA51NQv2zMy6_pCI25MNN5Tlz5Bj3GIDYzy7UvaIi_b88sirZmtDPmdCWIZ6Czxvn-oEJfELLWQlAu3vUhXcWQFF1hoRGHKQJxEeVWYzkUlQSztaomRtKyRHI"
              alt="mobile app interface"
            />
          </div>
          <p className="text-sm opacity-70">
            A seamless bridge between traditional communication and
            decentralized finance protocols.
          </p>
        </div>
        {/* <div className="md:col-span-8 relative overflow-hidden bg-white rounded-xl p-12 min-h-[400px] flex items-center shadow-sm">
          <div className="relative z-10 max-w-lg text-on-surface">
            <h3 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Kinetic Capital Flow
            </h3>
            <p className="text-on-surface-variant mb-8">
              Move liquidity across borders with 0.1% overhead. Our protocol
              optimizes for efficiency, removing the legacy banking bloat.
            </p>
            <a
              className="font-bold text-primary border-b-2 border-primary-container inline-flex items-center gap-2"
              href="#"
            >
              Read Whitepaper{" "}
              <span className="material-symbols-outlined">north_east</span>
            </a>
          </div>
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary-container/20 to-transparent"></div>
        </div> */}
      </div>
    </section>
  );
};
