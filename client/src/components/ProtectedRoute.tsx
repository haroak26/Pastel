import React from "react";
import { Redirect, useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";
import { useSpace } from "@/contexts/space-context";
import { useWorkspace } from "@/contexts/workspace-context";
import { PastelLogo } from "@/components/PastelLogo";

const ONBOARDING_COMPLETE_STEP = 5;

interface ProtectedRouteProps {
  component: React.ComponentType;
}

export function ProtectedRoute({ component: Component }: ProtectedRouteProps) {
  const [currentPath] = useLocation();
  const { data: user, isLoading: userLoading } = useUser();
  const { isLoading: spaceLoading } = useSpace();
  const { isLoading: workspaceLoading } = useWorkspace();

  const isOnboardingPage = currentPath === "/auth/onboarding";
  const loading = userLoading || (!isOnboardingPage && !!(user && (spaceLoading || workspaceLoading)));

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <div className="opacity-50">
            <PastelLogo size={26} />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-foreground/40 animate-pulse" style={{ animationDelay: "0ms" }} />
            <span className="w-2 h-2 rounded-full bg-foreground/40 animate-pulse" style={{ animationDelay: "160ms" }} />
            <span className="w-2 h-2 rounded-full bg-foreground/40 animate-pulse" style={{ animationDelay: "320ms" }} />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth/login" />;
  }

  const onboardingStep = (user as { onboardingStep?: number }).onboardingStep ?? 0;
  const isOnboardingComplete = onboardingStep >= ONBOARDING_COMPLETE_STEP;

  if (!isOnboardingComplete && !isOnboardingPage) {
    return <Redirect to="/auth/onboarding" />;
  }

  if (isOnboardingComplete && isOnboardingPage) {
    return <Redirect to="/home" />;
  }

  return <Component />;
}
