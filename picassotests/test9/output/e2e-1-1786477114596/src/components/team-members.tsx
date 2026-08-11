"use client"

import * as React from "react"
import { Check, ChevronsUpDown, MoreHorizontal, UserRound } from "lucide-react"

import { cn } from "./cn"
import { Button } from "./button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu"

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
}

interface TeamMembersProps {
  members: TeamMember[]
}

const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "agent", label: "Agent" },
  { value: "viewer", label: "Viewer" },
]

function RoleSelect({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const currentRole = ROLES.find((role) => role.value === value) || ROLES[1]

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="h-8 w-28 justify-between gap-2 rounded-md border-border bg-background px-2 text-xs font-medium text-foreground hover:bg-muted/50"
        >
          {currentRole.label}
          <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 rounded-md border-border bg-popover p-1 shadow-md">
        <DropdownMenuLabel className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          Change role
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border" />
        {ROLES.map((role) => (
          <DropdownMenuItem
            key={role.value}
            onClick={() => {
              onChange(role.value)
              setOpen(false)
            }}
            className="flex items-center justify-between rounded-sm px-2 py-1.5 text-xs font-medium text-foreground hover:bg-muted/50 focus:bg-muted/50"
          >
            {role.label}
            {role.value === value && <Check className="h-3.5 w-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto rounded-lg border border-border bg-card"
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
        "h-10 px-4 text-left align-middle text-xs font-medium whitespace-nowrap text-muted-foreground [&:has([role=checkbox])]:pr-0",
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
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0",
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

function TeamMembers({ members }: TeamMembersProps) {
  const [memberRoles, setMemberRoles] = React.useState<Record<string, string>>(() =>
    members.reduce(
      (acc, member) => {
        acc[member.id] = member.role
        return acc
      },
      {} as Record<string, string>
    )
  )

  const handleRoleChange = (memberId: string, newRole: string) => {
    setMemberRoles((prev) => ({ ...prev, [memberId]: newRole }))
  }

  if (!members || members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card px-6 py-12 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
          <UserRound className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">No team members yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Invite your first teammate to start triaging conversations together.
          </p>
        </div>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader className="bg-muted">
        <TableRow className="border-border hover:bg-muted">
          <TableHead className="w-[320px]">Member</TableHead>
          <TableHead>Role</TableHead>
          <TableHead className="w-[80px] text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <TableRow key={member.id} className="h-12 border-border hover:bg-muted/50">
            <TableCell className="px-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-foreground">
                  {member.name
                    .split(" ")
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{member.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                </div>
              </div>
            </TableCell>
            <TableCell className="px-4">
              <RoleSelect
                value={memberRoles[member.id] || "agent"}
                onChange={(newRole) => handleRoleChange(member.id, newRole)}
              />
            </TableCell>
            <TableCell className="px-4 text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open actions for {member.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 rounded-md border-border bg-popover p-1 shadow-md">
                  <DropdownMenuItem className="rounded-sm px-2 py-1.5 text-xs font-medium text-foreground hover:bg-muted/50 focus:bg-muted/50">
                    View activity
                  </DropdownMenuItem>
                  <DropdownMenuItem className="rounded-sm px-2 py-1.5 text-xs font-medium text-foreground hover:bg-muted/50 focus:bg-muted/50">
                    Edit profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem className="rounded-sm px-2 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 focus:bg-destructive/10">
                    Remove member
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
  TeamMembers,
}