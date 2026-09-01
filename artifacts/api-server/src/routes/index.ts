import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import transactionsRouter from "./transactions";
import budgetsRouter from "./budgets";
import insightsRouter from "./insights";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(transactionsRouter);
router.use(budgetsRouter);
router.use(insightsRouter);

export default router;
