import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import {
  Archive,
  CheckCircle2,
  ClipboardList,
  Clock,
  Inbox,
  Loader2,
  Reply,
  UserRound,
  type LucideIcon,
} from "lucide-react"

import { cn } from "./cn"
import { Separator } from "./separator"

const buttonGroupVariants = cva(
  "group/button-group flex w-fit items-stretch *:focus-visible:relative *:focus-visible:z-10 has-[>[data-slot=button-group]]:gap-2 has-[select[aria-hidden=true]:last-child]:[&>[data-slot=select-trigger]:last-of-type]:rounded-r-lg [&>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&>input]:flex-1",
  {
    variants: {
      orientation: {
        horizontal:
          "[&>*:not(:first-child)]:rounded-l-none [&>*:not(:first-child)]:border-l-0 [&>*:not(:last-child)]:rounded-r-none [&>[data-slot]:not(:has(~[data-slot]))]:rounded-r-lg!",
        vertical:
          "flex-col [&>*:not(:first-child)]:rounded-t-none [&>*:not(:first-child)]:border-t-0 [&>*:not(:last-child)]:rounded-b-none [&>[data-slot]:not(:has(~[data-slot]))]:rounded-b-lg!",
      },
    },
    defaultVariants: {
      orientation: "horizontal",
    },
  }
)

function ButtonGroup({
  className,
  orientation,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof buttonGroupVariants>) {
  return (
    <div
      role="group"
      data-slot="button-group"
      data-orientation={orientation}
      className={cn(buttonGroupVariants({ orientation }), className)}
      {...props}
    />
  )
}

function ButtonGroupText({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & {
  asChild?: boolean
}) {
  const Comp = asChild ? Slot.Root : "div"

  return (
    <Comp
      className={cn(
        "flex items-center gap-2 rounded-lg border bg-muted px-2.5 text-sm font-medium [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function ButtonGroupSeparator({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="button-group-separator"
      orientation={orientation}
      className={cn(
        "relative self-stretch bg-input data-horizontal:mx-px data-horizontal:w-auto data-vertical:my-px data-vertical:h-auto",
        className
      )}
      {...props}
    />
  )
}

const STATUS_ICONS: Record<string, LucideIcon> = {
  open: Inbox,
  unassigned: Inbox,
  assigned: UserRound,
  pending: Clock,
  replied: Reply,
  resolved: CheckCircle2,
  closed: CheckCircle2,
  archived: Archive,
  triaged: ClipboardList,
}

type QuickAction = {
  label: string
  value: string
  disabled?: boolean
  icon?: LucideIcon
}

type QuickActionsProps = React.ComponentProps<"div"> & {
  /** Actions that change status or assignment. */
  actions: QuickAction[]
  /** The currently selected action value. */
  value?: string
  /** Called when an action is selected. */
  onValueChange?: (value: string) => void
  /** Action value currently processing; shows a spinner in that button. */
  loadingValue?: string | null
}

function getActionIcon(action: QuickAction): LucideIcon {
  if (action.icon) return action.icon
  return STATUS_ICONS[action.value.toLowerCase()] ?? Inbox
}

function QuickActions({
  className,
  actions,
  value,
  onValueChange,
  loadingValue,
  ...props
}: QuickActionsProps) {
  if (actions.length === 0) return null

  return (
    <div
      role="group"
      data-slot="quick-actions"
      className={cn("flex w-fit items-center gap-2", className)}
      {...props}
    >
      {actions.map((action) => {
        const isActive = value === action.value
        const isLoading = loadingValue === action.value
        const Icon = getActionIcon(action)

        return (
          <button
            key={action.value}
            type="button"
            data-slot="quick-action"
            data-active={isActive || undefined}
            aria-pressed={isActive}
            aria-busy={isLoading || undefined}
            disabled={action.disabled || isLoading}
            onClick={() => onValueChange?.(action.value)}
            className={cn(
              "flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
              isActive
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent hover:text-accent-foreground"
            )}
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Icon className="size-4" aria-hidden="true" />
            )}
            <span>{action.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
  QuickActions,
  buttonGroupVariants,
}

export type { QuickAction, QuickActionsProps }