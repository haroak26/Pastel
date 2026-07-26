import { useLocation } from "wouter";
import { AppPage, ContentPanel } from "@/components/ds";
import { SettingsContent } from "@/pages/Settings";
import { TeamPageContent } from "@/pages/TeamPage";
import Domains from "@/pages/Domains";
import { AssignmentRulesContent } from "@/pages/AssignmentRules";
import { SlaSettingsContent } from "@/pages/SlaSettings";

const contentBySection: Record<string, React.ReactNode> = {
  "settings": <SettingsContent />,
  "team": <TeamPageContent />,
  "domains": <Domains />,
  "assignment-rules": <AssignmentRulesContent />,
  "sla": <SlaSettingsContent />,
};

export default function WorkspacePage() {
  const [location] = useLocation();
  const section = location.startsWith("/workspace/") ? location.slice("/workspace/".length) : "";

  return (
    <AppPage>
      <ContentPanel maxWidth="narrow">
        {contentBySection[section] ?? contentBySection["settings"]}
      </ContentPanel>
    </AppPage>
  );
}
