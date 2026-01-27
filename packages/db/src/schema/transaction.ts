import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { user } from "./auth";
import { bank } from "./bank";
import { card } from "./card";
import { category } from "./category";

export const transaction = sqliteTable("transaction", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  categoryId: integer("category_id").references(() => category.id, { onDelete: "set null" }),
  bankId: integer("bank_id").references(() => bank.id, { onDelete: "set null" }),
  cardId: integer("card_id").references(() => card.id, { onDelete: "set null" }),
  type: text("type", { enum: ["expense", "income"] }).notNull(),
  amount: real("amount").notNull(),
  description: text("description").notNull(),
  notes: text("notes"),
  date: integer("date", { mode: "timestamp" }).notNull(),
  isRecurring: integer("is_recurring", { mode: "boolean" }).default(false).notNull(),
  recurringType: text("recurring_type", { enum: ["daily", "weekly", "monthly", "yearly"] }),
  isPaid: integer("is_paid", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type Transaction = typeof transaction.$inferSelect;
export type NewTransaction = typeof transaction.$inferInsert;
