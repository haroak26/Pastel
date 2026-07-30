import { useMemo, useState } from "react";
import { FileCode2, Folder, ChevronRight, ChevronDown } from "lucide-react";
import type { FileItem } from "@/hooks/use-pastel-agent";

interface FilesPanelProps {
  files: Record<string, FileItem>;
  activeFile: string | null;
  onSelectFile: (path: string) => void;
}

/** Sidebar panel showing the generated virtual file system. */
export function FilesPanel({ files, activeFile, onSelectFile }: FilesPanelProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const tree = useMemo(() => {
    const folders = new Map<string, FileItem[]>();
    const sorted = Object.values(files).sort((a, b) => a.path.localeCompare(b.path));
    for (const f of sorted) {
      const dir = f.path.includes("/") ? f.path.slice(0, f.path.lastIndexOf("/")) : "";
      if (!folders.has(dir)) folders.set(dir, []);
      folders.get(dir)!.push(f);
    }
    return [...folders.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [files]);

  if (tree.length === 0) {
    return (
      <div className="px-2.5 py-4 text-center">
        <FileCode2 size={16} strokeWidth={1.5} className="text-fg-faint mx-auto mb-1.5" />
        <p className="text-[11px] text-fg-muted leading-relaxed">
          No files yet. The agent writes the app's source files here as it builds.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="px-2.5 pt-1 pb-0.5">
        <span className="text-[11px] font-semibold text-foreground">Files</span>
      </div>
      {tree.map(([dir, items]) => {
        const isCollapsed = collapsed[dir];
        return (
          <div key={dir || "(root)"}>
            <button
              onClick={() => setCollapsed((prev) => ({ ...prev, [dir]: !prev[dir] }))}
              className="flex items-center gap-1.5 w-full h-[24px] px-2.5 rounded-[8px] text-left cursor-pointer transition-colors text-fg-muted hover:bg-surface-hover border-none bg-transparent"
            >
              {isCollapsed ? (
                <ChevronRight size={11} strokeWidth={2} />
              ) : (
                <ChevronDown size={11} strokeWidth={2} />
              )}
              <Folder size={11} strokeWidth={1.5} />
              <span className="text-[10px] font-semibold font-mono">{dir || "/"}</span>
            </button>
            {!isCollapsed &&
              items.map((f) => {
                const name = f.path.split("/").pop() ?? f.path;
                return (
                  <button
                    key={f.path}
                    onClick={() => onSelectFile(f.path)}
                    className={`flex items-center gap-2 w-full h-[26px] pl-[26px] pr-2.5 rounded-[10px] text-left cursor-pointer transition-colors border-2 box-border ${
                      activeFile === f.path
                        ? "bg-surface-hover font-semibold border-transparent text-foreground"
                        : "bg-transparent border-transparent font-[450] text-foreground hover:bg-surface-hover"
                    }`}
                  >
                    <FileCode2 size={11} strokeWidth={1.5} className="shrink-0 text-fg-muted" />
                    <span className="text-[11px] truncate font-mono">{name}</span>
                  </button>
                );
              })}
          </div>
        );
      })}
    </div>
  );
}
