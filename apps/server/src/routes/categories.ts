import { db } from "@bagcoin/db";
import { category } from "@bagcoin/db/schema";
import { and, eq, or } from "drizzle-orm";
import Elysia, { t } from "elysia";
import { getAuthSession } from "../middleware/auth";

const DEFAULT_CATEGORIES = [
  {
    name: "Alimentação",
    type: "expense",
    icon: "restaurant",
    color: "#F97316",
  },
  { name: "Transporte", type: "expense", icon: "car", color: "#6366F1" },
  { name: "Moradia", type: "expense", icon: "home", color: "#8B5CF6" },
  { name: "Saúde", type: "expense", icon: "medkit", color: "#EC4899" },
  { name: "Educação", type: "expense", icon: "school", color: "#14B8A6" },
  { name: "Lazer", type: "expense", icon: "sparkles", color: "#F43F5E" },
  { name: "Vestuário", type: "expense", icon: "shirt", color: "#A855F7" },
  { name: "Assinaturas", type: "expense", icon: "repeat", color: "#6366F1" },
  { name: "Supermercado", type: "expense", icon: "cart", color: "#F59E0B" },
  {
    name: "Combustível",
    type: "expense",
    icon: "car-sport",
    color: "#64748B",
  },
  {
    name: "Seguros",
    type: "expense",
    icon: "shield-checkmark",
    color: "#0EA5E9",
  },
  { name: "Impostos", type: "expense", icon: "receipt", color: "#78716C" },
  { name: "Pets", type: "expense", icon: "paw", color: "#D97706" },
  { name: "Beleza", type: "expense", icon: "cut", color: "#EC4899" },
  {
    name: "Transferências",
    type: "expense",
    icon: "swap-horizontal",
    color: "#94A3B8",
  },
  {
    name: "Outros",
    type: "expense",
    icon: "ellipsis-horizontal",
    color: "#475569",
  },
  { name: "Salário", type: "income", icon: "wallet", color: "#10B981" },
  { name: "Freelance", type: "income", icon: "laptop", color: "#3B82F6" },
  {
    name: "Investimentos",
    type: "income",
    icon: "trending-up",
    color: "#14B8A6",
  },
  { name: "Vendas", type: "income", icon: "storefront", color: "#F97316" },
  { name: "Aluguel", type: "income", icon: "key", color: "#8B5CF6" },
  { name: "Reembolso", type: "income", icon: "arrow-undo", color: "#6366F1" },
  { name: "Presente", type: "income", icon: "gift", color: "#EC4899" },
  { name: "Bônus", type: "income", icon: "star", color: "#F59E0B" },
  { name: "Dividendos", type: "income", icon: "cash", color: "#D4A847" },
  {
    name: "Outros",
    type: "income",
    icon: "ellipsis-horizontal",
    color: "#475569",
  },
] as const;

export const categoryRoutes = new Elysia({ prefix: "/api/categories" })
  .derive(({ request }) => getAuthSession(request))
  .onBeforeHandle(({ userId, set }) => {
    if (!userId) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
  })
  .get(
    "/",
    async ({ userId, query }) => {
      const conditions = [
        or(eq(category.userId, userId), eq(category.isDefault, true)),
      ];

      if (query.type) {
        conditions.push(eq(category.type, query.type as "expense" | "income"));
      }

      const categories = await db
        .select()
        .from(category)
        .where(and(...conditions));

      return { data: categories };
    },
    {
      query: t.Object({
        type: t.Optional(t.String()),
      }),
    }
  )
  .post(
    "/",
    async ({ userId, body, set }) => {
      const id = crypto.randomUUID();
      const now = new Date();

      const [created] = await db
        .insert(category)
        .values({
          id,
          userId,
          name: body.name,
          type: body.type,
          icon: body.icon,
          color: body.color,
          isDefault: false,
          sortOrder: body.sortOrder ?? 0,
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
        type: t.Union([t.Literal("expense"), t.Literal("income")]),
        icon: t.String(),
        color: t.String(),
        sortOrder: t.Optional(t.Number()),
      }),
    }
  )
  .put(
    "/:id",
    async ({ userId, params, body, set }) => {
      const [existing] = await db
        .select()
        .from(category)
        .where(and(eq(category.userId, userId), eq(category.id, params.id)));

      if (!existing) {
        set.status = 404;
        return { error: "Category not found" };
      }

      if (existing.isDefault) {
        set.status = 403;
        return { error: "Cannot edit default categories" };
      }

      const [updated] = await db
        .update(category)
        .set({
          name: body.name,
          type: body.type,
          icon: body.icon,
          color: body.color,
          sortOrder: body.sortOrder,
          updatedAt: new Date(),
        })
        .where(eq(category.id, params.id))
        .returning();

      return { data: updated };
    },
    {
      body: t.Partial(
        t.Object({
          name: t.String(),
          type: t.Union([t.Literal("expense"), t.Literal("income")]),
          icon: t.String(),
          color: t.String(),
          sortOrder: t.Number(),
        })
      ),
    }
  )
  .delete("/:id", async ({ userId, params, set }) => {
    const [existing] = await db
      .select()
      .from(category)
      .where(and(eq(category.userId, userId), eq(category.id, params.id)));

    if (!existing) {
      set.status = 404;
      return { error: "Category not found" };
    }

    if (existing.isDefault) {
      set.status = 403;
      return { error: "Cannot delete default categories" };
    }

    await db.delete(category).where(eq(category.id, params.id));

    return { data: { id: params.id } };
  })
  .post("/seed", async ({ userId, set }) => {
    const existing = await db
      .select()
      .from(category)
      .where(and(eq(category.userId, userId), eq(category.isDefault, true)));

    if (existing.length > 0) {
      return { data: existing, seeded: false };
    }

    const now = new Date();
    const values = DEFAULT_CATEGORIES.map((cat, index) => ({
      id: crypto.randomUUID(),
      userId,
      name: cat.name,
      type: cat.type,
      icon: cat.icon,
      color: cat.color,
      isDefault: true,
      sortOrder: index,
      createdAt: now,
      updatedAt: now,
    }));

    const created = await db.insert(category).values(values).returning();

    set.status = 201;
    return { data: created, seeded: true };
  });
