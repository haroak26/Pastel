// FooterLinks.tsx — Navigation links for privacy, terms, and social channels. Use in a site footer or supporting product navigation area.
import type { HTMLAttributes, ReactNode } from "react";
import { cva } from "class-variance-authority";
import { cn } from "../lib/cn";

const footerLinksVariants = cva(
  "inline-flex items-center justify-center rounded-[var(--radius-md)] font-[var(--weight-medium)] transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2"
);

export interface FooterLinksProps extends HTMLAttributes<HTMLElement> {
  links: Array<{
    label: string;
    href: string;
    external?: boolean;
  }>;
  socialLinks?: Array<{
    icon: ReactNode;
    href: string;
    label: string;
  }>;
}

export default function FooterLinks({
  className,
  links,
  socialLinks,
  ...props
}: FooterLinksProps) {
  return (
    <footer
      className={cn(
        "flex flex-col gap-[var(--space-6)] border-t border-[var(--color-border-subtle)] py-[var(--space-6)] font-[var(--font-body)] md:flex-row md:items-center md:justify-between",
        className
      )}
      {...props}
    >
      <nav aria-label="Footer links">
        <ul className="flex flex-wrap items-center gap-[var(--space-2)]">
          {links.map((link) => (
            <li key={`${link.label}-${link.href}`}>
              <a
                className={cn(
                  footerLinksVariants(),
                  "min-h-[var(--control-sm)] px-[var(--space-3)] text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-accent-600)] active:bg-[var(--color-neutral-200)]"
                )}
                href={link.href}
                {...(link.external
                  ? {
                      target: "_blank",
                      rel: "noopener noreferrer",
                    }
                  : {})}
              >
                {link.label}
                {link.external && (
                  <span aria-hidden="true" className="text-[var(--color-text-muted)]">
                    ↗
                  </span>
                )}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {socialLinks && socialLinks.length > 0 && (
        <nav aria-label="Social links">
          <ul className="flex items-center gap-[var(--space-2)]">
            {socialLinks.map((socialLink) => (
              <li key={`${socialLink.label}-${socialLink.href}`}>
                <a
                  className={cn(
                    footerLinksVariants(),
                    "h-[var(--control-sm)] w-[var(--control-sm)] rounded-[var(--radius-full)] text-[var(--color-text-secondary)] hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-accent-600)] active:bg-[var(--color-neutral-200)]"
                  )}
                  href={socialLink.href}
                  aria-label={socialLink.label}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {socialLink.icon}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </footer>
  );
}