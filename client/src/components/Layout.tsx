import React, { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { X, ArrowRight, Palette, PenTool, Layers, Share2, Sparkles, Star, BarChart3 } from "lucide-react";

import { useUser, useLogout } from "@/hooks/use-user";
import { CookieBar } from "./CookieBar";
import { Button } from "@/components/button";
import { cn } from "@/lib/utils";


interface LayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
  panel?: boolean;
}

const navDropdowns = [
  {
    label: "Product",
    href: "/#features",
    items: [
      { icon: PenTool, title: "Design", desc: "Create beautiful interfaces", href: "/#features" },
      { icon: Layers, title: "Prototype", desc: "Interactive prototypes", href: "/#features" },
      { icon: Share2, title: "Handoff", desc: "Developer handoff made easy", href: "/#features" },
      { icon: Sparkles, title: "AI Features", desc: "AI-powered design tools", href: "/#features" },
    ],
  },
  {
    label: "Pricing",
    href: "/pricing",
    items: [
      { icon: PenTool, title: "Starter", desc: "$5/mo — For getting started", href: "/pricing" },
      { icon: Star, title: "Pro", desc: "$29/mo — For growing teams", href: "/pricing" },
      { icon: BarChart3, title: "Max", desc: "$99/mo — For teams that want everything", href: "/pricing" },
      { icon: ArrowRight, title: "Compare Plans", desc: "See all features side by side", href: "/pricing" },
    ],
  },
  {
    label: "Affiliate",
    href: "/affiliate",
    items: [
      { icon: PenTool, title: "Affiliate Program", desc: "Earn recurring commission", href: "/affiliate" },
      { icon: Layers, title: "Partners", desc: "Grow with Pastel", href: "/affiliate" },
      { icon: Share2, title: "Refer a friend", desc: "Share the love, earn rewards", href: "/affiliate" },
      { icon: Sparkles, title: "Contact sales", desc: "Talk to a human", href: "/contact" },
    ],
  },
];

export function Layout({ children, showFooter = true, panel = false }: LayoutProps) {
  const { data: user, isLoading: userLoading } = useUser();
  const logout = useLogout();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const onScroll = () => setScrolled(document.documentElement.scrollTop > 0);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNavEnter = (label: string) => {
    clearTimeout(hoverTimeout.current);
    setActiveDropdown(label);
  };

  const handleNavLeave = () => {
    hoverTimeout.current = setTimeout(() => setActiveDropdown(null), 120);
  };

  const handleDropdownEnter = () => {
    clearTimeout(hoverTimeout.current);
  };

  const headerContent = (
    <header className={cn("w-full h-14 md:h-[60px] bg-background/95 backdrop-blur z-40 sticky top-0 flex items-center border-b transition-all duration-200", panel && "border-border")} style={panel ? { borderColor: 'transparent' } : { borderColor: scrolled ? 'hsl(var(--border))' : 'transparent' }}>
      <div className="w-full max-w-[1280px] mx-auto px-6 md:px-8 overflow-x-hidden flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <img src="/PastelLogo.svg" alt="Pastel" width={100} className="h-auto shrink-0" />
        </Link>
 
        <div className="flex items-center justify-end gap-2.5">
          <div className="hidden md:flex items-center gap-1">
            <nav className="flex items-center gap-0.5">
              {navDropdowns.map(({ label, href }) => (
                <Link key={label} href={href} className="inline-flex items-center text-[14px] font-medium text-foreground px-2.5 leading-[20px] transition-colors hover:opacity-80">
                  {label}
                </Link>
              ))}
            </nav>

            <div className="w-px h-5 bg-border mx-2" />

            {userLoading ? null : user ? (
              <>
                <Link href="/home" className="inline-flex">
                  <Button design="pill" size="sm">My Account</Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="inline-flex">
                  <Button design="pill-ghost" size="sm">Log In</Button>
                </Link>
                <Link href="/auth/signup" className="inline-flex">
                  <Button design="pill" size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>
          <div className="md:hidden flex items-center gap-2">
            {!user && !userLoading && (
              <Link href="/auth/signup" className="inline-flex">
                <Button design="pill" size="xs">Get Started</Button>
              </Link>
            )}
            <button
              className="flex items-center justify-center w-8 h-8 rounded-lg text-foreground hover:bg-surface-hover transition-colors bg-none border-none"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <div className="relative w-4 h-[10px] flex flex-col justify-between">
                <span
                  className="block w-4 h-[2px] bg-current rounded-full transition-transform duration-300 ease-out origin-center"
                  style={{
                    transform: mobileMenuOpen
                      ? "translateY(4px) rotate(45deg)"
                      : "translateY(0) rotate(0deg)",
                  }}
                />
                <span
                  className="block w-4 h-[2px] bg-current rounded-full transition-transform duration-300 ease-out origin-center"
                  style={{
                    transform: mobileMenuOpen
                      ? "translateY(-4px) rotate(-45deg)"
                      : "translateY(0) rotate(0deg)",
                  }}
                />
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>
  );

  const mobileMenuContent = mobileMenuOpen && (
    <div
      className="fixed left-0 right-0 bottom-0 z-50 md:hidden flex flex-col bg-background"
      style={{ top: "3.5rem" }}
    >
      <div className="flex-1 flex flex-col overflow-y-auto px-6 pt-4 pb-6">
        <nav className="flex flex-col flex-1">
          <div>
            {[
              { label: "Product", href: "/#features" },
              { label: "Pricing", href: "/pricing" },
              { label: "Affiliate", href: "/affiliate" },
            ].map(({ label, href }) => (
              <div key={label}>
                <Link
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between py-3.5 text-[15px] font-medium text-foreground border-b border-border/60"
                >
                  {label}
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
              </div>
            ))}
            {user && (
              <div>
                <Link
                  href="/home"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between py-3.5 text-[15px] font-medium text-foreground border-b border-border/60"
                >
                  My Account
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
              </div>
            )}
          </div>
          <div className="mt-auto pt-8">
            {userLoading ? null : user ? (
              <Button
                onClick={() => { logout.mutate(); setMobileMenuOpen(false); }}
                className="w-full"
              >
                Sign out
              </Button>
            ) : (
              <div className="flex flex-row gap-2">
                <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)} className="flex-1">
                  <Button design="pill-ghost" size="sm" className="w-full max-md:h-10 max-md:px-5 max-md:text-[16px]">
                    Log In
                  </Button>
                </Link>
                <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)} className="flex-1">
                  <Button design="pill" size="sm" className="w-full max-md:h-10 max-md:px-5 max-md:text-[16px]">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </nav>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {panel ? (
        <div className="flex-1 flex flex-col w-full max-w-[1280px] mx-auto bg-white">
          {headerContent}
          {mobileMenuContent}
          <main className="flex-1 w-full">
            {children}
          </main>
        </div>
      ) : (
        <>
          {headerContent}
          {mobileMenuContent}
          <main className="flex-1 w-full bg-white">
            {children}
          </main>
        </>
      )}

      {showFooter && (
        <footer className="mt-auto border-t bg-white" style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="w-full max-w-[1280px] mx-auto px-6 md:px-8 pt-16 pb-12">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10 pb-10 border-b border-border">
              <div className="space-y-3 max-w-xs">
                <Link href="/" className="inline-flex items-center gap-2">
<img src="/PastelLogo.svg" alt="Pastel" width={116} className="h-auto shrink-0" />
                </Link>
                <p className="text-[13px] text-fg-muted font-medium leading-[1.6]">
                  Design beautiful interfaces, together.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-10">
              {[
                { heading: "Product", links: [["Features", "/#features"], ["Pricing", "/pricing"]] },
                { heading: "Resources", links: [["Documentation", "/docs"], ["Status", "/status"], ["Contact", "/contact"]] },
                { heading: "Company", links: [["Privacy", "/privacy"], ["Terms", "/terms"]] },
                { heading: "Legal", links: [["Privacy Policy", "/privacy"], ["Terms of Service", "/terms"]] },
              ].map(({ heading, links }) => (
                <div key={heading} className="space-y-3">
                  <p className="lds-section-label">{heading}</p>
                  <nav className="flex flex-col gap-2">
                    {links.map(([label, href]) => (
                      href.startsWith('https://') ? (
                        <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="lds-body text-[13px] hover:text-foreground transition-colors">
                          {label}
                        </a>
                      ) : (
                        <Link key={label} href={href} className="lds-body text-[13px] hover:text-foreground transition-colors">
                          {label}
                        </Link>
                      )
                    ))}
                  </nav>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-border">
              <span className="text-[12px] font-medium text-muted-foreground">&copy; {new Date().getFullYear()} Pastel. All rights reserved.</span>
            </div>
          </div>
        </footer>
      )}

      <CookieBar />
    </div>
  );
}
