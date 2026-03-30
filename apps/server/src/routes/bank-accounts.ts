import { db } from "@bagcoin/db";
import { bankAccount } from "@bagcoin/db/schema";
import { and, eq } from "drizzle-orm";
import Elysia, { t } from "elysia";
import { getAuthSession } from "../middleware/auth";

export const bankAccountRoutes = new Elysia({ prefix: "/api/bank-accounts" })
  .derive(({ request }) => getAuthSession(request))
  .onBeforeHandle(({ userId, set }) => {
    if (!userId) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
  })
  .get("/", async ({ userId }) => {
    const accounts = await db
      .select()
      .from(bankAccount)
      .where(eq(bankAccount.userId, userId));

    return { data: accounts };
  })
  .post(
    "/",
    async ({ userId, body, set }) => {
      const id = crypto.randomUUID();
      const now = new Date();

      const [created] = await db
        .insert(bankAccount)
        .values({
          id,
          userId,
          name: body.name,
          type: body.type,
          balance: body.balance,
          color: body.color ?? null,
          bankCode: body.bankCode ?? null,
          nickname: body.nickname ?? null,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      set.status = 201;
      return { data: created };
    },
    {
      body: t.Object({
        name: t.String(),
        type: t.Union([
          t.Literal("checking"),
          t.Literal("savings"),
          t.Literal("investment"),
          t.Literal("digital"),
        ]),
        balance: t.Number({ default: 0 }),
        color: t.Optional(t.String()),
        bankCode: t.Optional(t.String()),
        nickname: t.Optional(t.String()),
      }),
    }
  )
  .get("/:id", async ({ userId, params, set }) => {
    const [found] = await db
      .select()
      .from(bankAccount)
      .where(
        and(eq(bankAccount.userId, userId), eq(bankAccount.id, params.id))
      );

    if (!found) {
      set.status = 404;
      return { error: "Bank account not found" };
    }

    return { data: found };
  })
  .put(
    "/:id",
    async ({ userId, params, body, set }) => {
      const [existing] = await db
        .select()
        .from(bankAccount)
        .where(
          and(eq(bankAccount.userId, userId), eq(bankAccount.id, params.id))
        );

      if (!existing) {
        set.status = 404;
        return { error: "Bank account not found" };
      }

      const [updated] = await db
        .update(bankAccount)
        .set({
          name: body.name,
          type: body.type,
          balance: body.balance,
          color: body.color,
          bankCode: body.bankCode,
          nickname: body.nickname,
          updatedAt: new Date(),
        })
        .where(eq(bankAccount.id, params.id))
        .returning();

      return { data: updated };
    },
    {
      body: t.Partial(
        t.Object({
          name: t.String(),
          type: t.Union([
            t.Literal("checking"),
            t.Literal("savings"),
            t.Literal("investment"),
            t.Literal("digital"),
          ]),
          balance: t.Number(),
          color: t.String(),
          bankCode: t.String(),
          nickname: t.String(),
        })
      ),
    }
  )
  .delete("/:id", async ({ userId, params, set }) => {
    const [existing] = await db
      .select()
      .from(bankAccount)
      .where(
        and(eq(bankAccount.userId, userId), eq(bankAccount.id, params.id))
      );

    if (!existing) {
      set.status = 404;
      return { error: "Bank account not found" };
    }

    await db.delete(bankAccount).where(eq(bankAccount.id, params.id));

    return { data: { id: params.id } };
  });
