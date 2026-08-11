import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "./cn"
import { Separator } from "./separator"
import { Button } from "./button"

const buttonGroupVariants = cva(
  "group/button-group flex w-fit items-stretch *:focus-visible:relative *:focus-visible:z-10 has-[>[data-slot=button-group]]:gap-2 has-[select[aria-hidden=true]:last-child]:[&>[data-slot=select-trigger]:last-of-type]:rounded-r-md [&>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&>input]:flex-1",
  {
    variants: {
      orientation: {
        horizontal:
          "[&>*:not(:first-child)]:rounded-l-none [&>*:not(:first-child)]:border-l-0 [&>*:not(:last-child)]:rounded-r-none [&>[data-slot]:not(:has(~[data-slot]))]:rounded-r-md!",
        vertical:
          "flex-col [&>*:not(:first-child)]:rounded-t-none [&>*:not(:first-child)]:border-t-0 [&>*:not(:last-child)]:rounded-b-none [&>[data-slot]:not(:has(~[data-slot]))]:rounded-b-md!",
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
        "flex items-center gap-2 rounded-md border-border bg-muted px-2.5 text-sm font-medium [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
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
        "relative self-stretch bg-border data-horizontal:mx-px data-horizontal:w-auto data-vertical:my-px data-vertical:h-auto",
        className
      )}
      {...props}
    />
  )
}

export interface BulkActionsProps {
  selectedCount: number
  onAssign: () => void
  onStatusChange: () => void
  onPriorityChange: () => void
}

function BulkActions({
  selectedCount,
  onAssign,
  onStatusChange,
  onPriorityChange,
}: BulkActionsProps) {
  return (
    <ButtonGroup className="border-border">
      <ButtonGroupText className="h-9 border-border bg-muted text-muted-foreground">
        {selectedCount} selected
      </ButtonGroupText>
      <ButtonGroupSeparator />
      <Button
        variant="secondary"
        size="sm"
        className="h-9 rounded-md border-border"
        onClick={onAssign}
      >
        Assign
      </Button>
      <Button
        variant="secondary"
        size="sm"
        className="h-9 rounded-md border-border"
        onClick={onStatusChange}
      >
        Status
      </Button>
      <Button
        variant="secondary"
        size="sm"
        className="h-9 rounded-md border-border"
        onClick={onPriorityChange}
      >
        Priority
      </Button>
    </ButtonGroup>
  )
}

export {
  BulkActions,
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
  buttonGroupVariants,
}