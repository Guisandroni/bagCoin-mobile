export const BRAND = {
  pre: "bag",
  suf: "Coin",
};

export const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "LayoutGrid" },
  { id: "transacoes", label: "Transações", icon: "List" },
  { id: "orcamentos", label: "Orçamentos", icon: "BarChart3" },
  { id: "metas", label: "Metas", icon: "Target" },
  { id: "confirmacoes", label: "Confirmações", icon: "MessageSquare" },
  { id: "relatorios", label: "Relatórios", icon: "FileText" },
];

export const MOBILE_NAV_ITEMS = [
  { id: "dashboard", label: "Início", icon: "Home" },
  { id: "transacoes", label: "Transações", icon: "List" },
  { id: "orcamentos", label: "Orçamentos", icon: "BarChart3" },
  { id: "new", label: "Novo", icon: "Plus" },
  { id: "metas", label: "Metas", icon: "Target" },
  { id: "contas", label: "Contas", icon: "Wallet" },
  { id: "relatorios", label: "Relatórios", icon: "FileText" },
];

export const CATEGORIES = [
  {
    label: "Alimentação",
    icon: "🍔",
    name: "Alimentação",
    color: "#FF6B6B",
    emoji: "🍔",
  },
  {
    label: "Transporte",
    icon: "🚗",
    name: "Transporte",
    color: "#4ECDC4",
    emoji: "🚗",
  },
  {
    label: "Moradia",
    icon: "🏠",
    name: "Moradia",
    color: "#45B7D1",
    emoji: "🏠",
  },
  { label: "Saúde", icon: "🏥", name: "Saúde", color: "#96CEB4", emoji: "🏥" },
  {
    label: "Educação",
    icon: "📚",
    name: "Educação",
    color: "#FFEAA7",
    emoji: "📚",
  },
  { label: "Lazer", icon: "🎮", name: "Lazer", color: "#DDA0DD", emoji: "🎮" },
  {
    label: "Salário",
    icon: "💼",
    name: "Salário",
    color: "#98D8C8",
    emoji: "💼",
  },
  {
    label: "Investimentos",
    icon: "📈",
    name: "Investimentos",
    color: "#F7DC6F",
    emoji: "📈",
  },
];

export const PERIODS = [
  { value: "monthly", label: "Mensal" },
  { value: "weekly", label: "Semanal" },
  { value: "yearly", label: "Anual" },
];

export const SOURCE_LABELS: Record<string, string> = {
  text: "Texto",
  audio: "Áudio",
  image: "Imagem",
  document: "Documento",
  api: "API",
};

export const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmado",
  pending: "Pendente",
  cancelled: "Cancelado",
};
