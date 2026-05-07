/** Static demo data from apps/web/template/bagcoin-dashboard.html (SEED) */

export const SEED_USER = {
  name: "Guilherme Santos",
  email: "guilherme@bagcoin.com",
} as const

export const SEED_BALANCE = 23568.42

export const SEED_BALANCE_HISTORY = [
  { day: "28/04", val: 14800 },
  { day: "29/04", val: 16100 },
  { day: "30/04", val: 15300 },
  { day: "01/05", val: 18200 },
  { day: "02/05", val: 19900 },
  { day: "03/05", val: 21500 },
  { day: "04/05", val: 23568 },
] as const

export const SEED_STATS = {
  income: { value: 8500, sub: "Salário + freelance R$ 5.500", trend: 12 },
  expenses: { value: 642.5, sub: "4 categorias", trend: -3 },
  savings: { value: 7857.5, sub: "92% da receita", trend: 5 },
} as const

export const SEED_CATEGORIES = [
  { name: "Alimentação", value: 245.8, color: "oklch(58% 0.18 255)" },
  { name: "Transporte", value: 158.3, color: "oklch(64% 0.13 28)" },
  { name: "Moradia", value: 120.0, color: "oklch(58% 0.16 145)" },
  { name: "Lazer", value: 78.4, color: "oklch(52% 0.12 250)" },
  { name: "Outros", value: 40.0, color: "oklch(65% 0.16 80)" },
] as const

export const SEED_TRANSACTIONS = [
  {
    id: 1,
    name: "Salário Maio",
    category: "Receita",
    date: "2026-05-01",
    amount: 5500,
    type: "income" as const,
    source: "Auto",
    status: "Confirmada",
  },
  {
    id: 2,
    name: "Freelance Design",
    category: "Receita",
    date: "2026-05-02",
    amount: 3000,
    type: "income" as const,
    source: "Manual",
    status: "Confirmada",
  },
  {
    id: 3,
    name: "Supermercado",
    category: "Alimentação",
    date: "2026-05-02",
    amount: -245.8,
    type: "expense" as const,
    source: "WhatsApp",
    status: "Confirmada",
  },
  {
    id: 4,
    name: "Uber",
    category: "Transporte",
    date: "2026-05-03",
    amount: -45.5,
    type: "expense" as const,
    source: "WhatsApp",
    status: "Confirmada",
  },
  {
    id: 5,
    name: "Aluguel",
    category: "Moradia",
    date: "2026-05-01",
    amount: -120.0,
    type: "expense" as const,
    source: "Manual",
    status: "Confirmada",
  },
  {
    id: 6,
    name: "Restaurante Japonês",
    category: "Alimentação",
    date: "2026-05-03",
    amount: -158.3,
    type: "expense" as const,
    source: "WhatsApp",
    status: "Pendente",
  },
  {
    id: 7,
    name: "Gasolina",
    category: "Transporte",
    date: "2026-05-04",
    amount: -112.8,
    type: "expense" as const,
    source: "Auto",
    status: "Pendente",
  },
  {
    id: 8,
    name: "Netflix",
    category: "Lazer",
    date: "2026-05-03",
    amount: -45.9,
    type: "expense" as const,
    source: "Auto",
    status: "Confirmada",
  },
  {
    id: 9,
    name: "Cinema",
    category: "Lazer",
    date: "2026-05-04",
    amount: -32.5,
    type: "expense" as const,
    source: "WhatsApp",
    status: "Pendente",
  },
] as const

export const SEED_BUDGETS = [
  {
    id: 1,
    name: "Alimentação",
    category: "Alimentação",
    amount_limit: 600,
    spent: 404.1,
    period: "Mensal",
  },
  {
    id: 2,
    name: "Transporte",
    category: "Transporte",
    amount_limit: 400,
    spent: 158.3,
    period: "Mensal",
  },
  {
    id: 3,
    name: "Lazer",
    category: "Lazer",
    amount_limit: 300,
    spent: 248.4,
    period: "Mensal",
  },
  {
    id: 4,
    name: "Compras",
    category: "Outros",
    amount_limit: 500,
    spent: 40.0,
    period: "Mensal",
  },
  {
    id: 5,
    name: "Assinaturas",
    category: "Outros",
    amount_limit: 200,
    spent: 155.7,
    period: "Mensal",
  },
] as const

export const SEED_GOALS = [
  {
    id: 1,
    name: "Viagem Japão 2026",
    target_amount: 15000,
    current_amount: 8200,
    deadline: "2026-12-15",
    status: "Ativa",
  },
  {
    id: 2,
    name: "Reserva Emergência",
    target_amount: 30000,
    current_amount: 18600,
    deadline: null,
    status: "Ativa",
  },
  {
    id: 3,
    name: "MacBook Pro M6",
    target_amount: 22000,
    current_amount: 22000,
    deadline: "2026-04-30",
    status: "Concluída",
  },
  {
    id: 4,
    name: "Curso Pós-Graduação",
    target_amount: 12000,
    current_amount: 3500,
    deadline: "2027-01-01",
    status: "Ativa",
  },
] as const

export const SEED_ACCOUNTS = [
  {
    id: 1,
    name: "Conta Corrente",
    type: "Corrente",
    balance: 12450.3,
    institution: "Nubank",
  },
  {
    id: 2,
    name: "Poupança",
    type: "Poupança",
    balance: 8118.12,
    institution: "Itaú",
  },
  {
    id: 3,
    name: "Investimentos",
    type: "Investimento",
    balance: 3000.0,
    institution: "XP",
  },
] as const

export const SEED_CREDIT_CARDS = [
  {
    id: 1,
    name: "Nubank Visa",
    brand: "Visa",
    last_digits: "4821",
    limit: 8000,
    current_bill: 1245.8,
    due_day: 10,
  },
  {
    id: 2,
    name: "Inter Master",
    brand: "Mastercard",
    last_digits: "9374",
    limit: 5000,
    current_bill: 320.0,
    due_day: 25,
  },
] as const

export const SEED_CONVERSATIONS = [
  {
    id: 1,
    user_phone: "+55 11 99999-0001",
    last_message: "Paguei o supermercado R$ 245,80",
    timestamp: "10:42",
    pending: 0,
    messages: [
      { from: "user" as const, text: "Paguei o supermercado R$ 245,80" },
      {
        from: "bot" as const,
        text:
          "Transação registrada como pendente. Categoria identificada: Alimentação. Deseja confirmar?",
      },
    ],
  },
  {
    id: 2,
    user_phone: "+55 11 98888-0002",
    last_message: "Cinema R$ 32,50 — meia entrada",
    timestamp: "09:15",
    pending: 1,
    messages: [
      { from: "user" as const, text: "Cinema R$ 32,50 — meia entrada" },
      { from: "bot" as const, text: "Registrei como Lazer — R$ 32,50. Confirmar?" },
    ],
  },
  {
    id: 3,
    user_phone: "+55 11 97777-0003",
    last_message: "Recebi R$ 3.000 do freelance",
    timestamp: "Ontem",
    pending: 0,
    messages: [
      { from: "user" as const, text: "Recebi R$ 3.000 do freelance de design" },
      { from: "bot" as const, text: "Entrada registrada! Categoria: Receita — Freelance." },
    ],
  },
] as const

export const SEED_REPORTS = [
  {
    id: 1,
    type: "Mensal",
    period: "Abril 2026",
    created_at: "2026-05-01",
    status: "Pronto",
    file_url: "#",
  },
  {
    id: 2,
    type: "Mensal",
    period: "Março 2026",
    created_at: "2026-04-01",
    status: "Pronto",
    file_url: "#",
  },
  {
    id: 3,
    type: "Mensal",
    period: "Maio 2026",
    created_at: "2026-05-04",
    status: "Processando",
    file_url: null as string | null,
  },
] as const
