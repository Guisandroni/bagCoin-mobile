import { MessageSquare } from "lucide-react"

export function CTASection() {
  return (
    <section className="mx-auto max-w-4xl rounded-[32px] border border-gray-100 bg-white p-12 text-center shadow-sm md:p-20">
      <h2 className="font-heading text-4xl font-bold uppercase tracking-tight md:text-6xl">
        Ready to leap?
      </h2>
      <p className="mx-auto mt-4 max-w-md text-[14px] font-medium text-gray-600 md:text-base">
        Join the waitlist or connect your WhatsApp to start moving capital at the speed of light.
      </p>
      <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <button className="flex w-full items-center justify-center gap-2 rounded-full bg-brand px-8 py-4 text-[14px] font-bold uppercase tracking-wide text-brand-foreground transition-transform hover:scale-105 sm:w-auto">
          <MessageSquare className="h-5 w-5" />
          Conectar com WhatsApp
        </button>
        <button className="w-full rounded-full border-2 border-gray-200 px-8 py-4 text-[14px] font-bold uppercase tracking-wide text-gray-700 transition-colors hover:border-gray-300 sm:w-auto">
          Falar com Sales
        </button>
      </div>
    </section>
  )
}