"use client"

import * as React from "react"
import { cn } from "./cn"
import { CheckCircle2, Clock, Star } from "lucide-react"

// ─── Primitive table primitives (kept from base, tuned for Meridian) ─────────

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm font-sans", className)}
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
        "border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted",
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
        "h-10 px-4 text-left align-middle font-medium whitespace-nowrap text-muted-foreground [&:has([role=checkbox])]:pr-0",
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
        "p-4 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0",
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

// ─── Meridian Team Leaderboard ────────────────────────────────────────────────

export interface TeamMember {
  id: string
  name: string
  resolved: number
  avgResponse: string
  satisfaction: number
}

export interface TeamLeaderboardProps
  extends Omit<React.ComponentProps<"table">, "children"> {
  members: TeamMember[]
  loading?: boolean
  error?: string | null
}

function TeamLeaderboard({
  members,
  loading = false,
  error = null,
  className,
  ...props
}: TeamLeaderboardProps) {
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/)
    if (parts.length === 0) return "?"
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase()
  }

  const getAvatarColor = (name: string) => {
    // Deterministic accent variation based on name — uses only theme slots
    const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const variants = [
      "bg-primary text-primary-foreground",
      "bg-secondary text-secondary-foreground",
      "bg-muted text-foreground",
      "bg-accent text-accent-foreground",
    ]
    return variants[hash % variants.length]
  }

  const getSatisfactionColor = (score: number) => {
    if (score >= 90) return "text-primary"
    if (score >= 75) return "text-foreground"
    return "text-muted-foreground"
  }

  if (loading) {
    return (
      <div
        data-slot="team-leaderboard-loading"
        className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6"
        role="status"
        aria-label="Loading team leaderboard"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
          <div className="flex flex-col gap-2">
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            <div className="h-3 w-24 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
          <div className="flex flex-col gap-2">
            <div className="h-4 w-28 animate-pulse rounded bg-muted" />
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
          <div className="flex flex-col gap-2">
            <div className="h-4 w-36 animate-pulse rounded bg-muted" />
            <div className="h-3 w-24 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <span className="sr-only">Loading team performance data</span>
      </div>
    )
  }

  if (error) {
    return (
      <div
        data-slot="team-leaderboard-error"
        className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-6"
        role="alert"
      >
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-destructive">Unable to load leaderboard</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
        <span className="text-2xl" aria-hidden="true">
          ⚠
        </span>
      </div>
    )
  }

  if (!members || members.length === 0) {
    return (
      <div
        data-slot="team-leaderboard-empty"
        className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card p-10 text-center"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <CheckCircle2 className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        </div>
        <p className="text-sm font-medium text-foreground">No team members yet</p>
        <p className="max-w-[40ch] text-sm text-muted-foreground">
          Add teammates to your Meridian workspace to start tracking response times and resolution rates.
        </p>
      </div>
    )
  }

  return (
    <Table className={className} {...props}>
      <TableHeader>
        <TableRow className="bg-muted">
          <TableHead className="w-12 text-xs font-medium">Rank</TableHead>
          <TableHead className="text-xs font-medium">Agent</TableHead>
          <TableHead className="text-xs font-medium">Resolved</TableHead>
          <TableHead className="text-xs font-medium">Avg Response</TableHead>
          <TableHead className="text-xs font-medium">Satisfaction</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member, index) => (
          <TableRow key={member.id} className="h-12">
            <TableCell className="text-xs font-medium tabular-nums text-muted-foreground">
              {index === 0 ? (
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  1
                </span>
              ) : (
                index + 1
              )}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${getAvatarColor(
                    member.name
                  )}`}
                  aria-hidden="true"
                >
                  {getInitials(member.name)}
                </div>
                <span className="text-sm font-medium text-foreground">
                  {member.name}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
                <span className="text-sm tabular-nums text-foreground">
                  {member.resolved}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span className="text-sm tabular-nums text-foreground">
                  {member.avgResponse}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1.5">
                <Star className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span
                  className={`text-sm font-medium tabular-nums ${getSatisfactionColor(
                    member.satisfaction
                  )}`}
                >
                  {member.satisfaction}%
                </span>
              </div>
            </TableCell>
          </TableRow>
        ))}
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
  TeamLeaderboard,
}