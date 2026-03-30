import { db } from "@bagcoin/db";
import { creditCard } from "@bagcoin/db/schema";
import { and, eq } from "drizzle-orm";
import Elysia, { t } from "elysia";
import { getAuthSession } from "../middleware/auth";

export const creditCardRoutes = new Elysia({ prefix: "/api/credit-cards" })
  .derive(({ request }) => getAuthSession(request))
  .onBeforeHandle(({ userId, set }) => {
    if (!userId) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
  })
  .get("/", async ({ userId }) => {
    const cards = await db
      .select()
      .from(creditCard)
      .where(eq(creditCard.userId, userId));

    return { data: cards };
  })
  .post(
    "/",
    async ({ userId, body, set }) => {
      const id = crypto.randomUUID();
      const now = new Date();

      const [created] = await db
        .insert(creditCard)
        .values({
          id,
          userId,
          name: body.name,
          lastDigits: body.lastDigits,
          brand: body.brand,
          creditLimit: body.creditLimit,
          usedAmount: 0,
          closingDay: body.closingDay ?? null,
          dueDay: body.dueDay ?? null,
          color: body.color ?? null,
          bankAccountId: body.bankAccountId ?? null,
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
        lastDigits: t.String(),
        brand: t.Union([
          t.Literal("mastercard"),
          t.Literal("visa"),
          t.Literal("elo"),
          t.Literal("amex"),
          t.Literal("hipercard"),
        ]),
        creditLimit: t.Number({ minimum: 0 }),
        closingDay: t.Optional(t.Number({ minimum: 1, maximum: 31 })),
        dueDay: t.Optional(t.Number({ minimum: 1, maximum: 31 })),
        color: t.Optional(t.String()),
        bankAccountId: t.Optional(t.String()),
      }),
    }
  )
  .get("/:id", async ({ userId, params, set }) => {
    const [found] = await db
      .select()
      .from(creditCard)
      .where(and(eq(creditCard.userId, userId), eq(creditCard.id, params.id)));

    if (!found) {
      set.status = 404;
      return { error: "Credit card not found" };
    }

    return { data: found };
  })
  .put(
    "/:id",
    async ({ userId, params, body, set }) => {
      const [existing] = await db
        .select()
        .from(creditCard)
        .where(
          and(eq(creditCard.userId, userId), eq(creditCard.id, params.id))
        );

      if (!existing) {
        set.status = 404;
        return { error: "Credit card not found" };
      }

      const [updated] = await db
        .update(creditCard)
        .set({
          name: body.name,
          lastDigits: body.lastDigits,
          brand: body.brand,
          creditLimit: body.creditLimit,
          closingDay: body.closingDay,
          dueDay: body.dueDay,
          color: body.color,
          bankAccountId: body.bankAccountId,
          updatedAt: new Date(),
        })
        .where(eq(creditCard.id, params.id))
        .returning();

      return { data: updated };
    },
    {
      body: t.Partial(
        t.Object({
          name: t.String(),
          lastDigits: t.String(),
          brand: t.Union([
            t.Literal("mastercard"),
            t.Literal("visa"),
            t.Literal("elo"),
            t.Literal("amex"),
            t.Literal("hipercard"),
          ]),
          creditLimit: t.Number({ minimum: 0 }),
          closingDay: t.Number({ minimum: 1, maximum: 31 }),
          dueDay: t.Number({ minimum: 1, maximum: 31 }),
          color: t.String(),
          bankAccountId: t.String(),
        })
      ),
    }
  )
  .delete("/:id", async ({ userId, params, set }) => {
    const [existing] = await db
      .select()
      .from(creditCard)
      .where(and(eq(creditCard.userId, userId), eq(creditCard.id, params.id)));

    if (!existing) {
      set.status = 404;
      return { error: "Credit card not found" };
    }

    await db.delete(creditCard).where(eq(creditCard.id, params.id));

    return { data: { id: params.id } };
  });
