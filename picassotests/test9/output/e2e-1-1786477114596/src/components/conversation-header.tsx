import * as React from "react"

import { cn } from "./cn"

function Card({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-lg bg-card py-(--card-spacing) text-sm text-card-foreground ring-1 ring-border [--card-spacing:--spacing(4)] has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(3)] data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-lg *:[img:last-child]:rounded-b-lg",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-lg px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing)",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-heading text-base leading-snug font-medium group-data-[size=sm]/card:text-sm",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-(--card-spacing)", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center rounded-b-lg border-t bg-muted/50 p-(--card-spacing)",
        className
      )}
      {...props}
    />
  )
}

function ConversationHeader({
  customerName,
  customerEmail,
  subject,
  status,
  priority,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  customerName: string
  customerEmail: string
  subject: string
  status: string
  priority: string
}) {
  const priorityLabel = priority.charAt(0).toUpperCase() + priority.slice(1)
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1)

  return (
    <Card
      data-slot="conversation-header"
      className={cn("group/conversation-header", className)}
      {...props}
    >
      <CardHeader className="grid-cols-[1fr_auto]">
        <div className="grid gap-1">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary font-heading text-sm font-medium text-secondary-foreground">
              {customerName
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </div>
            <div className="grid gap-0.5">
              <CardTitle className="font-heading text-base font-medium">
                {customerName}
              </CardTitle>
              <CardDescription className="text-xs">
                {customerEmail}
              </CardDescription>
            </div>
          </div>
          <div className="mt-2 font-sans text-sm text-foreground">
            {subject}
          </div>
        </div>
        <CardAction className="flex items-center gap-2">
          <span
            data-slot="status-badge"
            className="inline-flex h-7 items-center rounded-md bg-secondary px-2.5 text-xs font-medium text-secondary-foreground"
          >
            {statusLabel}
          </span>
          <span
            data-slot="priority-badge"
            data-priority={priority}
            className={cn(
              "inline-flex h-7 items-center rounded-md px-2.5 text-xs font-medium",
              priority === "high"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            )}
          >
            {priorityLabel}
          </span>
        </CardAction>
      </CardHeader>
    </Card>
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  ConversationHeader,
}