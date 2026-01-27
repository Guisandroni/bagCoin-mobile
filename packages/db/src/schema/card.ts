import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { user } from "./auth";
import { bank } from "./bank";

export const card = sqliteTable("card", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  bankId: integer("bank_id").references(() => bank.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  lastFourDigits: text("last_four_digits"),
  cardType: text("card_type", { enum: ["credit", "debit", "prepaid"] }).default("credit").notNull(),
  brand: text("brand", { enum: ["visa", "mastercard", "elo", "amex", "other"] }).default("other"),
  creditLimit: real("credit_limit").default(0),
  currentBalance: real("current_balance").default(0).notNull(),
  dueDay: integer("due_day"),
  closingDay: integer("closing_day"),
  color: text("color").default("#1A1A1A"),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type Card = typeof card.$inferSelect;
export type NewCard = typeof card.$inferInsert;
