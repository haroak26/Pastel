import React from "react";

import { default as PageHeader } from "../components/PageHeader";
import { default as StreakBand } from "../components/StreakBand";
import { default as BalanceSummary } from "../components/BalanceSummary";
import { default as SpendingChart } from "../components/SpendingChart";
import { default as CategoryList } from "../components/CategoryList";
import { default as GoalsPreview } from "../components/GoalsPreview";
import { default as ViewAllGoalsLink } from "../components/ViewAllGoalsLink";
import { default as TransactionTable } from "../components/TransactionTable";
import { default as ViewAllTransactionsLink } from "../components/ViewAllTransactionsLink";
import { default as GoalCard } from "../components/GoalCard";
import { default as AchievementBand } from "../components/AchievementBand";
import { default as CompletedGoalsList } from "../components/CompletedGoalsList";
import { default as DateRangeFilter } from "../components/DateRangeFilter";
import { default as CategoryFilter } from "../components/CategoryFilter";
import { default as AmountRangeFilter } from "../components/AmountRangeFilter";
import { default as ResetFiltersButton } from "../components/ResetFiltersButton";
import { default as Pagination } from "../components/Pagination";
import { default as SectionHeader } from "../components/SectionHeader";
import { default as ProfileForm } from "../components/ProfileForm";
import { default as BudgetLimitsList } from "../components/BudgetLimitsList";
import { default as NotificationToggles } from "../components/NotificationToggles";
import { default as DeleteAccountButton } from "../components/DeleteAccountButton";
import { default as WelcomeHeading } from "../components/WelcomeHeading";
import { default as WelcomeSubheading } from "../components/WelcomeSubheading";
import { default as WelcomeIllustration } from "../components/WelcomeIllustration";
import { default as FeatureRow } from "../components/FeatureRow";
import { default as GetStartedButton } from "../components/GetStartedButton";
import { default as ProgressBar } from "../components/ProgressBar";
import { default as FormHeading } from "../components/FormHeading";
import { default as IncomeInput } from "../components/IncomeInput";
import { default as CategoryBudgetForm } from "../components/CategoryBudgetForm";
import { default as NavigationButtons } from "../components/NavigationButtons";
import { default as GoalNameInput } from "../components/GoalNameInput";
import { default as GoalTargetInput } from "../components/GoalTargetInput";
import { default as GoalDeadlineInput } from "../components/GoalDeadlineInput";
import { default as GoalPreview } from "../components/GoalPreview";
import { default as Logo } from "../components/Logo";
import { default as NavLinks } from "../components/NavLinks";
import { default as UserMenu } from "../components/UserMenu";

type AnyComponent = React.ComponentType<any>;

type Variant = {
  label: string;
  props?: Record<string, unknown>;
};

type CatalogDefinition = {
  name: string;
  kind: string;
  description: string;
  component: AnyComponent;
  variants?: Variant[];
};

const states = ["default", "hover", "focus", "disabled", "loading"];

const simple = (label = "Default", props: Record<string, unknown> = {}): Variant[] => [
  { label, props },
];

const combinations = (
  first: [string, Record<string, unknown>][],
  second: [string, Record<string, unknown>][]
): Variant[] =>
  first.flatMap(([firstLabel, firstProps]) =>
    second.map(([secondLabel, secondProps]) => ({
      label: `${firstLabel} / ${secondLabel}`,
      props: { ...firstProps, ...secondProps },
    }))
  );

const definitions: CatalogDefinition[] = [
  {
    name: "PageHeader",
    kind: "Molecule",
    description: "Month navigation, current month context, and the user menu trigger.",
    component: PageHeader,
    variants: [
      { label: "Compact", props: { layout: "compact" } },
      { label: "Expanded", props: { layout: "expanded" } },
    ],
  },
  {
    name: "StreakBand",
    kind: "Molecule",
    description: "Current streak count, remaining days, and the next reward unlock.",
    component: StreakBand,
    variants: [
      { label: "Active", props: { status: "active" } },
      { label: "At risk", props: { status: "at-risk" } },
      { label: "Broken", props: { status: "broken" } },
    ],
  },
  {
    name: "BalanceSummary",
    kind: "Molecule",
    description: "Summarizes available balance, monthly spend, and remaining funds.",
    component: BalanceSummary,
  },
  {
    name: "SpendingChart",
    kind: "Organism",
    description: "Visualizes category spending with bar and donut chart treatments.",
    component: SpendingChart,
    variants: combinations(
      [
        ["Bar", { chartType: "bar" }],
        ["Donut", { chartType: "donut" }],
      ],
      [
        ["Horizontal", { layout: "horizontal" }],
        ["Vertical", { layout: "vertical" }],
      ]
    ),
  },
  {
    name: "CategoryList",
    kind: "Organism",
    description: "Sortable spending categories with limits and progress indicators.",
    component: CategoryList,
    variants: combinations(
      [
        ["Name", { sortBy: "name" }],
        ["Spent", { sortBy: "spent" }],
        ["Remaining", { sortBy: "remaining" }],
      ],
      [
        ["Ascending", { sortOrder: "asc" }],
        ["Descending", { sortOrder: "desc" }],
      ]
    ),
  },
  {
    name: "GoalsPreview",
    kind: "Organism",
    description: "Compact preview of active savings goals and their progress.",
    component: GoalsPreview,
  },
  {
    name: "ViewAllGoalsLink",
    kind: "Primitive",
    description: "Text link to the complete goals view.",
    component: ViewAllGoalsLink,
  },
  {
    name: "TransactionTable",
    kind: "Organism",
    description: "Recent transaction table with category, amount, and quick-edit actions.",
    component: TransactionTable,
  },
  {
    name: "ViewAllTransactionsLink",
    kind: "Primitive",
    description: "Text link to transaction history.",
    component: ViewAllTransactionsLink,
  },
  {
    name: "GoalCard",
    kind: "Molecule",
    description: "Goal details, progress, deadline, and management actions.",
    component: GoalCard,
    variants: [
      { label: "Active", props: { status: "active" } },
      { label: "Completed", props: { status: "completed" } },
      { label: "Paused", props: { status: "paused" } },
    ],
  },
  {
    name: "AchievementBand",
    kind: "Molecule",
    description: "Completed Goals section heading with a count badge.",
    component: AchievementBand,
  },
  {
    name: "CompletedGoalsList",
    kind: "Organism",
    description: "Completed goals with dates, final amounts, and celebration badges.",
    component: CompletedGoalsList,
  },
  {
    name: "DateRangeFilter",
    kind: "Molecule",
    description: "Start and end date controls for transaction filtering.",
    component: DateRangeFilter,
  },
  {
    name: "CategoryFilter",
    kind: "Molecule",
    description: "Category filtering presented as a dropdown or checkbox group.",
    component: CategoryFilter,
    variants: [
      { label: "Dropdown", props: { displayMode: "dropdown" } },
      { label: "Checkboxes", props: { displayMode: "checkboxes" } },
    ],
  },
  {
    name: "AmountRangeFilter",
    kind: "Molecule",
    description: "Minimum and maximum amount fields for transaction filtering.",
    component: AmountRangeFilter,
  },
  {
    name: "ResetFiltersButton",
    kind: "Primitive",
    description: "Clears all active transaction filters.",
    component: ResetFiltersButton,
  },
  {
    name: "Pagination",
    kind: "Molecule",
    description: "Page navigation with current page, total count, and previous/next controls.",
    component: Pagination,
  },
  {
    name: "SectionHeader",
    kind: "Atom",
    description: "A section label for profile and settings surfaces.",
    component: SectionHeader,
  },
  {
    name: "ProfileForm",
    kind: "Organism",
    description: "Profile editing form with identity fields, avatar upload, and save action.",
    component: ProfileForm,
  },
  {
    name: "BudgetLimitsList",
    kind: "Organism",
    description: "Editable category budget limits with save controls.",
    component: BudgetLimitsList,
  },
  {
    name: "NotificationToggles",
    kind: "Organism",
    description: "Notification preferences for budgets, goals, streaks, and summaries.",
    component: NotificationToggles,
  },
  {
    name: "DeleteAccountButton",
    kind: "Primitive",
    description: "Destructive account deletion action with confirmation behavior.",
    component: DeleteAccountButton,
    variants: [
      { label: "Medium", props: { size: "md" } },
      { label: "Large", props: { size: "lg" } },
    ],
  },
  {
    name: "WelcomeHeading",
    kind: "Atom",
    description: "Large welcome heading with the Wavelength teal accent.",
    component: WelcomeHeading,
  },
  {
    name: "WelcomeSubheading",
    kind: "Atom",
    description: "Playful supporting copy that introduces the budgeting experience.",
    component: WelcomeSubheading,
  },
  {
    name: "WelcomeIllustration",
    kind: "Atom",
    description: "Geometric illustration representing money and budgeting.",
    component: WelcomeIllustration,
  },
  {
    name: "FeatureRow",
    kind: "Molecule",
    description: "Three onboarding highlights: spending, goals, and streaks.",
    component: FeatureRow,
  },
  {
    name: "GetStartedButton",
    kind: "Primitive",
    description: "Primary action for proceeding to the next onboarding step.",
    component: GetStartedButton,
    variants: [
      { label: "Medium", props: { size: "md" } },
      { label: "Large", props: { size: "lg" } },
    ],
  },
  {
    name: "ProgressBar",
    kind: "Molecule",
    description: "Onboarding progress indicator showing step two of three.",
    component: ProgressBar,
  },
  {
    name: "FormHeading",
    kind: "Atom",
    description: "Heading introducing the monthly income step.",
    component: FormHeading,
  },
  {
    name: "IncomeInput",
    kind: "Primitive",
    description: "Currency field for entering monthly income.",
    component: IncomeInput,
  },
  {
    name: "CategoryBudgetForm",
    kind: "Organism",
    description: "Category budget inputs with suggested allocation percentages.",
    component: CategoryBudgetForm,
  },
  {
    name: "NavigationButtons",
    kind: "Molecule",
    description: "Back and Continue actions for onboarding forms.",
    component: NavigationButtons,
  },
  {
    name: "GoalNameInput",
    kind: "Primitive",
    description: "Text field for naming a savings goal.",
    component: GoalNameInput,
  },
  {
    name: "GoalTargetInput",
    kind: "Primitive",
    description: "Currency field for a goal target amount.",
    component: GoalTargetInput,
  },
  {
    name: "GoalDeadlineInput",
    kind: "Primitive",
    description: "Date field for a goal deadline.",
    component: GoalDeadlineInput,
  },
  {
    name: "GoalPreview",
    kind: "Molecule",
    description: "Live preview of the goal card as details are entered.",
    component: GoalPreview,
  },
  {
    name: "Logo",
    kind: "Atom",
    description: "Wavelength logo and wordmark in the teal accent color.",
    component: Logo,
    variants: combinations(
      [
        ["Small", { size: "sm" }],
        ["Medium", { size: "md" }],
        ["Large", { size: "lg" }],
      ],
      [
        ["Full", { variant: "full" }],
        ["Icon", { variant: "icon" }],
      ]
    ),
  },
  {
    name: "NavLinks",
    kind: "Molecule",
    description: "Primary navigation links with an active state indicator.",
    component: NavLinks,
  },
  {
    name: "UserMenu",
    kind: "Molecule",
    description: "User identity trigger with account and logout menu actions.",
    component: UserMenu,
  },
];

function DemoBlock({
  component: Component,
  variant,
  state,
}: {
  component: AnyComponent;
  variant: Variant;
  state: string;
}) {
  const stateProps =
    state === "disabled"
      ? { disabled: true }
      : state === "loading"
        ? { loading: true }
        : {};

  return (
    <div className="demo" data-state={state}>
      <div className="demoLabel">
        <span>{variant.label}</span>
        <span className="stateLabel">{state}</span>
      </div>
      <div className="demoSurface">
        {React.createElement(Component, {
          ...(variant.props ?? {}),
          ...stateProps,
        })}
      </div>
    </div>
  );
}

function CatalogSection({ definition }: { definition: CatalogDefinition }) {
  const variants = definition.variants ?? simple();

  return (
    <section className="catalogSection">
      <div className="sectionIntro">
        <div>
          <span className="kind">{definition.kind}</span>
          <h2>{definition.name}</h2>
        </div>
        <p>{definition.description}</p>
      </div>

      <div className="variantList">
        {variants.map((variant) => (
          <div className="variantGroup" key={variant.label}>
            <h3>{variant.label}</h3>
            <div className="stateGrid">
              {states.map((state) => (
                <DemoBlock
                  key={`${variant.label}-${state}`}
                  component={definition.component}
                  variant={variant}
                  state={state}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function CatalogPage() {
  return (
    <>
      <main className="catalog">
        <header className="catalogHeader">
          <span className="eyebrow">Wavelength Design System</span>
          <h1>Component Catalog</h1>
          <p>
            A living visual reference for components, variants, interaction states, and
            composition patterns.
          </p>
        </header>

        {definitions.map((definition) => (
          <CatalogSection key={definition.name} definition={definition} />
        ))}
      </main>

      <style jsx global>{`
        :root {
          background: var(--color-surface-background);
          color: var(--color-text-primary);
          font-family: var(--font-body);
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: var(--space-0);
          background: var(--color-surface-background);
        }

        .catalog {
          width: 100%;
          padding: var(--space-12) var(--space-6);
        }

        .catalogHeader {
          width: 100%;
          padding: var(--space-12) var(--space-8);
          margin-bottom: var(--space-12);
          background: var(--color-surface-raised);
          border: var(--space-1) solid var(--color-border-subtle);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-lg);
        }

        .eyebrow,
        .kind {
          display: block;
          color: var(--color-accent-600);
          font-size: var(--text-xs);
          font-weight: var(--weight-bold);
          text-transform: uppercase;
        }

        .catalogHeader h1 {
          margin: var(--space-2) var(--space-0);
          color: var(--color-text-primary);
          font-family: var(--font-display);
          font-size: var(--text-5xl);
          font-weight: var(--weight-bold);
        }

        .catalogHeader p,
        .sectionIntro p {
          margin: var(--space-0);
          color: var(--color-text-secondary);
          font-size: var(--text-lg);
        }

        .catalogSection {
          padding: var(--space-8) var(--space-0);
          border-top: var(--space-1) solid var(--color-border-default);
        }

        .sectionIntro {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: var(--space-8);
          align-items: end;
          margin-bottom: var(--space-6);
        }

        .sectionIntro h2 {
          margin: var(--space-2) var(--space-0) var(--space-0);
          font-family: var(--font-display);
          font-size: var(--text-3xl);
          font-weight: var(--weight-bold);
        }

        .sectionIntro p {
          max-width: var(--space-24);
          font-size: var(--text-base);
        }

        .variantGroup {
          margin-top: var(--space-8);
        }

        .variantGroup h3 {
          margin: var(--space-0) var(--space-0) var(--space-3);
          color: var(--color-text-secondary);
          font-family: var(--font-display);
          font-size: var(--text-xl);
          font-weight: var(--weight-semibold);
        }

        .stateGrid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: var(--space-3);
        }

        .demo {
          min-width: var(--space-0);
          overflow: hidden;
          background: var(--color-surface-overlay);
          border: var(--space-1) solid var(--color-border-subtle);
          border-radius: var(--radius-md);
        }

        .demoLabel {
          display: flex;
          justify-content: space-between;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-3);
          color: var(--color-text-secondary);
          background: var(--color-neutral-100);
          font-family: var(--font-mono);
          font-size: var(--text-xs);
          font-weight: var(--weight-semibold);
        }

        .stateLabel {
          color: var(--color-text-muted);
        }

        .demoSurface {
          display: flex;
          min-height: var(--control-lg);
          align-items: center;
          justify-content: center;
          padding: var(--space-4);
          background: var(--color-surface-raised);
        }

        .demo[data-state="hover"] .demoSurface {
          background: var(--color-accent-50);
        }

        .demo[data-state="focus"] .demoSurface {
          outline: var(--space-1) solid var(--color-border-focus);
          outline-offset: calc(var(--space-1) * -1);
        }

        .demo[data-state="disabled"] .demoSurface {
          opacity: var(--weight-regular);
          background: var(--color-neutral-100);
        }

        .demo[data-state="loading"] .demoSurface {
          background: var(--color-info-50);
        }

        @media (max-width: 1000px) {
          .stateGrid {
            grid-template-columns: repeat(3, 1fr);
          }

          .sectionIntro {
            grid-template-columns: 1fr;
            gap: var(--space-3);
          }
        }

        @media (max-width: 640px) {
          .catalog {
            padding: var(--space-6) var(--space-3);
          }

          .catalogHeader {
            padding: var(--space-6) var(--space-4);
          }

          .catalogHeader h1 {
            font-size: var(--text-4xl);
          }

          .stateGrid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}