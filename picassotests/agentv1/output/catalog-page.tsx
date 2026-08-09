import { default as HeroHeadline } from "../components/HeroHeadline";
import { default as HeroSubheadline } from "../components/HeroSubheadline";
import { default as HeroIllustration } from "../components/HeroIllustration";
import { default as CTAButton } from "../components/CTAButton";
import { default as FeatureGrid } from "../components/FeatureGrid";
import { default as FeatureCard } from "../components/FeatureCard";
import { default as TestimonialCarousel } from "../components/TestimonialCarousel";
import { default as TestimonialCard } from "../components/TestimonialCard";
import { default as FooterLinks } from "../components/FooterLinks";
import { default as Copyright } from "../components/Copyright";
import { default as ProgressIndicator } from "../components/ProgressIndicator";
import { default as WelcomeHeading } from "../components/WelcomeHeading";
import { default as NameInput } from "../components/NameInput";
import { default as AgeRangeSelect } from "../components/AgeRangeSelect";
import { default as FinancialGoalCheckboxes } from "../components/FinancialGoalCheckboxes";
import { default as NextButton } from "../components/NextButton";
import { default as Logo } from "../components/Logo";
import { default as NotificationBell } from "../components/NotificationBell";
import { default as UserMenu } from "../components/UserMenu";
import { default as DashboardTab } from "../components/DashboardTab";
import { default as TransactionsTab } from "../components/TransactionsTab";
import { default as ChallengesTab } from "../components/ChallengesTab";
import { default as InsightsTab } from "../components/InsightsTab";
import { default as ProfileTab } from "../components/ProfileTab";

type AnyComponent = any;

const stateProps: Record<string, Record<string, unknown>> = {
  default: {},
  hover: { "data-catalog-state": "hover" },
  focus: { "data-catalog-state": "focus" },
  disabled: { disabled: true },
  loading: { loading: true },
};

function DemoStates({
  Component,
  props = {},
  children,
}: {
  Component: AnyComponent;
  props?: Record<string, unknown>;
  children?: React.ReactNode;
}) {
  return (
    <div className="stateGrid">
      {Object.entries(stateProps).map(([state, modifiers]) => (
        <div className={`stateDemo state-${state}`} key={state}>
          <span className="stateLabel">{state}</span>
          <div className="stateCanvas">
            <Component {...props} {...modifiers}>
              {children}
            </Component>
          </div>
        </div>
      ))}
    </div>
  );
}

function Variant({
  name,
  children,
}: {
  name: string;
  children: React.ReactNode;
}) {
  return (
    <div className="variant">
      <div className="variantHeading">
        <span className="variantName">{name}</span>
      </div>
      {children}
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="componentSection">
      <div className="sectionIntro">
        <p className="eyebrow">Component</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <div className="variants">{children}</div>
    </section>
  );
}

export default function CatalogPage() {
  return (
    <>
      <main className="catalog">
        <header className="catalogHeader">
          <div>
            <p className="eyebrow">Wavelength design system</p>
            <h1>Component catalog</h1>
            <p className="catalogLead">
              A living reference for the budgeting experience, from first
              impression through authenticated product screens.
            </p>
          </div>
          <div className="catalogMeta">Visual inventory · All states</div>
        </header>

        <Section
          title="HeroHeadline"
          description="Bold, playful headline introducing the app's core value proposition."
        >
          <Variant name="default">
            <DemoStates Component={HeroHeadline} />
          </Variant>
        </Section>

        <Section
          title="HeroSubheadline"
          description="Supporting copy explaining the game-like budgeting experience."
        >
          <Variant name="default">
            <DemoStates Component={HeroSubheadline} />
          </Variant>
        </Section>

        <Section
          title="HeroIllustration"
          description="An engaging visual that showcases the personality of the app."
        >
          <Variant name="type=static">
            <DemoStates Component={HeroIllustration} props={{ type: "static" }} />
          </Variant>
          <Variant name="type=animated">
            <DemoStates
              Component={HeroIllustration}
              props={{ type: "animated" }}
            />
          </Variant>
        </Section>

        <Section
          title="CTAButton"
          description="Primary call-to-action button directing users to sign up."
        >
          {(["sm", "md", "lg"] as const).map((size) =>
            (["primary", "secondary"] as const).map((variant) => (
              <Variant key={`${size}-${variant}`} name={`size=${size} · variant=${variant}`}>
                <DemoStates
                  Component={CTAButton}
                  props={{ size, variant, children: "Start budgeting" }}
                />
              </Variant>
            )),
          )}
        </Section>

        <Section
          title="FeatureGrid"
          description="A responsive feature layout highlighting categorization, challenges, and bank integration."
        >
          <Variant name="columns=3 · layout=grid">
            <DemoStates
              Component={FeatureGrid}
              props={{
                columns: 3,
                layout: "grid",
                features: [
                  { title: "Auto-categorize", description: "Keep every purchase organized." },
                  { title: "Money challenges", description: "Make progress feel rewarding." },
                  { title: "Bank integration", description: "See your whole picture in one place." },
                ],
              }}
            />
          </Variant>
          <Variant name="columns=4 · layout=grid">
            <DemoStates
              Component={FeatureGrid}
              props={{
                columns: 4,
                layout: "grid",
                features: [
                  { title: "Auto-categorize", description: "Keep every purchase organized." },
                  { title: "Challenges", description: "Turn goals into small wins." },
                  { title: "Bank integration", description: "Connect your accounts securely." },
                  { title: "Insights", description: "Understand your spending patterns." },
                ],
              }}
            />
          </Variant>
        </Section>

        <Section
          title="FeatureCard"
          description="An individual feature card with icon, title, and brief description."
        >
          <Variant name="default">
            <DemoStates
              Component={FeatureCard}
              props={{
                icon: "✦",
                title: "Auto-categorization",
                description: "Your spending is sorted automatically, so you can focus on the next goal.",
              }}
            />
          </Variant>
        </Section>

        <Section
          title="TestimonialCarousel"
          description="Rotating testimonials from Gen Z users praising the app."
        >
          <Variant name="autoplay=true">
            <DemoStates
              Component={TestimonialCarousel}
              props={{ autoplay: true }}
            />
          </Variant>
          <Variant name="autoplay=false">
            <DemoStates
              Component={TestimonialCarousel}
              props={{ autoplay: false }}
            />
          </Variant>
        </Section>

        <Section
          title="TestimonialCard"
          description="A single testimonial with user avatar, quote, and name."
        >
          <Variant name="default">
            <DemoStates
              Component={TestimonialCard}
              props={{
                avatar: "🧑🏽",
                quote: "It makes budgeting feel less intimidating and way more doable.",
                name: "Maya R.",
              }}
            />
          </Variant>
        </Section>

        <Section
          title="FooterLinks"
          description="Navigation links for privacy, terms, and social media."
        >
          <Variant name="default">
            <DemoStates Component={FooterLinks} />
          </Variant>
        </Section>

        <Section
          title="Copyright"
          description="Copyright notice and company information."
        >
          <Variant name="default">
            <DemoStates Component={Copyright} />
          </Variant>
        </Section>

        <Section
          title="ProgressIndicator"
          description="A visual step indicator showing the user is on step 1 of onboarding."
        >
          {(["dots", "bars", "numbered"] as const).map((style) => (
            <Variant key={style} name={`style=${style}`}>
              <DemoStates
                Component={ProgressIndicator}
                props={{ style, currentStep: 1, totalSteps: 4 }}
              />
            </Variant>
          ))}
        </Section>

        <Section
          title="WelcomeHeading"
          description="A friendly greeting and onboarding title."
        >
          <Variant name="default">
            <DemoStates Component={WelcomeHeading} />
          </Variant>
        </Section>

        <Section title="NameInput" description="Text input for the user's first name.">
          <Variant name="default">
            <DemoStates
              Component={NameInput}
              props={{ label: "First name", placeholder: "Enter your first name" }}
            />
          </Variant>
        </Section>

        <Section
          title="AgeRangeSelect"
          description="A control for selecting an age range during onboarding."
        >
          <Variant name="type=dropdown">
            <DemoStates
              Component={AgeRangeSelect}
              props={{ type: "dropdown" }}
            />
          </Variant>
          <Variant name="type=radio">
            <DemoStates Component={AgeRangeSelect} props={{ type: "radio" }} />
          </Variant>
        </Section>

        <Section
          title="FinancialGoalCheckboxes"
          description="Checkboxes for selecting goals such as saving, spending less, and investing."
        >
          <Variant name="default">
            <DemoStates
              Component={FinancialGoalCheckboxes}
              props={{
                goals: ["Save more", "Spend less", "Invest", "Build an emergency fund"],
              }}
            />
          </Variant>
        </Section>

        <Section
          title="NextButton"
          description="Button used to proceed to the next onboarding step."
        >
          <Variant name="default">
            <DemoStates
              Component={NextButton}
              props={{ children: "Next step" }}
            />
          </Variant>
        </Section>

        <Section
          title="Logo"
          description="Wavelength logo and app name used across authenticated screens."
        >
          {(["sm", "md", "lg"] as const).map((size) =>
            (["full", "icon"] as const).map((variant) => (
              <Variant key={`${size}-${variant}`} name={`size=${size} · variant=${variant}`}>
                <DemoStates Component={Logo} props={{ size, variant }} />
              </Variant>
            )),
          )}
        </Section>

        <Section
          title="NotificationBell"
          description="Icon button with an unread notification count badge."
        >
          <Variant name="default">
            <DemoStates Component={NotificationBell} props={{ unreadCount: 3 }} />
          </Variant>
        </Section>

        <Section
          title="UserMenu"
          description="Account menu containing profile, settings, and logout options."
        >
          <Variant name="default">
            <DemoStates Component={UserMenu} />
          </Variant>
        </Section>

        <Section
          title="DashboardTab"
          description="Navigation tab for the dashboard."
        >
          <Variant name="default">
            <DemoStates Component={DashboardTab} />
          </Variant>
        </Section>

        <Section
          title="TransactionsTab"
          description="Navigation tab for transactions."
        >
          <Variant name="default">
            <DemoStates Component={TransactionsTab} />
          </Variant>
        </Section>

        <Section
          title="ChallengesTab"
          description="Navigation tab for challenges."
        >
          <Variant name="default">
            <DemoStates Component={ChallengesTab} />
          </Variant>
        </Section>

        <Section
          title="InsightsTab"
          description="Navigation tab for spending insights."
        >
          <Variant name="default">
            <DemoStates Component={InsightsTab} />
          </Variant>
        </Section>

        <Section
          title="ProfileTab"
          description="Navigation tab for the user's profile."
        >
          <Variant name="default">
            <DemoStates Component={ProfileTab} />
          </Variant>
        </Section>
      </main>

      <style jsx>{`
        .catalog {
          min-height: 100vh;
          padding: var(--space-12) var(--space-8);
          background: var(--color-surface-background);
          color: var(--color-text-primary);
          font-family: var(--font-body);
        }

        .catalogHeader {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: var(--space-8);
          max-width: 1200px;
          margin: 0 auto var(--space-16);
          padding-bottom: var(--space-8);
          border-bottom: var(--space-1) solid var(--color-border-default);
        }

        .catalogHeader h1 {
          margin: var(--space-2) 0 var(--space-4);
          font: var(--weight-bold) var(--text-5xl) var(--font-display);
          letter-spacing: -0.02em;
        }

        .catalogLead {
          max-width: 620px;
          margin: 0;
          color: var(--color-text-secondary);
          font: var(--text-lg) var(--font-body);
        }

        .catalogMeta {
          flex: 0 0 auto;
          padding: var(--space-3) var(--space-4);
          border: var(--space-1) solid var(--color-border-subtle);
          border-radius: var(--radius-full);
          background: var(--color-surface-raised);
          color: var(--color-text-muted);
          font: var(--weight-semibold) var(--text-sm) var(--font-body);
        }

        .eyebrow {
          margin: 0;
          color: var(--color-accent-600);
          font: var(--weight-bold) var(--text-xs) var(--font-body);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .componentSection {
          max-width: 1200px;
          margin: 0 auto var(--space-16);
        }

        .sectionIntro {
          max-width: 680px;
          margin-bottom: var(--space-6);
        }

        .sectionIntro h2 {
          margin: var(--space-2) 0 var(--space-2);
          font: var(--weight-bold) var(--text-3xl) var(--font-display);
        }

        .sectionIntro p:last-child {
          margin: 0;
          color: var(--color-text-secondary);
          font: var(--text-base) var(--font-body);
        }

        .variants {
          display: grid;
          gap: var(--space-6);
        }

        .variant {
          overflow: hidden;
          border: var(--space-1) solid var(--color-border-subtle);
          border-radius: var(--radius-lg);
          background: var(--color-surface-raised);
        }

        .variantHeading {
          padding: var(--space-3) var(--space-4);
          border-bottom: var(--space-1) solid var(--color-border-subtle);
          background: var(--color-neutral-100);
        }

        .variantName {
          color: var(--color-text-secondary);
          font: var(--weight-semibold) var(--text-sm) var(--font-mono);
        }

        .stateGrid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: var(--space-3);
          padding: var(--space-4);
        }

        .stateDemo {
          min-width: 0;
        }

        .stateLabel {
          display: block;
          margin-bottom: var(--space-2);
          color: var(--color-text-muted);
          font: var(--weight-semibold) var(--text-xs) var(--font-mono);
          text-transform: capitalize;
        }

        .stateCanvas {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: var(--control-lg);
          padding: var(--space-4);
          border: var(--space-1) solid var(--color-border-subtle);
          border-radius: var(--radius-md);
          background: var(--color-neutral-50);
        }

        .state-hover:hover,
        .state-hover:hover .stateCanvas {
          border-color: var(--color-border-focus);
        }

        .state-focus .stateCanvas:focus-within {
          outline: var(--space-1) solid var(--color-border-focus);
          outline-offset: var(--space-1);
        }

        @media (max-width: 900px) {
          .catalog {
            padding: var(--space-8) var(--space-4);
          }

          .catalogHeader {
            display: block;
            margin-bottom: var(--space-12);
          }

          .catalogMeta {
            display: inline-block;
            margin-top: var(--space-6);
          }

          .stateGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 520px) {
          .catalogHeader h1 {
            font: var(--weight-bold) var(--text-4xl) var(--font-display);
          }

          .stateGrid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}