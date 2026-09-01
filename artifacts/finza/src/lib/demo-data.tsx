import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { Budget, DashboardSummary, Insight, Transaction } from '@workspace/api-client-react';

export interface DemoSort { search?: string; type?: 'income' | 'expense'; sort?: 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'; }

export interface DemoBudgetInput { category: string; month: string; limitAmount: number; }
export interface DemoTransactionInput { amount: number; description: string; category: string; date: string; type: 'income' | 'expense'; }

const STORAGE_KEY = 'finza-demo-data';
const CATEGORY_COLORS: Record<string, string> = { Home: '#46c8fb', Food: '#ffcf70', Transport: '#b889fa', Leisure: '#f66f83', Health: '#6ee7b7', Shopping: '#a78bfa', Income: '#46c8fb', Other: '#9aa5b5' };
const CATEGORIES = ['Food', 'Home', 'Transport', 'Leisure', 'Health', 'Shopping', 'Income', 'Other'];

const SEED: { transactions: Transaction[]; budgets: Budget[]; insights: Insight[] } = {
  transactions: [
    { id: 1, amount: 145, category: 'Food', description: 'Café Maure', date: '2025-05-26', type: 'expense', aiConfidence: .98 },
    { id: 2, amount: 1250, category: 'Income', description: 'Freelance project', date: '2025-05-25', type: 'income', aiConfidence: null },
    { id: 3, amount: 680, category: 'Home', description: 'Marjane Market', date: '2025-05-24', type: 'expense', aiConfidence: .94 },
    { id: 4, amount: 220, category: 'Transport', description: 'Careem ride', date: '2025-05-23', type: 'expense', aiConfidence: .91 },
    { id: 5, amount: 310, category: 'Food', description: 'Grocery run', date: '2025-05-22', type: 'expense', aiConfidence: .9 },
    { id: 6, amount: 540, category: 'Leisure', description: 'Cinema + dinner', date: '2025-05-21', type: 'expense', aiConfidence: .88 },
    { id: 7, amount: 1200, category: 'Income', description: 'Design retainer', date: '2025-05-19', type: 'income', aiConfidence: null },
    { id: 8, amount: 340, category: 'Health', description: 'Pharmacy', date: '2025-05-18', type: 'expense', aiConfidence: .87 },
    { id: 9, amount: 95, category: 'Transport', description: 'Taxi', date: '2025-05-17', type: 'expense', aiConfidence: .85 },
    { id: 10, amount: 890, category: 'Shopping', description: 'New headphones', date: '2025-05-15', type: 'expense', aiConfidence: .93 },
  ],
  budgets: [
    { id: 1, category: 'Home', limitAmount: 4000, spentAmount: 2850, month: '2025-05', color: '#46c8fb' },
    { id: 2, category: 'Food', limitAmount: 2800, spentAmount: 2190, month: '2025-05', color: '#ffcf70' },
    { id: 3, category: 'Transport', limitAmount: 1800, spentAmount: 1380, month: '2025-05', color: '#b889fa' },
    { id: 4, category: 'Leisure', limitAmount: 1500, spentAmount: 1010, month: '2025-05', color: '#f66f83' },
  ],
  insights: [
    { id: '1', title: 'Your weekday lunches are trending down', body: 'You spent 18% less on weekday lunches this month. That is the kind of small shift that keeps your savings rate healthy.', category: 'Food', impact: 'positive', createdAt: '2025-05-26' },
    { id: '2', title: 'Home is close to its monthly rhythm', body: 'Home spending is at 71% of your plan with 5 days still to go. A quiet week here keeps your balance on track.', category: 'Home', impact: 'neutral', createdAt: '2025-05-25' },
    { id: '3', title: 'A gentle watch on weekend rides', body: 'Transport is moving 12% faster than last month, mostly from Saturday rides. Nothing urgent — just a useful signal.', category: 'Transport', impact: 'warning', createdAt: '2025-05-24' },
  ],
};

function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as typeof SEED;
  } catch { /* ignore corrupted storage */ }
  return SEED;
}

interface DemoDataValue {
  transactions: Transaction[];
  budgets: Budget[];
  insights: Insight[];
  addTransaction: (input: DemoTransactionInput) => void;
  updateTransaction: (id: number, input: DemoTransactionInput) => void;
  deleteTransaction: (id: number) => void;
  categorize: (description: string) => string;
  upsertBudget: (input: DemoBudgetInput) => void;
  resetDemo: () => void;
}

const DemoDataContext = createContext<DemoDataValue | null>(null);

export function DemoDataProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState(loadStore);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); } catch { /* quota */ }
  }, [store]);

  const value = useMemo<DemoDataValue>(() => {
    const nextId = store.transactions.reduce((m, t) => Math.max(m, t.id + 1), 1);
    return {
      transactions: store.transactions,
      budgets: store.budgets,
      insights: store.insights,
      addTransaction: (input) => setStore((s) => ({
        ...s,
        transactions: [{ id: nextId, ...input, aiConfidence: .99 }, ...s.transactions],
        budgets: s.budgets.map((b) => b.category === input.category && input.type === 'expense' ? { ...b, spentAmount: b.spentAmount + input.amount } : b),
      })),
      updateTransaction: (id, input) => setStore((s) => ({
        ...s,
        transactions: s.transactions.map((t) => t.id === id ? { ...t, ...input } : t),
      })),
      deleteTransaction: (id) => setStore((s) => ({ ...s, transactions: s.transactions.filter((t) => t.id !== id) })),
      categorize: (description) => {
        const lower = description.toLowerCase();
        if (/(café|cafe|coffee|lunch|food|grocery|market|restaurant|dinner|pharmacy)/.test(lower)) return 'Food';
        if (/(rent|home|utilities|electric|water|wifi|internet|marjane)/.test(lower)) return 'Home';
        if (/(taxi|careem|uber|ride|fuel|petrol|transport|metro|bus)/.test(lower)) return 'Transport';
        if (/(cinema|movie|leisure|game|fun|concert|dinner out)/.test(lower)) return 'Leisure';
        if (/(clinic|doctor|health|fitness|gym|pharmacy)/.test(lower)) return 'Health';
        if (/(shop|amazon|clothes|electronics|headphone|store)/.test(lower)) return 'Shopping';
        if (/(salary|freelance|income|invoice|pay|retainer|design)/.test(lower)) return 'Income';
        return 'Other';
      },
      upsertBudget: (input) => setStore((s) => {
        const existing = s.budgets.find((b) => b.category === input.category && b.month === input.month);
        if (existing) return { ...s, budgets: s.budgets.map((b) => b.id === existing.id ? { ...b, limitAmount: input.limitAmount } : b) };
        return { ...s, budgets: [...s.budgets, { id: s.budgets.reduce((m, b) => Math.max(m, b.id + 1), 1), category: input.category, limitAmount: input.limitAmount, spentAmount: 0, month: input.month, color: CATEGORY_COLORS[input.category] ?? '#9aa5b5' }] };
      }),
      resetDemo: () => setStore(SEED),
    };
  }, [store]);

  return <DemoDataContext.Provider value={value}>{children}</DemoDataContext.Provider>;
}

export function useDemoData(): DemoDataValue {
  const ctx = useContext(DemoDataContext);
  if (!ctx) throw new Error('useDemoData must be used within DemoDataProvider');
  return ctx;
}

export function buildDashboard(transactions: Transaction[], budgets: Budget[]): DashboardSummary {
  const month = '2025-05';
  const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const spendCounts = new Map<string, number>();
  let spend = 0;
  for (const t of transactions) {
    if (t.type === 'expense') {
      spend += t.amount;
      spendCounts.set(t.category, (spendCounts.get(t.category) ?? 0) + t.amount);
    }
  }
  const totalBalance = 24680.5 + income - spend;
  const savingsRate = income > 0 ? Math.round(((income - spend) / income) * 1000) / 10 : 0;
  const spendByCategory = Array.from(spendCounts.entries())
    .map(([category, amount]) => ({ category, amount, color: CATEGORY_COLORS[category] ?? '#9aa5b5' }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);
  const weeklyOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const byDay = new Map<string, number>();
  for (const t of transactions) { if (t.type === 'expense') byDay.set(t.date, (byDay.get(t.date) ?? 0) + t.amount); }
  const weeklySpend = weeklyOrder.map((day, i) => ({ day, amount: byDay.get(`2025-05-${String(Math.min(i + 19, 28)).padStart(2, '0')}`) ?? 35 + ((day.length * 37 + i * 53) % 80) }));
  const recentTransactions = [...transactions].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 6);
  return {
    totalBalance, monthlySpend: spend, monthlyIncome: income, savingsRate,
    spendChange: -8.4, spendByCategory, weeklySpend, recentTransactions,
  };
}
