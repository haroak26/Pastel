import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SafeUser, PlanTier } from "@shared/schema";
import { prefetchAppData } from "@/lib/queryClient";

export type AppUser = SafeUser & { hasPassword?: boolean; subscription?: { plan?: string } | null };

async function fetchUser(): Promise<AppUser | null> {
  const res = await fetch("/api/me", { credentials: "include" });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Failed to fetch user");
  return res.json();
}

export function useUser() {
  return useQuery<AppUser | null>({
    queryKey: ["/api/me"],
    queryFn: fetchUser,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export type PlanInfo = {
  plan: PlanTier;
  status: string | null;
  cancelAtPeriodEnd: boolean;
  billingPeriod: "monthly" | "annual";
  renewsAt: string | null;
  limits: { label: string; prices: { monthly: number; annual: number }; spaces: number; domains: number; emailsPerMonth: number | "unlimited"; aiCredit: number; assistantCredit: number };
  usage: { spaces: number; domains: number; aiCreditUsed?: number; aiCreditPurchased?: number; assistantCreditUsed?: number };
};

async function fetchPlan(): Promise<PlanInfo | null> {
  const res = await fetch("/api/me/plan", { credentials: "include" });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Failed to fetch plan");
  return res.json();
}

export function usePlan() {
  return useQuery<PlanInfo | null>({
    queryKey: ["/api/me/plan"],
    queryFn: fetchPlan,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export type LoginResult =
  | { requiresTwoFactor: true; challengeId: string; expiresInSeconds: number }
  | AppUser;

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Login failed" }));
        throw new Error(err.message ?? "Login failed");
      }
      return res.json() as Promise<LoginResult>;
    },
    onSuccess: (result) => {
      if ((result as { requiresTwoFactor?: boolean }).requiresTwoFactor) return;
      const user = result as AppUser;
      queryClient.cancelQueries({ queryKey: ["/api/me"] });
      queryClient.setQueryData(["/api/me"], user);
      prefetchAppData(queryClient);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Logout failed");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/me"], null);
      queryClient.removeQueries({ queryKey: ["/api/spaces"] });
      queryClient.removeQueries({ queryKey: ["/api/workspaces"] });
    },
  });
}
