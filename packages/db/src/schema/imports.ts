import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { user } from "./auth";
import { bankAccount } from "./bank-accounts";
import { transaction } from "./transactions";

export const importLog = sqliteTable(
  "import_log",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    bankAccountId: text("bank_account_id")
      .notNull()
      .references(() => bankAccount.id),
    fileName: text("file_name").notNull(),
    fileType: text("file_type", { enum: ["csv", "xml"] }).notNull(),
    totalTransactions: integer("total_transactions").default(0).notNull(),
    importedCount: integer("imported_count").default(0).notNull(),
    errorCount: integer("error_count").default(0).notNull(),
    periodStart: integer("period_start", { mode: "timestamp_ms" }),
    periodEnd: integer("period_end", { mode: "timestamp_ms" }),
    status: text("status", {
      enum: ["pending", "processing", "completed", "failed"],
    })
      .default("pending")
      .notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [index("import_log_userId_idx").on(table.userId)]
);

export const importLogRelations = relations(importLog, ({ one, many }) => ({
  user: one(user, {
    fields: [importLog.userId],
    references: [user.id],
  }),
  bankAccount: one(bankAccount, {
    fields: [importLog.bankAccountId],
    references: [bankAccount.id],
  }),
  transactions: many(transaction),
}));
