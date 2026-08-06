import { motion } from "framer-motion";
import { FileText, Loader2 } from "lucide-react";
import type { DocItem } from "@/hooks/use-pastel-agent";

interface DocsPanelProps {
  docs: DocItem[];
  isRunning: boolean;
  activeDocPath: string | null;
  onOpenDoc: (path: string) => void;
}

const GROUPS: Array<{ id: string; label: string; match: (d: DocItem) => boolean }> = [
  { id: "brief", label: "Brief", match: (d) => d.kind === "brief" },
  { id: "design", label: "Design System", match: (d) => d.kind === "design-tokens" },
  { id: "references", label: "Design References", match: (d) => d.kind === "megadesign" || d.kind === "company-design" },
  { id: "planning", label: "Planning", match: (d) => d.kind === "wireframe-plan" || d.kind === "component-inventory" || d.kind === "copy-plan" || d.kind === "data-plan" },
  { id: "review", label: "Review", match: (d) => d.kind === "gate-report" || d.kind === "review-result" },
];

/** Sidebar panel listing every markdown document the agent produced, live. */
export function DocsPanel({ docs, isRunning, activeDocPath, onOpenDoc }: DocsPanelProps) {
  const grouped = GROUPS.map((g) => ({ ...g, items: docs.filter(g.match) })).filter(
    (g) => g.items.length > 0,
  );

  return (
    <div className="space-y-3">
      <div className="px-2.5 pt-1 pb-0.5 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-foreground">Docs</span>
        {isRunning && (
          <span className="flex items-center gap-1 text-[10px] text-fg-faint">
            <Loader2 size={10} className="animate-spin" />
            writing
          </span>
        )}
      </div>

      {grouped.length === 0 && (
        <div className="px-2.5 py-4 text-center">
          <FileText size={16} strokeWidth={1.5} className="text-fg-faint mx-auto mb-1.5" />
          <p className="text-[11px] text-fg-muted leading-relaxed">
            {isRunning
              ? "The agent is writing the brief — docs will appear here as they're created."
              : "No documents yet. Run the agent to generate design docs."}
          </p>        </div>
      )}

      {grouped.map((group) => (
        <div key={group.id}>
          <div className="px-2.5 pb-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-fg-faint">
              {group.label}
            </span>
          </div>
          <div className="space-y-0.5">
            {group.items.map((doc) => (
              <motion.button
                key={doc.path}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                onClick={() => onOpenDoc(doc.path)}
                className={`flex items-center gap-2 w-full h-[28px] px-2.5 rounded-[10px] text-left cursor-pointer transition-colors border-2 box-border ${
                  activeDocPath === doc.path
                    ? "bg-surface-hover font-semibold border-transparent text-foreground"
                    : "bg-transparent border-transparent font-[450] text-foreground hover:bg-surface-hover"
                }`}
              >
                <FileText size={12} strokeWidth={1.5} className="shrink-0 text-fg-muted" />
                <span className="text-[11px] truncate">{doc.title}</span>
              </motion.button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
