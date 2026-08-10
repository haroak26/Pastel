import React from "react";
import { default as AppHeader } from "../components/AppHeader";
import { default as MainNavigation } from "../components/MainNavigation";
import { default as StreakBanner } from "../components/StreakBanner";
import { default as MonthlyBudgetCard } from "../components/MonthlyBudgetCard";
import { default as SpendingBreakdownChart } from "../components/SpendingBreakdownChart";
import { default as ActiveGoalsList } from "../components/ActiveGoalsList";
import { default as RecentTransactionsFeed } from "../components/RecentTransactionsFeed";
import { default as PageHeader } from "../components/PageHeader";
import { default as GoalsFilterBar } from "../components/GoalsFilterBar";
import { default as GoalsTable } from "../components/GoalsTable";
import { default as GoalDetailModal } from "../components/GoalDetailModal";
import { default as TransactionSearchBar } from "../components/TransactionSearchBar";
import { default as TransactionFilterPanel } from "../components/TransactionFilterPanel";
import { default as TransactionsList } from "../components/TransactionsList";
import { default as TransactionDetailModal } from "../components/TransactionDetailModal";
import { default as SettingsNavigation } from "../components/SettingsNavigation";
import { default as ProfileSection } from "../components/ProfileSection";
import { default as BudgetSettingsSection } from "../components/BudgetSettingsSection";
import { default as NotificationSettingsSection } from "../components/NotificationSettingsSection";
import { default as ConnectedAccountsSection } from "../components/ConnectedAccountsSection";
import { default as PrivacySection } from "../components/PrivacySection";
import { default as DangerZoneSection } from "../components/DangerZoneSection";
import { default as WelcomeHero } from "../components/WelcomeHero";
import { default as OnboardingHeader } from "../components/OnboardingHeader";
import { default as BudgetInputForm } from "../components/BudgetInputForm";
import { default as GoalCreationForm } from "../components/GoalCreationForm";
import { default as CompletionHero } from "../components/CompletionHero";
import { default as GlobalSidebar } from "../components/GlobalSidebar";
import { default as GlobalTopbar } from "../components/GlobalTopbar";

type ComponentType = React.ComponentType<any>;

const states = ["default", "hover", "focus", "disabled", "loading"];

const componentProps = (value: string) => {
  const [key, variant] = value.split("=");
  return { [key]: variant };
};

const combinations = (...groups: string[][]) =>
  groups.reduce<string[][]>(
    (result, group) =>
      result.flatMap((current) =>
        group.map((value) => [...current, value])
      ),
    [[]]
  );

function DemoBlock({
  label,
  Component,
  props = {},
}: {
  label: string;
  Component: ComponentType;
  props?: Record<string, unknown>;
}) {
  return (
    <div className="demoBlock">
      <div className="demoLabel">{label}</div>
      <div className="demoStates">
        {states.map((state) => (
          <div className={`state state-${state}`} key={state}>
            <span className="stateLabel">{state}</span>
            <div className="componentPreview">
              <Component {...props} state={state} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Section({
  name,
  description,
  children,
}: {
  name: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="catalogSection">
      <div className="sectionIntro">
        <p className="eyebrow">Component</p>
        <h2>{name}</h2>
        <p>{description}</p>
      </div>
      <div className="variantGrid">{children}</div>
    </section>
  );
}

function VariantDemos({
  Component,
  variants,
}: {
  Component: ComponentType;
  variants: string[];
}) {
  return (
    <>
      {variants.map((variant) => (
        <DemoBlock
          key={variant}
          label={variant}
          Component={Component}
          props={componentProps(variant)}
        />
      ))}
    </>
  );
}

function CombinationDemos({
  Component,
  groups,
}: {
  Component: ComponentType;
  groups: string[][];
}) {
  return (
    <>
      {combinations(...groups).map((variantSet) => {
        const label = variantSet.join(" / ");
        const props = variantSet.reduce(
          (result, value) => ({ ...result, ...componentProps(value) }),
          {}
        );

        return (
          <DemoBlock
            key={label}
            label={label}
            Component={Component}
            props={props}
          />
        );
      })}
    </>
  );
}

export default function CatalogPage() {
  return (
    <main className="catalog">
      <header className="catalogHeader">
        <p className="eyebrow">Wavelength Design System</p>
        <h1>Component Catalog</h1>
        <p>
          A living visual reference for product, design, and engineering teams.
          Each variant is shown across default, hover, focus, disabled, and
          loading states.
        </p>
      </header>

      <Section
        name="AppHeader"
        description="Application header with branding, account controls, and notifications."
      >
        <CombinationDemos
          Component={AppHeader}
          groups={[["layout=desktop", "layout=mobile"]]}
        />
      </Section>

      <Section
        name="MainNavigation"
        description="Primary navigation with active page indication and responsive layouts."
      >
        <CombinationDemos
          Component={MainNavigation}
          groups={[
            ["layout=sidebar", "layout=topbar"],
            ["orientation=vertical", "orientation=horizontal"],
          ]}
        />
      </Section>

      <Section
        name="StreakBanner"
        description="Prominent spending streak display with milestone messaging."
      >
        <CombinationDemos
          Component={StreakBanner}
          groups={[
            ["size=sm", "size=md", "size=lg"],
            ["emphasis=default", "emphasis=milestone"],
          ]}
        />
      </Section>

      <Section
        name="MonthlyBudgetCard"
        description="Budget summary with spending, remaining balance, and progress ring."
      >
        <CombinationDemos
          Component={MonthlyBudgetCard}
          groups={[
            ["size=sm", "size=md"],
            ["displayMode=compact", "displayMode=expanded"],
          ]}
        />
      </Section>

      <Section
        name="SpendingBreakdownChart"
        description="Category spending visualization using horizontal bars or a donut chart."
      >
        <CombinationDemos
          Component={SpendingBreakdownChart}
          groups={[
            ["chartType=horizontal-bar", "chartType=donut"],
            ["size=sm", "size=md", "size=lg"],
          ]}
        />
      </Section>

      <Section
        name="ActiveGoalsList"
        description="Sortable list of active savings goals with progress and deadlines."
      >
        <CombinationDemos
          Component={ActiveGoalsList}
          groups={[
            ["sortBy=progress", "sortBy=deadline", "sortBy=name"],
            ["sortOrder=asc", "sortOrder=desc"],
          ]}
        />
      </Section>

      <Section
        name="RecentTransactionsFeed"
        description="Recent transaction activity with merchant, category, amount, and running balance."
      >
        <DemoBlock label="default feed" Component={RecentTransactionsFeed} />
      </Section>

      <Section
        name="PageHeader"
        description="Page title and primary create action."
      >
        <VariantDemos
          Component={PageHeader}
          variants={["size=sm", "size=md", "size=lg"]}
        />
      </Section>

      <Section
        name="GoalsFilterBar"
        description="Goal status filters with counts for each state."
      >
        <VariantDemos
          Component={GoalsFilterBar}
          variants={["layout=tabs", "layout=buttons"]}
        />
      </Section>

      <Section
        name="GoalsTable"
        description="Detailed goals table with progress, deadlines, sorting, and row actions."
      >
        <CombinationDemos
          Component={GoalsTable}
          groups={[
            ["density=compact", "density=comfortable"],
            ["sortBy=name", "sortBy=progress", "sortBy=deadline"],
          ]}
        />
      </Section>

      <Section
        name="GoalDetailModal"
        description="Overlay for viewing and editing savings goal details."
      >
        <DemoBlock label="default modal" Component={GoalDetailModal} />
      </Section>

      <Section
        name="TransactionSearchBar"
        description="Search control for merchants and transaction descriptions."
      >
        <DemoBlock label="default search" Component={TransactionSearchBar} />
      </Section>

      <Section
        name="TransactionFilterPanel"
        description="Transaction filters for dates, categories, amounts, and transaction type."
      >
        <DemoBlock label="default filter panel" Component={TransactionFilterPanel} />
      </Section>

      <Section
        name="TransactionsList"
        description="Date-grouped transaction history with amounts and row actions."
      >
        <DemoBlock label="default transaction list" Component={TransactionsList} />
      </Section>

      <Section
        name="TransactionDetailModal"
        description="Overlay for viewing and editing transaction information."
      >
        <DemoBlock
          label="default transaction modal"
          Component={TransactionDetailModal}
        />
      </Section>

      <Section
        name="SettingsNavigation"
        description="Secondary settings navigation for account and preference areas."
      >
        <VariantDemos
          Component={SettingsNavigation}
          variants={["layout=vertical", "layout=horizontal"]}
        />
      </Section>

      <Section
        name="ProfileSection"
        description="Profile identity and editable contact information."
      >
        <DemoBlock label="default profile section" Component={ProfileSection} />
      </Section>

      <Section
        name="BudgetSettingsSection"
        description="Monthly budget, currency, and reset day settings."
      >
        <DemoBlock
          label="default budget settings"
          Component={BudgetSettingsSection}
        />
      </Section>

      <Section
        name="NotificationSettingsSection"
        description="Notification preferences for alerts, milestones, reminders, and summaries."
      >
        <DemoBlock
          label="default notification settings"
          Component={NotificationSettingsSection}
        />
      </Section>

      <Section
        name="ConnectedAccountsSection"
        description="Connected financial accounts with disconnect and add account actions."
      >
        <DemoBlock
          label="default connected accounts"
          Component={ConnectedAccountsSection}
        />
      </Section>

      <Section
        name="PrivacySection"
        description="Privacy resources, legal links, and data export controls."
      >
        <DemoBlock label="default privacy section" Component={PrivacySection} />
      </Section>

      <Section
        name="DangerZoneSection"
        description="Destructive account actions with confirmation protection."
      >
        <DemoBlock
          label="default danger zone"
          Component={DangerZoneSection}
        />
      </Section>

      <Section
        name="WelcomeHero"
        description="Onboarding introduction with Wavelength branding and a getting started action."
      >
        <DemoBlock label="default welcome hero" Component={WelcomeHero} />
      </Section>

      <Section
        name="OnboardingHeader"
        description="Onboarding progress indicator with step-specific heading and supporting copy."
      >
        <DemoBlock label="step 1 of 3" Component={OnboardingHeader} />
      </Section>

      <Section
        name="BudgetInputForm"
        description="First onboarding form for choosing currency and monthly budget."
      >
        <DemoBlock label="default budget input" Component={BudgetInputForm} />
      </Section>

      <Section
        name="GoalCreationForm"
        description="Onboarding form for creating a savings goal."
      >
        <DemoBlock label="default goal creation" Component={GoalCreationForm} />
      </Section>

      <Section
        name="CompletionHero"
        description="Onboarding completion celebration and dashboard continuation action."
      >
        <DemoBlock label="default completion hero" Component={CompletionHero} />
      </Section>

      <Section
        name="GlobalSidebar"
        description="Fixed application sidebar with navigation and user profile area."
      >
        <CombinationDemos
          Component={GlobalSidebar}
          groups={[
            ["state=expanded", "state=collapsed"],
            ["layout=desktop", "layout=mobile"],
          ]}
        />
      </Section>

      <Section
        name="GlobalTopbar"
        description="Fixed application top navigation with branding, notifications, and user controls."
      >
        <DemoBlock label="default topbar" Component={GlobalTopbar} />
      </Section>

      <style jsx>{`
        .catalog {
          min-height: 100vh;
          padding: var(--space-12) var(--space-8);
          background: var(--color-surface-background);
          color: var(--color-text-primary);
          font-family: var(--font-body);
        }

        .catalogHeader,
        .catalogSection {
          width: 100%;
          max-width: var(--space-24);
          margin: 0 auto;
        }

        .catalogHeader {
          padding: var(--space-12) var(--space-8);
          background: var(--color-surface-raised);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-lg);
        }

        .catalogHeader h1 {
          margin: var(--space-2) 0 var(--space-4);
          font-family: var(--font-display);
          font-size: var(--text-5xl);
          line-height: var(--text-5xl);
          font-weight: var(--weight-bold);
        }

        .catalogHeader > p:last-child {
          max-width: var(--space-24);
          color: var(--color-text-secondary);
          font-size: var(--text-lg);
          line-height: var(--text-lg);
        }

        .catalogSection {
          margin-top: var(--space-16);
        }

        .sectionIntro {
          margin-bottom: var(--space-8);
        }

        .sectionIntro h2 {
          margin: var(--space-2) 0;
          font-family: var(--font-display);
          font-size: var(--text-3xl);
          line-height: var(--text-3xl);
          font-weight: var(--weight-semibold);
        }

        .sectionIntro p:last-child {
          max-width: var(--space-24);
          margin: 0;
          color: var(--color-text-secondary);
          font-size: var(--text-base);
          line-height: var(--text-base);
        }

        .eyebrow {
          margin: 0;
          color: var(--color-accent-500);
          font-family: var(--font-mono);
          font-size: var(--text-xs);
          line-height: var(--text-xs);
          font-weight: var(--weight-semibold);
          letter-spacing: var(--space-1);
          text-transform: uppercase;
        }

        .variantGrid {
          display: grid;
          gap: var(--space-6);
        }

        .demoBlock {
          overflow: hidden;
          background: var(--color-surface-raised);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
        }

        .demoLabel {
          padding: var(--space-3) var(--space-4);
          background: var(--color-accent-900);
          color: var(--color-text-inverse);
          font-family: var(--font-mono);
          font-size: var(--text-sm);
          line-height: var(--text-sm);
          font-weight: var(--weight-semibold);
        }

        .demoStates {
          display: grid;
          gap: var(--space-4);
          padding: var(--space-4);
        }

        .state {
          display: grid;
          gap: var(--space-2);
          min-width: 0;
          padding: var(--space-3);
          background: var(--color-neutral-50);
          border-radius: var(--radius-md);
          border-left: var(--space-1) solid var(--color-border-default);
        }

        .state-hover {
          border-left-color: var(--color-accent-500);
          background: var(--color-accent-50);
        }

        .state-focus {
          border-left-color: var(--color-border-focus);
          box-shadow: var(--shadow-sm);
        }

        .state-disabled {
          opacity: var(--weight-regular);
          background: var(--color-neutral-100);
        }

        .state-loading {
          border-left-color: var(--color-info-500);
          background: var(--color-info-50);
        }

        .stateLabel {
          color: var(--color-text-muted);
          font-family: var(--font-mono);
          font-size: var(--text-xs);
          line-height: var(--text-xs);
          text-transform: uppercase;
        }

        .componentPreview {
          min-width: 0;
          padding: var(--space-4);
          background: var(--color-surface-raised);
          border-radius: var(--radius-md);
        }

        @media (min-width: var(--control-lg)) {
          .demoStates {
            grid-template-columns: repeat(5, 1fr);
          }
        }

        @media (max-width: var(--control-lg)) {
          .catalog {
            padding: var(--space-4);
          }

          .catalogHeader {
            padding: var(--space-6);
          }

          .catalogHeader h1 {
            font-size: var(--text-3xl);
            line-height: var(--text-3xl);
          }
        }
      `}</style>
    </main>
  );
}