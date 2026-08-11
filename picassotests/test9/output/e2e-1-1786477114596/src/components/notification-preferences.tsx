"use client"

import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"
import { Label } from "./label"

import { cn } from "./cn"
import { IconPlaceholder } from "./icon-placeholder"

interface NotificationPreferencesProps {
  emailNotifications: boolean
  pushNotifications: boolean
  onEmailNotificationsChange: (checked: boolean) => void
  onPushNotificationsChange: (checked: boolean) => void
  className?: string
}

function NotificationPreferences({
  emailNotifications,
  pushNotifications,
  onEmailNotificationsChange,
  onPushNotificationsChange,
  className,
}: NotificationPreferencesProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex h-10 items-center gap-2 border-b border-border p-2">
        <Checkbox
          id="email-notifications"
          checked={emailNotifications}
          onCheckedChange={onEmailNotificationsChange}
          aria-label="Email notifications"
        />
        <Label
          htmlFor="email-notifications"
          className="text-sm font-medium leading-none text-foreground"
        >
          Email notifications
        </Label>
      </div>
      <div className="flex h-10 items-center gap-2 p-2">
        <Checkbox
          id="push-notifications"
          checked={pushNotifications}
          onCheckedChange={onPushNotificationsChange}
          aria-label="Push notifications"
        />
        <Label
          htmlFor="push-notifications"
          className="text-sm font-medium leading-none text-foreground"
        >
          Push notifications
        </Label>
      </div>
    </div>
  )
}

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input transition-colors outline-none group-has-disabled/field:opacity-50 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-invalid:aria-checked:border-primary dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground dark:data-checked:bg-primary",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none [&>svg]:size-3.5"
      >
        <IconPlaceholder
          lucide="CheckIcon"
          tabler="IconCheck"
          hugeicons="Tick02Icon"
          phosphor="CheckIcon"
          remixicon="RiCheckLine"
        />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox, NotificationPreferences }