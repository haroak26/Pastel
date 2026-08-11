"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "./cn"
import { Button } from "./button"
import { Input } from "./input"
import { Textarea } from "./textarea"

function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      role="group"
      className={cn(
        "group/input-group relative flex h-9 w-full min-w-0 items-center rounded-md border border-border bg-background transition-colors outline-none in-data-[slot=combobox-content]:focus-within:border-inherit in-data-[slot=combobox-content]:focus-within:ring-0 has-disabled:bg-input/50 has-disabled:opacity-50 has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-3 has-[[data-slot=input-group-control]:focus-visible]:ring-ring/50 has-[[data-slot][aria-invalid=true]]:border-destructive has-[[data-slot][aria-invalid=true]]:ring-3 has-[[data-slot][aria-invalid=true]]:ring-destructive/20 has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>textarea]:h-auto dark:bg-input/30 dark:has-disabled:bg-input/80 dark:has-[[data-slot][aria-invalid=true]]:ring-destructive/40 has-[>[data-align=block-end]]:[&>input]:pt-3 has-[>[data-align=block-start]]:[&>input]:pb-3 has-[>[data-align=inline-end]]:[&>input]:pr-1.5 has-[>[data-align=inline-start]]:[&>input]:pl-1.5",
        className
      )}
      {...props}
    />
  )
}

const inputGroupAddonVariants = cva(
  "flex h-auto cursor-text items-center justify-center gap-2 py-1.5 text-sm font-medium text-muted-foreground select-none group-data-[disabled=true]/input-group:opacity-50 [&>kbd]:rounded-[calc(var(--radius)-5px)] [&>svg:not([class*='size-'])]:size-4",
  {
    variants: {
      align: {
        "inline-start":
          "order-first pl-2 has-[>button]:ml-[-0.3rem] has-[>kbd]:ml-[-0.15rem]",
        "inline-end":
          "order-last pr-2 has-[>button]:mr-[-0.3rem] has-[>kbd]:mr-[-0.15rem]",
        "block-start":
          "order-first w-full justify-start px-2.5 pt-2 group-has-[>input]/input-group:pt-2 [.border-b]:pb-2",
        "block-end":
          "order-last w-full justify-start px-2.5 pb-2 group-has-[>input]/input-group:pb-2 [.border-t]:pt-2",
      },
    },
    defaultVariants: {
      align: "inline-start",
    },
  }
)

function InputGroupAddon({
  className,
  align = "inline-start",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof inputGroupAddonVariants>) {
  return (
    <div
      role="group"
      data-slot="input-group-addon"
      data-align={align}
      className={cn(inputGroupAddonVariants({ align }), className)}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button")) {
          return
        }
        e.currentTarget.parentElement?.querySelector("input")?.focus()
      }}
      {...props}
    />
  )
}

const inputGroupButtonVariants = cva(
  "flex items-center gap-2 text-sm shadow-none",
  {
    variants: {
      size: {
        xs: "h-6 gap-1 rounded-[calc(var(--radius)-3px)] px-1.5 [&>svg:not([class*='size-'])]:size-3.5",
        sm: "",
        "icon-xs":
          "size-6 rounded-[calc(var(--radius)-3px)] p-0 has-[>svg]:p-0",
        "icon-sm": "size-8 p-0 has-[>svg]:p-0",
      },
    },
    defaultVariants: {
      size: "xs",
    },
  }
)

function InputGroupButton({
  className,
  type = "button",
  variant = "ghost",
  size = "xs",
  ...props
}: Omit<React.ComponentProps<typeof Button>, "size"> &
  VariantProps<typeof inputGroupButtonVariants>) {
  return (
    <Button
      type={type}
      data-size={size}
      variant={variant}
      className={cn(inputGroupButtonVariants({ size }), className)}
      {...props}
    />
  )
}

function InputGroupText({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "flex items-center gap-2 text-sm text-muted-foreground [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function InputGroupInput({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <Input
      data-slot="input-group-control"
      className={cn(
        "flex-1 rounded-none border-0 bg-transparent shadow-none ring-0 focus-visible:ring-0 disabled:bg-transparent aria-invalid:ring-0 dark:bg-transparent dark:disabled:bg-transparent",
        className
      )}
      {...props}
    />
  )
}

function InputGroupTextarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <Textarea
      data-slot="input-group-control"
      className={cn(
        "flex-1 resize-none rounded-none border-0 bg-transparent py-2 shadow-none ring-0 focus-visible:ring-0 disabled:bg-transparent aria-invalid:ring-0 dark:bg-transparent dark:disabled:bg-transparent",
        className
      )}
      {...props}
    />
  )
}

// ─── TagInput ────────────────────────────────────────────────────────────────

interface TagInputProps extends Omit<React.ComponentProps<"div">, "onChange"> {
  /** Current tags to display */
  tags: string[]
  /** Callback fired when a tag is removed */
  onRemove?: (tag: string) => void
  /** Optional placeholder for the underlying input */
  placeholder?: string
  /** Disable all interaction */
  disabled?: boolean
  /** Show loading state */
  loading?: boolean
  /** Show error state */
  error?: boolean
  /** Accessible label for the remove button */
  removeLabel?: (tag: string) => string
}

function TagInput({
  className,
  tags = [],
  onRemove,
  placeholder = "Add a tag…",
  disabled = false,
  loading = false,
  error = false,
  removeLabel = (tag) => `Remove ${tag}`,
  ...props
}: TagInputProps) {
  return (
    <div
      data-slot="tag-input"
      role="group"
      aria-disabled={disabled || undefined}
      className={cn(
        "group/tag-input relative flex h-9 w-full min-w-0 flex-wrap items-center gap-1 rounded-md border border-border bg-background px-1.5 py-1 transition-colors outline-none",
        "has-[[data-slot=tag-input-control]:focus-visible]:border-ring has-[[data-slot=tag-input-control]:focus-visible]:ring-3 has-[[data-slot=tag-input-control]:focus-visible]:ring-ring/50",
        "has-[[data-slot=tag-input-control][aria-invalid=true]]:border-destructive has-[[data-slot=tag-input-control][aria-invalid=true]]:ring-3 has-[[data-slot=tag-input-control][aria-invalid=true]]:ring-destructive/20",
        "has-disabled:bg-input/50 has-disabled:opacity-50",
        error && "border-destructive ring-3 ring-destructive/20",
        className
      )}
      {...props}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          data-slot="tag-chip"
          className="inline-flex h-6 items-center gap-1 rounded-sm bg-accent px-2 text-xs font-medium text-foreground"
        >
          {tag}
          <button
            type="button"
            aria-label={removeLabel(tag)}
            disabled={disabled || loading}
            onClick={() => onRemove?.(tag)}
            className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50"
          >
            <X className="size-3" aria-hidden="true" />
          </button>
        </span>
      ))}
      <InputGroupInput
        data-slot="tag-input-control"
        disabled={disabled}
        placeholder={placeholder}
        aria-invalid={error || undefined}
        className="h-6 min-w-24 flex-1 px-1 text-sm"
      />
      {loading && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-2 top-1/2 size-3 -translate-y-1/2 animate-spin rounded-full border-2 border-border border-t-primary"
        />
      )}
    </div>
  )
}

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
  TagInput,
}