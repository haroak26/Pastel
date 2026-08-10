import * as React from "react";
import AppHeader from "../components/app-header";
import MainNavigation from "../components/main-navigation";
import StreakBanner from "../components/streak-banner";
import MonthlyBudgetCard from "../components/monthly-budget-card";
import SpendingBreakdownChart from "../components/spending-breakdown-chart";
import ActiveGoalsList from "../components/active-goals-list";
import RecentTransactionsFeed from "../components/recent-transactions-feed";
import PageHeader from "../components/page-header";

const currentUser = {
  id: "usr_1",
  name: "Maya Thompson",
  email: "maya.thompson@wavelength.money",
  role: "Budget owner",
  avatar:
    "https://ui-avatars.com/api/?name=Maya+Thompson&background=0f766e&color=f8fafc",
};

const spendingCategories = [
  { name: "Food", amount: 486.24, percentage: 31 },
  { name: "Transport", amount: 264.8, percentage: 17 },
  { name: "Shopping", amount: 238.45, percentage: 15 },
  { name: "Entertainment", amount: 187.1, percentage: 12 },
  { name: "Other", amount: 390.61, percentage: 25 },
];

const activeGoals = [
  {
    id: "goal_1",
    name: "Emergency fund",
    targetAmount: 6000,
    currentAmount: 3850,
    progress: 64,
    deadline: "Dec 31, 2026",
    timeRemaining: "145 days",
  },
  {
    id: "goal_2",
    name: "Japan trip",
    targetAmount: 3200,
    currentAmount: 1880,
    progress: 59,
    deadline: "Mar 15, 2027",
    timeRemaining: "220 days",
  },
  {
    id: "goal_3",
    name: "New laptop",
    targetAmount: 1800,
    currentAmount: 990,
    progress: 55,
    deadline: "Nov 30, 2026",
    timeRemaining: "114 days",
  },
  {
    id: "goal_4",
    name: "Home repairs",
    targetAmount: 2500,
    currentAmount: 875,
    progress: 35,
    deadline: "Jun 30, 2027",
    timeRemaining: "327 days",
  },
];

const recentTransactions = [
  {
    id: "txn_1",
    date: "Aug 9, 2026",
    merchant: "Green Leaf Market",
    category: "Food",
    amount: -84.32,
    balance: 4128.56,
    status: "Cleared",
  },
  {
    id: "txn_2",
    date: "Aug 8, 2026",
    merchant: "Metro Transit",
    category: "Transport",
    amount: -42.5,
    balance: 4212.88,
    status: "Cleared",
  },
  {
    id: "txn_3",
    date: "Aug 7, 2026",
    merchant: "Northstar Books",
    category: "Shopping",
    amount: -63.99,
    balance: 4255.38,
    status: "Cleared",
  },
  {
    id: "txn_4",
    date: "Aug 6, 2026",
    merchant: "Luna Cinema",
    category: "Entertainment",
    amount: -28.0,
    balance: 4319.37,
    status: "Cleared",
  },
  {
    id: "txn_5",
    date: "Aug 5, 2026",
    merchant: "Harbor Coffee",
    category: "Food",
    amount: -16.75,
    balance: 4347.37,
    status: "Cleared",
  },
  {
    id: "txn_6",
    date: "Aug 4, 2026",
    merchant: "Oak Pharmacy",
    category: "Other",
    amount: -37.2,
    balance: 4364.12,
    status: "Cleared",
  },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[var(--color-surface-background)] text-[var(--color-text-primary)]">
      <div className="flex min-h-screen">
        <aside
          aria-label="Sidebar"
          className="hidden w-[var(--space-24)] shrink-0 border-r border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] lg:block"
        >
          <div className="sticky top-0 flex h-screen flex-col">
            <div className="border-b border-[var(--color-border-subtle)] p-[var(--space-4)]">
              <MainNavigation
                items={[
                  { label: "Dashboard", href: "/dashboard", active: true },
                  { label: "Goals", href: "/goals" },
                  { label: "Transactions", href: "/transactions" },
                  { label: "Settings", href: "/settings" },
                ]}
                activeItem="Dashboard"
                layout="sidebar"
                orientation="vertical"
              />
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header role="nav" className="sticky top-0 z-10">
            <AppHeader user={currentUser} />
          </header>

          <main
            role="content"
            className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-[var(--space-8)] px-[var(--space-4)] py-[var(--space-6)] sm:px-[var(--space-6)] lg:px-[var(--space-8)]"
          >
            <PageHeader
              title="Your money this month"
              description="See August spending, savings progress, and your latest money activity in one place."
              primaryAction={{
                label: "Add transaction",
                href: "/transactions/new",
              }}
            />

            <section
              aria-label="Monthly overview"
              className="grid grid-cols-1 gap-[var(--space-4)] xl:grid-cols-12"
            >
              <div className="xl:col-span-7">
                <StreakBanner
                  label="Money streak"
                  currentStreak="12 days"
                  streakChange="+4 days"
                  nextMilestone="18 days to reach your next reward"
                />
              </div>
              <div className="xl:col-span-5">
                <MonthlyBudgetCard
                  label="August budget"
                  budget={4200}
                  spent={1567.2}
                  remaining={2632.8}
                  spendingChange="+8% compared with last period"
                  savingsRate={28}
                  currency="USD"
                />
              </div>
            </section>

            <section
              aria-label="Spending breakdown"
              className="grid grid-cols-1 gap-[var(--space-6)] xl:grid-cols-12"
            >
              <div className="xl:col-span-7">
                <SpendingBreakdownChart
                  title="August spending breakdown"
                  categories={spendingCategories}
                  categoryLabel="Category"
                  amountLabel="Amount"
                  shareLabel="Share of spend"
                  currency="USD"
                />
              </div>
              <div className="flex flex-col justify-between gap-[var(--space-4)] xl:col-span-5">
                <div className="border-b border-[var(--color-border-subtle)] pb-[var(--space-4)]">
                  <p className="font-[var(--font-body)] text-[var(--text-base)] text-[var(--color-text-muted)]">
                    Cash available
                  </p>
                  <p className="mt-[var(--space-2)] font-[var(--font-display)] text-3xl font-semibold">
                    $4,128.56
                  </p>
                  <p className="mt-[var(--space-2)] font-[var(--font-body)] text-[var(--text-base)] text-[var(--color-text-secondary)]">
                    After pending bills and planned savings
                  </p>
                </div>
                <a
                  href="/goals"
                  className="inline-flex w-fit items-center rounded-[var(--radius-md)] border border-[var(--color-border-default)] px-[var(--space-4)] py-[var(--space-3)] font-[var(--font-body)] text-[var(--text-base)] font-medium text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-border-focus)] hover:text-[var(--color-accent-600)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
                >
                  View all goals
                </a>
              </div>
            </section>

            <section aria-label="Active goals">
              <div className="mb-[var(--space-4)] flex items-end justify-between gap-[var(--space-4)]">
                <div>
                  <h2 className="font-[var(--font-display)] text-xl font-semibold">
                    Active goals
                  </h2>
                  <p className="mt-[var(--space-1)] font-[var(--font-body)] text-[var(--text-base)] text-[var(--color-text-secondary)]">
                    Four goals are moving forward this month.
                  </p>
                </div>
                <a
                  href="/goals"
                  className="hidden font-[var(--font-body)] text-[var(--text-base)] font-medium text-[var(--color-accent-600)] hover:text-[var(--color-accent-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] sm:inline"
                >
                  View all goals
                </a>
              </div>
              <ActiveGoalsList
                goals={activeGoals}
                goalNameLabel="Goal"
                progressLabel="Progress"
                targetLabel="Target"
                sortBy="progress"
              />
            </section>

            <section
              aria-label="Recent transactions"
              className="border-t border-[var(--color-border-subtle)] pt-[var(--space-8)]"
            >
              <div className="mb-[var(--space-4)] flex items-end justify-between gap-[var(--space-4)]">
                <div>
                  <h2 className="font-[var(--font-display)] text-xl font-semibold">
                    Recent transactions
                  </h2>
                  <p className="mt-[var(--space-1)] font-[var(--font-body)] text-[var(--text-base)] text-[var(--color-text-secondary)]">
                    The latest activity across your connected accounts.
                  </p>
                </div>
                <a
                  href="/transactions"
                  className="font-[var(--font-body)] text-[var(--text-base)] font-medium text-[var(--color-accent-600)] hover:text-[var(--color-accent-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
                >
                  View all transactions
                </a>
              </div>
              <RecentTransactionsFeed
                transactions={recentTransactions}
                merchantLabel="Merchant"
                dateLabel="Date"
                statusLabel="Status"
                amountLabel="Amount"
                viewDetailsLabel="View details"
              />
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}