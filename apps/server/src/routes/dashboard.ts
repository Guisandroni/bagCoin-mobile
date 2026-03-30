import { db } from "@bagcoin/db";
import { bankAccount, creditCard, transaction } from "@bagcoin/db/schema";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import Elysia from "elysia";
import { getAuthSession } from "../middleware/auth";

function getMonthRange(year: number, month: number) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export const dashboardRoutes = new Elysia({ prefix: "/api/dashboard" })
  .derive(({ request }) => getAuthSession(request))
  .onBeforeHandle(({ userId, set }) => {
    if (!userId) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
  })

  .get("/summary", async ({ userId }) => {
    const now = new Date();
    const thisMonth = getMonthRange(now.getFullYear(), now.getMonth());
    const lastMonth = getMonthRange(now.getFullYear(), now.getMonth() - 1);

    const incomeSumExpr = sql<number>`COALESCE(SUM(CASE WHEN ${transaction.type} = 'income' THEN ${transaction.amount} ELSE 0 END), 0)`;
    const expenseSumExpr = sql<number>`COALESCE(SUM(CASE WHEN ${transaction.type} = 'expense' THEN ${transaction.amount} ELSE 0 END), 0)`;

    const [[balanceRow], [thisMonthRow], [lastMonthRow], accounts] =
      await Promise.all([
        db
          .select({
            total: sql<number>`COALESCE(SUM(${bankAccount.balance}), 0)`,
          })
          .from(bankAccount)
          .where(eq(bankAccount.userId, userId)),

        db
          .select({ income: incomeSumExpr, expenses: expenseSumExpr })
          .from(transaction)
          .where(
            and(
              eq(transaction.userId, userId),
              gte(transaction.date, thisMonth.start),
              lte(transaction.date, thisMonth.end)
            )
          ),

        db
          .select({ income: incomeSumExpr, expenses: expenseSumExpr })
          .from(transaction)
          .where(
            and(
              eq(transaction.userId, userId),
              gte(transaction.date, lastMonth.start),
              lte(transaction.date, lastMonth.end)
            )
          ),

        db.select().from(bankAccount).where(eq(bankAccount.userId, userId)),
      ]);

    const thisIncome = thisMonthRow?.income ?? 0;
    const thisExpenses = thisMonthRow?.expenses ?? 0;
    const lastIncome = lastMonthRow?.income ?? 0;
    const lastExpenses = lastMonthRow?.expenses ?? 0;

    const thisMonthNet = thisIncome - thisExpenses;
    const lastMonthNet = lastIncome - lastExpenses;

    let changePercent = 0;
    if (lastMonthNet !== 0) {
      changePercent = Math.round(
        ((thisMonthNet - lastMonthNet) / Math.abs(lastMonthNet)) * 100
      );
    } else if (thisMonthNet > 0) {
      changePercent = 100;
    } else if (thisMonthNet < 0) {
      changePercent = -100;
    }

    return {
      data: {
        totalBalance: balanceRow?.total ?? 0,
        monthIncome: thisIncome,
        monthExpenses: thisExpenses,
        changePercent,
        accounts,
      },
    };
  })

  .get("/recent", async ({ userId }) => {
    const data = await db.query.transaction.findMany({
      where: eq(transaction.userId, userId),
      with: { category: true },
      orderBy: [desc(transaction.date)],
      limit: 5,
    });

    return { data };
  })

  .get("/monthly-summary", async ({ userId }) => {
    const now = new Date();
    const { start, end } = getMonthRange(now.getFullYear(), now.getMonth());

    const [row] = await db
      .select({
        income: sql<number>`COALESCE(SUM(CASE WHEN ${transaction.type} = 'income' THEN ${transaction.amount} ELSE 0 END), 0)`,
        expenses: sql<number>`COALESCE(SUM(CASE WHEN ${transaction.type} = 'expense' THEN ${transaction.amount} ELSE 0 END), 0)`,
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
    const total = income + expenses;

    return {
      data: {
        income,
        expenses,
        incomePercent: total > 0 ? Math.round((income / total) * 100) : 0,
        expensePercent: total > 0 ? Math.round((expenses / total) * 100) : 0,
      },
    };
  })

  .get("/credit-cards", async ({ userId }) => {
    const cards = await db
      .select()
      .from(creditCard)
      .where(eq(creditCard.userId, userId));

    const data = cards.map((card) => ({
      ...card,
      available: card.creditLimit - card.usedAmount,
      usagePercent:
        card.creditLimit > 0
          ? Math.round((card.usedAmount / card.creditLimit) * 100)
          : 0,
    }));

    return { data };
  });
