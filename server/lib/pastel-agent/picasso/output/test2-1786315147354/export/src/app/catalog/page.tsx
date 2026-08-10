import { default as TopbarHeader } from "../components/TopbarHeader";
import { default as MainNavigation } from "../components/MainNavigation";
import { default as StreakBanner } from "../components/StreakBanner";
import { default as SpendingSummaryCard } from "../components/SpendingSummaryCard";
import { default as CategoryBreakdownChart } from "../components/CategoryBreakdownChart";
import { default as ActiveGoalsPreview } from "../components/ActiveGoalsPreview";
import { default as RecentTransactionsList } from "../components/RecentTransactionsList";
import { default as PageHeader } from "../components/PageHeader";
import { default as GoalsList } from "../components/GoalsList";
import { default as GoalDetailCard } from "../components/GoalDetailCard";
import { default as MilestoneRewardsSection } from "../components/MilestoneRewardsSection";
import { default as FilterPanel } from "../components/FilterPanel";
import { default as SearchBar } from "../components/SearchBar";
import { default as TransactionsTable } from "../components/TransactionsTable";
import { default as Pagination } from "../components/Pagination";
import { default as SettingsSectionHeader } from "../components/SettingsSectionHeader";
import { default as ProfileSection } from "../components/ProfileSection";
import { default as BudgetLimitsForm } from "../components/BudgetLimitsForm";
import { default as NotificationPreferences } from "../components/NotificationPreferences";
import { default as AccountSection } from "../components/AccountSection";
import { default as GoalHeader } from "../components/GoalHeader";
import { default as GoalProgressRing } from "../components/GoalProgressRing";
import { default as MilestoneTimeline } from "../components/MilestoneTimeline";
import { default as ContributionHistory } from "../components/ContributionHistory";
import { default as ContributionChart } from "../components/ContributionChart";
import { default as TransactionHeader } from "../components/TransactionHeader";
import { default as TransactionDetails } from "../components/TransactionDetails";
import { default as EditTransactionForm } from "../components/EditTransactionForm";
import { default as DeleteButton } from "../components/DeleteButton";
import { default as FormHeader } from "../components/FormHeader";
import { default as GoalForm } from "../components/GoalForm";
import { default as FormActions } from "../components/FormActions";
import { default as Logo } from "../components/Logo";
import { default as NotificationIcon } from "../components/NotificationIcon";
import { default as UserProfileMenu } from "../components/UserProfileMenu";
import { default as NavLink } from "../components/NavLink";
import { default as NavSection } from "../components/NavSection";

import type { ComponentType, ReactNode } from "react";

type Variant = {
  label: string;
  props?: Record<string, unknown>;
};

type CatalogItem = {
  name: string;
  description: string;
  component: ComponentType<any>;
  variants?: Variant[];
};

const states = ["default", "hover", "focus", "disabled", "loading"];

function DemoBlock({
  component: Component,
  variant,
}: {
  component: ComponentType<any>;
  variant: Variant;
}) {
  return (
    <div className="variant">
      <div className="variantHeading">
        <span>{variant.label}</span>
        <span className="variantRule" />
      </div>

      <div className="stateGrid">
        {states.map((state) => (
          <div className={`stateDemo state-${state}`} key={state}>
            <div className="stateLabel">{state}</div>
            <div className="stateCanvas">
              <Component {...(variant.props || {})} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComponentSection({ item }: { item: CatalogItem }) {
  const variants = item.variants?.length
    ? item.variants
    : [{ label: "Default" }];

  return (
    <section className="componentSection" id={item.name}>
      <div className="sectionIntro">
        <p className="eyebrow">Component</p>
        <h2>{item.name}</h2>
        <p>{item.description}</p>
      </div>

      <div className="variants">
        {variants.map((variant) => (
          <DemoBlock
            component={item.component}
            variant={variant}
            key={variant.label}
          />
        ))}
      </div>
    </section>
  );
}

const catalog: CatalogItem[] = [
  {
    name: "TopbarHeader",
    component: TopbarHeader,
    description:
      "Horizontal application header with brand identity, profile controls, and notifications.",
    variants: [
      { label: "Compact", props: { layout: "compact" } },
      { label: "Standard", props: { layout: "standard" } },
    ],
  },
  {
    name: "MainNavigation",
    component: MainNavigation,
    description:
      "Vertical primary navigation for Dashboard, Goals, Transactions, and Settings.",
    variants: [
      { label: "Collapsed", props: { width: "collapsed" } },
      { label: "Expanded", props: { width: "expanded" } },
    ],
  },
  {
    name: "StreakBanner",
    component: StreakBanner,
    description:
      "Prominent spending streak message with a flame indicator and progress.",
    variants: [
      { label: "Small", props: { size: "sm" } },
      { label: "Medium", props: { size: "md" } },
      { label: "Large", props: { size: "lg" } },
    ],
  },
  {
    name: "SpendingSummaryCard",
    component: SpendingSummaryCard,
    description:
      "Monthly spending summary with budget limit, remaining amount, and progress ring.",
  },
  {
    name: "CategoryBreakdownChart",
    component: CategoryBreakdownChart,
    description:
      "Horizontal category spending chart with percentages and amounts.",
  },
  {
    name: "ActiveGoalsPreview",
    component: ActiveGoalsPreview,
    description:
      "Preview of active savings goals with progress, targets, and time remaining.",
  },
  {
    name: "RecentTransactionsList",
    component: RecentTransactionsList,
    description:
      "Clickable list of recent transactions with merchant, category, date, and amount.",
  },
  {
    name: "PageHeader",
    component: PageHeader,
    description:
      "Page heading pattern for Savings Goals with a primary create action.",
  },
  {
    name: "GoalsList",
    component: GoalsList,
    description:
      "Goal collection with progress, deadlines, amounts, and contextual actions.",
    variants: [
      { label: "List · All", props: { layout: "list", filter: "all" } },
      { label: "List · Active", props: { layout: "list", filter: "active" } },
      {
        label: "List · Completed",
        props: { layout: "list", filter: "completed" },
      },
      { label: "Grid · All", props: { layout: "grid", filter: "all" } },
      { label: "Grid · Active", props: { layout: "grid", filter: "active" } },
      {
        label: "Grid · Completed",
        props: { layout: "grid", filter: "completed" },
      },
    ],
  },
  {
    name: "GoalDetailCard",
    component: GoalDetailCard,
    description:
      "Expanded goal detail view with progress, earned milestones, and contributions.",
  },
  {
    name: "MilestoneRewardsSection",
    component: MilestoneRewardsSection,
    description:
      "Gamification panel showing rewards unlocked at each goal milestone.",
  },
  {
    name: "FilterPanel",
    component: FilterPanel,
    description:
      "Collapsible transaction filters for dates, categories, amount, and transaction type.",
  },
  {
    name: "SearchBar",
    component: SearchBar,
    description:
      "Search input for finding transactions by merchant or description.",
  },
  {
    name: "TransactionsTable",
    component: TransactionsTable,
    description:
      "Sortable full transaction history with date, merchant, category, amount, and status.",
    variants: [
      {
        label: "Date · Ascending",
        props: { sortBy: "date", sortOrder: "asc" },
      },
      {
        label: "Date · Descending",
        props: { sortBy: "date", sortOrder: "desc" },
      },
      {
        label: "Merchant · Ascending",
        props: { sortBy: "merchant", sortOrder: "asc" },
      },
      {
        label: "Merchant · Descending",
        props: { sortBy: "merchant", sortOrder: "desc" },
      },
      {
        label: "Category · Ascending",
        props: { sortBy: "category", sortOrder: "asc" },
      },
      {
        label: "Category · Descending",
        props: { sortBy: "category", sortOrder: "desc" },
      },
      {
        label: "Amount · Ascending",
        props: { sortBy: "amount", sortOrder: "asc" },
      },
      {
        label: "Amount · Descending",
        props: { sortBy: "amount", sortOrder: "desc" },
      },
    ],
  },
  {
    name: "Pagination",
    component: Pagination,
    description: "Table pagination controls for moving between result pages.",
  },
  {
    name: "SettingsSectionHeader",
    component: SettingsSectionHeader,
    description: "Settings page title pattern with breadcrumb or section navigation.",
  },
  {
    name: "ProfileSection",
    component: ProfileSection,
    description:
      "Profile identity panel with avatar, name, email, and edit action.",
  },
  {
    name: "BudgetLimitsForm",
    component: BudgetLimitsForm,
    description:
      "Form for setting monthly category spending limits and saving changes.",
  },
  {
    name: "NotificationPreferences",
    component: NotificationPreferences,
    description:
      "Notification controls for alerts, milestones, streaks, and summaries.",
  },
  {
    name: "AccountSection",
    component: AccountSection,
    description:
      "Account management actions including password, linked accounts, export, and logout.",
  },
  {
    name: "GoalHeader",
    component: GoalHeader,
    description:
      "Goal detail header with back navigation, goal metadata, and actions.",
  },
  {
    name: "GoalProgressRing",
    component: GoalProgressRing,
    description:
      "Circular goal progress indicator with current and target amounts.",
    variants: [
      { label: "Medium", props: { size: "md" } },
      { label: "Large", props: { size: "lg" } },
      { label: "Extra Large", props: { size: "xl" } },
    ],
  },
  {
    name: "MilestoneTimeline",
    component: MilestoneTimeline,
    description:
      "Visual goal timeline showing milestone thresholds, badges, and unlock dates.",
  },
  {
    name: "ContributionHistory",
    component: ContributionHistory,
    description:
      "Contribution table showing dates, amounts, and manual or automatic sources.",
  },
  {
    name: "ContributionChart",
    component: ContributionChart,
    description:
      "Cumulative savings line chart tracking progress toward a goal deadline.",
  },
  {
    name: "TransactionHeader",
    component: TransactionHeader,
    description:
      "Transaction detail header with back navigation, merchant, amount, and date.",
  },
  {
    name: "TransactionDetails",
    component: TransactionDetails,
    description:
      "Key-value transaction information including type, payment method, and tags.",
  },
  {
    name: "EditTransactionForm",
    component: EditTransactionForm,
    description:
      "Transaction editing form for category, amount, date, description, and tags.",
  },
  {
    name: "DeleteButton",
    component: DeleteButton,
    description: "Destructive action button for removing a transaction.",
    variants: [
      { label: "Small · Solid", props: { size: "sm", variant: "solid" } },
      { label: "Medium · Solid", props: { size: "md", variant: "solid" } },
      { label: "Large · Solid", props: { size: "lg", variant: "solid" } },
      { label: "Small · Outline", props: { size: "sm", variant: "outline" } },
      { label: "Medium · Outline", props: { size: "md", variant: "outline" } },
      { label: "Large · Outline", props: { size: "lg", variant: "outline" } },
    ],
  },
  {
    name: "FormHeader",
    component: FormHeader,
    description: "Create-goal page heading with back navigation.",
  },
  {
    name: "GoalForm",
    component: GoalForm,
    description:
      "Goal creation form with name, target, deadline, category, and description fields.",
  },
  {
    name: "FormActions",
    component: FormActions,
    description: "Primary create and secondary cancel form actions.",
  },
  {
    name: "Logo",
    component: Logo,
    description: "Wavelength brand logo and wordmark in the accent color.",
    variants: [
      { label: "Small · Full", props: { size: "sm", variant: "full" } },
      { label: "Medium · Full", props: { size: "md", variant: "full" } },
      { label: "Large · Full", props: { size: "lg", variant: "full" } },
      { label: "Small · Icon", props: { size: "sm", variant: "icon" } },
      { label: "Medium · Icon", props: { size: "md", variant: "icon" } },
      { label: "Large · Icon", props: { size: "lg", variant: "icon" } },
    ],
  },
  {
    name: "NotificationIcon",
    component: NotificationIcon,
    description: "Bell icon indicating unread alerts with a badge count.",
  },
  {
    name: "UserProfileMenu",
    component: UserProfileMenu,
    description:
      "User avatar control with profile, settings, and logout menu options.",
  },
  {
    name: "NavLink",
    component: NavLink,
    description:
      "Navigation link combining an icon and label with an accent active state.",
  },
  {
    name: "NavSection",
    component: NavSection,
    description:
      "Grouped navigation items with an optional collapsible section header.",
  },
];

export default function CatalogPage(): ReactNode {
  return (
    <main className="catalog">
      <header className="catalogHeader">
        <div>
          <p className="eyebrow">Wavelength design system</p>
          <h1>Component catalog</h1>
          <p className="catalogLead">
            A living visual reference for finance, goals, transactions, and
            account management patterns.
          </p>
        </div>
        <div className="catalogMeta">
          <span>{catalog.length} components</span>
          <span>Interactive states included</span>
        </div>
      </header>

      <nav className="catalogIndex" aria-label="Catalog sections">
        {catalog.map((item) => (
          <a href={`#${item.name}`} key={item.name}>
            {item.name}
          </a>
        ))}
      </nav>

      <div className="componentSections">
        {catalog.map((item) => (
          <ComponentSection item={item} key={item.name} />
        ))}
      </div>

      <style jsx>{`
        .catalog {
          min-height: 100vh;
          padding: var(--space-12) var(--space-8);
          color: var(--color-text-primary);
          background: var(--color-surface-background);
          font-family: var(--font-body);
        }

        .catalogHeader,
        .componentSection {
          max-width: 1280px;
          margin: 0 auto;
        }

        .catalogHeader {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: var(--space-8);
          padding-bottom: var(--space-12);
          border-bottom: 1px solid var(--color-border-default);
        }

        .eyebrow {
          margin: 0 0 var(--space-2);
          color: var(--color-accent-500);
          font-family: var(--font-mono);
          font-size: var(--text-xs);
          font-weight: var(--weight-semibold);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        h1,
        h2 {
          margin: 0;
          font-family: var(--font-display);
          font-weight: var(--weight-semibold);
          letter-spacing: -0.03em;
        }

        h1 {
          font-size: var(--text-4xl);
          line-height: 1.1;
        }

        h2 {
          font-size: var(--text-2xl);
          line-height: 1.25;
        }

        .catalogLead {
          max-width: 640px;
          margin: var(--space-4) 0 0;
          color: var(--color-text-secondary);
          font-size: var(--text-lg);
        }

        .catalogMeta {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          color: var(--color-text-muted);
          font-family: var(--font-mono);
          font-size: var(--text-xs);
          text-align: right;
          white-space: nowrap;
        }

        .catalogIndex {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-2);
          max-width: 1280px;
          margin: 0 auto;
          padding: var(--space-6) 0 var(--space-12);
        }

        .catalogIndex a {
          padding: var(--space-2) var(--space-3);
          color: var(--color-text-secondary);
          border: 1px solid var(--color-border-default);
          border-radius: var(--radius-full);
          background: var(--color-surface-raised);
          font-size: var(--text-xs);
          text-decoration: none;
          transition:
            color var(--duration-fast) var(--easing-standard),
            border-color var(--duration-fast) var(--easing-standard);
        }

        .catalogIndex a:hover,
        .catalogIndex a:focus-visible {
          color: var(--color-accent-600);
          border-color: var(--color-border-focus);
          outline: none;
        }

        .componentSection {
          padding: var(--space-12) 0;
          border-top: 1px solid var(--color-border-subtle);
          scroll-margin-top: var(--space-8);
        }

        .sectionIntro {
          display: grid;
          grid-template-columns: minmax(180px, 0.35fr) minmax(240px, 0.8fr) minmax(280px, 1.5fr);
          align-items: baseline;
          gap: var(--space-6);
          margin-bottom: var(--space-8);
        }

        .sectionIntro .eyebrow {
          margin: 0;
        }

        .sectionIntro p:last-child {
          max-width: 620px;
          margin: 0;
          color: var(--color-text-secondary);
          font-size: var(--text-base);
          line-height: 1.5;
        }

        .variants {
          display: flex;
          flex-direction: column;
          gap: var(--space-8);
        }

        .variant {
          padding: var(--space-6);
          border: 1px solid var(--color-border-default);
          border-radius: var(--radius-lg);
          background: var(--color-surface-raised);
        }

        .variantHeading {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          margin-bottom: var(--space-4);
          color: var(--color-text-primary);
          font-family: var(--font-display);
          font-size: var(--text-sm);
          font-weight: var(--weight-semibold);
        }

        .variantRule {
          height: 1px;
          flex: 1;
          background: var(--color-border-subtle);
        }

        .stateGrid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: var(--space-3);
        }

        .stateDemo {
          min-width: 0;
        }

        .stateLabel {
          margin-bottom: var(--space-2);
          color: var(--color-text-muted);
          font-family: var(--font-mono);
          font-size: var(--text-xs);
          text-transform: capitalize;
        }

        .stateCanvas {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: var(--control-lg);
          padding: var(--space-4);
          overflow: auto;
          border: 1px solid var(--color-border-subtle);
          border-radius: var(--radius-md);
          background: var(--color-neutral-50);
          transition:
            border-color var(--duration-fast) var(--easing-standard),
            background var(--duration-fast) var(--easing-standard);
        }

        .state-hover .stateCanvas {
          border-color: var(--color-accent-500);
          background: var(--color-accent-50);
        }

        .state-focus .stateCanvas {
          border-color: var(--color-border-focus);
          outline: 2px solid var(--color-accent-100);
          outline-offset: 1px;
        }

        .state-disabled .stateCanvas {
          opacity: 0.52;
        }

        .state-loading .stateCanvas {
          background: var(--color-info-50);
        }

        @media (max-width: 960px) {
          .catalog {
            padding: var(--space-8) var(--space-4);
          }

          .catalogHeader,
          .sectionIntro {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
          }

          .catalogMeta {
            text-align: left;
          }

          .stateGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 560px) {
          h1 {
            font-size: var(--text-3xl);
          }

          .stateGrid {
            grid-template-columns: 1fr;
          }

          .variant {
            padding: var(--space-4);
          }
        }
      `}</style>
    </main>
  );
}