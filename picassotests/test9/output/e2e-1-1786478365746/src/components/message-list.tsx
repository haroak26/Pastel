"use client"

import * as React from "react"
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui"
import { AlertCircle, Inbox, Loader2 } from "lucide-react"

import { cn } from "./cn"

function ScrollArea({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root>) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn("relative", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className="size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        "flex touch-none p-px transition-colors select-none data-horizontal:h-2.5 data-horizontal:flex-col data-horizontal:border-t data-horizontal:border-t-transparent data-vertical:h-full data-vertical:w-2.5 data-vertical:border-l data-vertical:border-l-transparent",
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="scroll-area-thumb"
        className="relative flex-1 rounded-full bg-border"
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
}

export interface Message {
  id: string
  sender: string
  content: string
  timestamp: string
}

export interface MessageListProps extends React.ComponentProps<typeof ScrollAreaPrimitive.Root> {
  messages: Message[]
  loading?: boolean
  error?: boolean
  disabled?: boolean
  emptyMessage?: string
  errorMessage?: string
  className?: string
}

function MessageList({
  messages,
  loading = false,
  error = false,
  disabled = false,
  emptyMessage,
  errorMessage,
  className,
  ...props
}: MessageListProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null)

  return (
    <ScrollArea
      data-slot="message-list"
      className={cn(
        "h-96 max-h-[60vh] rounded-lg border border-border bg-card font-sans",
        className
      )}
      {...props}
    >
      <div className="flex flex-col gap-3 p-4">
        {loading ? (
          <div className="flex h-full items-center justify-center py-10" role="status">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
            <span className="sr-only">Loading messages</span>
          </div>
        ) : error ? (
          <div
            className="flex flex-col items-center justify-center gap-2 py-10 text-center"
            role="alert"
          >
            <AlertCircle className="size-6 text-destructive" />
            <p className="text-sm font-medium text-foreground">
              {errorMessage ?? "Failed to load messages."}
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <Inbox className="size-6 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              {emptyMessage ?? "No messages yet."}
            </p>
            <p className="text-xs text-muted-foreground">
              Replies will appear here as they arrive.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {messages.map((message) => {
              const isActive = activeId === message.id

              return (
                <li key={message.id} className="list-none">
                  <button
                    type="button"
                    data-active={isActive || undefined}
                    aria-pressed={isActive}
                    disabled={disabled}
                    onClick={() => setActiveId(isActive ? null : message.id)}
                    className={cn(
                      "group flex w-full flex-col gap-1.5 rounded-md border p-3 text-left transition-[color,background-color,border-color,box-shadow] duration-200",
                      "border-transparent bg-background hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1",
                      "data-[active=true]:border-ring data-[active=true]:bg-accent",
                      "disabled:pointer-events-none disabled:opacity-60"
                    )}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-semibold text-foreground group-hover:text-primary">
                        {message.sender}
                      </span>
                      <time className="text-xs font-medium text-muted-foreground">
                        {message.timestamp}
                      </time>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground group-hover:text-foreground">
                      {message.content}
                    </p>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </ScrollArea>
  )
}

export { ScrollArea, ScrollBar, MessageList }