import React, { createElement } from "react";

import { default as PageHeader } from "../components/PageHeader";
import { default as StreakBand } from "../components/StreakBand";
import { default as SpendingBreakdownCard } from "../components/SpendingBreakdownCard";
import { default as BudgetStatusList } from "../components/BudgetStatusList";
import { default as RecentTransactionsFeed } from "../components/RecentTransactionsFeed";
import { default as NavigationMenu } from "../components/NavigationMenu";
import { default as QuickActionButtons } from "../components/QuickActionButtons";
import { default as GoalsList } from "../components/GoalsList";
import { default as CompletedGoalsSection } from "../components/CompletedGoalsSection";
import { default as GoalStatsCard } from "../components/GoalStatsCard";
import { default as FilterBar } from "../components/FilterBar";
import { default as TransactionsTable } from "../components/TransactionsTable";
import { default as TransactionStatsCard } from "../components/TransactionStatsCard";
import { default as ProfileSection } from "../components/ProfileSection";
import { default as BudgetSettingsForm } from "../components/BudgetSettingsForm";
import { default as NotificationPreferencesForm } from "../components/NotificationPreferencesForm";
import { default as AccountSection } from "../components/AccountSection";
import { default as BackButton } from "../components/BackButton";
import { default as GoalHeaderBand } from "../components/GoalHeaderBand";
import { default as ProgressTimeline } from "../components/ProgressTimeline";
import { default as ContributionHistoryTable } from "../components/ContributionHistoryTable";
import { default as AddContributionForm } from "../components/AddContributionForm";
import { default as GoalMetricsCard } from "../components/GoalMetricsCard";
import { default as ModalHeader } from "../components/ModalHeader";
import { default as ExpenseForm } from "../components/ExpenseForm";
import { default as GoalForm } from "../components/GoalForm";
import { default as Logo } from "../components/Logo";
import { default as MainNavigation } from "../components/MainNavigation";
import { default as UserProfile } from "../components/UserProfile";

type CatalogComponent = React.ComponentType<any>;

type Variant = {
  label: string;
  props?: Record<string, unknown>;
};

type CatalogEntry = {
  name: string;
  kind: string;
  description: string;
  component: CatalogComponent;
  variants: Variant[];
};

const states = [
  { label: "Default", props: {} },
  { label: "Hover", props: { "data-state": "hover" } },
  { label: "Focus", props: { autoFocus: true, "data-state": "focus" } },
  { label: "Disabled", props: { disabled: true, "data-state": "disabled" } },
  { label: "Loading", props: { loading: true, isLoading: true, "data-state": "loading" } },
];

const catalog: CatalogEntry[] = [
  {
    name: "PageHeader",
    kind: "Molecule",
    description: "Month selector, current date, and a contextual user greeting.",
    component: PageHeader,
    variants: [
      { label: "Greeting: Streak", props: { greeting: "streak" } },
      { label: "Greeting: Standard", props: { greeting: "standard" } },
      { label: "Greeting: Milestone", props: { greeting: "milestone" } },
    ],
  },
  {
    name: "StreakBand",
    kind: "Molecule",
    description: "Prominent streak count with days remaining and progress.",
    component: StreakBand,
    variants: [
      { label: "Emphasis: Active", props: { emphasis: "active" } },
      { label: "Emphasis: Warning", props: { emphasis: "warning" } },
      { label: "Emphasis: Milestone", props: { emphasis: "milestone" } },
    ],
  },
  {
    name: "SpendingBreakdownCard",
    kind: "Organism",
    description: "Spending distribution by category with period controls.",
    component: SpendingBreakdownCard,
    variants: [
      { label: "Donut · Week", props: { chartType: "donut", period: "week" } },
      { label: "Donut · Month", props: { chartType: "donut", period: "month" } },
      { label: "Donut · Custom", props: { chartType: "donut", period: "custom" } },
      { label: "Horizontal Bar · Week", props: { chartType: "horizontal-bar", period: "week" } },
      { label: "Horizontal Bar · Month", props: { chartType: "horizontal-bar", period: "month" } },
      { label: "Horizontal Bar · Custom", props: { chartType: "horizontal-bar", period: "custom" } },
    ],
  },
  {
    name: "BudgetStatusList",
    kind: "Organism",
    description: "Budget categories with remaining amounts, progress, and status.",
    component: BudgetStatusList,
    variants: [
      { label: "Sort: Category", props: { sortBy: "category" } },
      { label: "Sort: Remaining", props: { sortBy: "remaining" } },
      { label: "Sort: Status", props: { sortBy: "status" } },
    ],
  },
  {
    name: "RecentTransactionsFeed",
    kind: "Organism",
    description: "Scrollable feed of recent transactions with merchant and timestamp details.",
    component: RecentTransactionsFeed,
    variants: [
      { label: "List · Newest", props: { layout: "list", sortOrder: "newest" } },
      { label: "List · Oldest", props: { layout: "list", sortOrder: "oldest" } },
      { label: "Compact · Newest", props: { layout: "compact", sortOrder: "newest" } },
      { label: "Compact · Oldest", props: { layout: "compact", sortOrder: "oldest" } },
    ],
  },
  {
    name: "NavigationMenu",
    kind: "Molecule",
    description: "Primary navigation links with an active destination.",
    component: NavigationMenu,
    variants: [{ label: "Active: Dashboard", props: { activeItem: "Dashboard", active: "Dashboard" } }],
  },
  {
    name: "QuickActionButtons",
    kind: "Molecule",
    description: "Fast access actions for logging an expense or adding a goal.",
    component: QuickActionButtons,
    variants: [
      { label: "Layout: Horizontal", props: { layout: "horizontal" } },
      { label: "Layout: Vertical", props: { layout: "vertical" } },
      { label: "Layout: Stacked", props: { layout: "stacked" } },
    ],
  },
  {
    name: "GoalsList",
    kind: "Organism",
    description: "Active goals with savings progress, dates, and actions.",
    component: GoalsList,
    variants: [
      { label: "Target Date · List", props: { sortBy: "targetDate", layout: "list" } },
      { label: "Target Date · Card", props: { sortBy: "targetDate", layout: "card" } },
      { label: "Progress · List", props: { sortBy: "progress", layout: "list" } },
      { label: "Progress · Card", props: { sortBy: "progress", layout: "card" } },
      { label: "Name · List", props: { sortBy: "name", layout: "list" } },
      { label: "Name · Card", props: { sortBy: "name", layout: "card" } },
    ],
  },
  {
    name: "CompletedGoalsSection",
    kind: "Organism",
    description: "Completed goals grouped behind a collapsible section.",
    component: CompletedGoalsSection,
    variants: [
      { label: "Expanded: True", props: { expanded: true } },
      { label: "Expanded: False", props: { expanded: false } },
    ],
  },
  {
    name: "GoalStatsCard",
    kind: "Molecule",
    description: "Summary of goal count, total savings, and next milestone.",
    component: GoalStatsCard,
    variants: [{ label: "Default" }],
  },
  {
    name: "FilterBar",
    kind: "Molecule",
    description: "Date, category, and amount filters for transaction views.",
    component: FilterBar,
    variants: [
      { label: "Density: Compact", props: { density: "compact" } },
      { label: "Density: Normal", props: { density: "normal" } },
      { label: "Density: Spacious", props: { density: "spacious" } },
    ],
  },
  {
    name: "TransactionsTable",
    kind: "Organism",
    description: "Paginated transaction table with sortable columns.",
    component: TransactionsTable,
    variants: [
      { label: "Date · Ascending", props: { sortBy: "date", sortOrder: "asc" } },
      { label: "Date · Descending", props: { sortBy: "date", sortOrder: "desc" } },
      { label: "Amount · Ascending", props: { sortBy: "amount", sortOrder: "asc" } },
      { label: "Amount · Descending", props: { sortBy: "amount", sortOrder: "desc" } },
      { label: "Merchant · Ascending", props: { sortBy: "merchant", sortOrder: "asc" } },
      { label: "Merchant · Descending", props: { sortBy: "merchant", sortOrder: "desc" } },
    ],
  },
  {
    name: "TransactionStatsCard",
    kind: "Molecule",
    description: "Filtered spending total, transaction count, and average size.",
    component: TransactionStatsCard,
    variants: [{ label: "Default" }],
  },
  {
    name: "ProfileSection",
    kind: "Organism",
    description: "User identity details with an edit profile action.",
    component: ProfileSection,
    variants: [{ label: "Default" }],
  },
  {
    name: "BudgetSettingsForm",
    kind: "Organism",
    description: "Settings for monthly budget, categories, and currency.",
    component: BudgetSettingsForm,
    variants: [{ label: "Default" }],
  },
  {
    name: "NotificationPreferencesForm",
    kind: "Organism",
    description: "Toggle preferences for alerts, reminders, streaks, and summaries.",
    component: NotificationPreferencesForm,
    variants: [{ label: "Default" }],
  },
  {
    name: "AccountSection",
    kind: "Organism",
    description: "Account security, export, and destructive actions.",
    component: AccountSection,
    variants: [{ label: "Default" }],
  },
  {
    name: "BackButton",
    kind: "Primitive",
    description: "Back link returning to the Goals list.",
    component: BackButton,
    variants: [{ label: "Default" }],
  },
  {
    name: "GoalHeaderBand",
    kind: "Molecule",
    description: "Goal summary with target, current savings, progress, and actions.",
    component: GoalHeaderBand,
    variants: [{ label: "Default" }],
  },
  {
    name: "ProgressTimeline",
    kind: "Organism",
    description: "Contribution timeline with milestone markers.",
    component: ProgressTimeline,
    variants: [{ label: "Default" }],
  },
  {
    name: "ContributionHistoryTable",
    kind: "Organism",
    description: "Contribution records including source and notes.",
    component: ContributionHistoryTable,
    variants: [{ label: "Default" }],
  },
  {
    name: "AddContributionForm",
    kind: "Molecule",
    description: "Quick form for adding a manual contribution and note.",
    component: AddContributionForm,
    variants: [{ label: "Default" }],
  },
  {
    name: "GoalMetricsCard",
    kind: "Molecule",
    description: "Days remaining, monthly savings needed, and completion percentage.",
    component: GoalMetricsCard,
    variants: [{ label: "Default" }],
  },
  {
    name: "ModalHeader",
    kind: "Molecule",
    description: "Modal title and close control for logging an expense.",
    component: ModalHeader,
    variants: [{ label: "Default" }],
  },
  {
    name: "ExpenseForm",
    kind: "Organism",
    description: "Expense entry form with amount, category, merchant, date, and note.",
    component: ExpenseForm,
    variants: [{ label: "Default" }],
  },
  {
    name: "GoalForm",
    kind: "Organism",
    description: "Goal creation form with target, date, auto-save, and icon selection.",
    component: GoalForm,
    variants: [{ label: "Default" }],
  },
  {
    name: "Logo",
    kind: "Atom",
    description: "Wavelength logo and product name for the sidebar.",
    component: Logo,
    variants: [{ label: "Default" }],
  },
  {
    name: "MainNavigation",
    kind: "Molecule",
    description: "Sidebar navigation for the primary product destinations.",
    component: MainNavigation,
    variants: [{ label: "Active: Dashboard", props: { activeItem: "Dashboard", active: "Dashboard" } }],
  },
  {
    name: "UserProfile",
    kind: "Molecule",
    description: "Sidebar user identity with settings access.",
    component: UserProfile,
    variants: [{ label: "Default" }],
  },
];

function DemoStates({
  component,
  variant,
}: {
  component: CatalogComponent;
  variant: Variant;
}) {
  return (
    <div className="stateGrid">
      {states.map((state) => (
        <div className="stateDemo" key={state.label}>
          <div className="stateLabel">{state.label}</div>
          <div className={`componentPreview state-${state.label.toLowerCase()}`}>
            {createElement(component, {
              ...(variant.props || {}),
              ...(state.props || {}),
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CatalogPage() {
  return (
    <>
      <style jsx>{`
        .catalog {
          min-height: 100vh;
          padding: var(--space-12) var(--space-8);
          background: var(--color-surface-background);
          color: var(--color-text-primary);
          font: var(--text-base) var(--font-body);
        }

        .catalogHeader {
          max-width: var(--space-24);
          margin: 0 auto var(--space-12);
        }

        .eyebrow {
          margin: 0 0 var(--space-2);
          color: var(--color-accent-500);
          font: var(--text-sm) var(--font-body);
          font-weight: var(--weight-semibold);
          letter-spacing: var(--space-1);
          text-transform: uppercase;
        }

        h1,
        h2,
        h3,
        p {
          margin-top: var(--space-0);
        }

        h1,
        h2,
        h3 {
          font-family: var(--font-display);
        }

        h1 {
          margin-bottom: var(--space-3);
          font: var(--text-4xl) var(--font-display);
          font-weight: var(--weight-bold);
        }

        .intro {
          max-width: var(--space-24);
          margin-bottom: var(--space-0);
          color: var(--color-text-secondary);
          font: var(--text-lg) var(--font-body);
        }

        .componentSection {
          max-width: var(--space-24);
          margin: 0 auto var(--space-16);
        }

        .componentHeading {
          display: flex;
          align-items: baseline;
          gap: var(--space-3);
          margin-bottom: var(--space-2);
        }

        h2 {
          margin-bottom: var(--space-0);
          font: var(--text-2xl) var(--font-display);
          font-weight: var(--weight-semibold);
        }

        .kind {
          color: var(--color-accent-600);
          font: var(--text-sm) var(--font-body);
          font-weight: var(--weight-semibold);
        }

        .description {
          margin-bottom: var(--space-6);
          color: var(--color-text-muted);
          font: var(--text-base) var(--font-body);
        }

        .variantBlock {
          margin-bottom: var(--space-8);
          padding: var(--space-4);
          border: var(--space-1) solid var(--color-border-subtle);
          border-radius: var(--radius-lg);
          background: var(--color-surface-raised);
        }

        .variantLabel {
          display: inline-flex;
          margin-bottom: var(--space-4);
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-full);
          background: var(--color-accent-50);
          color: var(--color-accent-900);
          font: var(--text-sm) var(--font-body);
          font-weight: var(--weight-semibold);
        }

        .stateGrid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(var(--space-24), 1fr));
          gap: var(--space-3);
        }

        .stateDemo {
          min-width: 0;
        }

        .stateLabel {
          margin-bottom: var(--space-2);
          color: var(--color-text-muted);
          font: var(--text-xs) var(--font-body);
          font-weight: var(--weight-semibold);
          text-transform: uppercase;
          letter-spacing: var(--space-1);
        }

        .componentPreview {
          min-height: var(--control-lg);
          padding: var(--space-3);
          overflow: auto;
          border: var(--space-1) solid var(--color-border-subtle);
          border-radius: var(--radius-md);
          background: var(--color-surface-overlay);
        }

        .state-hover {
          border-color: var(--color-border-focus);
          background: var(--color-accent-50);
        }

        .state-focus {
          border-color: var(--color-border-focus);
          box-shadow: 0 0 0 var(--space-1) var(--color-accent-100);
        }

        .state-disabled {
          opacity: 0.55;
          background: var(--color-neutral-50);
        }

        .state-loading {
          background: var(--color-info-50);
        }

        @media (max-width: var(--space-24)) {
          .catalog {
            padding: var(--space-8) var(--space-4);
          }

          .componentHeading {
            display: block;
          }

          .kind {
            display: block;
            margin-top: var(--space-2);
          }
        }
      `}</style>

      <main className="catalog">
        <header className="catalogHeader">
          <p className="eyebrow">Wavelength · Component Catalog</p>
          <h1>Living style guide</h1>
          <p className="intro">
            A visual reference for the Wavelength design system. Each component is shown across its
            available variants and interaction states.
          </p>
        </header>

        {catalog.map((entry) => (
          <section className="componentSection" key={entry.name} aria-labelledby={`${entry.name}-heading`}>
            <div className="componentHeading">
              <h2 id={`${entry.name}-heading`}>{entry.name}</h2>
              <span className="kind">{entry.kind}</span>
            </div>
            <p className="description">{entry.description}</p>

            {entry.variants.map((variant) => (
              <div className="variantBlock" key={variant.label}>
                <div className="variantLabel">{variant.label}</div>
                <DemoStates component={entry.component} variant={variant} />
              </div>
            ))}
          </section>
        ))}
      </main>
    </>
  );
}