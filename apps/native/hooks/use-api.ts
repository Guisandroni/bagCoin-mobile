import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface BankAccount {
  balance: number;
  bankCode: string | null;
  color: string | null;
  createdAt: string;
  id: string;
  name: string;
  nickname: string | null;
  type: "checking" | "savings" | "investment" | "digital";
  updatedAt: string;
  userId: string;
}

interface Category {
  color: string;
  createdAt: string;
  icon: string;
  id: string;
  isDefault: boolean;
  name: string;
  sortOrder: number;
  type: "expense" | "income";
  updatedAt: string;
  userId: string | null;
}

interface CreditCard {
  bankAccountId: string | null;
  brand: string | null;
  closingDay: number | null;
  color: string | null;
  createdAt: string;
  creditLimit: number;
  dueDay: number | null;
  id: string;
  lastDigits: string;
  name: string;
  updatedAt: string;
  usedAmount: number;
  userId: string;
}

interface Transaction {
  amount: number;
  bankAccount?: BankAccount | null;
  bankAccountId: string | null;
  category?: Category | null;
  categoryId: string | null;
  createdAt: string;
  creditCard?: CreditCard | null;
  creditCardId: string | null;
  date: string;
  description: string;
  id: string;
  isImported: boolean;
  notes: string | null;
  type: "expense" | "income";
  updatedAt: string;
  userId: string;
}

interface DashboardSummary {
  accounts: BankAccount[];
  changePercent: number;
  monthExpenses: number;
  monthIncome: number;
  totalBalance: number;
}

interface MonthlySummary {
  expensePercent: number;
  expenses: number;
  income: number;
  incomePercent: number;
}

interface DashboardCreditCard extends CreditCard {
  available: number;
  usagePercent: number;
}

interface ProfileData {
  stats: { accounts: number; cards: number; categories: number };
  user: { id: string; name: string; email: string; image: string | null };
}

interface ReportSummary {
  balance: number;
  expenses: number;
  income: number;
  transactionCount: number;
}

interface CategoryReport {
  categoryId: string;
  categoryName: string;
  color: string;
  icon: string;
  percentage: number;
  total: number;
}

interface Wrap<T> {
  data: T;
}
interface PaginatedWrap<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: () => api.get<Wrap<DashboardSummary>>("/api/dashboard/summary"),
    select: (r) => r.data,
  });
}

export function useDashboardRecent() {
  return useQuery({
    queryKey: ["dashboard", "recent"],
    queryFn: () => api.get<Wrap<Transaction[]>>("/api/dashboard/recent"),
    select: (r) => r.data,
  });
}

export function useMonthlySummary() {
  return useQuery({
    queryKey: ["dashboard", "monthly-summary"],
    queryFn: () =>
      api.get<Wrap<MonthlySummary>>("/api/dashboard/monthly-summary"),
    select: (r) => r.data,
  });
}

export function useDashboardCreditCards() {
  return useQuery({
    queryKey: ["dashboard", "credit-cards"],
    queryFn: () =>
      api.get<Wrap<DashboardCreditCard[]>>("/api/dashboard/credit-cards"),
    select: (r) => r.data,
  });
}

export function useBankAccounts() {
  return useQuery({
    queryKey: ["bank-accounts"],
    queryFn: () => api.get<Wrap<BankAccount[]>>("/api/bank-accounts"),
    select: (r) => r.data,
  });
}

export function useCreditCards() {
  return useQuery({
    queryKey: ["credit-cards"],
    queryFn: () => api.get<Wrap<CreditCard[]>>("/api/credit-cards"),
    select: (r) => r.data,
  });
}

export function useCategories(type?: "expense" | "income") {
  const query = type ? `?type=${type}` : "";
  return useQuery({
    queryKey: ["categories", type ?? "all"],
    queryFn: () => api.get<Wrap<Category[]>>(`/api/categories${query}`),
    select: (r) => r.data,
  });
}

export function useTransactions(params?: {
  type?: string;
  page?: number;
  limit?: number;
}) {
  const search = new URLSearchParams();
  if (params?.type) {
    search.set("type", params.type);
  }
  if (params?.page) {
    search.set("page", String(params.page));
  }
  if (params?.limit) {
    search.set("limit", String(params.limit));
  }
  const query = search.toString() ? `?${search.toString()}` : "";

  return useQuery({
    queryKey: ["transactions", params?.type ?? "all", params?.page ?? 1],
    queryFn: () =>
      api.get<PaginatedWrap<Transaction>>(`/api/transactions${query}`),
  });
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: () => api.get<Wrap<ProfileData>>("/api/profile"),
    select: (r) => r.data,
  });
}

export function useReportSummary(month: number, year: number) {
  return useQuery({
    queryKey: ["reports", "summary", month, year],
    queryFn: () =>
      api.get<Wrap<ReportSummary>>(
        `/api/reports/summary?month=${month}&year=${year}`
      ),
    select: (r) => r.data,
  });
}

export function useReportByCategory(month: number, year: number) {
  return useQuery({
    queryKey: ["reports", "by-category", month, year],
    queryFn: () =>
      api.get<Wrap<CategoryReport[]>>(
        `/api/reports/by-category?month=${month}&year=${year}`
      ),
    select: (r) => r.data,
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      type: "expense" | "income";
      amount: number;
      description: string;
      date: string;
      categoryId?: string;
      bankAccountId?: string;
      creditCardId?: string;
      notes?: string;
    }) => api.post<Wrap<Transaction>>("/api/transactions", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["bank-accounts"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<Wrap<{ id: string }>>(`/api/transactions/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["bank-accounts"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name: string;
      type: "expense" | "income";
      icon: string;
      color: string;
    }) => api.post<Wrap<Category>>("/api/categories", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useCreateBankAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name: string;
      type: "checking" | "savings" | "investment" | "digital";
      balance?: number;
      color?: string;
      bankCode?: string;
    }) => api.post<Wrap<BankAccount>>("/api/bank-accounts", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bank-accounts"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
