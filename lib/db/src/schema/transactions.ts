import { date, numeric, pgTable, real, serial, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 12, scale: 2, mode: "number" }).notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  date: date("date", { mode: "string" }).notNull(),
  type: text("type", { enum: ["income", "expense"] }).notNull(),
  aiConfidence: real("ai_confidence"),
});

export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({
  id: true,
  userId: true,
});
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;