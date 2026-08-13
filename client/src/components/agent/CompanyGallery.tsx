import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import type { CompanyCatalogItem, SuggestedCompany } from "@/hooks/use-maxi-agent";

interface CompanyGalleryProps {
  catalog: CompanyCatalogItem[];
  suggested: SuggestedCompany[];
  inspiration: string;
  secondary: string[];
  onPick: (slug: string, secondary?: boolean) => void;
  onGenerate: () => void;
  loading?: boolean;
}

/** Style swatch dots for a company card. */
function Swatches({ colors }: { colors: string[] }) {
  return (
    <div className="flex items-center gap-1">
      {colors.slice(0, 4).map((c, i) => (
        <span
          key={i}
          className="h-3 w-3 rounded-full border border-black/10"
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  );
}

/**
 * V6 discovery step — pick the app/company your product is "inspired by".
 * Suggested picks (scored from the prompt) are highlighted first.
 */
export function CompanyGallery({
  catalog,
  suggested,
  inspiration,
  secondary,
  onPick,
  onGenerate,
  loading,
}: CompanyGalleryProps) {
  const suggestedSlugs = suggested.slice(0, 4).map((s) => s.slug);
  const ordered = [
    ...suggested.map((s) => catalog.find((c) => c.slug === s.slug)).filter(Boolean) as CompanyCatalogItem[],
    ...catalog.filter((c) => !suggestedSlugs.includes(c.slug)),
  ];

  const canGenerate = inspiration.length > 0;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="rounded-[20px] border border-border bg-background shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="px-4 pt-3.5 pb-1 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-brand flex items-center gap-1.5">
            <Sparkles size={12} strokeWidth={2} />
            Pick your inspiration
          </span>
          <span className="text-[10px] text-fg-faint">choose the app your product feels like</span>
        </div>
        <p className="px-4 text-[13px] text-fg-muted leading-relaxed">
          Building a fitness app? Go <span className="text-foreground font-medium">inspired by Nike</span>.
          A fintech dashboard? Try <span className="text-foreground font-medium">Stripe</span>. Pick one
          (or a secondary vibe) — the brief is written around it.
        </p>

        <div className="px-4 py-3 grid gap-2">
          {ordered.map((c, i) => {
            const isPrimary = inspiration === c.slug;
            const isSecondary = secondary.includes(c.slug);
            const isSuggested = suggestedSlugs.includes(c.slug);
            return (
              <motion.button
                key={c.slug}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
                onClick={() => onPick(c.slug, inspiration.length > 0 && inspiration !== c.slug)}
                className={`w-full text-left px-3.5 py-2.5 rounded-[14px] border transition-all duration-150 cursor-pointer ${
                  isPrimary
                    ? "border-brand bg-brand/5"
                    : isSecondary
                      ? "border-brand/40 bg-brand/5"
                      : "border-border/70 bg-surface-muted hover:border-brand/40 hover:bg-surface-hover"
                }`}
              >
                <div className="flex items-center gap-3">
                  {c.imageUrl ? (
                    <img
                      src={c.imageUrl}
                      alt={`${c.name} design reference`}
                      loading="lazy"
                      className="h-14 w-20 shrink-0 rounded-lg border border-border object-cover"
                    />
                  ) : (
                    <Swatches colors={c.swatches} />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-semibold text-foreground">{c.name}</span>
                      {isSuggested && (
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-brand bg-brand/10 px-1.5 py-0.5 rounded-full">
                          suggested
                        </span>
                      )}
                      {isPrimary && (
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-success bg-success/10 px-1.5 py-0.5 rounded-full">
                          inspired by
                        </span>
                      )}
                      {isSecondary && (
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-fg-muted bg-border/40 px-1.5 py-0.5 rounded-full">
                          + secondary
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-[11px] text-fg-muted">{c.description}</p>
                    {isPrimary && (
                      <p className="mt-1 line-clamp-1 text-[10px] text-fg-faint">
                        {suggested.find((s) => s.slug === c.slug)?.reason ?? c.tags.slice(0, 4).join(" · ")}
                      </p>
                    )}
                  </div>
                  {isPrimary && <Check size={16} strokeWidth={2.5} className="text-brand shrink-0" />}
                </div>
              </motion.button>
            );
          })}
        </div>

        <div className="flex items-center justify-between px-4 pb-4 pt-1">
          <span className="text-[10px] text-fg-faint">You can also pick a second vibe after choosing one.</span>
          <button
            onClick={onGenerate}
            disabled={!canGenerate || loading}
            className={`flex items-center gap-1.5 h-[34px] px-4 rounded-[10px] text-[13px] font-semibold border-none cursor-pointer transition-colors ${
              canGenerate
                ? "bg-brand text-white hover:bg-brand/90"
                : "bg-surface-muted text-fg-faint cursor-not-allowed"
            }`}
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}
