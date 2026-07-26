import { useState } from "react";
import { ArrowRight, Mail, Headphones, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/button";
import { TextInput } from "@/components/text-input";
import { PillFilter } from "@/components/ds";
import type { SpaceTypeOption } from "./types";

const SPACE_TYPE_OPTIONS = [
  { value: "support" as const, label: "Support", icon: Headphones, desc: "Tickets, AI agents, and auto-reply" },
  { value: "email"   as const, label: "Email",   icon: Mail,       desc: "General shared email inbox" },
] as const;

type Props = {
  spaceName: string;
  spaceLocalPart: string;
  spaceType: SpaceTypeOption;
  canonicalDomain: string;
  emailAddress: string;
  emailPassword: string;
  onSpaceNameChange: (value: string) => void;
  onLocalPartChange: (value: string) => void;
  onSpaceTypeChange: (value: SpaceTypeOption) => void;
  onEmailPasswordChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
};

export function CreateSpaceStep({
  spaceName,
  spaceLocalPart,
  spaceType,
  canonicalDomain,
  emailPassword,
  onSpaceNameChange,
  onLocalPartChange,
  onSpaceTypeChange,
  onEmailPasswordChange,
  onSubmit,
  isLoading,
}: Props) {
  const [nameTouched, setNameTouched] = useState(false);
  const [localPartTouched, setLocalPartTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const nameValid = spaceName.trim().length > 0;
  const localPartValid = spaceLocalPart.trim().length > 0 && /^[a-z0-9._%+-]+$/.test(spaceLocalPart.trim());
  const isValid = nameValid && localPartValid;

  return (
    <div className="space-y-4">
      {/* Space type */}
      <div className="space-y-2">
        <label className="text-[13px] font-medium text-foreground">Space type</label>
        <div className="flex gap-2">
          {SPACE_TYPE_OPTIONS.map((opt) => (
            <PillFilter key={opt.value} active={spaceType === opt.value} onClick={() => onSpaceTypeChange(opt.value)}>
              <opt.icon size={12} />
              {opt.label}
            </PillFilter>
          ))}
        </div>
        <p className="text-[11px] text-fg-faint">
          {SPACE_TYPE_OPTIONS.find((o) => o.value === spaceType)?.desc}
        </p>
      </div>

      {/* Sender name */}
      <div className="space-y-1.5">
        <label className="text-[13px] font-medium text-foreground">Sender name</label>
        <TextInput
          placeholder="e.g. Help"
          value={spaceName}
          onChange={(e) => onSpaceNameChange(e.target.value)}
          onBlur={() => setNameTouched(true)}
          error={nameTouched && !nameValid}
          aria-invalid={nameTouched && !nameValid}
        />
        {nameTouched && !nameValid && (
          <p className="text-[12px] text-danger">Enter a sender name.</p>
        )}
      </div>

      {/* Email address */}
      <div className="space-y-1.5">
        <label className="text-[13px] font-medium text-foreground">Email address</label>
        <TextInput
          placeholder="hello"
          value={spaceLocalPart}
          onChange={(e) => onLocalPartChange(e.target.value.toLowerCase().replace(/[^a-z0-9._+-]/g, ""))}
          onBlur={() => setLocalPartTouched(true)}
          error={localPartTouched && !localPartValid}
          suffix={`@${canonicalDomain}`}
          aria-invalid={localPartTouched && !localPartValid}
        />
        {localPartTouched && !localPartValid && (
          <p className="text-[12px] text-danger">Use only letters, numbers, dots, and hyphens.</p>
        )}
      </div>

      {/* Email password */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[13px] font-medium text-foreground">Email password</label>
          <span className="text-[11px] text-fg-faint">Optional — auto-generated if blank</span>
        </div>
        <div className="relative">
          <TextInput
            type={showPassword ? "text" : "password"}
            placeholder="Leave blank to auto-generate"
            value={emailPassword}
            onChange={(e) => onEmailPasswordChange(e.target.value)}
            autoComplete="new-password"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-faint hover:text-foreground transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        <p className="text-[11px] text-fg-faint">
          Used to connect this inbox to email clients via IMAP/SMTP.
        </p>
      </div>

      <Button onClick={onSubmit} isLoading={isLoading} disabled={!isValid} size="md" className="w-full">
        Create space <ArrowRight size={14} />
      </Button>
    </div>
  );
}
