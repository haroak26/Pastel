import * as React from "react"

import { cn } from "./cn"

function MessageGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="message-group"
      className={cn("flex min-w-0 flex-col gap-3", className)}
      {...props}
    />
  )
}

function Message({
  className,
  align = "start",
  ...props
}: React.ComponentProps<"div"> & { align?: "start" | "end" }) {
  return (
    <div
      data-slot="message"
      data-align={align}
      className={cn(
        "group/message relative flex w-full min-w-0 gap-3 text-sm data-[align=end]:flex-row-reverse",
        className
      )}
      {...props}
    />
  )
}

function MessageAvatar({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="message-avatar"
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center self-end overflow-hidden rounded-full bg-muted text-xs font-medium text-muted-foreground group-has-data-[slot=message-footer]/message:-translate-y-8",
        className
      )}
      {...props}
    />
  )
}

function MessageContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="message-content"
      className={cn(
        "flex w-full min-w-0 flex-col gap-2.5 wrap-break-word group-data-[align=end]/message:*:data-slot:self-end",
        className
      )}
      {...props}
    />
  )
}

function MessageHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="message-header"
      className={cn(
        "flex max-w-full min-w-0 items-center gap-2 px-3 text-xs font-medium text-muted-foreground group-has-data-[variant=ghost]/message:px-0",
        className
      )}
      {...props}
    />
  )
}

function MessageFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="message-footer"
      className={cn(
        "flex max-w-full min-w-0 items-center px-3 text-xs font-medium text-muted-foreground group-has-data-[variant=ghost]/message:px-0 group-data-[align=end]/message:justify-end",
        className
      )}
      {...props}
    />
  )
}

function MessageItem({
  sender,
  content,
  timestamp,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  sender: string
  content: string
  timestamp: string
}) {
  const formattedTime = React.useMemo(() => {
    if (!timestamp) return ""
    try {
      return new Date(timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return ""
    }
  }, [timestamp])

  return (
    <Message className={className} {...props}>
      <MessageAvatar>
        <span className="font-heading text-sm font-medium">
          {sender?.charAt(0)?.toUpperCase() || "?"}
        </span>
      </MessageAvatar>
      <MessageContent>
        <MessageHeader>
          <span className="text-sm font-medium text-foreground">{sender}</span>
          <span className="text-xs text-muted-foreground">{formattedTime}</span>
        </MessageHeader>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm leading-relaxed text-foreground">{content}</p>
        </div>
      </MessageContent>
    </Message>
  )
}

export {
  MessageGroup,
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageHeader,
  MessageItem,
}