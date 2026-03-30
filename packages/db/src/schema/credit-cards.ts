import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { user } from "./auth";
import { bankAccount } from "./bank-accounts";

export const creditCard = sqliteTable(
  "credit_card",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    lastDigits: text("last_digits").notNull(),
    brand: text("brand", {
      enum: ["mastercard", "visa", "elo", "amex", "hipercard"],
    }),
    creditLimit: integer("credit_limit").notNull(),
    usedAmount: integer("used_amount").notNull().default(0),
    closingDay: integer("closing_day"),
    dueDay: integer("due_day"),
    color: text("color").default("#8A05BE"),
    bankAccountId: text("bank_account_id").references(() => bankAccount.id),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("credit_card_userId_idx").on(table.userId)]
);

export const creditCardRelations = relations(creditCard, ({ one }) => ({
  user: one(user, {
    fields: [creditCard.userId],
    references: [user.id],
  }),
  bankAccount: one(bankAccount, {
    fields: [creditCard.bankAccountId],
    references: [bankAccount.id],
  }),
}));
