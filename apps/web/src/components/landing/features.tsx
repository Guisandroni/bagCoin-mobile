import { Zap } from "lucide-react"

const features = [
  {
    pill: "Infrastructure",
    title: "Absolute Transparency.\nGlobal Reach.",
    description:
      "Every transaction, every movement of capital is verified on-chain, yet managed with the simplicity of a text message.",
    span: "col-span-1 md:col-span-2",
    extra: (
      <div className="mt-auto flex w-full items-center gap-3 border-t border-gray-100 pt-8">
        <div className="flex -space-x-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-8 w-8 rounded-full border-2 border-white bg-gray-300"
            />
          ))}
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-brand text-[10px] font-bold text-white">
            4.9k
          </div>
        </div>
        <span className="text-[12px] font-semibold text-gray-500">
          Trusted by high-net-worth innovators globally.
        </span>
      </div>
    ),
  },
  {
    icon: Zap,
    title: "Real-time\nSettlements",
    description: "Done are the days of 3-5 business days wait. Kinetic speed is our baseline protocol.",
    span: "col-span-1",
  },
  {
    title: "Everything happens\non WhatsApp",
    description:
      "A seamless bridge between traditional communication and decentralized finance protocols.",
    span: "col-span-1",
    mockPhone: true,
  },
  {
    title: "Kinetic Capital Flow",
    description:
      "Move liquidity across borders with 0.1% overhead. Our protocol optimizes for efficiency, removing the legacy banking bloat.",
    span: "col-span-1 md:col-span-2",
    hasBlur: true,
  },
]

export function FeaturesGrid() {
  return (
    <>
      <div className="mb-16 flex items-end justify-between">
        <h2 className="max-w-2xl font-heading text-4xl font-bold uppercase leading-[0.95] tracking-tight md:text-6xl">
          Built for the
          <br />
          next
          <br />
          generation of
          <br />
          wealth
        </h2>
        <div className="mb-4 hidden h-1 w-16 bg-brand md:block" />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {features.map((feature, i) => {
          if (feature.mockPhone) {
            return (
              <div
                key={i}
                className="feature-card rounded-3xl border border-gray-100 bg-white p-8 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)]"
              >
                <h3 className="font-heading text-lg font-bold uppercase leading-tight">
                  Everything happens
                  <br />
                  on WhatsApp
                </h3>
                <div className="relative mb-6 mt-6 flex h-48 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
                  <div className="relative h-40 w-24 rotate-12 overflow-hidden rounded-xl border-4 border-gray-900 bg-gray-800 shadow-xl">
                    <div className="absolute inset-0 bg-gradient-to-b from-gray-700 to-gray-900" />
                    <div className="absolute right-2 top-8 h-4 w-12 rounded-lg rounded-tr-sm bg-brand" />
                    <div className="absolute right-2 top-14 h-4 w-16 rounded-lg rounded-tr-sm bg-brand" />
                  </div>
                </div>
                <p className="text-[12px] font-medium text-gray-500">
                  A seamless bridge between traditional communication and decentralized finance protocols.
                </p>
              </div>
            )
          }

          const Icon = feature.icon
          return (
            <div
              key={i}
              className={`feature-card group relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-8 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)] md:p-12 ${feature.span}`}
            >
              {feature.hasBlur && (
                <div className="absolute inset-y-0 right-0 w-1/2 translate-x-1/4 rounded-full bg-blue-50/50 blur-3xl" />
              )}
              <div className="relative z-10">
                {feature.pill && (
                  <span className="mb-6 inline-block rounded-full bg-[#EBF3FF] px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.05em] text-brand">
                    {feature.pill}
                  </span>
                )}
                {Icon && <Icon className="mb-8 h-6 w-6 text-brand" />}
                <h3 className="font-heading text-xl font-bold uppercase leading-tight md:text-2xl lg:text-3xl">
                  {feature.title.split("\n").map((line, j) => (
                    <span key={j}>
                      {line}
                      {j < feature.title.split("\n").length - 1 && <br />}
                    </span>
                  ))}
                </h3>
                <p className="mt-3 max-w-sm text-[14px] text-gray-600 md:text-base">
                  {feature.description}
                </p>
                {feature.extra}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}