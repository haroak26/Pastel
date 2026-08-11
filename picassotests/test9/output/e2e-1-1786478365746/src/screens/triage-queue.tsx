import { Topbar as TopbarTopbar, NavigationMenu as TopbarNavigationMenu, NavigationMenuList as TopbarNavigationMenuList, NavigationMenuItem as TopbarNavigationMenuItem, NavigationMenuContent as TopbarNavigationMenuContent, NavigationMenuTrigger as TopbarNavigationMenuTrigger, NavigationMenuLink as TopbarNavigationMenuLink, NavigationMenuIndicator as TopbarNavigationMenuIndicator, NavigationMenuViewport as TopbarNavigationMenuViewport, navigationMenuTriggerStyle as TopbarnavigationMenuTriggerStyle } from "./topbar"
import { Sidebar as SidebarSidebar, SidebarContent as SidebarSidebarContent, SidebarFooter as SidebarSidebarFooter, SidebarGroup as SidebarSidebarGroup, SidebarGroupAction as SidebarSidebarGroupAction, SidebarGroupContent as SidebarSidebarGroupContent, SidebarGroupLabel as SidebarSidebarGroupLabel, SidebarHeader as SidebarSidebarHeader, SidebarInput as SidebarSidebarInput, SidebarInset as SidebarSidebarInset, SidebarMenu as SidebarSidebarMenu, SidebarMenuAction as SidebarSidebarMenuAction, SidebarMenuBadge as SidebarSidebarMenuBadge, SidebarMenuButton as SidebarSidebarMenuButton, SidebarMenuItem as SidebarSidebarMenuItem, SidebarMenuSkeleton as SidebarSidebarMenuSkeleton, SidebarMenuSub as SidebarSidebarMenuSub, SidebarMenuSubButton as SidebarSidebarMenuSubButton, SidebarMenuSubItem as SidebarSidebarMenuSubItem, SidebarProvider as SidebarSidebarProvider, SidebarRail as SidebarSidebarRail, SidebarSeparator as SidebarSidebarSeparator, SidebarTrigger as SidebarSidebarTrigger, useSidebar as SidebaruseSidebar } from "./sidebar"
import { Tabs as FilterTabsTabs, TabsList as FilterTabsTabsList, TabsTrigger as FilterTabsTabsTrigger, TabsContent as FilterTabsTabsContent, tabsListVariants as FilterTabstabsListVariants } from "./filter-tabs"
import { Select as PriorityFilterSelect, SelectContent as PriorityFilterSelectContent, SelectGroup as PriorityFilterSelectGroup, SelectItem as PriorityFilterSelectItem, SelectLabel as PriorityFilterSelectLabel, SelectScrollDownButton as PriorityFilterSelectScrollDownButton, SelectScrollUpButton as PriorityFilterSelectScrollUpButton, SelectSeparator as PriorityFilterSelectSeparator, SelectTrigger as PriorityFilterSelectTrigger, SelectValue as PriorityFilterSelectValue } from "./priority-filter"
import { Select as AssigneeFilterSelect, SelectContent as AssigneeFilterSelectContent, SelectGroup as AssigneeFilterSelectGroup, SelectItem as AssigneeFilterSelectItem, SelectLabel as AssigneeFilterSelectLabel, SelectScrollDownButton as AssigneeFilterSelectScrollDownButton, SelectScrollUpButton as AssigneeFilterSelectScrollUpButton, SelectSeparator as AssigneeFilterSelectSeparator, SelectTrigger as AssigneeFilterSelectTrigger, SelectValue as AssigneeFilterSelectValue } from "./assignee-filter"
import { Table as TicketTableTable, TableHeader as TicketTableTableHeader, TableBody as TicketTableTableBody, TableFooter as TicketTableTableFooter, TableHead as TicketTableTableHead, TableRow as TicketTableTableRow, TableCell as TicketTableTableCell, TableCaption as TicketTableTableCaption, TicketTable as TicketTableTicketTable } from "./ticket-table"
import { DropdownMenu as TicketRowActionsDropdownMenu, DropdownMenuPortal as TicketRowActionsDropdownMenuPortal, DropdownMenuTrigger as TicketRowActionsDropdownMenuTrigger, DropdownMenuContent as TicketRowActionsDropdownMenuContent, DropdownMenuGroup as TicketRowActionsDropdownMenuGroup, DropdownMenuLabel as TicketRowActionsDropdownMenuLabel, DropdownMenuItem as TicketRowActionsDropdownMenuItem, DropdownMenuCheckboxItem as TicketRowActionsDropdownMenuCheckboxItem, DropdownMenuRadioGroup as TicketRowActionsDropdownMenuRadioGroup, DropdownMenuRadioItem as TicketRowActionsDropdownMenuRadioItem, DropdownMenuSeparator as TicketRowActionsDropdownMenuSeparator, DropdownMenuShortcut as TicketRowActionsDropdownMenuShortcut, DropdownMenuSub as TicketRowActionsDropdownMenuSub, DropdownMenuSubTrigger as TicketRowActionsDropdownMenuSubTrigger, DropdownMenuSubContent as TicketRowActionsDropdownMenuSubContent, TicketRowActions as TicketRowActionsTicketRowActions } from "./ticket-row-actions"
import { Badge as PriorityBadgeBadge, badgeVariants as PriorityBadgebadgeVariants } from "./priority-badge"
import { Badge as StatusBadgeBadge, badgeVariants as StatusBadgebadgeVariants } from "./status-badge"
import { Badge as TimerBadgeBadge, badgeVariants as TimerBadgebadgeVariants, TimerBadge as TimerBadgeTimerBadge } from "./timer-badge"
import { Empty as QueueEmptyEmpty, EmptyHeader as QueueEmptyEmptyHeader, EmptyTitle as QueueEmptyEmptyTitle, EmptyDescription as QueueEmptyEmptyDescription, EmptyContent as QueueEmptyEmptyContent, EmptyMedia as QueueEmptyEmptyMedia } from "./queue-empty"
import { Dialog as AssignDialogDialog, DialogClose as AssignDialogDialogClose, DialogContent as AssignDialogDialogContent, DialogDescription as AssignDialogDialogDescription, DialogFooter as AssignDialogDialogFooter, DialogHeader as AssignDialogDialogHeader, DialogOverlay as AssignDialogDialogOverlay, DialogPortal as AssignDialogDialogPortal, DialogTitle as AssignDialogDialogTitle, DialogTrigger as AssignDialogDialogTrigger } from "./assign-dialog"
import { Card as ThreadTitleCard, CardHeader as ThreadTitleCardHeader, CardFooter as ThreadTitleCardFooter, CardTitle as ThreadTitleCardTitle, CardAction as ThreadTitleCardAction, CardDescription as ThreadTitleCardDescription, CardContent as ThreadTitleCardContent, ThreadTitle as ThreadTitleThreadTitle } from "./thread-title"
import { ButtonGroup as QuickActionsButtonGroup, ButtonGroupSeparator as QuickActionsButtonGroupSeparator, ButtonGroupText as QuickActionsButtonGroupText, QuickActions as QuickActionsQuickActions, buttonGroupVariants as QuickActionsbuttonGroupVariants } from "./quick-actions"
import { ScrollArea as MessageListScrollArea, ScrollBar as MessageListScrollBar, MessageList as MessageListMessageList } from "./message-list"
import { MessageGroup as MessageItemMessageGroup, Message as MessageItemMessage, MessageAvatar as MessageItemMessageAvatar, MessageContent as MessageItemMessageContent, MessageFooter as MessageItemMessageFooter, MessageHeader as MessageItemMessageHeader, MessageItem as MessageItemMessageItem } from "./message-item"
import { MessageGroup as InternalNoteMessageGroup, Message as InternalNoteMessage, MessageAvatar as InternalNoteMessageAvatar, MessageContent as InternalNoteMessageContent, MessageFooter as InternalNoteMessageFooter, MessageHeader as InternalNoteMessageHeader, InternalNote as InternalNoteInternalNote } from "./internal-note"
import { Textarea as ReplyTextareaTextarea } from "./reply-textarea"
import { Button as SendButtonButton, buttonVariants as SendButtonbuttonVariants } from "./send-button"
import { ToggleGroup as NoteToggleToggleGroup, ToggleGroupItem as NoteToggleToggleGroupItem, NoteToggle as NoteToggleNoteToggle } from "./note-toggle"
import { Select as AssigneeSelectSelect, SelectContent as AssigneeSelectSelectContent, SelectGroup as AssigneeSelectSelectGroup, SelectItem as AssigneeSelectSelectItem, SelectLabel as AssigneeSelectSelectLabel, SelectScrollDownButton as AssigneeSelectSelectScrollDownButton, SelectScrollUpButton as AssigneeSelectSelectScrollUpButton, SelectSeparator as AssigneeSelectSelectSeparator, SelectTrigger as AssigneeSelectSelectTrigger, SelectValue as AssigneeSelectSelectValue } from "./assignee-select"
import { InputGroup as TagInputInputGroup, InputGroupAddon as TagInputInputGroupAddon, InputGroupButton as TagInputInputGroupButton, InputGroupText as TagInputInputGroupText, InputGroupInput as TagInputInputGroupInput, InputGroupTextarea as TagInputInputGroupTextarea, TagInput as TagInputTagInput } from "./tag-input"
import { Progress as SlaTimerProgress } from "./sla-timer"
import { Card as CustomerInfoCard, CardHeader as CustomerInfoCardHeader, CardFooter as CustomerInfoCardFooter, CardTitle as CustomerInfoCardTitle, CardAction as CustomerInfoCardAction, CardDescription as CustomerInfoCardDescription, CardContent as CustomerInfoCardContent, CustomerInfo as CustomerInfoCustomerInfo } from "./customer-info"
import { Button as ButtonButton, buttonVariants as ButtonbuttonVariants } from "./button"
import { Input as InputInput } from "./input"
import { DropdownMenu as DropdownMenuDropdownMenu, DropdownMenuPortal as DropdownMenuDropdownMenuPortal, DropdownMenuTrigger as DropdownMenuDropdownMenuTrigger, DropdownMenuContent as DropdownMenuDropdownMenuContent, DropdownMenuGroup as DropdownMenuDropdownMenuGroup, DropdownMenuLabel as DropdownMenuDropdownMenuLabel, DropdownMenuItem as DropdownMenuDropdownMenuItem, DropdownMenuCheckboxItem as DropdownMenuDropdownMenuCheckboxItem, DropdownMenuRadioGroup as DropdownMenuDropdownMenuRadioGroup, DropdownMenuRadioItem as DropdownMenuDropdownMenuRadioItem, DropdownMenuSeparator as DropdownMenuDropdownMenuSeparator, DropdownMenuShortcut as DropdownMenuDropdownMenuShortcut, DropdownMenuSub as DropdownMenuDropdownMenuSub, DropdownMenuSubTrigger as DropdownMenuDropdownMenuSubTrigger, DropdownMenuSubContent as DropdownMenuDropdownMenuSubContent } from "./dropdown-menu"
import { Separator as SeparatorSeparator } from "./separator"
import { Sheet as SheetSheet, SheetTrigger as SheetSheetTrigger, SheetClose as SheetSheetClose, SheetContent as SheetSheetContent, SheetHeader as SheetSheetHeader, SheetFooter as SheetSheetFooter, SheetTitle as SheetSheetTitle, SheetDescription as SheetSheetDescription } from "./sheet"
import { Skeleton as SkeletonSkeleton } from "./skeleton"
import { Tooltip as TooltipTooltip, TooltipContent as TooltipTooltipContent, TooltipProvider as TooltipTooltipProvider, TooltipTrigger as TooltipTooltipTrigger } from "./tooltip"
import { IconPlaceholder as IconPlaceholderIconPlaceholder } from "./icon-placeholder"
import { Toggle as ToggleToggle, toggleVariants as ToggletoggleVariants } from "./toggle"
import { Textarea as TextareaTextarea } from "./textarea"

export default function TriageQueue() {
  return (
    <div className="min-h-screen bg-background">
      <div data-mount="topbar" className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
        <TopbarNavigationMenu>
          <TopbarNavigationMenuList>
            <TopbarNavigationMenuItem>
              <TopbarNavigationMenuTrigger>Meridian Inbox</TopbarNavigationMenuTrigger>
              <TopbarNavigationMenuContent>
                <TopbarNavigationMenuLink>Queue</TopbarNavigationMenuLink>
              </TopbarNavigationMenuContent>
            </TopbarNavigationMenuItem>
          </TopbarNavigationMenuList>
          <TopbarNavigationMenuIndicator />
          <TopbarNavigationMenuViewport />
        </TopbarNavigationMenu>
      </div>arNavigationMenuViewport />
        </div>         </div>Queue</div>
              </TopbarNavigationMenuContent>
            </TopbarNavigationMenuItem>
          </TopbarNavigationMenuList>
          <div data-mount="topbar" className="rounded-lg border border-border p-4 text-sm text-muted-foreground" />
          <div data-mount="topbar" className="rounded-lg border border-border p-4 text-sm text-muted-foreground" />
        </TopbarNavigationMenu>
      </TopbarTopbar>

      <div data-mount="sidebar" className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
        <div className="flex min-h-screen">
          <SidebarSidebar>
            <SidebarSidebarHeader>
              <SidebarSidebarMenu>
                <SidebarSidebarMenuItem>
                  <SidebarSidebarMenuButton asChild>
                    <a href="/queue">
                      <IconPlaceholderIconPlaceholder />
                      <span>Meridian Inbox</span>
                    </a>
                  </SidebarSidebarMenuButton>
                </SidebarSidebarMenuItem>
              </SidebarSidebarMenu>
            </SidebarSidebarHeader>
            <SidebarSidebarContent>
              <SidebarSidebarGroup>
                <SidebarSidebarGroupLabel>Queue views</SidebarSidebarGroupLabel>
                <SidebarSidebarGroupContent>
                  <SidebarSidebarMenu>
                    <SidebarSidebarMenuItem>
                      <SidebarSidebarMenuButton>
                        <IconPlaceholderIconPlaceholder />
                        <span>Inbox</span>
                      </SidebarSidebarMenuButton>
                    </SidebarSidebarMenuItem>
                    <SidebarSidebarMenuItem>
                      <SidebarSidebarMenuButton>
                        <IconPlaceholderIconPlaceholder />
                        <span>Assigned</span>
                      </SidebarSidebarMenuButton>
                    </SidebarSidebarMenuItem>
                    <SidebarSidebarMenuItem>
                      <SidebarSidebarMenuButton>
                        <IconPlaceholderIconPlaceholder />
                        <span>Mentions</span>
                      </SidebarSidebarMenuButton>
                    </SidebarSidebarMenuItem>
                    <SidebarSidebarMenuItem>
                      <SidebarSidebarMenuButton>
                        <IconPlaceholderIconPlaceholder />
                        <span>Settings</span>
                      </SidebarSidebarMenuButton>
                    </SidebarSidebarMenuItem>
                  </SidebarSidebarMenu>
                </SidebarSidebarGroupContent>
              </SidebarSidebarGroup>
            </SidebarSidebarContent>
            <SidebarSidebarFooter>
              <SidebarSidebarMenu>
                <SidebarSidebarMenuItem>
                  <SidebarSidebarMenuButton>
                    <IconPlaceholderIconPlaceholder />
                    <span>Profile</span>
                  </SidebarSidebarMenuButton>
                </SidebarSidebarMenuItem>
              </SidebarSidebarMenu>
            </SidebarSidebarFooter>
            <SidebarSidebarRail />
          </SidebarSidebar>

          <SidebarSidebarInset>
            <main className="flex-1 px-4 lg:px-8 py-10 lg:py-14">
              <header className="mb-8">
                <h1 className="font-heading text-3xl font-bold text-foreground">Triage Queue</h1>
                <p className="text-muted-foreground mt-2">Prioritized list of incoming customer conversations.</p>
              </header>

              <section className="mb-8" aria-label="Queue metrics">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-card rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Open tickets</p>
                    <p className="text-2xl font-bold text-foreground">12</p>
                    <p className="text-sm text-destructive">-3</p>
                  </div>
                  <div className="bg-card rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Unassigned</p>
                    <p className="text-2xl font-bold text-foreground">4</p>
                    <p className="text-sm text-destructive">+1</p>
                  </div>
                  <div className="bg-card rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Avg. first response</p>
                    <p className="text-2xl font-bold text-foreground">1h 23m</p>
                    <p className="text-sm text-primary">-12%</p>
                  </div>
                  <div className="bg-card rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">SLA breached</p>
                    <p className="text-2xl font-bold text-foreground">2</p>
                    <p className="text-sm text-destructive">+2</p>
                  </div>
                </div>
              </section>

              <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6">
                <FilterTabsTabs defaultValue="all">
                  <div data-mount="filter-tabs" className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                    <FilterTabsTabsTrigger value="all">All</FilterTabsTabsTrigger>
                    <FilterTabsTabsTrigger value="unassigned">Unassigned</FilterTabsTabsTrigger>
                    <FilterTabsTabsTrigger value="mine">Mine</FilterTabsTabsTrigger>
                  </div>
                </FilterTabsTabs>

                <div className="flex flex-wrap items-center gap-3">
                  <div data-mount="priority-filter" className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                    <PriorityFilterSelectTrigger className="w-[140px]">
                      <PriorityFilterSelectValue placeholder="Priority" />
                    </PriorityFilterSelectTrigger>
                    <PriorityFilterSelectContent>
                      <PriorityFilterSelectGroup>
                        <PriorityFilterSelectLabel>Priority</PriorityFilterSelectLabel>
                        <PriorityFilterSelectItem value="urgent">Urgent</PriorityFilterSelectItem>
                        <PriorityFilterSelectItem value="high">High</PriorityFilterSelectItem>
                        <PriorityFilterSelectItem value="medium">Medium</PriorityFilterSelectItem>
                        <PriorityFilterSelectItem value="low">Low</PriorityFilterSelectItem>
                      </PriorityFilterSelectGroup>
                    </PriorityFilterSelectContent>
                  </div>/PriorityFilterSelectGroup>
                    </div>      </div>rSelectItem>
                      </PriorityFilterSelectGroup>
                    </PriorityFilterSelectContent>
                  </PriorityFilterSelect>

                  <div data-mount="assignee-filter" className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                    <AssigneeFilterSelectTrigger className="w-[140px]">
                      <AssigneeFilterSelectValue placeholder="Assignee" />
                    </AssigneeFilterSelectTrigger>
                    <AssigneeFilterSelectContent>
                      <AssigneeFilterSelectGroup>
                        <AssigneeFilterSelectLabel>Assignee</AssigneeFilterSelectLabel>
                        <AssigneeFilterSelectItem value="priya">Priya</AssigneeFilterSelectItem>
                        <AssigneeFilterSelectItem value="liam">Liam</AssigneeFilterSelectItem>
                        <AssigneeFilterSelectItem value="unassigned">Unassigned</AssigneeFilterSelectItem>
                      </AssigneeFilterSelectGroup>
                    </AssigneeFilterSelectContent>
                  </div>/AssigneeFilterSelectGroup>
                    </div>      </div>rSelectItem>
                      </AssigneeFilterSelectGroup>
                    </AssigneeFilterSelectContent>
                  </AssigneeFilterSelect>

                  <AssignDialogDialog>
                    <AssignDialogDialogTrigger asChild>
                      <ButtonButton variant="outline">Assign selected</ButtonButton>
                    </AssignDialogDialogTrigger>
                    <AssignDialogDialogContent>
                      <AssignDialogDialogHeader>
                        <AssignDialogDialogTitle>Assign conversations</AssignDialogDialogTitle>
                        <AssignDialogDialogDescription>
                          Select a teammate to assign the selected conversations to.
                        </AssignDialogDialogDescription>
                      </AssignDialogDialogHeader>
                      <div data-mount="assignee-select" className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                        <AssigneeSelectSelectTrigger>
                          <AssigneeSelectSelectValue placeholder="Select assignee" />
                        </AssigneeSelectSelectTrigger>
                        <AssigneeSelectSelectContent>
                          <AssigneeSelectSelectGroup>
                            <AssigneeSelectSelectItem value="priya">Priya</AssigneeSelectSelectItem>
                            <AssigneeSelectSelectItem value="liam">Liam</AssigneeSelectSelectItem>
                          </AssigneeSelectSelectGroup>
                        </AssigneeSelectSelectContent>
                      </div>             </AssigneeSelectSelectGroup>
                        </div>  </div>
                        </AssigneeSelectSelectContent>
                      </AssigneeSelectSelect>
                      <AssignDialogDialogFooter>
                        <AssignDialogDialogClose asChild>
                          <ButtonButton variant="outline">Cancel</ButtonButton>
                        </AssignDialogDialogClose>
                        <ButtonButton>Assign</ButtonButton>
                      </AssignDialogDialogFooter>
                    </AssignDialogDialogContent>
                  </AssignDialogDialog>

                  <ButtonButton variant="outline">Export</ButtonButton>
                </div>
              </div>

              <section className="bg-card rounded-lg shadow-sm overflow-hidden">
                <div data-mount="ticket-table" className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                  <TicketTableTableHeader>
                    <TicketTableTableRow>
                      <TicketTableTableHead>Ticket</TicketTableTableHead>
                      <TicketTableTableHead>Subject</TicketTableTableHead>
                      <TicketTableTableHead>Customer</TicketTableTableHead>
                      <TicketTableTableHead>Status</TicketTableTableHead>
                      <TicketTableTableHead>Priority</TicketTableTableHead>
                      <TicketTableTableHead>Assignee</TicketTableTableHead>
                      <TicketTableTableHead>SLA</TicketTableTableHead>
                      <TicketTableTableHead>Last message</TicketTableTableHead>
                      <TicketTableTableHead className="w-[50px]">Actions</TicketTableTableHead>
                    </TicketTableTableRow>
                  </TicketTableTableHeader>
                  <TicketTableTableBody>
                    {[
                      {
                        id: "T-1024",
                        subject: "Cannot log in after password reset",
                        customer: "alex@brightpath.io",
                        status: "open",
                        priority: "urgent",
                        assignee: "Priya",
                        sla_due: "2025-03-15T10:30:00Z",
                        last_message: "2025-03-15T09:14:00Z"
                      },
                      {
                        id: "T-1023",
                        subject: "Billing question: invoice for March",
                        customer: "sam@northwind.co",
                        status: "pending",
                        priority: "high",
                        assignee: "Liam",
                        sla_due: "2025-03-15T11:00:00Z",
                        last_message: "2025-03-15T08:45:00Z"
                      },
                      {
                        id: "T-1022",
                        subject: "Feature request: dark mode",
                        customer: "jordan@loopmedia.com",
                        status: "new",
                        priority: "medium",
                        assignee: null,
                        sla_due: "2025-03-15T12:00:00Z",
                        last_message: "2025-03-15T07:30:00Z"
                      },
                      {
                        id: "T-1021",
                        subject: "Error when exporting report",
                        customer: "casey@fintech.io",
                        status: "open",
                        priority: "high",
                        assignee: "Priya",
                        sla_due: "2025-03-15T12:30:00Z",
                        last_message: "2025-03-15T06:55:00Z"
                      },
                      {
                        id: "T-1020",
                        subject: "How to add team members?",
                        customer: "morgan@designlab.co",
                        status: "new",
                        priority: "low",
                        assignee: null,
                        sla_due: "2025-03-15T13:00:00Z",
                        last_message: "2025-03-15T06:20:00Z"
                      },
                      {
                        id: "T-1019",
                        subject: "App crashes on iOS 18",
                        customer: "taylor@cloudnine.com",
                        status: "open",
                        priority: "urgent",
                        assignee: "Liam",
                        sla_due: "2025-03-15T10:00:00Z",
                        last_message: "2025-03-15T05:45:00Z"
                      },
                      {
                        id: "T-1018",
                        subject: "Integration with Slack",
                        customer: "devon@teamflow.io",
                        status: "pending",
                        priority: "medium",
                        assignee: "Priya",
                        sla_due: "2025-03-15T14:00:00Z",
                        last_message: "2025-03-15T04:10:00Z"
                      },
                      {
                        id: "T-1017",
                        subject: "Refund request",
                        customer: "riley@shopstream.com",
                        status: "new",
                        priority: "high",
                        assignee: null,
                        sla_due: "2025-03-15T09:30:00Z",
                        last_message: "2025-03-15T03:25:00Z"
                      }
                    ].map((ticket) => (
                      <TicketTableTableRow key={ticket.id}>
                        <TicketTableTableCell className="font-mono text-sm">{ticket.id}</TicketTableTableCell>
                        <TicketTableTableCell className="font-medium">{ticket.subject}</TicketTableTableCell>
                        <TicketTableTableCell className="text-muted-foreground">{ticket.customer}</TicketTableTableCell>
                        <TicketTableTableCell>
                          <StatusBadgeBadge variant={ticket.status === "urgent" ? "destructive" : ticket.status === "high" ? "default" : "secondary"}>
                            {ticket.status}
                          </StatusBadgeBadge>
                        </TicketTableTableCell>
                        <TicketTableTableCell>
                          <PriorityBadgeBadge variant={ticket.priority === "urgent" ? "destructive" : ticket.priority === "high" ? "default" : "secondary"}>
                            {ticket.priority}
                          </PriorityBadgeBadge>
                        </TicketTableTableCell>
                        <TicketTableTableCell>{ticket.assignee ?? <span className="text-muted-foreground">Unassigned</span>}</TicketTableTableCell>
                        <TicketTableTableCell>
                          <TimerBadgeTimerBadge due={ticket.sla_due} />
                        </TicketTableTableCell>
                        <TicketTableTableCell className="text-muted-foreground">
                          {new Date(ticket.last_message).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </TicketTableTableCell>
                        <TicketTableTableCell>
                          <div data-mount="ticket-row-actions" className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                            <TicketRowActionsDropdownMenu>
                              <TicketRowActionsDropdownMenuTrigger asChild>
                                <ButtonButton variant="ghost" size="icon">
                                  <IconPlaceholderIconPlaceholder />
                                </ButtonButton>
                              </TicketRowActionsDropdownMenuTrigger>
                              <TicketRowActionsDropdownMenuContent>
                                <TicketRowActionsDropdownMenuLabel>Actions</TicketRowActionsDropdownMenuLabel>
                                <TicketRowActionsDropdownMenuItem>Assign</TicketRowActionsDropdownMenuItem>
                                <TicketRowActionsDropdownMenuItem>Change Status</TicketRowActionsDropdownMenuItem>
                                <TicketRowActionsDropdownMenuItem>Open</TicketRowActionsDropdownMenuItem>
                              </TicketRowActionsDropdownMenuContent>
                            </TicketRowActionsDropdownMenu>
                          </div>                </div>            <div data-mount="ticket-row-actions" className="rounded-lg border border-border p-4 text-sm text-muted-foreground">Open</div>
                              </TicketRowActionsDropdownMenuContent>
                            </TicketRowActionsDropdownMenu>
                          </TicketRowActionsTicketRowActions>
                        </TicketTableTableCell>
                      </TicketTableTableRow>
                    ))}
                  </TicketTableTableBody>
                </div>t>
                                <div data-mount="ticket-row-actions" className="rounded-lg border border-border p-4 text-sm text-muted-foreground">Actions</div>
                                <div data-mount="ticket-row-actions" className="rounded-lg border border-border p-4 text-sm text-muted-foreground">Assign</div>
                                <div data-mount="ticket-row-actions" className="rounded-lg border border-border p-4 text-sm text-muted-foreground">Change Status</div>
                                <div data-mount="ticket-row-actions" className="rounded-lg border border-border p-4 text-sm text-muted-foreground">Open</div>
                              </TicketRowActionsDropdownMenuContent>
                            </TicketRowActionsDropdownMenu>
                          </TicketRowActionsTicketRowActions>
                        </TicketTableTableCell>
                      </TicketTableTableRow>
                    ))}
                  </div>nMenuItem>
                                <div data-mount="ticket-row-actions" className="rounded-lg border border-border p-4 text-sm text-muted-foreground">Change Status</div>
                                <div data-mount="ticket-row-actions" className="rounded-lg border border-border p-4 text-sm text-muted-foreground">Open</div>
                              </TicketRowActionsDropdownMenuContent>
                            </TicketRowActionsDropdownMenu>
                          </TicketRowActionsTicketRowActions>
                        </div>
                      </TicketTableTableRow>
                    ))}
                  </TicketTableTableBody>
                </TicketTableTicketTable>
              </section>

              <section className="mt-10">
                <div data-mount="queue-empty" className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                  <QueueEmptyEmptyContent>
                    <QueueEmptyEmptyHeader>
                      <QueueEmptyEmptyTitle>No tickets</QueueEmptyEmptyTitle>
                      <QueueEmptyEmptyDescription>
                        No tickets match the current filters. Try adjusting your filter criteria.
                      </QueueEmptyEmptyDescription>
                    </QueueEmptyEmptyHeader>
                    <QueueEmptyEmptyMedia>
                      <IconPlaceholderIconPlaceholder />
                    </QueueEmptyEmptyMedia>
                  </QueueEmptyEmptyContent>
                </div>edia>
                  </div>ader>
                    <div data-mount="queue-empty" className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                      <IconPlaceholderIconPlaceholder />
                    </div>
                  </QueueEmptyEmptyContent>
                </QueueEmptyEmpty>
              </section>
            </main>
          </SidebarSidebarInset>
        </div>
      </div>uItem>Assign</TicketRowActionsDropdownMenuItem>
                                <div data-mount="ticket-row-actions" className="rounded-lg border border-border p-4 text-sm text-muted-foreground">Change Status</div>
                                <div data-mount="ticket-row-actions" className="rounded-lg border border-border p-4 text-sm text-muted-foreground">Open</div>
                              </TicketRowActionsDropdownMenuContent>
                            </TicketRowActionsDropdownMenu>
                          </TicketRowActionsTicketRowActions>
                        </TicketTableTableCell>
                      </TicketTableTableRow>
                    ))}
                  </TicketTableTableBody>
                </TicketTableTicketTable>
              </section>

              <section className="mt-10">
                <div data-mount="queue-empty" className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                  <QueueEmptyEmptyContent>
                    <QueueEmptyEmptyHeader>
                      <QueueEmptyEmptyTitle>No tickets</QueueEmptyEmptyTitle>
                      <QueueEmptyEmptyDescription>
                        No tickets match the current filters. Try adjusting your filter criteria.
                      </QueueEmptyEmptyDescription>
                    </QueueEmptyEmptyHeader>
                    <QueueEmptyEmptyMedia>
                      <IconPlaceholderIconPlaceholder />
                    </QueueEmptyEmptyMedia>
                  </QueueEmptyEmptyContent>
                </div>edia>
                  </div>ader>
                    <div data-mount="queue-empty" className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                      <IconPlaceholderIconPlaceholder />
                    </div>
                  </QueueEmptyEmptyContent>
                </QueueEmptyEmpty>
              </section>
            </main>
          </div>
        </div>
      </SidebarSidebarProvider>
    </div>
  )
}