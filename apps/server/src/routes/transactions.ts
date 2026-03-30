import { db } from "@bagcoin/db";
import { bankAccount, creditCard, transaction } from "@bagcoin/db/schema";
import { and, count, desc, eq, gte, like, lte, sql } from "drizzle-orm";
import Elysia, { t } from "elysia";
import { getAuthSession } from "../middleware/auth";

interface BalanceParams {
  amount: number;
  bankAccountId: string | null;
  creditCardId: string | null;
  type: "expense" | "income";
}

async function applyBalanceEffect(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  params: BalanceParams
) {
  if (params.bankAccountId) {
    const delta = params.type === "expense" ? -params.amount : params.amount;
    await tx
      .update(bankAccount)
      .set({ balance: sql`${bankAccount.balance} + ${delta}` })
      .where(eq(bankAccount.id, params.bankAccountId));
  }
  if (params.creditCardId && params.type === "expense") {
    await tx
      .update(creditCard)
      .set({
        usedAmount: sql`${creditCard.usedAmount} + ${params.amount}`,
      })
      .where(eq(creditCard.id, params.creditCardId));
  }
}

async function reverseBalanceEffect(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  params: BalanceParams
) {
  if (params.bankAccountId) {
    const delta = params.type === "expense" ? params.amount : -params.amount;
    await tx
      .update(bankAccount)
      .set({ balance: sql`${bankAccount.balance} + ${delta}` })
      .where(eq(bankAccount.id, params.bankAccountId));
  }
  if (params.creditCardId && params.type === "expense") {
    await tx
      .update(creditCard)
      .set({
        usedAmount: sql`${creditCard.usedAmount} - ${params.amount}`,
      })
      .where(eq(creditCard.id, params.creditCardId));
  }
}

export const transactionRoutes = new Elysia({
  prefix: "/api/transactions",
})
  .derive(({ request }) => getAuthSession(request))
  .onBeforeHandle(({ userId, set }) => {
    if (!userId) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
  })

  .get(
    "/",
    async ({ query, userId }) => {
      const page = Math.max(1, Number(query.page) || 1);
      const limit = Math.min(Math.max(1, Number(query.limit) || 20), 100);
      const offset = (page - 1) * limit;

      const conditions = [eq(transaction.userId, userId)];

      if (query.type) {
        conditions.push(eq(transaction.type, query.type));
      }
      if (query.categoryId) {
        conditions.push(eq(transaction.categoryId, query.categoryId));
      }
      if (query.bankAccountId) {
        conditions.push(eq(transaction.bankAccountId, query.bankAccountId));
      }
      if (query.creditCardId) {
        conditions.push(eq(transaction.creditCardId, query.creditCardId));
      }
      if (query.startDate) {
        conditions.push(gte(transaction.date, new Date(query.startDate)));
      }
      if (query.endDate) {
        conditions.push(lte(transaction.date, new Date(query.endDate)));
      }
      if (query.search) {
        conditions.push(like(transaction.description, `%${query.search}%`));
      }

      const where = and(...conditions);

      const [data, countResult] = await Promise.all([
        db.query.transaction.findMany({
          where,
          with: { category: true, bankAccount: true, creditCard: true },
          orderBy: [desc(transaction.date)],
          limit,
          offset,
        }),
        db.select({ total: count() }).from(transaction).where(where),
      ]);

      const total = countResult[0]?.total ?? 0;

      return {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    },
    {
      query: t.Object({
        type: t.Optional(t.Union([t.Literal("expense"), t.Literal("income")])),
        categoryId: t.Optional(t.String()),
        bankAccountId: t.Optional(t.String()),
        creditCardId: t.Optional(t.String()),
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
        search: t.Optional(t.String()),
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
    }
  )

  .post(
    "/",
    async ({ body, userId, set }) => {
      const [created] = await db.transaction(async (tx) => {
        const [record] = await tx
          .insert(transaction)
          .values({
            userId,
            type: body.type,
            amount: body.amount,
            description: body.description,
            notes: body.notes,
            date: new Date(body.date),
            categoryId: body.categoryId,
            bankAccountId: body.bankAccountId,
            creditCardId: body.creditCardId,
          })
          .returning();

        await applyBalanceEffect(tx, {
          bankAccountId: body.bankAccountId ?? null,
          creditCardId: body.creditCardId ?? null,
          type: body.type,
          amount: body.amount,
        });

        return [record];
      });

      set.status = 201;
      return { data: created };
    },
    {
      body: t.Object({
        type: t.Union([t.Literal("expense"), t.Literal("income")]),
        amount: t.Integer({ minimum: 1 }),
        description: t.String(),
        notes: t.Optional(t.String()),
        date: t.String(),
        categoryId: t.Optional(t.String()),
        bankAccountId: t.Optional(t.String()),
        creditCardId: t.Optional(t.String()),
      }),
    }
  )

  .get(
    "/:id",
    async ({ params, userId, set }) => {
      const data = await db.query.transaction.findFirst({
        where: and(
          eq(transaction.id, params.id),
          eq(transaction.userId, userId)
        ),
        with: { category: true, bankAccount: true, creditCard: true },
      });

      if (!data) {
        set.status = 404;
        return { error: "Transaction not found" };
      }

      return { data };
    },
    {
      params: t.Object({ id: t.String() }),
    }
  )

  .put(
    "/:id",
    async ({ params, body, userId, set }) => {
      const existing = await db.query.transaction.findFirst({
        where: and(
          eq(transaction.id, params.id),
          eq(transaction.userId, userId)
        ),
      });

      if (!existing) {
        set.status = 404;
        return { error: "Transaction not found" };
      }

      const newType = body.type ?? existing.type;
      const newAmount = body.amount ?? existing.amount;
      const newBankAccountId =
        body.bankAccountId === undefined
          ? existing.bankAccountId
          : body.bankAccountId;
      const newCreditCardId =
        body.creditCardId === undefined
          ? existing.creditCardId
          : body.creditCardId;

      const needsBalanceAdjust =
        newType !== existing.type ||
        newAmount !== existing.amount ||
        newBankAccountId !== existing.bankAccountId ||
        newCreditCardId !== existing.creditCardId;

      const [updated] = await db.transaction(async (tx) => {
        if (needsBalanceAdjust) {
          await reverseBalanceEffect(tx, {
            bankAccountId: existing.bankAccountId,
            creditCardId: existing.creditCardId,
            type: existing.type,
            amount: existing.amount,
          });
          await applyBalanceEffect(tx, {
            bankAccountId: newBankAccountId,
            creditCardId: newCreditCardId,
            type: newType,
            amount: newAmount,
          });
        }

        return tx
          .update(transaction)
          .set({
            ...(body.type === undefined ? {} : { type: body.type }),
            ...(body.amount === undefined ? {} : { amount: body.amount }),
            ...(body.description === undefined
              ? {}
              : { description: body.description }),
            ...(body.notes === undefined ? {} : { notes: body.notes }),
            ...(body.date === undefined ? {} : { date: new Date(body.date) }),
            ...(body.categoryId === undefined
              ? {}
              : { categoryId: body.categoryId }),
            ...(body.bankAccountId === undefined
              ? {}
              : { bankAccountId: body.bankAccountId }),
            ...(body.creditCardId === undefined
              ? {}
              : { creditCardId: body.creditCardId }),
          })
          .where(eq(transaction.id, params.id))
          .returning();
      });

      return { data: updated };
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        type: t.Optional(t.Union([t.Literal("expense"), t.Literal("income")])),
        amount: t.Optional(t.Integer({ minimum: 1 })),
        description: t.Optional(t.String()),
        notes: t.Optional(t.Union([t.String(), t.Null()])),
        date: t.Optional(t.String()),
        categoryId: t.Optional(t.Union([t.String(), t.Null()])),
        bankAccountId: t.Optional(t.Union([t.String(), t.Null()])),
        creditCardId: t.Optional(t.Union([t.String(), t.Null()])),
      }),
    }
  )

  .delete(
    "/:id",
    async ({ params, userId, set }) => {
      const existing = await db.query.transaction.findFirst({
        where: and(
          eq(transaction.id, params.id),
          eq(transaction.userId, userId)
        ),
      });

      if (!existing) {
        set.status = 404;
        return { error: "Transaction not found" };
      }

      await db.transaction(async (tx) => {
        await reverseBalanceEffect(tx, {
          bankAccountId: existing.bankAccountId,
          creditCardId: existing.creditCardId,
          type: existing.type,
          amount: existing.amount,
        });
        await tx.delete(transaction).where(eq(transaction.id, params.id));
      });

      return { data: { id: params.id } };
    },
    {
      params: t.Object({ id: t.String() }),
    }
  );
