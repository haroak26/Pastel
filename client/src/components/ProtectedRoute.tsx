import React from "react";
import { Redirect, useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";
import { useSpace } from "@/contexts/space-context";
import { useWorkspace } from "@/contexts/workspace-context";
import { AppShellSkeleton } from "@/components/AppShellSkeleton";

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

  // With the persisted cache this only ever flashes on a first-ever visit;
  // the shell skeleton matches the app layout so the swap-in is seamless.
  if (loading) {
    if (isOnboardingPage) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-border border-t-foreground/60 rounded-full animate-spin" />
        </div>
      );
    }
    return <AppShellSkeleton />;
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
