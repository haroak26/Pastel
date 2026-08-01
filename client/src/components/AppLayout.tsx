import React, { Suspense, useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Loading01Icon, SmartPhone01Icon } from 'hugeicons-react';
import { SidebarContent } from '@/components/Sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { useSpace } from '@/contexts/space-context';
import { useWorkspace } from '@/contexts/workspace-context';
import { useUser, useCredits } from '@/hooks/use-user';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/button';
import { OtpInput } from '@/components/otp-input';
import { Menu, X } from 'lucide-react';

function initials(name: string | null | undefined, email: string | null | undefined): string {
  const str = name || email || '?';
  const parts = str.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return str[0].toUpperCase();
}


const SIDEBAR_W = 216;

/** Skeleton shown inside the app shell while a lazy page chunk loads. */
function MainContentSkeleton() {
  return (
    <div className="flex-1 px-4 sm:px-6 md:px-8 py-6 overflow-hidden" aria-busy="true" aria-label="Loading">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-8 w-28 rounded-[10px]" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Skeleton className="h-[130px] w-full rounded-[12px]" />
          <Skeleton className="h-[130px] w-full rounded-[12px]" />
          <Skeleton className="h-[130px] w-full rounded-[12px] hidden lg:block" />
        </div>
        <Skeleton className="h-[180px] w-full rounded-[12px]" />
      </div>
    </div>
  );
}

export function AppLayout({
  children,
  subNav,
}: {
  children: React.ReactNode;
  subNav?: React.ReactNode;
}) {
  const [locationPath] = useLocation();
  const { data: user } = useUser();
  const { data: credits } = useCredits();
  const isAccountPage = locationPath.startsWith('/account');
  const showHeader = !isAccountPage;
  const { switchingSpace, switchingPhase, switchingSpaceName, requireTotp, totpError, verifyTotpForSpace, cancelTotp, activeSpace } = useSpace();
  const { switchingWorkspace, switchingWsPhase, switchingWsName } = useWorkspace();
  const [totpCode, setTotpCode] = useState('');
  const isMobile = useIsMobile();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (activeSpace) {
      document.title = `${activeSpace.name} — Pastel`;
    } else {
      document.title = 'Pastel — Design. Collaborate. Ship.';
    }
  }, [activeSpace]);

  return (
      <div className="lds-app-shell h-dvh bg-background flex flex-col overflow-hidden overscroll-none">
        {/* ── Body: sidebar + main ── */}
        <div className="flex-1 min-h-0 flex mobile-body-row">
          {/* Sidebar — desktop only */}
          {!isMobile && (
            <aside className="h-full shrink-0" style={{ width: SIDEBAR_W, minWidth: SIDEBAR_W }}>
              <SidebarContent location={locationPath} />
            </aside>
          )}

          {/* Main content */}
          <div className="flex-1 min-h-0 flex flex-col">
            {showHeader && (
              <div className="shrink-0 flex items-center justify-between h-[48px] px-5">
                <div className="flex items-center gap-2">
                  {isMobile && (
                    <button
                      onClick={() => setMobileSidebarOpen(true)}
                      className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg text-fg-muted hover:text-foreground hover:bg-surface-hover transition-colors border-none cursor-pointer"
                      aria-label="Open menu"
                    >
                      <Menu size={18} />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {credits ? (
                    <Link href="/account/credits" className="text-[14px] font-medium text-fg-muted hover:text-foreground transition-colors no-underline tabular-nums">
                      {credits.balance % 1 === 0 ? credits.balance : credits.balance.toFixed(2)} Credits Remaining
                    </Link>
                  ) : (
                    <Skeleton className="h-4 w-28" />
                  )}
                  <div className="w-px h-4 bg-border/60" />
                  <Link href="/account/profile">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="w-[28px] h-[28px] rounded-full object-cover hover:opacity-80 transition-opacity cursor-pointer" />
                    ) : (
                      <div className="w-[28px] h-[28px] rounded-full bg-brand flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer">
                        <span className="text-[11px] font-bold text-white">
                          {initials(user?.displayName, user?.email)}
                        </span>
                      </div>
                    )}
                  </Link>
                </div>
              </div>
            )}
            {subNav && (
              <div className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
                {subNav}
              </div>
            )}
            <main className="flex-1 min-w-0 md:overflow-hidden flex flex-col page-enter">
              <Suspense fallback={<MainContentSkeleton />}>
                {children}
              </Suspense>
            </main>
          </div>
        </div>

      {switchingWorkspace && (
        <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center gap-4">
              <Loading01Icon className="h-6 w-6 animate-spin text-foreground" />
          <div className="text-center">
            {switchingWsPhase === 'logging-out' && (
              <>
                <p className="text-[16px] font-semibold text-foreground">Logging out of {switchingWsName}...</p>
                <p className="text-[12px] text-fg-muted font-medium mt-1.5">Closing your current workspace session</p>
              </>
            )}
            {switchingWsPhase === 'signing-in' && (
              <>
                <p className="text-[16px] font-semibold text-foreground">Signing into {switchingWsName}...</p>
                <p className="text-[12px] text-fg-muted font-medium mt-1.5">Authenticating your workspace connection</p>
              </>
            )}
          </div>
        </div>
      )}
      {/* Mobile sidebar overlay */}
      {isMobile && mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative h-full w-[216px] animate-slide-in-left bg-background">
            <div className="absolute top-3 right-3 z-10">
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="flex items-center justify-center w-7 h-7 rounded-lg text-fg-muted hover:text-foreground hover:bg-surface-hover transition-colors border-none cursor-pointer"
                aria-label="Close menu"
              >
                <X size={16} />
              </button>
            </div>
            <SidebarContent location={locationPath} onNavigate={() => setMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      {switchingSpace && !switchingWorkspace && (
        <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center gap-4">
          {switchingPhase === 'totp' ? (
            <div className="flex flex-col items-center gap-4 max-w-sm w-full px-6">
              <SmartPhone01Icon className="h-8 w-8 text-foreground" />
              <div className="text-center">
                <p className="text-[16px] font-semibold text-foreground">Authenticate to access {switchingSpaceName}</p>
                <p className="text-[12px] text-fg-muted font-medium mt-1.5">Enter the code from your authenticator app</p>
              </div>
              <div className="flex items-center gap-2 w-full max-w-[200px]">
                <OtpInput
                  value={totpCode}
                  onChange={setTotpCode}
                  onComplete={(code) => { verifyTotpForSpace(code); setTotpCode(''); }}
                  autoFocus
                />
              </div>
              {totpError && <p className="text-[12px] text-destructive font-medium">{totpError}</p>}
              <div className="flex items-center gap-2">
                <Button size="xs" onClick={() => { verifyTotpForSpace(totpCode); setTotpCode(''); }} disabled={totpCode.length !== 6}>
                  <SmartPhone01Icon size={12} /> Verify
                </Button>
                <Button design="ghost" size="xs" onClick={() => { cancelTotp(); setTotpCode(''); }}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
          <Loading01Icon className="h-6 w-6 animate-spin text-foreground" />
              <div className="text-center">
                {switchingPhase === 'logging-out' && (
                  <>
                    <p className="text-[16px] font-semibold text-foreground">Logging out of {switchingSpaceName}...</p>
                    <p className="text-[12px] text-fg-muted font-medium mt-1.5">Closing your current session</p>
                  </>
                )}
                {switchingPhase === 'signing-in' && (
                  <>
                    <p className="text-[16px] font-semibold text-foreground">Signing into {switchingSpaceName}...</p>
                    <p className="text-[12px] text-fg-muted font-medium mt-1.5">Authenticating your space connection</p>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}
      </div>
  );
}
