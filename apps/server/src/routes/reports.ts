import { db } from "@bagcoin/db";
import { bankAccount, category, transaction } from "@bagcoin/db/schema";
import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import Elysia, { t } from "elysia";
import { getAuthSession } from "../middleware/auth";

function getDateRange(
  period?: string,
  startDate?: string,
  endDate?: string
): { start: Date; end: Date } {
  if (startDate && endDate) {
    return { start: new Date(startDate), end: new Date(endDate) };
  }

  const now = new Date();

  switch (period) {
    case "quarter": {
      const qMonth = Math.floor(now.getMonth() / 3) * 3;
      return {
        start: new Date(now.getFullYear(), qMonth, 1),
        end: new Date(now.getFullYear(), qMonth + 3, 0, 23, 59, 59, 999),
      };
    }
    case "year":
      return {
        start: new Date(now.getFullYear(), 0, 1),
        end: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999),
      };
    default:
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59,
          999
        ),
      };
  }
}

const periodFields = {
  period: t.Optional(
    t.Union([t.Literal("month"), t.Literal("quarter"), t.Literal("year")])
  ),
  startDate: t.Optional(t.String()),
  endDate: t.Optional(t.String()),
};

export const reportRoutes = new Elysia({ prefix: "/api/reports" })
  .derive(({ request }) => getAuthSession(request))
  .onBeforeHandle(({ userId, set }) => {
    if (!userId) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
  })

  .get(
    "/by-category",
    async ({ query, userId }) => {
      const { start, end } = getDateRange(
        query.period,
        query.startDate,
        query.endDate
      );

      const conditions = [
        eq(transaction.userId, userId),
        eq(transaction.type, "expense"),
        gte(transaction.date, start),
        lte(transaction.date, end),
      ];

      if (query.accountId) {
        conditions.push(eq(transaction.bankAccountId, query.accountId));
      }

      const results = await db
        .select({
          categoryId: transaction.categoryId,
          categoryName: category.name,
          icon: category.icon,
          color: category.color,
          total: sql<number>`COALESCE(SUM(${transaction.amount}), 0)`,
        })
        .from(transaction)
        .leftJoin(category, eq(transaction.categoryId, category.id))
        .where(and(...conditions))
        .groupBy(
          transaction.categoryId,
          category.name,
          category.icon,
          category.color
        )
        .orderBy(desc(sql`SUM(${transaction.amount})`));

      const grandTotal = results.reduce((acc, r) => acc + r.total, 0);

      return {
        data: results.map((r) => ({
          ...r,
          percentage:
            grandTotal > 0
              ? Math.round((r.total / grandTotal) * 10_000) / 100
              : 0,
        })),
      };
    },
    {
      query: t.Object({
        ...periodFields,
        accountId: t.Optional(t.String()),
      }),
    }
  )

  .get(
    "/by-account",
    async ({ query, userId }) => {
      const { start, end } = getDateRange(
        query.period,
        query.startDate,
        query.endDate
      );

      const data = await db
        .select({
          accountId: bankAccount.id,
          accountName: bankAccount.name,
          totalExpenses: sql<number>`COALESCE(SUM(CASE WHEN ${transaction.type} = 'expense' THEN ${transaction.amount} ELSE 0 END), 0)`,
          totalIncome: sql<number>`COALESCE(SUM(CASE WHEN ${transaction.type} = 'income' THEN ${transaction.amount} ELSE 0 END), 0)`,
        })
        .from(bankAccount)
        .leftJoin(
          transaction,
          and(
            eq(bankAccount.id, transaction.bankAccountId),
            eq(transaction.userId, userId),
            gte(transaction.date, start),
            lte(transaction.date, end)
          )
        )
        .where(eq(bankAccount.userId, userId))
        .groupBy(bankAccount.id, bankAccount.name);

      return { data };
    },
    {
      query: t.Object(periodFields),
    }
  )

  .get("/trend", async ({ userId }) => {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const yearExpr = sql`strftime('%Y', ${transaction.date} / 1000, 'unixepoch')`;
    const monthExpr = sql`strftime('%m', ${transaction.date} / 1000, 'unixepoch')`;

    const results = await db
      .select({
        year: sql<number>`CAST(${yearExpr} AS INTEGER)`,
        month: sql<number>`CAST(${monthExpr} AS INTEGER)`,
        income: sql<number>`COALESCE(SUM(CASE WHEN ${transaction.type} = 'income' THEN ${transaction.amount} ELSE 0 END), 0)`,
        expenses: sql<number>`COALESCE(SUM(CASE WHEN ${transaction.type} = 'expense' THEN ${transaction.amount} ELSE 0 END), 0)`,
      })
      .from(transaction)
      .where(
        and(eq(transaction.userId, userId), gte(transaction.date, sixMonthsAgo))
      )
      .groupBy(yearExpr, monthExpr)
      .orderBy(yearExpr, monthExpr);

    return {
      data: results.map((r) => ({
        ...r,
        balance: r.income - r.expenses,
      })),
    };
  })

  .get(
    "/summary",
    async ({ query, userId }) => {
      const { start, end } = getDateRange(
        query.period,
        query.startDate,
        query.endDate
      );

      const [row] = await db
        .select({
          income: sql<number>`COALESCE(SUM(CASE WHEN ${transaction.type} = 'income' THEN ${transaction.amount} ELSE 0 END), 0)`,
          expenses: sql<number>`COALESCE(SUM(CASE WHEN ${transaction.type} = 'expense' THEN ${transaction.amount} ELSE 0 END), 0)`,
          transactionCount: count(),
        })
        .from(transaction)
        .where(
          and(
            eq(transaction.userId, userId),
            gte(transaction.date, start),
            lte(transaction.date, end)
          )
        );

      const income = row?.income ?? 0;
      const expenses = row?.expenses ?? 0;

      return {
        data: {
          income,
          expenses,
          balance: income - expenses,
          transactionCount: row?.transactionCount ?? 0,
        },
      };
    },
    {
      query: t.Object(periodFields),
    }
  );
