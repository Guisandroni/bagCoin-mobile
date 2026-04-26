"use client";

import React, { createContext, useContext, useReducer, useEffect } from "react";

export type TransactionType = "income" | "expense";
export type TransactionStatus = "paid" | "pending" | "overdue";

export interface Transaction {
  id: string;
  name: string;
  amount: number;
  category: string;
  date: string;
  type: TransactionType;
  recurring: boolean;
  status: TransactionStatus;
  accountId?: string;
  cardId?: string;
  installments?: number;
  installmentNumber?: number;
  parentId?: string;
}

export interface BankAccount {
  id: string;
  name: string;
  balance: number;
  bankName: string;
  color: string;
  icon: string;
}

export interface CreditCard {
  id: string;
  name: string;
  limit: number;
  used: number;
  dueDate: number;
  closingDay: number;
  color: string;
  flag: string;
}

export interface UserSettings {
  name: string;
  avatar: string;
  currency: string;
  language: string;
  country: string;
  customCategories: string[];
}

export interface Goal {
  id: string;
  title: string;
  target: number;
  current: number;
  color: string;
  icon: string;
  deadline: string;
  monthly: number;
}

export interface BudgetItem {
  id: string;
  category: string;
  budgeted: number;
  spent: number;
  icon: string;
  color: string;
  subcategories: string[];
}

interface AppState {
  selectedAccountId: string | null;
  selectedCardId: string | null;
  accounts: BankAccount[];
  cards: CreditCard[];
  transactions: Transaction[];
  goals: Goal[];
  budgets: BudgetItem[];
  settings: UserSettings;
}

type Action =
  | { type: "SELECT_ACCOUNT"; payload: string | null }
  | { type: "SELECT_CARD"; payload: string | null }
  | { type: "ADD_ACCOUNT"; payload: BankAccount }
  | { type: "UPDATE_ACCOUNT"; payload: BankAccount }
  | { type: "DELETE_ACCOUNT"; payload: string }
  | { type: "ADD_CARD"; payload: CreditCard }
  | { type: "UPDATE_CARD"; payload: CreditCard }
  | { type: "DELETE_CARD"; payload: string }
  | { type: "ADD_TRANSACTION"; payload: Transaction }
  | { type: "ADD_TRANSACTIONS"; payload: Transaction[] }
  | { type: "UPDATE_TRANSACTION"; payload: Transaction }
  | { type: "DELETE_TRANSACTION"; payload: string }
  | { type: "PAY_INVOICE"; payload: { accountId: string; cardId: string; amount: number } }
  | { type: "ADD_GOAL"; payload: Goal }
  | { type: "UPDATE_GOAL"; payload: Goal }
  | { type: "DELETE_GOAL"; payload: string }
  | { type: "ADD_CONTRIBUTION"; payload: { goalId: string; amount: number } }
  | { type: "ADD_BUDGET"; payload: BudgetItem }
  | { type: "UPDATE_BUDGET"; payload: BudgetItem }
  | { type: "DELETE_BUDGET"; payload: string }
  | { type: "UPDATE_SETTINGS"; payload: Partial<UserSettings> }
  | { type: "RESET_DATA" }
  | { type: "LOAD_STATE"; payload: AppState };

const defaultSettings: UserSettings = {
  name: "Usuário",
  avatar: "",
  currency: "BRL",
  language: "pt-BR",
  country: "Brasil",
  customCategories: [],
};

const initialState: AppState = {
  selectedAccountId: null,
  selectedCardId: null,
  accounts: [
    { id: "acc-1", name: "Conta Principal", balance: 15850, bankName: "Nubank", color: "#9fe870", icon: "account_balance" },
    { id: "acc-2", name: "Poupança", balance: 8900, bankName: "Itaú", color: "#163300", icon: "savings" },
  ],
  cards: [
    { id: "card-1", name: "Platinum", limit: 12000, used: 3840, dueDate: 15, closingDay: 7, color: "#0e0f0c", flag: "mastercard" },
    { id: "card-2", name: "Gold", limit: 8000, used: 2150, dueDate: 20, closingDay: 12, color: "#163300", flag: "visa" },
  ],
  transactions: [
    { id: "tx-1", name: "Salário", amount: 7500, category: "Renda", date: "2026-04-24", type: "income", recurring: true, status: "paid", accountId: "acc-1" },
    { id: "tx-2", name: "Supermercado Extra", amount: 487.32, category: "Alimentação", date: "2026-04-23", type: "expense", recurring: false, status: "paid", accountId: "acc-1" },
    { id: "tx-3", name: "Netflix", amount: 39.90, category: "Entretenimento", date: "2026-04-22", type: "expense", recurring: true, status: "pending", accountId: "acc-1" },
    { id: "tx-4", name: "Uber", amount: 24.50, category: "Transporte", date: "2026-04-21", type: "expense", recurring: false, status: "paid", cardId: "card-1" },
    { id: "tx-5", name: "Freela Design", amount: 1200, category: "Renda Extra", date: "2026-04-20", type: "income", recurring: false, status: "paid", accountId: "acc-2" },
    { id: "tx-6", name: "Academia", amount: 129.90, category: "Saúde", date: "2026-04-19", type: "expense", recurring: true, status: "pending", accountId: "acc-1" },
    { id: "tx-7", name: "iFood", amount: 67.40, category: "Alimentação", date: "2026-04-18", type: "expense", recurring: false, status: "paid", cardId: "card-2" },
    { id: "tx-8", name: "Aluguel", amount: 2100, category: "Moradia", date: "2026-04-15", type: "expense", recurring: true, status: "overdue", accountId: "acc-1" },
    { id: "tx-9", name: "Spotify", amount: 19.90, category: "Entretenimento", date: "2026-04-14", type: "expense", recurring: true, status: "paid", accountId: "acc-1" },
    { id: "tx-10", name: "Consulta Médica", amount: 250, category: "Saúde", date: "2026-04-12", type: "expense", recurring: false, status: "paid", accountId: "acc-1" },
    { id: "tx-11", name: "Gasolina", amount: 180, category: "Transporte", date: "2026-04-10", type: "expense", recurring: false, status: "paid", cardId: "card-1" },
    { id: "tx-12", name: "Amazon", amount: 349.90, category: "Compras", date: "2026-04-08", type: "expense", recurring: false, status: "paid", cardId: "card-1", installments: 3, installmentNumber: 1 },
    { id: "tx-13", name: "Amazon (2/3)", amount: 349.90, category: "Compras", date: "2026-05-08", type: "expense", recurring: false, status: "pending", cardId: "card-1", installments: 3, installmentNumber: 2, parentId: "tx-12" },
    { id: "tx-14", name: "Amazon (3/3)", amount: 349.90, category: "Compras", date: "2026-06-08", type: "expense", recurring: false, status: "pending", cardId: "card-1", installments: 3, installmentNumber: 3, parentId: "tx-12" },
  ],
  goals: [
    { id: "goal-1", title: "Viagem Japão", target: 15000, current: 8750, color: "#9fe870", icon: "flight", deadline: "Dez 2026", monthly: 1042 },
    { id: "goal-2", title: "MacBook Pro", target: 18000, current: 12000, color: "#163300", icon: "laptop_mac", deadline: "Ago 2026", monthly: 1500 },
    { id: "goal-3", title: "Reserva de Emergência", target: 25000, current: 18500, color: "#ffd11a", icon: "shield", deadline: "Mar 2027", monthly: 722 },
    { id: "goal-4", title: "Entrada Apartamento", target: 80000, current: 32000, color: "#ffc091", icon: "apartment", deadline: "Dez 2028", monthly: 2222 },
  ],
  budgets: [
    { id: "budget-1", category: "Alimentação", budgeted: 1500, spent: 1250, icon: "restaurant", color: "#9fe870", subcategories: ["Mercado", "Restaurantes", "Delivery"] },
    { id: "budget-2", category: "Transporte", budgeted: 800, spent: 680, icon: "directions_car", color: "#163300", subcategories: ["Combustível", "Uber", "Ônibus"] },
    { id: "budget-3", category: "Moradia", budgeted: 2800, spent: 2800, icon: "home", color: "#ffd11a", subcategories: ["Aluguel", "Condomínio", "Contas"] },
    { id: "budget-4", category: "Entretenimento", budgeted: 500, spent: 420, icon: "movie", color: "#ffc091", subcategories: ["Streaming", "Cinema", "Lazer"] },
    { id: "budget-5", category: "Saúde", budgeted: 400, spent: 380, icon: "health_and_safety", color: "#d03238", subcategories: ["Academia", "Médico", "Farmácia"] },
    { id: "budget-6", category: "Compras", budgeted: 600, spent: 210, icon: "shopping_bag", color: "#868685", subcategories: ["Roupas", "Eletrônicos", "Casa"] },
  ],
  settings: { ...defaultSettings },
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SELECT_ACCOUNT":
      return { ...state, selectedAccountId: action.payload, selectedCardId: null };
    case "SELECT_CARD":
      return { ...state, selectedCardId: action.payload, selectedAccountId: null };
    case "ADD_ACCOUNT":
      return { ...state, accounts: [...state.accounts, action.payload] };
    case "UPDATE_ACCOUNT":
      return {
        ...state,
        accounts: state.accounts.map((a) => (a.id === action.payload.id ? action.payload : a)),
      };
    case "DELETE_ACCOUNT":
      return {
        ...state,
        accounts: state.accounts.filter((a) => a.id !== action.payload),
        transactions: state.transactions.filter((t) => t.accountId !== action.payload),
      };
    case "ADD_CARD":
      return { ...state, cards: [...state.cards, action.payload] };
    case "UPDATE_CARD":
      return {
        ...state,
        cards: state.cards.map((c) => (c.id === action.payload.id ? action.payload : c)),
      };
    case "DELETE_CARD":
      return {
        ...state,
        cards: state.cards.filter((c) => c.id !== action.payload),
        transactions: state.transactions.filter((t) => t.cardId !== action.payload),
      };
    case "ADD_TRANSACTION":
      return { ...state, transactions: [...state.transactions, action.payload] };
    case "ADD_TRANSACTIONS":
      return { ...state, transactions: [...state.transactions, ...action.payload] };
    case "UPDATE_TRANSACTION":
      return {
        ...state,
        transactions: state.transactions.map((t) =>
          t.id === action.payload.id ? action.payload : t
        ),
      };
    case "DELETE_TRANSACTION":
      return {
        ...state,
        transactions: state.transactions.filter((t) => t.id !== action.payload),
      };
    case "PAY_INVOICE": {
      const { accountId, cardId, amount } = action.payload;
      return {
        ...state,
        accounts: state.accounts.map((a) =>
          a.id === accountId ? { ...a, balance: a.balance - amount } : a
        ),
        cards: state.cards.map((c) =>
          c.id === cardId ? { ...c, used: Math.max(0, c.used - amount) } : c
        ),
      };
    }
    case "ADD_GOAL":
      return { ...state, goals: [...state.goals, action.payload] };
    case "UPDATE_GOAL":
      return {
        ...state,
        goals: state.goals.map((g) => (g.id === action.payload.id ? action.payload : g)),
      };
    case "DELETE_GOAL":
      return {
        ...state,
        goals: state.goals.filter((g) => g.id !== action.payload),
      };
    case "ADD_CONTRIBUTION": {
      const { goalId, amount } = action.payload;
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === goalId ? { ...g, current: Math.min(g.current + amount, g.target) } : g
        ),
      };
    }
    case "ADD_BUDGET":
      return { ...state, budgets: [...state.budgets, action.payload] };
    case "UPDATE_BUDGET":
      return {
        ...state,
        budgets: state.budgets.map((b) => (b.id === action.payload.id ? action.payload : b)),
      };
    case "DELETE_BUDGET":
      return {
        ...state,
        budgets: state.budgets.filter((b) => b.id !== action.payload),
      };
    case "UPDATE_SETTINGS":
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };
    case "RESET_DATA":
      return {
        ...initialState,
        settings: state.settings,
        goals: state.goals,
        budgets: state.budgets,
      };
    case "LOAD_STATE":
      return { ...initialState, ...action.payload };
    default:
      return state;
  }
}

interface FinanceContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  canCreateTransaction: () => boolean;
  getTransactionsForMonth: (month: string) => Transaction[];
  getFutureTransactions: () => Transaction[];
  getRecurringTransactions: () => Transaction[];
  totalBalance: number;
  totalIncomeForMonth: number;
  totalExpenseForMonth: number;
  totalInvestments: number;
  totalGoals: number;
  totalGoalsTarget: number;
  totalBudgeted: number;
  totalBudgetSpent: number;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("bagcoin_state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        dispatch({ type: "LOAD_STATE", payload: { ...initialState, ...parsed } });
      } catch {
        // ignore
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("bagcoin_state", JSON.stringify(state));
  }, [state]);

  const canCreateTransaction = () => {
    return state.accounts.some((a) => a.balance > 0) || state.cards.some((c) => c.limit - c.used > 0);
  };

  const getTransactionsForMonth = (month: string) => {
    return state.transactions.filter((t) => t.date.startsWith(month));
  };

  const getFutureTransactions = () => {
    const today = new Date().toISOString().slice(0, 10);
    return state.transactions
      .filter((t) => t.date > today)
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  const getRecurringTransactions = () => {
    return state.transactions.filter((t) => t.recurring);
  };

  const totalBalance = state.accounts.reduce((acc, a) => acc + a.balance, 0);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthTxs = getTransactionsForMonth(currentMonth);
  const totalIncomeForMonth = monthTxs
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);
  const totalExpenseForMonth = monthTxs
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + t.amount, 0);
  const totalInvestments = 12400; // mocked for now

  const totalGoals = state.goals.reduce((acc, g) => acc + g.current, 0);
  const totalGoalsTarget = state.goals.reduce((acc, g) => acc + g.target, 0);
  const totalBudgeted = state.budgets.reduce((acc, b) => acc + b.budgeted, 0);
  const totalBudgetSpent = state.budgets.reduce((acc, b) => acc + b.spent, 0);

  return (
    <FinanceContext.Provider
      value={{
        state,
        dispatch,
        canCreateTransaction,
        getTransactionsForMonth,
        getFutureTransactions,
        getRecurringTransactions,
        totalBalance,
        totalIncomeForMonth,
        totalExpenseForMonth,
        totalInvestments,
        totalGoals,
        totalGoalsTarget,
        totalBudgeted,
        totalBudgetSpent,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used within FinanceProvider");
  return ctx;
}
