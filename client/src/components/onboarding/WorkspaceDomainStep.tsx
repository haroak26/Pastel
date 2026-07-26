import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/button";
import { TextInput } from "@/components/text-input";

type Props = {
  domainName: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
};

export function WorkspaceDomainStep({ domainName, onChange, onSubmit, isLoading }: Props) {
  const [touched, setTouched] = useState(false);
  const isValid = domainName.trim().length > 0;
  const showError = touched && !isValid;

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="workspaceDomain" className="text-[13px] font-medium text-foreground">
          Primary domain
        </label>
        <TextInput
          id="workspaceDomain"
          type="text"
          placeholder="example.com"
          value={domainName}
          onChange={(e) => onChange(e.target.value.toLowerCase())}
          onBlur={() => setTouched(true)}
          autoFocus
          onKeyDown={(e) => { if (e.key === "Enter" && isValid) onSubmit(); }}
          className={`w-full ${showError ? "border-[hsl(var(--danger))]!" : ""}`}
          aria-invalid={showError}
          aria-describedby={showError ? "workspaceDomain-error" : undefined}
        />
        {showError && (
          <p id="workspaceDomain-error" className="text-[12px] text-[hsl(var(--danger))]">
            Enter a primary domain to continue.
          </p>
        )}
        <p className="text-[11px] text-[hsl(var(--fg-faint))]">
          We use this for the favicon now. TXT verification happens next.
        </p>
      </div>
      <Button onClick={onSubmit} isLoading={isLoading} disabled={!isValid} size="md" className="w-full">
        Continue <ArrowRight size={14} />
      </Button>
    </div>
  );
}
