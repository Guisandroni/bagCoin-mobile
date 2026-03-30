import { db } from "@bagcoin/db";
import {
  bankAccount,
  category,
  creditCard,
  transaction,
  user,
} from "@bagcoin/db/schema";
import { and, eq, isNull, or, sql } from "drizzle-orm";
import Elysia, { t } from "elysia";
import { getAuthSession } from "../middleware/auth";

export const profileRoutes = new Elysia({ prefix: "/api/profile" })
  .derive(({ request }) => getAuthSession(request))
  .onBeforeHandle(({ userId, set }) => {
    if (!userId) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
  })
  .get("/", async ({ userId, session }) => {
    const userInfo = session?.user;

    const [accountResult, cardResult, categoryResult] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(bankAccount)
        .where(eq(bankAccount.userId, userId)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(creditCard)
        .where(eq(creditCard.userId, userId)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(category)
        .where(and(eq(category.userId, userId), eq(category.isDefault, false))),
    ]);

    return {
      data: {
        user: {
          id: userInfo?.id ?? userId,
          name: userInfo?.name ?? null,
          email: userInfo?.email ?? null,
          image: userInfo?.image ?? null,
        },
        stats: {
          accounts: accountResult[0]?.count ?? 0,
          cards: cardResult[0]?.count ?? 0,
          categories: categoryResult[0]?.count ?? 0,
        },
      },
    };
  })
  .put(
    "/",
    async ({ userId, body, set }) => {
      const [existing] = await db
        .select()
        .from(user)
        .where(eq(user.id, userId));

      if (!existing) {
        set.status = 404;
        return { error: "User not found" };
      }

      const [updated] = await db
        .update(user)
        .set({
          ...(body.name !== undefined && { name: body.name }),
          ...(body.image !== undefined && { image: body.image }),
          updatedAt: new Date(),
        })
        .where(eq(user.id, userId))
        .returning();

      return { data: updated };
    },
    {
      body: t.Partial(
        t.Object({
          name: t.String(),
          image: t.String(),
        })
      ),
    }
  )
  .get("/settings", () => ({
    data: {
      theme: "dark" as const,
      notifications: true,
      language: "pt-BR",
      currency: "BRL",
    },
  }))
  .post("/export", async ({ userId }) => {
    const [userAccounts, userCards, userCategories, userTransactions] =
      await Promise.all([
        db.select().from(bankAccount).where(eq(bankAccount.userId, userId)),
        db.select().from(creditCard).where(eq(creditCard.userId, userId)),
        db
          .select()
          .from(category)
          .where(or(eq(category.userId, userId), isNull(category.userId))),
        db.select().from(transaction).where(eq(transaction.userId, userId)),
      ]);

    return {
      data: {
        exportedAt: new Date().toISOString(),
        accounts: userAccounts,
        creditCards: userCards,
        categories: userCategories,
        transactions: userTransactions,
      },
    };
  });
