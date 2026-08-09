// AgeRangeSelect.tsx — Age range dropdown or radio group selector for user profile and filtering contexts. Use for demographic collection and age-based feature access.
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";
import * as Select from "@radix-ui/react-select";
import { ChevronDown, Check } from "lucide-react";
import { useState } from "react";

const selectVariants = cva(
  "inline-flex items-center justify-between rounded-[var(--radius-md)] font-[var(--weight-regular)] transition-all duration-[var(--duration-fast)] ease-[var(--easing-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      type: {
        dropdown:
          "h-[var(--control-md)] px-4 bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] border border-[var(--color-border-default)] hover:border-[var(--color-border-focus)] active:bg-[var(--color-neutral-50)]",
        radio: "flex flex-col gap-[var(--space-3)]",
      },
    },
    defaultVariants: {
      type: "dropdown",
    },
  }
);

const radioGroupVariants = cva(
  "inline-flex items-center gap-[var(--space-3)] px-4 py-3 rounded-[var(--radius-md)] cursor-pointer transition-all duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:bg-[var(--color-neutral-50)] active:bg-[var(--color-neutral-100)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      selected: {
        true: "bg-[var(--color-accent-50)] border border-[var(--color-accent-500)]",
        false: "bg-[var(--color-surface-raised)] border border-[var(--color-border-default)]",
      },
    },
    defaultVariants: {
      selected: false,
    },
  }
);

export interface AgeRangeSelectProps
  extends VariantProps<typeof selectVariants> {
  value?: string;
  onChange?: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  disabled?: boolean;
  placeholder?: string;
}

export default function AgeRangeSelect({
  value,
  onChange,
  options,
  disabled = false,
  type = "dropdown",
  placeholder = "Select age range",
}: AgeRangeSelectProps) {
  const [internalValue, setInternalValue] = useState(value || "");

  const handleChange = (newValue: string) => {
    setInternalValue(newValue);
    onChange?.(newValue);
  };

  const selectedOption = options.find((opt) => opt.value === internalValue);

  if (type === "radio") {
    return (
      <div className="flex flex-col gap-[var(--space-3)]">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              radioGroupVariants({
                selected: internalValue === option.value,
              }),
              disabled && "pointer-events-none opacity-50"
            )}
          >
            <input
              type="radio"
              name="age-range"
              value={option.value}
              checked={internalValue === option.value}
              onChange={(e) => handleChange(e.target.value)}
              disabled={disabled}
              className="w-4 h-4 accent-[var(--color-accent-500)] cursor-pointer"
              aria-label={option.label}
            />
            <span className="text-[var(--text-base)] font-[var(--weight-regular)] text-[var(--color-text-primary)]">
              {option.label}
            </span>
            {internalValue === option.value && (
              <Check
                className="ml-auto w-4 h-4 text-[var(--color-accent-500)]"
                aria-hidden="true"
              />
            )}
          </label>
        ))}
      </div>
    );
  }

  return (
    <Select.Root value={internalValue} onValueChange={handleChange}>
      <Select.Trigger
        disabled={disabled}
        className={cn(
          selectVariants({ type: "dropdown" }),
          "relative w-full"
        )}
        aria-label="Age range selector"
      >
        <Select.Value placeholder={placeholder}>
          {selectedOption?.label || placeholder}
        </Select.Value>
        <Select.Icon className="ml-auto">
          <ChevronDown
            className="w-4 h-4 text-[var(--color-text-secondary)]"
            aria-hidden="true"
          />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          className="bg-[var(--color-surface-raised)] border border-[var(--color-border-default)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] overflow-hidden z-50"
          position="popper"
          sideOffset={8}
        >
          <Select.ScrollUpButton className="flex items-center justify-center h-[var(--control-sm)] text-[var(--color-text-secondary)]" />
          <Select.Viewport className="p-[var(--space-2)]">
            {options.map((option) => (
              <Select.Item
                key={option.value}
                value={option.value}
                className="relative flex items-center gap-[var(--space-3)] px-4 py-3 rounded-[var(--radius-md)] text-[var(--color-text-primary)] hover:bg-[var(--color-neutral-50)] active:bg-[var(--color-neutral-100)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-0 cursor-pointer transition-all duration-[var(--duration-fast)] ease-[var(--easing-standard)]"
              >
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator className="ml-auto">
                  <Check
                    className="w-4 h-4 text-[var(--color-accent-500)]"
                    aria-hidden="true"
                  />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
          <Select.ScrollDownButton className="flex items-center justify-center h-[var(--control-sm)] text-[var(--color-text-secondary)]" />
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}