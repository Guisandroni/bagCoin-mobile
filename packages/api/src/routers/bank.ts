import { db } from "@bagcoin/db";
import { bank } from "@bagcoin/db/schema/bank";
import { eq, and } from "drizzle-orm";
import z from "zod";

import { router, protectedProcedure } from "../index";

export const bankRouter = router({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return await db
      .select()
      .from(bank)
      .where(eq(bank.userId, ctx.session.user.id));
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const result = await db
        .select()
        .from(bank)
        .where(and(eq(bank.id, input.id), eq(bank.userId, ctx.session.user.id)));
      return result[0] ?? null;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        bankCode: z.string().optional(),
        accountNumber: z.string().optional(),
        accountType: z.enum(["checking", "savings", "investment"]).default("checking"),
        balance: z.number().default(0),
        currency: z.string().default("BRL"),
        color: z.string().optional(),
        icon: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await db.insert(bank).values({
        userId: ctx.session.user.id,
        ...input,
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        bankCode: z.string().optional(),
        accountNumber: z.string().optional(),
        accountType: z.enum(["checking", "savings", "investment"]).optional(),
        balance: z.number().optional(),
        currency: z.string().optional(),
        color: z.string().optional(),
        icon: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await db
        .update(bank)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(bank.id, id), eq(bank.userId, ctx.session.user.id)));
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return await db
        .delete(bank)
        .where(and(eq(bank.id, input.id), eq(bank.userId, ctx.session.user.id)));
    }),

  getTotalBalance: protectedProcedure.query(async ({ ctx }) => {
    const banks = await db
      .select()
      .from(bank)
      .where(and(eq(bank.userId, ctx.session.user.id), eq(bank.isActive, true)));

    return banks.reduce((acc, b) => acc + b.balance, 0);
  }),
});
