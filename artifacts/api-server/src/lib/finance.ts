import { and, asc, desc, eq, gte, ilike, lt, or } from "drizzle-orm";
import { db, budgetsTable, transactionsTable, usersTable } from "@workspace/db";
import type { AuthenticatedRequest } from "../middlewares/requireAuth";

export const categoryColors: Record<string, string> = {
  Food: "#f59e0b",
  Transport: "#65d9c6",
  Shopping: "#a78bfa",
  Bills: "#f97316",
  Health: "#fb7185",
  Entertainment: "#60a5fa",
  Other: "#94a3b8",
};

export function getUserId(req: AuthenticatedRequest): string {
  return req.userId;
}

export async function ensureUser(userId: string): Promise<void> {
  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  if (existing.length > 0) return;

  await db
    .insert(usersTable)
    .values({ id: userId, email: "private@example.com", name: "Finza member" })
    .onConflictDoNothing();
  const month = currentMonth();
  await db.insert(transactionsTable).values([
    {
      userId,
      amount: 86,
      category: "Food",
      description: "La Sqala breakfast",
      date: `${month}-02`,
      type: "expense",
      aiConfidence: 0.99,
    },
    {
      userId,
      amount: 35,
      category: "Transport",
      description: "Uber ride",
      date: `${month}-04`,
      type: "expense",
      aiConfidence: 0.95,
    },
    {
      userId,
      amount: 12500,
      category: "Other",
      description: "Monthly salary",
      date: `${month}-01`,
      type: "income",
      aiConfidence: null,
    },
  ]);
  await db.insert(budgetsTable).values([
    { userId, category: "Food", limitAmount: 1800, month },
    { userId, category: "Transport", limitAmount: 900, month },
    { userId, category: "Shopping", limitAmount: 1200, month },
    { userId, category: "Bills", limitAmount: 2200, month },
  ]);
}

export function monthBounds(month = currentMonth()): {
  start: string;
  end: string;
} {
  const [year, monthNumber] = month.split("-").map(Number);
  const nextMonth = monthNumber === 12 ? 1 : monthNumber + 1;
  const nextYear = monthNumber === 12 ? year + 1 : year;
  return {
    start: `${year}-${String(monthNumber).padStart(2, "0")}-01`,
    end: `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`,
  };
}

export function currentMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function toApiTransaction(transaction: typeof transactionsTable.$inferSelect) {
  return {
    id: transaction.id,
    amount: Number(transaction.amount),
    category: transaction.category,
    description: transaction.description,
    date: transaction.date,
    type: transaction.type,
    aiConfidence: transaction.aiConfidence,
  };
}

export async function getUserTransactions(
  userId: string,
  options?: {
    search?: string;
    category?: string;
    type?: "income" | "expense";
    sort?: "date_desc" | "date_asc" | "amount_desc" | "amount_asc";
  },
) {
  const filters = [eq(transactionsTable.userId, userId)];
  if (options?.search) {
    filters.push(
      or(
        ilike(transactionsTable.description, `%${options.search}%`),
        ilike(transactionsTable.category, `%${options.search}%`),
      )!,
    );
  }
  if (options?.category && options.category !== "all") {
    filters.push(eq(transactionsTable.category, options.category));
  }
  if (options?.type) {
    filters.push(eq(transactionsTable.type, options.type));
  }

  const sort = options?.sort ?? "date_desc";
  const orderBy =
    sort === "date_asc"
      ? asc(transactionsTable.date)
      : sort === "amount_desc"
        ? desc(transactionsTable.amount)
        : sort === "amount_asc"
          ? asc(transactionsTable.amount)
          : desc(transactionsTable.date);

  return db
    .select()
    .from(transactionsTable)
    .where(and(...filters))
    .orderBy(orderBy);
}

export async function getMonthlyTransactions(userId: string, month = currentMonth()) {
  const bounds = monthBounds(month);
  return db
    .select()
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.userId, userId),
        gte(transactionsTable.date, bounds.start),
        lt(transactionsTable.date, bounds.end),
      ),
    )
    .orderBy(desc(transactionsTable.date));
}

export function sumTransactions(
  transactions: Array<{ amount: number | string; type: string }>,
  type: "income" | "expense",
): number {
  return transactions
    .filter((transaction) => transaction.type === type)
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}