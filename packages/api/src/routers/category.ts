import { db } from "@bagcoin/db";
import { category } from "@bagcoin/db/schema/category";
import { eq, or, isNull } from "drizzle-orm";
import z from "zod";

import { router, protectedProcedure } from "../index";

export const categoryRouter = router({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return await db
      .select()
      .from(category)
      .where(or(eq(category.userId, ctx.session.user.id), isNull(category.userId)));
  }),

  getByType: protectedProcedure
    .input(z.object({ type: z.enum(["expense", "income", "both"]) }))
    .query(async ({ ctx, input }) => {
      return await db
        .select()
        .from(category)
        .where(
          or(
            eq(category.userId, ctx.session.user.id),
            isNull(category.userId)
          )
        );
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        icon: z.string().optional(),
        color: z.string().optional(),
        type: z.enum(["expense", "income", "both"]).default("both"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await db.insert(category).values({
        userId: ctx.session.user.id,
        ...input,
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        icon: z.string().optional(),
        color: z.string().optional(),
        type: z.enum(["expense", "income", "both"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await db
        .update(category)
        .set(data)
        .where(eq(category.id, id));
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return await db.delete(category).where(eq(category.id, input.id));
    }),
});
