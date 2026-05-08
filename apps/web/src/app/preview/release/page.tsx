import Link from "next/link"

const pages = [
  { href: "/preview/release/dashboard", label: "Dashboard", desc: "Centro Financeiro com saldo, transações, donut chart" },
  { href: "/preview/release/login", label: "Login", desc: "Tela de login com email, senha, Google OAuth" },
  { href: "/preview/release/register", label: "Registro", desc: "Tela de cadastro com nome, email, senha" },
  { href: "/preview/release/metas", label: "Metas de Economia", desc: "Lista de metas com progresso circular" },
  { href: "/preview/release/orcamentos", label: "Orçamentos Mensais", desc: "Cards de orçamento por categoria" },
  { href: "/preview/release/categorias", label: "Categorias", desc: "Lista de categorias com filtro chips" },
  { href: "/preview/release/transacoes", label: "Transações", desc: "Lista de transações com search e filtros" },
  { href: "/preview/release/relatorios", label: "Relatórios Financeiros", desc: "Lista de relatórios com download" },
  { href: "/preview/release/criar-meta", label: "Criar Meta/Orçamento", desc: "Form com segment toggle Meta/Orçamento" },
  { href: "/preview/release/perfil", label: "Perfil do Usuário", desc: "Perfil com cards agrupados" },
  { href: "/preview/release/configuracoes", label: "Configurações", desc: "Lista de configurações + logout" },
  { href: "/preview/release/alterar-senha", label: "Alterar Senha", desc: "Modal/bottom sheet de senha" },
]

export default function ReleasePreviewIndex() {
  return (
    <div className="rls min-h-screen bg-[var(--rls-background)] p-[var(--rls-container-margin)]">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8 pt-8">
          <h1 className="rls-text-display-lg text-[var(--rls-on-surface)] mb-2">
            Release Preview
          </h1>
          <p className="rls-text-body-lg text-[var(--rls-on-surface-variant)]">
            Visualização dos componentes da nova interface (MD3 Design System).
          </p>
        </header>

        <div className="flex flex-col gap-3">
          {pages.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className="bg-[var(--rls-surface-container-lowest)] p-4 rounded-[var(--rls-radius-lg)] shadow-sm hover:bg-[var(--rls-surface-container-low)] transition-colors block"
            >
              <span className="rls-text-title-lg text-[var(--rls-primary-container)] block">
                {page.label}
              </span>
              <span className="rls-text-body-md text-[var(--rls-on-surface-variant)]">
                {page.desc}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}