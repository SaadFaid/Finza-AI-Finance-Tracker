import { pgTable, text } from "drizzle-orm/pg-core";

export const categoriesTable = pgTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
});

export type Category = typeof categoriesTable.$inferSelect;