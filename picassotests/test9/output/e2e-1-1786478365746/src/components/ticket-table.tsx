"use client"

import * as React from "react"
import { Clock } from "lucide-react"

import { cn } from "./cn"

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto rounded-lg border border-border"
    >
      <table
        data-slot="table"
        className={cn("w-full min-w-[760px] caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn(
        "bg-muted text-xs font-medium text-muted-foreground [&_tr]:border-b [&_tr]:border-border [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-muted",
        className
      )}
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
        "border-t bg-muted font-medium [&>tr]:last:border-b-0",
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
        "h-12 border-b border-border transition-colors hover:bg-accent has-aria-expanded:bg-accent data-[state=selected]:bg-accent",
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
        "h-12 px-3 text-left align-middle font-medium whitespace-nowrap text-muted-foreground [&:has([role=checkbox])]:pr-0",
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
        "px-3 py-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0",
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

export interface Ticket {
  id: string
  priority: string
  subject: string
  customer: string
  status: string
  assignee: string
  timer: string
}

export interface TicketTableProps extends React.ComponentProps<"table"> {
  tickets: Ticket[]
}

function getPriorityClasses(priority: string) {
  switch (priority.toLowerCase()) {
    case "urgent":
      return "bg-destructive text-destructive-foreground"
    case "high":
      return "bg-primary text-primary-foreground"
    case "medium":
      return "bg-secondary text-secondary-foreground"
    default:
      return "bg-muted text-muted-foreground border border-border"
  }
}

function TicketTable({ className, tickets, ...props }: TicketTableProps) {
  const rows = tickets ?? []

  return (
    <Table className={className} {...props}>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Priority</TableHead>
          <TableHead>Subject</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Assignee</TableHead>
          <TableHead>Timer</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow className="hover:bg-transparent">
            <TableCell
              colSpan={6}
              className="h-24 text-center text-sm text-muted-foreground"
            >
              No tickets in the queue — new inbound messages will land here.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((ticket) => (
            <TableRow key={ticket.id}>
              <TableCell>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                    getPriorityClasses(ticket.priority)
                  )}
                >
                  {ticket.priority}
                </span>
              </TableCell>
              <TableCell>
                <span className="font-medium text-foreground">
                  {ticket.subject}
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {ticket.customer}
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center rounded-full border border-border bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                  {ticket.status}
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {ticket.assignee}
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {ticket.timer}
                </span>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
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
  TicketTable,
}