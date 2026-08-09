import React from "react";

export function OnboardingStart() {
  return (
    <main className="flex min-h-screen items-start justify-center px-[var(--space-6)] py-[var(--space-8)]">
      <section className="flex w-full max-w-2xl flex-col gap-[var(--space-8)]">
        <ProgressIndicator currentStep={1} totalSteps={4} />

        <div className="flex flex-col gap-[var(--space-8)]">
          <WelcomeHeading
            eyebrow="Step 1 of 4"
            title="Let’s make this personal"
            description="A few quick details help us shape Wavelength around your goals and your real life."
          />

          <div className="flex flex-col gap-[var(--space-6)]">
            <NameInput
              label="What should we call you?"
              placeholder="Your first name"
              required
            />

            <AgeRangeSelect
              label="Which age range are you in?"
              placeholder="Choose an age range"
              options={[
                { label: "Under 18", value: "under-18" },
                { label: "18–24", value: "18-24" },
                { label: "25–34", value: "25-34" },
                { label: "35–44", value: "35-44" },
                { label: "45 or older", value: "45-plus" },
              ]}
            />

            <div className="flex flex-col gap-[var(--space-3)]">
              <div className="flex flex-col gap-[var(--space-1)]">
                <h2>What are you working toward?</h2>
                <p>Choose as many as you like. You can change these anytime.</p>
              </div>
              <FinancialGoalCheckboxes
                goals={[
                  { label: "Build my savings", value: "save" },
                  { label: "Spend less day to day", value: "spend-less" },
                  { label: "Pay off debt", value: "debt" },
                  { label: "Start investing", value: "invest" },
                  { label: "Understand my money", value: "understand" },
                ]}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <NextButton type="button">
              Continue
              <ArrowRight aria-hidden="true" />
            </NextButton>
          </div>
        </div>
      </section>
    </main>
  );
}

export default WavelengthLanding;