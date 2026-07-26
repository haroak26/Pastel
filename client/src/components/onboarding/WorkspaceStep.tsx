import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/button";
import { TextInput } from "@/components/text-input";

type Props = {
  workspaceName: string;
  domainName: string;
  onWorkspaceNameChange: (value: string) => void;
  onDomainNameChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
};

export function WorkspaceStep({
  workspaceName,
  domainName,
  onWorkspaceNameChange,
  onDomainNameChange,
  onSubmit,
  isLoading,
}: Props) {
  const [nameTouched, setNameTouched] = useState(false);
  const isValid = workspaceName.trim().length > 0;

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="workspaceName" className="text-[13px] font-medium text-foreground">
          Workspace name
        </label>
        <TextInput
          id="workspaceName"
          type="text"
          placeholder="My Company"
          value={workspaceName}
          onChange={(e) => onWorkspaceNameChange(e.target.value)}
          onBlur={() => setNameTouched(true)}
          autoFocus
          onKeyDown={(e) => { if (e.key === "Enter" && isValid) onSubmit(); }}
          className={`w-full ${nameTouched && !isValid ? "border-[hsl(var(--danger))]!" : ""}`}
          aria-invalid={nameTouched && !isValid}
        />
        {nameTouched && !isValid && (
          <p className="text-[12px] text-[hsl(var(--danger))]">Enter a workspace name to continue.</p>
        )}
      </div>
      <div className="space-y-2">
        <label htmlFor="workspaceDomain" className="text-[13px] font-medium text-foreground">
          Primary domain
        </label>
        <TextInput
          id="workspaceDomain"
          type="text"
          placeholder="example.com"
          value={domainName}
          onChange={(e) => onDomainNameChange(e.target.value.toLowerCase())}
          onKeyDown={(e) => { if (e.key === "Enter" && isValid) onSubmit(); }}
          className="w-full"
        />
        <p className="text-[11px] text-[hsl(var(--fg-faint))]">
          We use this for the favicon now. TXT verification happens next.
        </p>
      </div>
      <Button onClick={onSubmit} isLoading={isLoading} disabled={!isValid} size="md" className="w-full">
        Save workspace <ArrowRight size={14} />
      </Button>
    </div>
  );
}
