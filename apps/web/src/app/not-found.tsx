import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4 p-8">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <h2 className="text-2xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="text-muted-foreground max-w-md">
          A página que você procura não existe ou foi removida.
        </p>
        <Link href="/app" className="inline-flex shrink-0 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90">
          Voltar ao painel
        </Link>
      </div>
    </div>
  )
}
