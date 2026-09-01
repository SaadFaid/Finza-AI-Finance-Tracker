import { numeric, pgTable, serial, text, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const budgetsTable = pgTable("budgets", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  category: text("category").notNull(),
  limitAmount: numeric("limit_amount", { precision: 12, scale: 2, mode: "number" }).notNull(),
  month: text("month").notNull(),
}, (table) => ({
  userCategoryMonthUnique: uniqueIndex("budgets_user_category_month_idx").on(
    table.userId,
    table.category,
    table.month,
  ),
}));

export const insertBudgetSchema = createInsertSchema(budgetsTable).omit({
  id: true,
  userId: true,
});
export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type Budget = typeof budgetsTable.$inferSelect;