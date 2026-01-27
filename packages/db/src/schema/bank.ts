import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { user } from "./auth";

export const bank = sqliteTable("bank", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  bankCode: text("bank_code"),
  accountNumber: text("account_number"),
  accountType: text("account_type", { enum: ["checking", "savings", "investment"] }).default("checking").notNull(),
  balance: real("balance").default(0).notNull(),
  currency: text("currency").default("BRL").notNull(),
  color: text("color").default("#3B82F6"),
  icon: text("icon").default("account_balance"),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  lastSyncAt: integer("last_sync_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type Bank = typeof bank.$inferSelect;
export type NewBank = typeof bank.$inferInsert;
