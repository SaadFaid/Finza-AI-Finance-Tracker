import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, transactionsTable, type InsertTransaction } from "@workspace/db";
import {
  CreateTransactionBody,
  CreateTransactionResponse,
  DeleteTransactionParams,
  ListTransactionsQueryParams,
  ListTransactionsResponse,
  UpdateTransactionBody,
  UpdateTransactionParams,
  UpdateTransactionResponse,
} from "@workspace/api-zod";
import {
  ensureUser,
  getUserId,
  getUserTransactions,
  toApiTransaction,
} from "../lib/finance";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/requireAuth";

const router: IRouter = Router();
router.use("/transactions", requireAuth);

router.get("/transactions", async (req, res): Promise<void> => {
  const authReq = req as unknown as AuthenticatedRequest;
  const query = ListTransactionsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  await ensureUser(getUserId(authReq));
  const rows = await getUserTransactions(getUserId(authReq), query.data);
  res.json(ListTransactionsResponse.parse(rows.map(toApiTransaction)));
});

router.post("/transactions", async (req, res): Promise<void> => {
  const authReq = req as unknown as AuthenticatedRequest;
  const parsed = CreateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  await ensureUser(getUserId(authReq));
  const [row] = await db
    .insert(transactionsTable)
    .values({
      ...parsed.data,
      date: parsed.data.date.toISOString().slice(0, 10),
      userId: getUserId(authReq),
    })
    .returning();
  res.status(201).json(CreateTransactionResponse.parse(toApiTransaction(row)));
});

router.patch("/transactions/:id", async (req, res): Promise<void> => {
  const authReq = req as unknown as AuthenticatedRequest;
  const params = UpdateTransactionParams.safeParse(req.params);
  const parsed = UpdateTransactionBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Partial<InsertTransaction> = {};
  if (parsed.data.amount !== undefined) updateData.amount = parsed.data.amount;
  if (parsed.data.category !== undefined) updateData.category = parsed.data.category;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.type !== undefined) updateData.type = parsed.data.type;
  if (parsed.data.aiConfidence !== undefined) updateData.aiConfidence = parsed.data.aiConfidence;
  if (parsed.data.date !== undefined) {
    updateData.date = parsed.data.date.toISOString().slice(0, 10);
  }
  const [row] = await db
    .update(transactionsTable)
    .set(updateData)
    .where(
      and(
        eq(transactionsTable.id, params.data.id),
        eq(transactionsTable.userId, getUserId(authReq)),
      ),
    )
    .returning();
  if (!row) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }
  res.json(UpdateTransactionResponse.parse(toApiTransaction(row)));
});

router.delete("/transactions/:id", async (req, res): Promise<void> => {
  const authReq = req as unknown as AuthenticatedRequest;
  const params = DeleteTransactionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .delete(transactionsTable)
    .where(
      and(
        eq(transactionsTable.id, params.data.id),
        eq(transactionsTable.userId, getUserId(authReq)),
      ),
    )
    .returning();
  if (!row) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;