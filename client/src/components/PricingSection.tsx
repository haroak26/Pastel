import React, { useState } from "react";
import { Link } from "wouter";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { PLAN_LIMITS, type PlanTier, type BillingPeriod } from "@shared/schema";

type CurrentPlan = PlanTier;
const PLAN_RANK: Record<CurrentPlan, number> = { free: 0, pro: 1, team: 2, enterprise: 3 };

const TIERS: { key: PlanTier; description: string; badge?: string }[] = [
  { key: "free", description: "For individuals getting started." },
  { key: "pro", description: "For professional designers.", badge: "Popular" },
  { key: "team", description: "For growing design teams." },
  { key: "enterprise", description: "For large organizations." },
];

const METERED_FEATURES: Record<string, { label: string; render: (val: unknown) => string | null }> = {
  projects: { label: "Projects", render: (v) => v === "unlimited" ? "Unlimited projects" : `${v} Projects` },
  designFiles: { label: "Design files", render: (v) => v === "unlimited" ? "Unlimited design files" : `${v} Design files` },
  editors: { label: "Editors", render: (v) => v === "unlimited" ? "Unlimited editors" : `${v} Editors` },
  viewers: { label: "Viewers", render: (v) => v === "unlimited" ? "Unlimited viewers" : `${v} Viewers` },
  storage: { label: "Storage", render: (v) => `${v} MB Storage` },
  versionHistory: { label: "Version history", render: (v) => `${v}-day history` },
  components: { label: "Components", render: (v) => `${v} Components` },
};

const BOOLEAN_FEATURES: Record<string, { label: string }> = {
  customFonts: { label: "Custom fonts" },
  exportPresets: { label: "Export presets" },
  advancedPrototyping: { label: "Advanced prototyping" },
  apiAccess: { label: "API access" },
  ssO: { label: "SSO" },
  prioritySupport: { label: "Priority support" },
};

const AI_FEATURE = {
  label: "AI credits",
  render: (monthly: number, daily: number) =>
    monthly === 0 ? null : `${monthly}/mo AI credits (${daily}/day)`,
};

export function PricingSection() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");
  const { data: user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: planInfo } = useQuery<{ plan: CurrentPlan; cancelAtPeriodEnd: boolean }>({
    queryKey: ["/api/me/plan"],
    enabled: !!user,
  });
  const currentPlan: CurrentPlan = planInfo?.plan ?? "free";

  const checkoutMutation = useMutation({
    mutationFn: async ({ plan, billingPeriod: bp }: { plan: PlanTier; billingPeriod: BillingPeriod }) => {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ plan, billingPeriod: bp }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed to create checkout session" }));
        throw new Error(err.message ?? "Failed to create checkout session");
      }
      return res.json() as Promise<{ url?: string; switched?: boolean; plan?: string }>;
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      if (data.switched) {
        toast({
          title: "Plan updated",
          description: `You're now on the ${data.plan ?? "new"} plan. Billing has been adjusted.`,
          variant: "success",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/me"] });
        queryClient.invalidateQueries({ queryKey: ["/api/me/plan"] });
      }
    },
    onError: (err) => {
      toast({
        title: "Subscription checkout unavailable",
        description: (err as Error).message,
        variant: "destructive",
      });
    },
  });

  function featuresForPlan(key: PlanTier): string[] {
    const limits = PLAN_LIMITS[key];
    const features: string[] = [];

    for (const [field, meta] of Object.entries(METERED_FEATURES)) {
      const val = limits[field as keyof typeof limits];
      const rendered = meta.render(val);
      if (rendered) features.push(rendered);
    }

    const aiRendered = AI_FEATURE.render(limits.aiCredits.monthly, limits.aiCredits.daily);
    if (aiRendered) features.push(aiRendered);

    return features;
  }

  function booleanFeaturesForPlan(key: PlanTier): string[] {
    const limits = PLAN_LIMITS[key];
    return Object.entries(BOOLEAN_FEATURES)
      .filter(([field]) => limits[field as keyof typeof limits])
      .map(([, meta]) => meta.label);
  }

  return (
    <section id="pricing" className="py-6 md:py-8">
      <div>
        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <span className={`text-sm font-medium ${billingPeriod === "monthly" ? "text-foreground" : "text-muted-foreground"}`}>Monthly</span>
          <button
            onClick={() => setBillingPeriod(p => p === "monthly" ? "annual" : "monthly")}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${billingPeriod === "annual" ? "bg-brand" : "bg-border"}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${billingPeriod === "annual" ? "translate-x-6" : "translate-x-1"}`} />
          </button>
          <span className={`text-sm font-medium ${billingPeriod === "annual" ? "text-foreground" : "text-muted-foreground"}`}>
            Annual <span className="text-emerald-600 font-semibold">Save ~15%</span>
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-stretch">
          {TIERS.map(({ key, description, badge }, idx) => {
            const limits = PLAN_LIMITS[key];
            const displayPrice = billingPeriod === "annual" ? limits.prices.annual / 12 : limits.prices.monthly;
            return (
              <React.Fragment key={key}>
                <div className="flex-1 flex flex-col py-6 md:px-7 lg:px-9 min-h-[500px]">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-medium tracking-[-0.01em]">{limits.label}</h3>
                      {badge && (
                        <span className="inline-flex items-center rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand">
                          {badge}
                        </span>
                      )}
                    </div>
                    <p className="text-sm leading-5 text-muted-foreground">{description}</p>
                  </div>
                  <div className="mt-5">
                    <div className="flex items-end gap-1.5">
                      {displayPrice === 0 ? (
                        <span className="text-4xl font-medium tracking-tight leading-none">Free</span>
                      ) : (
                        <>
                          <span className="text-[22px] font-medium text-foreground leading-none mb-0.5">$</span>
                          <span className="text-4xl font-medium tracking-tight leading-none">{displayPrice}</span>
                          <span className="mb-0.5 text-sm text-muted-foreground">/mo</span>
                        </>
                      )}
                    </div>
                    {billingPeriod === "annual" && displayPrice > 0 && (
                      <p className="text-xs text-emerald-600 font-medium mt-1">${limits.prices.annual} billed annually</p>
                    )}
                  </div>
                  <div className="mt-5 flex-1">
                    <p className="mb-3 text-sm font-semibold text-brand">What's included</p>
                    <ul className="space-y-2.5">
                      {featuresForPlan(key).map((feature) => (
                        <li key={feature} className="flex items-start gap-2.5 text-sm leading-6 text-muted-foreground">
                          <Check className="h-3.5 w-3.5 mt-[5px] shrink-0 text-brand" strokeWidth={2.5} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {booleanFeaturesForPlan(key).length > 0 && (
                    <>
                      <div className="my-4 border-t border-border/60" />
                      <ul className="space-y-2.5 mb-6">
                        {booleanFeaturesForPlan(key).map((feature) => (
                          <li key={feature} className="flex items-start gap-2.5 text-sm leading-6 text-muted-foreground">
                            <Check className="h-3.5 w-3.5 mt-[5px] shrink-0 text-brand" strokeWidth={2.5} />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  <div className="mt-auto">
                    {key === "enterprise" ? (
                      <div className="flex gap-2">
                        {user ? (
                          <Button
                            className="flex-1"
                            onClick={() => checkoutMutation.mutate({ plan: key, billingPeriod })}
                            disabled={key === currentPlan || checkoutMutation.isPending}
                            data-testid={`button-pricing-${key}`}
                          >
                            Get started
                          </Button>
                        ) : (
                          <Link href="/auth/signup" className="flex-1">
                            <Button className="w-full" data-testid={`button-pricing-${key}`}>
                              Get started
                            </Button>
                          </Link>
                        )}
                        <a href="mailto:sales@getlatte.app" className="flex-1">
                          <Button className="w-full" design="outline" data-testid={`button-pricing-${key}-sales`}>
                            Contact Sales
                          </Button>
                        </a>
                      </div>
                    ) : key === "free" ? (
                      user ? (
                        <Button className="w-full" design="outline" disabled data-testid={`button-pricing-${key}`}>
                          Current plan
                        </Button>
                      ) : (
                        <Link href="/auth/signup">
                          <Button className="w-full" data-testid={`button-pricing-${key}`}>
                            Get started free
                          </Button>
                        </Link>
                      )
                    ) : user ? (
                      <Button
                        className="w-full"
                        onClick={() => checkoutMutation.mutate({ plan: key, billingPeriod })}
                        disabled={key === currentPlan || checkoutMutation.isPending}
                        data-testid={`button-pricing-${key}`}
                      >
                        {key === currentPlan ? "Current plan" : "Get started"}
                      </Button>
                    ) : (
                      <Link href="/auth/signup">
                        <Button className="w-full" data-testid={`button-pricing-${key}`}>
                          Get started
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
                {idx < TIERS.length - 1 && (
                  <div className="mx-auto h-px w-full bg-border/70 md:h-auto md:w-px md:self-stretch md:bg-border/70" />
                )}
              </React.Fragment>
            );
          })}
        </div>
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Need more AI credits? Buy credit packs — they never expire.
          </p>
        </div>
      </div>
    </section>
  );
}