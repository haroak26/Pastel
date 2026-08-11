"use client"

import * as React from "react"
import { Checkbox } from "./checkbox"
import { cn } from "./cn"

interface Conversation {
  id: string
  customerName: string
  customerEmail: string
  subject: string
  status: string
  priority: string
  assignee: string
  due: string
  updated: string
}

interface ConversationTableProps extends React.ComponentProps<"div"> {
  conversations: Conversation[]
  selectedIds?: string[]
  onSelectionChange?: (ids: string[]) => void
}

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto rounded-md border border-border"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "h-12 border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-10 bg-muted px-3 text-left align-middle text-xs font-medium whitespace-nowrap text-muted-foreground [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-3 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function StatusBadge({ status }: { status: string }) {
  const statusStyles: Record<string, string> = {
    open: "bg-secondary text-secondary-foreground",
    pending: "bg-accent text-accent-foreground",
    resolved: "bg-muted text-muted-foreground",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium",
        statusStyles[status] || "bg-muted text-muted-foreground"
      )}
    >
      {status}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const priorityStyles: Record<string, string> = {
    high: "bg-destructive text-destructive-foreground",
    medium: "bg-primary text-primary-foreground",
    low: "bg-secondary text-secondary-foreground",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium",
        priorityStyles[priority] || "bg-muted text-muted-foreground"
      )}
    >
      {priority}
    </span>
  )
}

function ConversationTable({
  conversations,
  selectedIds = [],
  onSelectionChange,
  className,
  ...props
}: ConversationTableProps) {
  const allSelected = conversations.length > 0 && selectedIds.length === conversations.length

  const toggleAll = () => {
    if (!onSelectionChange) return
    if (allSelected) {
      onSelectionChange([])
    } else {
      onSelectionChange(conversations.map((c) => c.id))
    }
  }

  const toggleOne = (id: string) => {
    if (!onSelectionChange) return
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id))
    } else {
      onSelectionChange([...selectedIds, id])
    }
  }

  return (
    <div className={cn("w-full", className)} {...props}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={toggleAll}
                aria-label="Select all conversations"
              />
            </TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead>Due</TableHead>
            <TableHead>Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {conversations.map((conversation) => (
            <TableRow
              key={conversation.id}
              data-state={selectedIds.includes(conversation.id) ? "selected" : undefined}
            >
              <TableCell>
                <Checkbox
                  checked={selectedIds.includes(conversation.id)}
                  onCheckedChange={() => toggleOne(conversation.id)}
                  aria-label={`Select conversation from ${conversation.customerName}`}
                />
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">
                    {conversation.customerName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {conversation.customerEmail}
                  </span>
                </div>
              </TableCell>
              <TableCell className="max-w-[280px] truncate text-foreground">
                {conversation.subject}
              </TableCell>
              <TableCell>
                <StatusBadge status={conversation.status} />
              </TableCell>
              <TableCell>
                <PriorityBadge priority={conversation.priority} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {conversation.assignee || "Unassigned"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {conversation.due || "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {conversation.updated}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  ConversationTable,
}