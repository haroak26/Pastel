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

export default function ConversationDetail() {
  return (
    <div className="min-h-screen bg-background">
      <div data-mount="topbar" className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
        <TopbarNavigationMenu>
          <TopbarNavigationMenuList>
            <TopbarNavigationMenuItem>
              <TopbarNavigationMenuTrigger>Meridian Inbox</TopbarNavigationMenuTrigger>
              <TopbarNavigationMenuContent>
                <TopbarNavigationMenuLink href="/inbox">Inbox</TopbarNavigationMenuLink>
                <TopbarNavigationMenuLink href="/assigned">Assigned</TopbarNavigationMenuLink>
                <TopbarNavigationMenuLink href="/mentions">Mentions</TopbarNavigationMenuLink>
                <TopbarNavigationMenuLink href="/settings">Settings</TopbarNavigationMenuLink>
              </TopbarNavigationMenuContent>
            </TopbarNavigationMenuItem>
          </TopbarNavigationMenuList>
        </TopbarNavigationMenu>
      </div></TopbarNavigationMenuList>
        </div>nuItem>
          </div>            </div>gs">Settings</TopbarNavigationMenuLink>
              </div>
            </TopbarNavigationMenuItem>
          </TopbarNavigationMenuList>
        </TopbarNavigationMenu>
      </TopbarTopbar>

      <div className="flex">
        <div data-mount="sidebar" className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
          <SidebarSidebarHeader>
            <SidebarSidebarGroupLabel>Queue views</SidebarSidebarGroupLabel>
            <SidebarSidebarMenu>
              <SidebarSidebarMenuItem>
                <SidebarSidebarMenuButton asChild>
                  <a href="/inbox">Inbox</a>
                </SidebarSidebarMenuButton>
              </SidebarSidebarMenuItem>
              <SidebarSidebarMenuItem>
                <SidebarSidebarMenuButton asChild>
                  <a href="/assigned">Assigned</a>
                </SidebarSidebarMenuButton>
              </SidebarSidebarMenuItem>
              <SidebarSidebarMenuItem>
                <SidebarSidebarMenuButton asChild>
                  <a href="/mentions">Mentions</a>
                </SidebarSidebarMenuButton>
              </SidebarSidebarMenuItem>
              <SidebarSidebarMenuItem>
                <SidebarSidebarMenuButton asChild>
                  <a href="/settings">Settings</a>
                </SidebarSidebarMenuButton>
              </SidebarSidebarMenuItem>
            </SidebarSidebarMenu>
          </SidebarSidebarHeader>
        </div> </SidebarSidebarMenu>
          </div>      </SidebarSidebarMenuButton>
              </SidebarSidebarMenuItem>
            </div>>
              </div>   </div>
              </SidebarSidebarMenuItem>
              <div data-mount="sidebar" className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                <SidebarSidebarMenuButton asChild>
                  <a href="/settings">Settings</a>
                </SidebarSidebarMenuButton>
              </div>   </div>
              </SidebarSidebarMenuItem>
            </SidebarSidebarMenu>
          </SidebarSidebarHeader>
        </SidebarSidebar>

        <main className="flex-1 px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* ThreadHeader */}
            <section className="lg:col-span-8 space-y-4">
              <div data-mount="thread-title" className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                <ThreadTitleCard>
                  <ThreadTitleCardHeader>
                    <ThreadTitleCardTitle>Conversation subject</ThreadTitleCardTitle>
                    <ThreadTitleCardDescription>Alex Chen</ThreadTitleCardDescription>
                  </ThreadTitleCardHeader>
                  <ThreadTitleCardContent>
                    <div data-mount="status-badge" className="rounded-lg border border-border p-4 text-sm text-muted-foreground">Status</div>
                    <div data-mount="priority-badge" className="rounded-lg border border-border p-4 text-sm text-muted-foreground">Priority</div>
                  </ThreadTitleCardContent>
                </ThreadTitleCard>
              </div>TitleCardContent>
                </div>"rounded-lg border border-border p-4 text-sm text-muted-foreground">
                    <div data-mount="status-badge" className="rounded-lg border border-border p-4 text-sm text-muted-foreground">Status</div>
                    <div data-mount="priority-badge" className="rounded-lg border border-border p-4 text-sm text-muted-foreground">Priority</div>
                  </div>
                </ThreadTitleCard>
              </ThreadTitleThreadTitle>

              <div data-mount="quick-actions" className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                <QuickActionsButtonGroup>
                  <QuickActionsButtonGroupText>Quick actions</QuickActionsButtonGroupText>
                  <QuickActionsButtonGroupSeparator />
                  <ButtonButton variant="outline">Assign</ButtonButton>
                  <ButtonButton variant="outline">Change status</ButtonButton>
                </QuickActionsButtonGroup>
              </div>
                </div>ttonButton>
                  <ButtonButton variant="outline">Change status</ButtonButton>
                </QuickActionsButtonGroup>
              </QuickActionsQuickActions>
            </section>

            {/* MessageThread */}
            <section className="lg:col-span-8 space-y-4">
              <div data-mount="message-list" className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                <ScrollArea className="h-[400px]">
                  <div data-mount="message-item" className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                    <MessageItemMessageGroup>
                      <MessageItemMessageAvatar />
                      <MessageItemMessageContent>
                        <MessageItemMessageHeader>
                          <span className="font-medium">Alex Chen</span>
                          <span className="text-muted-foreground text-sm">2025-03-15T09:14:00Z</span>
                        </MessageItemMessageHeader>
                        <p className="text-sm">I tried to reset my password but the link doesn't work. Can you help?</p>
                      </MessageItemMessageContent>
                    </MessageItemMessageGroup>
                  </div>              </div>d to reset my password but the link doesn't work. Can you help?</p>
                      </div>u help?</p>
                      </MessageItemMessageContent>
                    </MessageItemMessageGroup>
                  </MessageItemMessageItem>

                  <div data-mount="message-item" className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                    <MessageItemMessageGroup>
                      <MessageItemMessageAvatar />
                      <MessageItemMessageContent>
                        <MessageItemMessageHeader>
                          <span className="font-medium">Priya</span>
                          <span className="text-muted-foreground text-sm">2025-03-15T09:20:00Z</span>
                        </MessageItemMessageHeader>
                        <p className="text-sm">Hi Alex, we're looking into it. Could you try again in 10 minutes?</p>
                      </MessageItemMessageContent>
                    </MessageItemMessageGroup>
                  </div>              </div>Alex, we're looking into it. Could you try again in 10 minutes?</p>
                      </div>inutes?</p>
                      </MessageItemMessageContent>
                    </MessageItemMessageGroup>
                  </MessageItemMessageItem>

                  <div data-mount="internal-note" className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                    <InternalNoteMessageGroup>
                      <InternalNoteMessageAvatar />
                      <InternalNoteMessageContent>
                        <InternalNoteMessageHeader>
                          <span className="font-medium">Priya</span>
                          <span className="text-muted-foreground text-sm">2025-03-15T09:25:00Z</span>
                        </InternalNoteMessageHeader>
                        <p className="text-sm">Check if the token expiry is too short. Might be a bug in our reset flow.</p>
                      </InternalNoteMessageContent>
                    </InternalNoteMessageGroup>
                  </div>           </div> token expiry is too short. Might be a bug in our reset flow.</p>
                      </div>flow.</p>
                      </InternalNoteMessageContent>
                    </InternalNoteMessageGroup>
                  </InternalNoteInternalNote>
                </ScrollArea>
              </div>

              {/* ReplyComposer */}
              <div className="space-y-4">
                <div data-mount="note-toggle" className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                  <ToggleGroup type="single" defaultValue="reply">
                    <ToggleGroupItem value="reply">Reply</ToggleGroupItem>
                    <ToggleGroupItem value="note">Internal note</ToggleGroupItem>
                  </ToggleGroup>
                </div>

                <ReplyTextareaTextarea placeholder="Write a reply…" />

                <div className="flex justify-end">
                  <div data-mount="send-button" className="rounded-lg border border-border p-4 text-sm text-muted-foreground">Send</div>
                </div>
              </div>
            </section>

            {/* ConversationDetailsPanel */}
            <aside className="lg:col-span-4 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Assignee</label>
                <div data-mount="assignee-select" className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                  <AssigneeSelectSelectTrigger>
                    <AssigneeSelectSelectValue placeholder="Select assignee" />
                  </AssigneeSelectSelectTrigger>
                  <AssigneeSelectSelectContent>
                    <AssigneeSelectSelectItem value="priya">Priya</AssigneeSelectSelectItem>
                    <AssigneeSelectSelectItem value="liam">Liam</AssigneeSelectSelectItem>
                  </AssigneeSelectSelectContent>
                </div>lectItem value="liam">Liam</AssigneeSelectSelectItem>
                  </div>
                </AssigneeSelectSelect>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Tags</label>
                <TagInputTagInput>
                  <TagInputInputGroup>
                    <TagInputInputGroupInput placeholder="Add tags" />
                  </TagInputInputGroup>
                </TagInputTagInput>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">SLA due</label>
                <SlaTimerProgress value={75} />
                <p className="text-sm text-muted-foreground">Due in 1h 16m</p>
              </div>

              <div data-mount="customer-info" className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                <CustomerInfoCard>
                  <CustomerInfoCardHeader>
                    <CustomerInfoCardTitle>Customer</CustomerInfoCardTitle>
                    <CustomerInfoCardDescription>alex@brightpath.io</CustomerInfoCardDescription>
                  </CustomerInfoCardHeader>
                  <CustomerInfoCardContent>
                    <p className="text-sm">Brightpath.io</p>
                  </CustomerInfoCardContent>
                </CustomerInfoCard>
              </div>foCardContent>
                </div>Header>
                  <div data-mount="customer-info" className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                    <p className="text-sm">Brightpath.io</p>
                  </div>
                </CustomerInfoCard>
              </CustomerInfoCustomerInfo>
            </aside>
          </div>
        </main>
      </div>
    </div>
  )
}