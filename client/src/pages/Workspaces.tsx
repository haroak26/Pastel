import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";

import { ListSkeleton } from "@/components/ds/widgets";
import { AppPage, ContentPanel } from "@/components/ds";
import { SettingsSection, SettingsRow } from "@/components/settings-ui";
import { Button, IconButton } from "@/components/button";
import { useWorkspace } from "@/contexts/workspace-context";
import {
  Building2, Plus, Pencil,
} from "lucide-react";

type Workspace = {
  id: string;
  name: string;
  domain: string;
  logoUrl?: string | null;
  role: string;
};

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    owner: "bg-brand/10 text-brand",
    editor: "bg-violet-50 text-violet-600",
    viewer: "bg-gray-50 text-gray-500",
  };
  const label: Record<string, string> = { owner: "Owner", editor: "Editor", viewer: "Viewer" };
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${colors[role] ?? colors.viewer}`}>
      {label[role] ?? role}
    </span>
  );
}

export default function Workspaces() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { setActiveWorkspaceId } = useWorkspace();

  const { data: workspaces = [], isLoading } = useQuery<Workspace[]>({
    queryKey: ["/api/workspaces"],
    queryFn: async () => {
      const res = await fetch("/api/workspaces", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  return (
    <AppLayout>
      <AppPage>
        <ContentPanel maxWidth="narrow">
          <div className="space-y-8 py-6">
            <SettingsSection
              title="Workspaces"
              description="Manage workspaces and their settings."
            >
              {isLoading ? (
                <ListSkeleton rows={3} />
              ) : workspaces.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <div className="w-11 h-11 rounded-full bg-brand/10 flex items-center justify-center">
                    <Building2 size={20} className="text-brand" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-[14px] font-semibold text-foreground">No workspaces yet</p>
                    <p className="text-[12.5px] text-fg-muted">Create a workspace to organise your team and inboxes.</p>
                  </div>
                  <Button size="sm" onClick={() => navigate("/account/workspaces/new")}>
                    <Plus size={14} /> New workspace
                  </Button>
                </div>
              ) : (
                workspaces.map((ws) => (
                  <SettingsRow
                    key={ws.id}
                    label={
                      <div className="flex items-center gap-2">
                        <span className="text-[13.5px] font-medium">{ws.name}</span>
                        <RoleBadge role={ws.role} />
                      </div>
                    }
                  >
                    <IconButton icon={Pencil} size="sm" design="ghost" onClick={() => { setActiveWorkspaceId(ws.id); navigate(`/account/workspaces/${ws.id}`); }} title="Edit" />
                  </SettingsRow>
                ))
              )}
            </SettingsSection>
          </div>
        </ContentPanel>
      </AppPage>
      <Button onClick={() => navigate("/account/workspaces/new")} className="fixed right-4 z-40" style={{ bottom: 'max(1.5rem, env(safe-area-inset-bottom) + 0.75rem)' }}>
        <Plus size={16} strokeWidth={2.5} />
        New workspace
      </Button>
    </AppLayout>
  );
}
