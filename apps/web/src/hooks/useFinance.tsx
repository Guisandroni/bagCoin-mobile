"use client";

import React, { createContext, useContext, useReducer, useEffect } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { useBudgets } from "@/hooks/useBudgets";
import { useFunds } from "@/hooks/useFunds";
import { Transaction as ApiTransaction } from "@/lib/api";

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
  | { type: "ADD_TRANSACTION"; payload: Transaction }
  | { type: "ADD_TRANSACTIONS"; payload: Transaction[] }
  | { type: "UPDATE_TRANSACTION"; payload: Transaction }
  | { type: "DELETE_TRANSACTION"; payload: string }
  | { type: "ADD_GOAL"; payload: Goal }
  | { type: "UPDATE_GOAL"; payload: Goal }
  | { type: "DELETE_GOAL"; payload: string }
  | { type: "ADD_CONTRIBUTION"; payload: { goalId: string; amount: number } }
  | { type: "ADD_BUDGET"; payload: BudgetItem }
  | { type: "UPDATE_BUDGET"; payload: BudgetItem }
  | { type: "DELETE_BUDGET"; payload: string }
  | { type: "UPDATE_SETTINGS"; payload: Partial<UserSettings> }
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
  accounts: [],
  cards: [],
  transactions: [],
  goals: [],
  budgets: [],
  settings: { ...defaultSettings },
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SELECT_ACCOUNT":
      return { ...state, selectedAccountId: action.payload, selectedCardId: null };
    case "SELECT_CARD":
      return { ...state, selectedCardId: action.payload, selectedAccountId: null };
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
    case "LOAD_STATE":
      return { ...initialState, ...action.payload };
    default:
      return state;
  }
}

interface FinanceContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { transactions: apiTransactions, summary, isLoading: txLoading, error: txError } = useTransactions();
  const { budgets: apiBudgets } = useBudgets();
  const { funds: apiFunds } = useFunds();

  // Transform API data to app format
  useEffect(() => {
    if (apiTransactions.length > 0) {
      const transformedTxs: Transaction[] = apiTransactions.map((t: ApiTransaction) => ({
        id: String(t.id),
        name: t.description,
        amount: Math.abs(t.amount),
        category: t.category,
        date: t.transaction_date,
        type: t.amount > 0 ? "income" : "expense",
        recurring: false,
        status: "paid" as TransactionStatus,
      }));
      dispatch({ type: "ADD_TRANSACTIONS", payload: transformedTxs });
    }
  }, [apiTransactions]);

  useEffect(() => {
    if (apiBudgets.length > 0) {
      const transformedBudgets: BudgetItem[] = apiBudgets.flatMap((b) =>
        b.categories.map((c) => ({
          id: String(c.id),
          category: c.category_name,
          budgeted: c.budgeted_amount,
          spent: c.spent_amount,
          icon: "category",
          color: "#9fe870",
          subcategories: [],
        }))
      );
      dispatch({ type: "LOAD_STATE", payload: { ...initialState, budgets: transformedBudgets } });
    }
  }, [apiBudgets]);

  useEffect(() => {
    if (apiFunds.length > 0) {
      const transformedGoals: Goal[] = apiFunds.map((f) => ({
        id: String(f.id),
        title: f.name,
        target: f.target_amount || 0,
        current: f.current_amount,
        color: "#9fe870",
        icon: "savings",
        deadline: "N/A",
        monthly: 0,
      }));
      dispatch({ type: "LOAD_STATE", payload: { ...initialState, goals: transformedGoals } });
    }
  }, [apiFunds]);

  const refetch = () => {
    // This will be handled by the hooks themselves via SWR/react-query
    window.location.reload();
  };

  return (
    <FinanceContext.Provider
      value={{
        state,
        dispatch,
        isLoading: txLoading,
        error: txError,
        refetch,
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
