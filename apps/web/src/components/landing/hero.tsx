import Link from "next/link"
import { MessageSquare } from "lucide-react"

export function HeroSection() {
  return (
    <header className="mx-auto mt-4 px-4">
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#4da4fc] via-[#3a7cf5] to-[#68bafc] px-8 py-20 md:py-32">
        <div
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            backgroundImage: `url("data:image/svg+xml;utf8,<svg width='100%' height='100%' xmlns='http://www.w3.org/2000/svg'><defs><pattern id='grid' width='40' height='40' patternUnits='userSpaceOnUse'><path d='M 40 0 L 0 0 0 40' fill='none' stroke='rgba(255,255,255,0.1)' stroke-width='1'/></pattern></defs><rect width='100%' height='100%' fill='url(%23grid)'/></svg>")`,
          }}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-1/2 bg-[radial-gradient(circle_at_bottom,_rgba(255,255,255,0.2)_0%,_transparent_70%)]" />

        <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center text-center">
          <h1 className="font-heading text-[12vw] font-bold uppercase leading-[0.9] tracking-tight text-gray-900 md:text-[8vw] lg:text-[100px]">
            Money For
            <br />
            Here, There
            <br />
            And Everywhere
          </h1>

          <div className="mt-16 flex w-full max-w-5xl flex-col items-start justify-between gap-8 text-left md:flex-row">
            <p className="max-w-md text-[18px] font-medium leading-tight text-gray-800 md:text-xl">
              Redefining capital through technology, transparency, and clinical design.
            </p>
            <Link
              href="#"
              className="flex shrink-0 items-center gap-2 rounded-full bg-brand px-8 py-4 text-[18px] font-semibold text-brand-foreground transition-transform hover:scale-105"
            >
              <span>Conectar com WhatsApp</span>
              <MessageSquare className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}