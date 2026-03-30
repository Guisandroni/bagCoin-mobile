import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { user } from "./auth";

export const bankAccount = sqliteTable(
  "bank_account",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: text("type", {
      enum: ["checking", "savings", "investment", "digital"],
    })
      .notNull()
      .default("checking"),
    balance: integer("balance").notNull().default(0),
    color: text("color").default("#3B82F6"),
    bankCode: text("bank_code"),
    nickname: text("nickname"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("bank_account_userId_idx").on(table.userId)]
);

export const bankAccountRelations = relations(bankAccount, ({ one }) => ({
  user: one(user, {
    fields: [bankAccount.userId],
    references: [user.id],
  }),
}));
