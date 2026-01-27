import { db } from "@bagcoin/db";
import { transaction } from "@bagcoin/db/schema/transaction";
import { bank } from "@bagcoin/db/schema/bank";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import z from "zod";

import { router, protectedProcedure } from "../index";

export const transactionRouter = router({
  getAll: protectedProcedure
    .input(
      z.object({
        type: z.enum(["expense", "income"]).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().default(0),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      let query = db
        .select()
        .from(transaction)
        .where(eq(transaction.userId, ctx.session.user.id))
        .orderBy(desc(transaction.date))
        .limit(input?.limit ?? 50)
        .offset(input?.offset ?? 0);

      return await query;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const result = await db
        .select()
        .from(transaction)
        .where(and(eq(transaction.id, input.id), eq(transaction.userId, ctx.session.user.id)));
      return result[0] ?? null;
    }),

  getRecent: protectedProcedure
    .input(z.object({ limit: z.number().default(5) }))
    .query(async ({ ctx, input }) => {
      return await db
        .select()
        .from(transaction)
        .where(eq(transaction.userId, ctx.session.user.id))
        .orderBy(desc(transaction.date))
        .limit(input.limit);
    }),

  create: protectedProcedure
    .input(
      z.object({
        type: z.enum(["expense", "income"]),
        amount: z.number().positive(),
        description: z.string().min(1),
        notes: z.string().optional(),
        categoryId: z.number().optional(),
        bankId: z.number().optional(),
        cardId: z.number().optional(),
        date: z.date(),
        isRecurring: z.boolean().default(false),
        recurringType: z.enum(["daily", "weekly", "monthly", "yearly"]).optional(),
        isPaid: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await db.insert(transaction).values({
        userId: ctx.session.user.id,
        ...input,
      });

      // Update bank balance if linked
      if (input.bankId && input.isPaid) {
        const balanceChange = input.type === "income" ? input.amount : -input.amount;
        await db
          .update(bank)
          .set({
            balance: sql`${bank.balance} + ${balanceChange}`,
            updatedAt: new Date(),
          })
          .where(and(eq(bank.id, input.bankId), eq(bank.userId, ctx.session.user.id)));
      }

      return result;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        type: z.enum(["expense", "income"]).optional(),
        amount: z.number().positive().optional(),
        description: z.string().min(1).optional(),
        notes: z.string().optional(),
        categoryId: z.number().optional(),
        bankId: z.number().optional(),
        cardId: z.number().optional(),
        date: z.date().optional(),
        isRecurring: z.boolean().optional(),
        recurringType: z.enum(["daily", "weekly", "monthly", "yearly"]).optional(),
        isPaid: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await db
        .update(transaction)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(transaction.id, id), eq(transaction.userId, ctx.session.user.id)));
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return await db
        .delete(transaction)
        .where(and(eq(transaction.id, input.id), eq(transaction.userId, ctx.session.user.id)));
    }),

  getMonthlyStats: protectedProcedure
    .input(
      z.object({
        year: z.number(),
        month: z.number().min(1).max(12),
      })
    )
    .query(async ({ ctx, input }) => {
      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0, 23, 59, 59);

      const transactions = await db
        .select()
        .from(transaction)
        .where(
          and(
            eq(transaction.userId, ctx.session.user.id),
            gte(transaction.date, startDate),
            lte(transaction.date, endDate)
          )
        );

      const totalIncome = transactions
        .filter((t) => t.type === "income")
        .reduce((acc, t) => acc + t.amount, 0);

      const totalExpense = transactions
        .filter((t) => t.type === "expense")
        .reduce((acc, t) => acc + t.amount, 0);

      return {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        transactionCount: transactions.length,
      };
    }),

  getByCategory: protectedProcedure
    .input(
      z.object({
        type: z.enum(["expense", "income"]),
        year: z.number(),
        month: z.number().min(1).max(12),
      })
    )
    .query(async ({ ctx, input }) => {
      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0, 23, 59, 59);

      const transactions = await db
        .select()
        .from(transaction)
        .where(
          and(
            eq(transaction.userId, ctx.session.user.id),
            eq(transaction.type, input.type),
            gte(transaction.date, startDate),
            lte(transaction.date, endDate)
          )
        );

      const byCategory = transactions.reduce((acc, t) => {
        const catId = t.categoryId ?? 0;
        if (!acc[catId]) {
          acc[catId] = { categoryId: catId, total: 0, count: 0 };
        }
        acc[catId].total += t.amount;
        acc[catId].count += 1;
        return acc;
      }, {} as Record<number, { categoryId: number; total: number; count: number }>);

      return Object.values(byCategory);
    }),
});
