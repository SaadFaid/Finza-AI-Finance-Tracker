import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, budgetsTable } from "@workspace/db";
import {
  ListBudgetsResponse,
  UpsertBudgetBody,
  UpsertBudgetParams,
  UpsertBudgetResponse,
} from "@workspace/api-zod";
import {
  categoryColors,
  currentMonth,
  ensureUser,
  getMonthlyTransactions,
  getUserId,
  roundMoney,
  sumTransactions,
} from "../lib/finance";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/requireAuth";

const router: IRouter = Router();
router.use("/budgets", requireAuth);

router.get("/budgets", async (req, res): Promise<void> => {
  const authReq = req as unknown as AuthenticatedRequest;
  const userId = getUserId(authReq);
  await ensureUser(userId);
  const rows = await db.select().from(budgetsTable).where(eq(budgetsTable.userId, userId));
  const transactions = await getMonthlyTransactions(userId);
  res.json(
    ListBudgetsResponse.parse(
      rows.map((budget) => ({
        id: budget.id,
        category: budget.category,
        limitAmount: Number(budget.limitAmount),
        spentAmount: roundMoney(
          transactions
            .filter((transaction) => transaction.category === budget.category)
            .reduce((sum, transaction) => sum + (transaction.type === "expense" ? Number(transaction.amount) : 0), 0),
        ),
        month: budget.month,
        color: categoryColors[budget.category] ?? categoryColors.Other,
      })),
    ),
  );
});

router.put("/budgets/:category", async (req, res): Promise<void> => {
  const authReq = req as unknown as AuthenticatedRequest;
  const params = UpsertBudgetParams.safeParse(req.params);
  const parsed = UpsertBudgetBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const userId = getUserId(authReq);
  await ensureUser(userId);
  const [row] = await db
    .insert(budgetsTable)
    .values({
      userId,
      category: params.data.category,
      limitAmount: parsed.data.limitAmount,
      month: parsed.data.month,
    })
    .onConflictDoUpdate({
      target: [budgetsTable.userId, budgetsTable.category, budgetsTable.month],
      set: { limitAmount: parsed.data.limitAmount },
    })
    .returning();
  const transactions = await getMonthlyTransactions(userId, row.month);
  res.json(
    UpsertBudgetResponse.parse({
      id: row.id,
      category: row.category,
      limitAmount: Number(row.limitAmount),
      spentAmount: roundMoney(sumTransactions(transactions.filter((item) => item.category === row.category), "expense")),
      month: row.month,
      color: categoryColors[row.category] ?? categoryColors.Other,
    }),
  );
});

export default router;