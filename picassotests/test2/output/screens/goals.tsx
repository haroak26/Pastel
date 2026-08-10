import { useState } from "react";
import appHeader from "../components/app-header";
import mainNavigation from "../components/main-navigation";
import pageHeader from "../components/page-header";
import goalsFilterBar from "../components/goals-filter-bar";
import goalsTable from "../components/goals-table";
import goalDetailModal from "../components/goal-detail-modal";

const AppHeader = appHeader as any;
const MainNavigation = mainNavigation as any;
const PageHeader = pageHeader as any;
const GoalsFilterBar = goalsFilterBar as any;
const GoalsTable = goalsTable as any;
const GoalDetailModal = goalDetailModal as any;

const goals = [
  {
    id: "goal_1",
    name: "Japan trip",
    category: "Travel",
    icon: "✈",
    targetAmount: 4200,
    currentAmount: 2860,
    savedAmount: 2860,
    progress: 68,
    deadline: "Jun 30, 2026",
    status: "Active",
    monthlyContribution: 350,
    account: "Everyday checking",
    createdOn: "Jan 12, 2026",
    description: "Flights, lodging, and spending money for our two-week trip to Japan.",
  },
  {
    id: "goal_2",
    name: "Emergency fund",
    category: "Safety net",
    icon: "✦",
    targetAmount: 9000,
    currentAmount: 6750,
    savedAmount: 6750,
    progress: 75,
    deadline: "Dec 31, 2026",
    status: "Active",
    monthlyContribution: 500,
    account: "High-yield savings",
    createdOn: "Oct 4, 2025",
    description: "A six-month cushion for unexpected expenses and time between jobs.",
  },
  {
    id: "goal_3",
    name: "New laptop",
    category: "Technology",
    icon: "▣",
    targetAmount: 1800,
    currentAmount: 1800,
    savedAmount: 1800,
    progress: 100,
    deadline: "Mar 15, 2026",
    status: "Completed",
    monthlyContribution: 0,
    account: "High-yield savings",
    createdOn: "Nov 20, 2025",
    description: "A reliable laptop for design work and personal projects.",
  },
  {
    id: "goal_4",
    name: "Home down payment",
    category: "Home",
    icon: "⌂",
    targetAmount: 30000,
    currentAmount: 8400,
    savedAmount: 8400,
    progress: 28,
    deadline: "Aug 31, 2028",
    status: "Active",
    monthlyContribution: 700,
    account: "Home savings",
    createdOn: "Feb 1, 2026",
    description: "Long-term savings toward a down payment on our first home.",
  },
  {
    id: "goal_5",
    name: "Wedding weekend",
    category: "Life event",
    icon: "♡",
    targetAmount: 7500,
    currentAmount: 2400,
    savedAmount: 2400,
    progress: 32,
    deadline: "Sep 12, 2027",
    status: "Active",
    monthlyContribution: 300,
    account: "Everyday checking",
    createdOn: "Dec 18, 2025",
    description: "Travel and accommodations for the wedding weekend in Vermont.",
  },
  {
    id: "goal_6",
    name: "Winter coat",
    category: "Personal",
    icon: "◇",
    targetAmount: 450,
    currentAmount: 225,
    savedAmount: 225,
    progress: 50,
    deadline: "Oct 1, 2026",
    status: "Paused",
    monthlyContribution: 0,
    account: "Everyday checking",
    createdOn: "Jan 28, 2026",
    description: "A warm winter coat before the colder months arrive.",
  },
];

export default function Goals() {
  const [selectedGoal, setSelectedGoal] = useState<(typeof goals)[number] | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const openCreateGoal = () => {
    setSelectedGoal(null);
    setIsCreateOpen(true);
  };

  const openGoalDetails = (goal: (typeof goals)[number]) => {
    setSelectedGoal(goal);
    setIsCreateOpen(false);
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface-background)] font-[var(--font-body)] text-[var(--color-text-primary)]">
      <div role="nav">
        <AppHeader
          appName="Wavelength"
          title="Wavelength"
          user={{
            name: "Maya Thompson",
            email: "maya.thompson@wavelength.money",
            role: "Budget owner",
            avatar:
              "https://ui-avatars.com/api/?name=Maya+Thompson&background=0f766e&color=f8fafc",
          }}
          notifications={3}
          showNotifications
        />
      </div>

      <div className="mx-auto flex min-h-[calc(100vh-var(--space-16))] max-w-[var(--space-24)]">
        <aside
          role="sidebar"
          className="hidden w-[272px] shrink-0 border-r border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] px-[var(--space-4)] py-[var(--space-6)] lg:block"
        >
          <MainNavigation
            layout="sidebar"
            orientation="vertical"
            activeItem="Goals"
            activePath="/goals"
            items={[
              { label: "Overview", href: "/" },
              { label: "Transactions", href: "/transactions" },
              { label: "Goals", href: "/goals", active: true },
              { label: "Settings", href: "/settings" },
            ]}
          />
        </aside>

        <main role="content" className="min-w-0 flex-1 px-[var(--space-6)] py-[var(--space-8)] lg:px-[var(--space-12)]">
          <div className="mx-auto max-w-[var(--space-24)]">
            <PageHeader
              title="Savings goals"
              heading="Savings goals"
              description="Create, track, and update the money you are setting aside for what comes next."
              subtitle="Create, track, and update the money you are setting aside for what comes next."
              actionLabel="Create savings goal"
              primaryActionLabel="Create savings goal"
              onAction={openCreateGoal}
              onPrimaryAction={openCreateGoal}
              size="md"
            />

            <section
              aria-label="Goal filters"
              className="mt-[var(--space-2)] border-b border-[var(--color-border-subtle)] pb-[var(--space-4)]"
            >
              <GoalsFilterBar
                label="Filter goals"
                filterLabel="Filter goals"
                searchLabel="Search goals"
                searchPlaceholder="Search goals"
                statusLabel="Status"
                statusFilterLabel="Status"
                allStatusesLabel="All statuses"
                activeStatusLabel="Active"
                completedStatusLabel="Completed"
                pausedStatusLabel="Paused"
                sortLabel="Sort by"
                sortByLabel="Sort by"
                progressSortLabel="Progress"
                deadlineSortLabel="Deadline"
                amountSavedSortLabel="Amount saved"
                counts={{
                  all: goals.length,
                  active: goals.filter((goal) => goal.status === "Active").length,
                  completed: goals.filter((goal) => goal.status === "Completed").length,
                  paused: goals.filter((goal) => goal.status === "Paused").length,
                }}
                defaultFilter="all"
                defaultStatus="all"
                defaultSort="progress"
              />
            </section>

            <section aria-label="All savings goals" className="mt-[var(--space-6)]">
              <GoalsTable
                title="All savings goals"
                heading="All savings goals"
                goals={goals}
                data={goals}
                goalNameLabel="Goal name"
                savedAmountLabel="Saved"
                targetAmountLabel="Target amount"
                progressLabel="Progress"
                deadlineLabel="Deadline"
                statusLabel="Status"
                goalStatusLabel="Status"
                actionsLabel="Actions"
                editLabel="Edit goal"
                editGoalLabel="Edit goal"
                deleteLabel="Delete goal"
                deleteGoalLabel="Delete goal"
                detailsLabel="View details"
                onEdit={openGoalDetails}
                onViewDetails={openGoalDetails}
                onDelete={(goal: (typeof goals)[number]) => {
                  setSelectedGoal(goal);
                }}
              />
            </section>
          </div>
        </main>
      </div>

      <GoalDetailModal
        open={Boolean(selectedGoal) || isCreateOpen}
        isOpen={Boolean(selectedGoal) || isCreateOpen}
        goal={selectedGoal}
        mode={isCreateOpen ? "create" : "edit"}
        title={isCreateOpen ? "Create savings goal" : "Goal details"}
        goalDetailLabel="Goal details"
        nameLabel="Goal name"
        targetAmountLabel="Target amount"
        currentSavingsLabel="Current savings"
        deadlineLabel="Deadline"
        categoryLabel="Category"
        descriptionLabel="Description"
        monthlyContributionLabel="Monthly contribution"
        accountLabel="Funding account"
        createdOnLabel="Created on"
        cancelLabel="Cancel"
        saveLabel="Save changes"
        saveChangesLabel="Save changes"
        confirmDeleteLabel="Delete goal"
        onOpenChange={(open: boolean) => {
          if (!open) {
            setSelectedGoal(null);
            setIsCreateOpen(false);
          }
        }}
        onCancel={() => {
          setSelectedGoal(null);
          setIsCreateOpen(false);
        }}
        onSave={() => {
          setSelectedGoal(null);
          setIsCreateOpen(false);
        }}
      />
    </div>
  );
}