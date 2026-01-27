import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { user } from "./auth";

export const category = sqliteTable("category", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  icon: text("icon").default("category").notNull(),
  color: text("color").default("#6B7280").notNull(),
  type: text("type", { enum: ["expense", "income", "both"] }).default("both").notNull(),
  isSystem: integer("is_system", { mode: "boolean" }).default(false).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type Category = typeof category.$inferSelect;
export type NewCategory = typeof category.$inferInsert;
