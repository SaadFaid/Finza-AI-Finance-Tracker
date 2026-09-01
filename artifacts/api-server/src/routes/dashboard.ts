import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, transactionsTable } from "@workspace/db";
import { GetDashboardResponse } from "@workspace/api-zod";
import {
  categoryColors,
  currentMonth,
  ensureUser,
  getMonthlyTransactions,
  getUserId,
  roundMoney,
  sumTransactions,
  toApiTransaction,
} from "../lib/finance";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/requireAuth";

const router: IRouter = Router();
router.get("/dashboard", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const userId = getUserId(authReq);
  await ensureUser(userId);
  const allTransactions = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.userId, userId))
    .orderBy(transactionsTable.date);
  const monthly = await getMonthlyTransactions(userId);
  const monthlySpend = sumTransactions(monthly, "expense");
  const monthlyIncome = sumTransactions(monthly, "income");
  const totalIncome = sumTransactions(allTransactions, "income");
  const totalSpend = sumTransactions(allTransactions, "expense");
  const grouped = monthly
    .filter((transaction) => transaction.type === "expense")
    .reduce<Record<string, number>>((acc, transaction) => {
      acc[transaction.category] = (acc[transaction.category] ?? 0) + Number(transaction.amount);
      return acc;
    }, {});
  const spendByCategory = Object.entries(grouped)
    .map(([category, amount]) => ({
      category,
      amount: roundMoney(amount),
      color: categoryColors[category] ?? categoryColors.Other,
    }))
    .sort((a, b) => b.amount - a.amount);
  const weeklySpend = Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setUTCDate(day.getUTCDate() - (6 - index));
    const date = day.toISOString().slice(0, 10);
    return {
      day: day.toLocaleDateString("en-US", { weekday: "short" }),
      amount: roundMoney(
        monthly
          .filter((transaction) => transaction.date === date && transaction.type === "expense")
          .reduce((sum, transaction) => sum + Number(transaction.amount), 0),
      ),
    };
  });

  const previousMonth = new Date();
  previousMonth.setUTCMonth(previousMonth.getUTCMonth() - 1);
  const previousMonthKey = `${previousMonth.getUTCFullYear()}-${String(previousMonth.getUTCMonth() + 1).padStart(2, "0")}`;
  const previous = await getMonthlyTransactions(userId, previousMonthKey);
  const previousSpend = sumTransactions(previous, "expense");
  const spendChange = previousSpend
    ? roundMoney(((monthlySpend - previousSpend) / previousSpend) * 100)
    : 0;

  res.json(
    GetDashboardResponse.parse({
      totalBalance: roundMoney(totalIncome - totalSpend),
      monthlySpend: roundMoney(monthlySpend),
      monthlyIncome: roundMoney(monthlyIncome),
      savingsRate: monthlyIncome ? roundMoney(((monthlyIncome - monthlySpend) / monthlyIncome) * 100) : 0,
      spendChange,
      spendByCategory,
      weeklySpend,
      recentTransactions: allTransactions.slice(-5).reverse().map(toApiTransaction),
    }),
  );
});

export default router;