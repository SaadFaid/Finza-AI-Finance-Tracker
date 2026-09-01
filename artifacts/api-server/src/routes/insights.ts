import { Router, type IRouter } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { ListInsightsResponse, CategorizeTransactionBody, CategorizeTransactionResponse } from "@workspace/api-zod";
import { categoryColors, ensureUser, getMonthlyTransactions, getUserId } from "../lib/finance";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/requireAuth";

const router: IRouter = Router();
router.use("/insights", requireAuth);

router.get("/insights", async (req, res): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const userId = getUserId(authReq);
  await ensureUser(userId);
  const transactions = await getMonthlyTransactions(userId);
  const expenses = transactions.filter((transaction) => transaction.type === "expense");
  const total = expenses.reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  const food = expenses.filter((transaction) => transaction.category === "Food").reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  const transport = expenses.filter((transaction) => transaction.category === "Transport").reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  const topCategory = Object.entries(
    expenses.reduce<Record<string, number>>((acc, transaction) => {
      acc[transaction.category] = (acc[transaction.category] ?? 0) + Number(transaction.amount);
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1])[0];
  const insights = [
    topCategory && total > 0
      ? {
          id: "top-category",
          title: `${topCategory[0]} is your biggest opportunity`,
          body: `You spent ${Math.round((topCategory[1] / total) * 100)}% of your monthly expenses on ${topCategory[0].toLowerCase()}. A small weekly limit could make a noticeable difference.`,
          category: topCategory[0],
          impact: "warning" as const,
          createdAt: new Date().toISOString(),
        }
      : null,
    food > 0
      ? {
          id: "food-rhythm",
          title: "Make your food budget work harder",
          body: "Planning two extra meals at home this week could help you keep more of your food budget for the things you really enjoy.",
          category: "Food",
          impact: "neutral" as const,
          createdAt: new Date().toISOString(),
        }
      : null,
    transport > 0
      ? {
          id: "transport-win",
          title: "Your transport pattern is manageable",
          body: "You have a clear transport rhythm. Grouping two errands into one trip is an easy way to turn that consistency into savings.",
          category: "Transport",
          impact: "positive" as const,
          createdAt: new Date().toISOString(),
        }
      : null,
  ].filter(Boolean);
  res.json(ListInsightsResponse.parse(insights));
});

router.post("/insights/categorize", async (req, res): Promise<void> => {
  const parsed = CategorizeTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await client.messages.create({
    model: "claude-3-5-haiku-latest",
    max_tokens: 8192,
    system:
      "You categorize personal finance transactions. Return only valid JSON with category and confidence. Categories: Food, Transport, Shopping, Bills, Health, Entertainment, Other.",
    messages: [
      {
        role: "user",
        content: `Categorize this expense: ${parsed.data.description}`,
      },
    ],
  });
  const text = response.content[0]?.type === "text" ? response.content[0].text : "";
  let result: { category: string; confidence: number };
  try {
    result = JSON.parse(text) as { category: string; confidence: number };
  } catch {
    result = { category: "Other", confidence: 0.35 };
  }
  const category = categoryColors[result.category] ? result.category : "Other";
  res.json(CategorizeTransactionResponse.parse({ category, confidence: Math.max(0, Math.min(1, result.confidence)) }));
});

export default router;