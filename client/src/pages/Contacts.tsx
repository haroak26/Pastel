import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { AppPage, PageHeader, PageToolbar, PageToolbarGroup, FilterChip, EmptyState, SlideoverPanel, StatusBadge, DataTable, Badge, ListSkeleton, ContentPanel, type DataTableColumn } from "@/components/ds";
import {
  Search, X, Mail, MessageCircle, MoreHorizontal,
  UserPlus, Clock, CheckCircle2,
  CircleDot, User, ChevronRight,
} from "lucide-react";
import { TextInput } from "@/components/text-input";
import { Button, IconButton } from "@/components/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

type ContactStatus = "active" | "idle" | "resolved";

type Contact = {
  id: string;
  name: string;
  email: string;
  initials: string;
  color: string;
  status: ContactStatus;
  ticketCount: number;
  lastSeen: string;
  tags?: string[];
  channel: "email" | "chat";
};

interface ContactCounts {
  contacts: Contact[];
  total: number;
}

function useContacts() {
  return useQuery<ContactCounts>({
    queryKey: ["/api/contacts"],
    queryFn: async () => {
      const res = await fetch("/api/contacts", { credentials: "include" });
      if (!res.ok) return { contacts: [], total: 0 };
      return res.json();
    },
  });
}

const STATUS_CONFIG: Record<ContactStatus, { dot: string; label: string; icon: typeof CircleDot; color: string }> = {
  active:   { dot: "bg-emerald-500",  label: "Active",   icon: CircleDot, color: "#22c55e" },
  idle:     { dot: "bg-amber",    label: "Idle",     icon: Clock,     color: "hsl(var(--amber))" },
  resolved: { dot: "bg-gray-300",     label: "Resolved", icon: CheckCircle2, color: "#9ca3af" },
};

function ContactDetail({ contact, onClose }: { contact: Contact; onClose: () => void }) {
  const openCount = Math.max(0, Math.floor(contact.ticketCount * 0.4));
  const pendingCount = Math.max(0, Math.floor(contact.ticketCount * 0.3));
  const resolvedCount = Math.max(0, contact.ticketCount - openCount - pendingCount);
  const breakdown = [
    { label: "Open",     count: openCount,     icon: CircleDot,    color: "text-sky-500" },
    { label: "Pending",  count: pendingCount,  icon: Clock,        color: "text-amber" },
    { label: "Resolved", count: resolvedCount, icon: CheckCircle2, color: "text-emerald-500" },
  ];

  return (
    <SlideoverPanel open onClose={onClose} title="Contact details" width={272}>
      <div className="px-[18px] pt-5 pb-4 border-b border-border-subtle">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center" style={{ background: contact.color }}>
            <span className="text-white text-[13.5px] font-semibold">{contact.initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-foreground truncate">{contact.name}</p>
            <p className="text-[12px] text-fg-subtle truncate mt-0.5">{contact.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-fg-muted font-medium">
          <StatusBadge
            icon={STATUS_CONFIG[contact.status].icon}
            color={STATUS_CONFIG[contact.status].color}
            label={STATUS_CONFIG[contact.status].label}
          />
          <span className="text-border-strong">·</span>
          <span>Last seen {contact.lastSeen}</span>
        </div>
        {contact.tags && contact.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {contact.tags.map(tag => (
              <Badge key={tag} size="sm">{tag}</Badge>
            ))}
          </div>
        )}
      </div>
      <div className="px-[18px] py-3.5 border-b border-border-subtle">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-subtle">Tickets</span>
        <div className="grid grid-cols-3 gap-2 mt-2.5">
          {breakdown.map(({ label, count, icon: Icon, color }) => (
            <div key={label} className="flex flex-col items-center gap-1 py-2.5 rounded-lg border border-border">
              <Icon size={13} className={color} strokeWidth={2} />
              <p className="text-[18px] font-bold text-foreground leading-none">{count}</p>
              <p className="text-[10px] text-fg-subtle font-medium">{label}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="px-[18px] py-3.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-subtle">Actions</span>
        <div className="flex flex-col gap-1.5 mt-2.5">
          {[
            { icon: Mail, label: "Send email" },
            { icon: MessageCircle, label: "Open new conversation" },
          ].map(({ icon: Icon, label }) => (
            <Button
              key={label}
              design="secondary"
              size="xs"
              className="w-full justify-start"
            >
              <Icon size={13} />
              {label}
            </Button>
          ))}
        </div>
      </div>
    </SlideoverPanel>
  );
}

export function ContactsContent() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Contact | null>(null);
  const [statusFilter, setStatusFilter] = useState<ContactStatus | "all">("all");
  const [channelFilter, setChannelFilter] = useState<Contact["channel"] | "all">("all");
  const { data: contactsData, isLoading } = useContacts();
  const contacts = contactsData?.contacts ?? [];

  const filtered = contacts.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (channelFilter !== "all" && c.channel !== channelFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
    }
    return true;
  });

  const channelCounts = {
    all: contacts.length,
    email: contacts.filter(c => c.channel === "email").length,
    chat: contacts.filter(c => c.channel === "chat").length,
  };
  const statusCounts = {
    active: contacts.filter(c => c.status === "active").length,
    idle: contacts.filter(c => c.status === "idle").length,
    resolved: contacts.filter(c => c.status === "resolved").length,
  };

  const FILTERS: { key: ContactStatus | "all"; label: string }[] = [
    { key: "all", label: "All" }, { key: "active", label: "Active" },
    { key: "idle", label: "Idle" }, { key: "resolved", label: "Resolved" },
  ];
  const CHANNEL_FILTERS: { key: Contact["channel"] | "all"; label: string }[] = [
    { key: "all", label: "All channels" },
    { key: "email", label: "Email" },
    { key: "chat", label: "Chat" },
  ];

  const columns: DataTableColumn<Contact>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (row) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-[30px] h-[30px] rounded-full shrink-0 flex items-center justify-center" style={{ background: row.color }}>
            <span className="text-white text-[10px] font-semibold">{row.initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-foreground truncate">{row.name}</p>
            <p className="text-[11.5px] text-fg-subtle truncate">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: 100,
      render: (row) => {
        const s = STATUS_CONFIG[row.status];
        return (
          <StatusBadge icon={s.icon} color={s.color} label={s.label} />
        );
      },
    },
    {
      key: 'tickets',
      header: 'Tickets',
      width: 80,
      render: (row) => (
        <span className="text-[13px] font-medium text-foreground">{row.ticketCount}</span>
      ),
    },
    {
      key: 'tags',
      header: 'Tags',
      render: (row) => (
        <div className="flex gap-1">
          {row.tags?.slice(0, 2).map(tag => (
            <Badge key={tag} size="sm">{tag}</Badge>
          )) ?? <span className="text-[12px] text-fg-faint">—</span>}
        </div>
      ),
    },
    {
      key: 'lastSeen',
      header: 'Last seen',
      width: 100,
      render: (row) => (
        <span className="text-[12px] text-fg-subtle">{row.lastSeen}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: 40,
      align: 'right',
      render: () => (
        <IconButton icon={MoreHorizontal} size="xs" design="ghost" className="ml-auto" />
      ),
    },
  ];

  const isMobile = useIsMobile();

  return (
    <AppPage>
      <ContentPanel
        header={
          <PageHeader
            title="Contacts"
            icon={User}
            iconColor="#4682B4"
            subtitle={`${filtered.length} of ${contactsData?.total ?? 0} people`}
            actions={
              <Button size="xs">
                <UserPlus size={12} /> Add contact
              </Button>
            }
          />
        }
        maxWidth="full"
      >
        <PageToolbar className="px-4 py-3 sm:px-6">
          <PageToolbarGroup>
            {FILTERS.map(f => (
                <FilterChip
                  key={f.key}
                  active={statusFilter === f.key}
                  onClick={() => setStatusFilter(f.key)}
                >
                  {f.label}
                </FilterChip>
            ))}
            <div className="mx-1 h-5 w-px bg-border" />
            {CHANNEL_FILTERS.map(f => (
              <FilterChip
                key={f.key}
                active={channelFilter === f.key}
                onClick={() => setChannelFilter(f.key)}
              >
                {f.label}
              </FilterChip>
            ))}
          </PageToolbarGroup>
          <PageToolbarGroup className="min-w-[220px] flex-1 justify-end">
            <div className="relative w-full max-w-sm">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-faint pointer-events-none" />
              <TextInput
                placeholder="Search contacts..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-8"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-muted hover:text-foreground flex bg-none border-none cursor-pointer p-0">
                  <X size={12} />
                </button>
              )}
            </div>
          </PageToolbarGroup>
        </PageToolbar>
        <div className="grid grid-cols-4 border-b border-border px-4 py-3 sm:px-6 md:max-w-2xl">
          <div><p className="lds-section-label">Total</p><p className="mt-1 text-[20px] font-semibold leading-none text-foreground">{channelCounts.all}</p></div>
          <div><p className="lds-section-label">Active</p><p className="mt-1 text-[20px] font-semibold leading-none text-foreground">{statusCounts.active}</p></div>
          <div><p className="lds-section-label">Email</p><p className="mt-1 text-[20px] font-semibold leading-none text-foreground">{channelCounts.email}</p></div>
          <div><p className="lds-section-label">Chat</p><p className="mt-1 text-[20px] font-semibold leading-none text-foreground">{channelCounts.chat}</p></div>
        </div>
        {isLoading ? (
          <ListSkeleton rows={10} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={User}
            title="No contacts found"
            description="Try adjusting your search or filters"
          />
        ) : isMobile ? (
          <div className="divide-y divide-border/40">
            {filtered.map(contact => {
              const statusCfg = STATUS_CONFIG[contact.status];
              return (
                <div
                  key={contact.id}
                  onClick={() => setSelected(selected?.id === contact.id ? null : contact)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors",
                    "hover:bg-surface-active",
                    selected?.id === contact.id && "bg-surface-active"
                  )}
                >
                  <div className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center" style={{ background: contact.color }}>
                    <span className="text-white text-[12px] font-semibold">{contact.initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-foreground truncate">{contact.name}</p>
                    <p className="text-[12px] text-fg-muted truncate">{contact.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn("w-2 h-2 rounded-full", statusCfg.dot)} />
                    <span className="text-[12px] text-fg-faint">{contact.ticketCount} tickets</span>
                    <ChevronRight size={13} className="text-fg-faint" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={filtered}
            getRowKey={(r) => r.id}
            onRowClick={(row) => setSelected(selected?.id === row.id ? null : row)}
            activeRowKey={selected?.id}
          />
        )}
        {selected && (
          <ContactDetail contact={selected} onClose={() => setSelected(null)} />
        )}
      </ContentPanel>
    </AppPage>
  );
}

export default function Contacts() {
  return (
    <AppLayout>
      <ContactsContent />
    </AppLayout>
  );
}
