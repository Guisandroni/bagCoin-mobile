import { db } from "@bagcoin/db";
import { card } from "@bagcoin/db/schema/card";
import { eq, and } from "drizzle-orm";
import z from "zod";

import { router, protectedProcedure } from "../index";

export const cardRouter = router({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return await db
      .select()
      .from(card)
      .where(eq(card.userId, ctx.session.user.id));
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const result = await db
        .select()
        .from(card)
        .where(and(eq(card.id, input.id), eq(card.userId, ctx.session.user.id)));
      return result[0] ?? null;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        bankId: z.number().optional(),
        lastFourDigits: z.string().max(4).optional(),
        cardType: z.enum(["credit", "debit", "prepaid"]).default("credit"),
        brand: z.enum(["visa", "mastercard", "elo", "amex", "other"]).optional(),
        creditLimit: z.number().optional(),
        dueDay: z.number().min(1).max(31).optional(),
        closingDay: z.number().min(1).max(31).optional(),
        color: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await db.insert(card).values({
        userId: ctx.session.user.id,
        ...input,
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        bankId: z.number().optional(),
        lastFourDigits: z.string().max(4).optional(),
        cardType: z.enum(["credit", "debit", "prepaid"]).optional(),
        brand: z.enum(["visa", "mastercard", "elo", "amex", "other"]).optional(),
        creditLimit: z.number().optional(),
        currentBalance: z.number().optional(),
        dueDay: z.number().min(1).max(31).optional(),
        closingDay: z.number().min(1).max(31).optional(),
        color: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await db
        .update(card)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(card.id, id), eq(card.userId, ctx.session.user.id)));
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return await db
        .delete(card)
        .where(and(eq(card.id, input.id), eq(card.userId, ctx.session.user.id)));
    }),

  getTotalDebt: protectedProcedure.query(async ({ ctx }) => {
    const cards = await db
      .select()
      .from(card)
      .where(and(eq(card.userId, ctx.session.user.id), eq(card.isActive, true)));

    return cards.reduce((acc, c) => acc + c.currentBalance, 0);
  }),
});
