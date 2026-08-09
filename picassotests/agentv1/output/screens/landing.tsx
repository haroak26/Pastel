import React from "react";

export function WavelengthLanding() {
  return (
    <main className="flex min-h-screen flex-col gap-[var(--space-24)] px-[var(--space-6)] py-[var(--space-8)]">
      <section className="mx-auto grid w-full max-w-6xl grid-cols-12 items-center gap-[var(--space-8)]">
        <div className="col-span-12 flex flex-col items-start gap-[var(--space-6)] lg:col-span-6">
          <HeroHeadline>
            Make your money moves feel like a game.
          </HeroHeadline>
          <HeroSubheadline>
            Wavelength turns everyday budgeting into a friendly challenge. Track
            your spending, build better habits, and celebrate every small win.
          </HeroSubheadline>
          <CTAButton href="/signup">
            Start your money journey
            <ArrowRight aria-hidden="true" />
          </CTAButton>
        </div>

        <div className="col-span-12 lg:col-span-6">
          <HeroIllustration>
            <div className="flex flex-col gap-[var(--space-6)] p-[var(--space-8)]">
              <div className="flex items-center justify-between">
                <span>Weekly money energy</span>
                <Sparkles aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-[var(--space-3)]">
                <span>Spending streak</span>
                <strong>6 days in a row</strong>
              </div>
              <div className="flex items-center gap-[var(--space-3)]">
                <Check aria-hidden="true" />
                <span>Takeout-free Tuesday unlocked</span>
              </div>
            </div>
          </HeroIllustration>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-6xl flex-col gap-[var(--space-8)]">
        <div className="flex flex-col gap-[var(--space-2)]">
          <h2>Money management, but make it fun</h2>
          <p>Everything you need to feel more in control without the finance-app intimidation.</p>
        </div>

        <FeatureGrid className="grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon={<Tags aria-hidden="true" />}
            title="Auto-sort your spending"
            description="Your purchases are categorized automatically, so you can see where your money goes at a glance."
          />
          <FeatureCard
            icon={<Trophy aria-hidden="true" />}
            title="Turn goals into challenges"
            description="Pick a goal, keep your streak alive, and collect wins that make progress feel motivating."
          />
          <FeatureCard
            icon={<Landmark aria-hidden="true" />}
            title="Connect your accounts"
            description="Bring your bank accounts together for one clear, up-to-date view of your money."
          />
          <FeatureCard
            icon={<ShieldCheck aria-hidden="true" />}
            title="Feel confident and secure"
            description="Get helpful insights while keeping your financial information protected."
          />
        </FeatureGrid>
      </section>

      <section className="mx-auto flex w-full max-w-6xl flex-col gap-[var(--space-8)]">
        <div className="flex flex-col gap-[var(--space-2)]">
          <h2>Small wins, big energy</h2>
          <p>Real people are making money feel a little less overwhelming with Wavelength.</p>
        </div>

        <TestimonialCarousel>
          <TestimonialCard
            quote="I finally know where my money is going, and the challenges make saving feel weirdly satisfying."
            name="Maya R."
            role="Student, Chicago"
          />
          <TestimonialCard
            quote="Wavelength is the first budgeting app that didn't make me feel guilty about buying coffee."
            name="Jordan K."
            role="Designer, Austin"
          />
          <TestimonialCard
            quote="The weekly check-ins are quick, clear, and actually helped me build a real emergency fund."
            name="Alex T."
            role="Developer, Brooklyn"
          />
        </TestimonialCarousel>
      </section>

      <footer className="mx-auto flex w-full max-w-6xl flex-col gap-[var(--space-6)] border-t border-[var(--color-border-subtle)] pt-[var(--space-8)]">
        <FooterLinks />
        <Copyright>© 2026 Wavelength, Inc. Make money feel possible.</Copyright>
      </footer>
    </main>
  );
}