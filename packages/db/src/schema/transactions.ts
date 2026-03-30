import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { user } from "./auth";
import { bankAccount } from "./bank-accounts";
import { category } from "./categories";
import { creditCard } from "./credit-cards";
import { importLog } from "./imports";

export const transaction = sqliteTable(
  "transaction",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["expense", "income"] }).notNull(),
    amount: integer("amount").notNull(),
    description: text("description").notNull(),
    notes: text("notes"),
    date: integer("date", { mode: "timestamp_ms" }).notNull(),
    categoryId: text("category_id").references(() => category.id),
    bankAccountId: text("bank_account_id").references(() => bankAccount.id),
    creditCardId: text("credit_card_id").references(() => creditCard.id),
    importId: text("import_id").references(() => importLog.id),
    isImported: integer("is_imported", { mode: "boolean" })
      .default(false)
      .notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("transaction_userId_idx").on(table.userId),
    index("transaction_categoryId_idx").on(table.categoryId),
    index("transaction_bankAccountId_idx").on(table.bankAccountId),
    index("transaction_date_idx").on(table.date),
  ]
);

export const transactionRelations = relations(transaction, ({ one }) => ({
  user: one(user, {
    fields: [transaction.userId],
    references: [user.id],
  }),
  category: one(category, {
    fields: [transaction.categoryId],
    references: [category.id],
  }),
  bankAccount: one(bankAccount, {
    fields: [transaction.bankAccountId],
    references: [bankAccount.id],
  }),
  creditCard: one(creditCard, {
    fields: [transaction.creditCardId],
    references: [creditCard.id],
  }),
  importLog: one(importLog, {
    fields: [transaction.importId],
    references: [importLog.id],
  }),
}));
