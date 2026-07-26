import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowUp, Sparkles, RotateCcw, MessageSquarePlus, Trash2, ChevronLeft, ChevronRight, Bot, BookOpen, Paperclip, FileText, PanelRightClose, PanelRightOpen, X, Copy, Search } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button, IconButton } from "@/components/button";
import { AppPage, PageHeader, AppBody, ListSkeleton } from "@/components/ds";
import { useUser } from "@/hooks/use-user";
import { ThinkingIndicator } from "@/components/ThinkingIndicator";
import { Textarea, TextInput } from "@/components/text-input";
import { marked } from "marked";
import DOMPurify from 'dompurify';

type AgentRole = "user" | "assistant";
type AgentMessage = {
  id: string;
  role: AgentRole;
  content: string;
  sources?: { id: string; label: string | null; fileName: string | null }[];
};

interface Conversation {
  id: string;
  title: string;
  agentId: string | null;
  createdAt: string;
  updatedAt: string;
  messages?: AgentMessage[];
}

interface Agent {
  id: string;
  name: string;
  personality: string;
  description: string;
  active: boolean;
  spaceId: string;
}

interface KnowledgeItem {
  id: string;
  type: string;
  content: string;
  fileName: string | null;
  label: string | null;
}

function MarkdownContent({ content }: { content: string }) {
  const html = useMemo(() => {
    return DOMPurify.sanitize(marked.parse(content, { breaks: true, gfm: true }) as string, {
      ALLOWED_TAGS: ['a', 'b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'span', 'div'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel'],
      ALLOW_DATA_ATTR: false,
      FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
    });
  }, [content]);
  return <div className="agent-markdown" dangerouslySetInnerHTML={{ __html: html }} />;
}

function useGreeting() {
  const { data: user } = useUser();
  const hour = new Date().getHours();
  const greeting = hour < 5 ? "Good evening" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const name = (user as any)?.displayName || user?.username || "";
  const firstName = name.split(/\s+/)[0] || "";
  return `${greeting}${firstName ? `, ${firstName}` : ""}`;
}

function AgentContent() {
  const queryClient = useQueryClient();
  const greeting = useGreeting();
  const feedRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [knowledgePanelOpen, setKnowledgePanelOpen] = useState(false);
  const [followUps, setFollowUps] = useState<string[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [renamingConv, setRenamingConv] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState("");
  const showWelcome = messages.length === 0;

  const { data: agentsData } = useQuery<{ agents: Agent[] }>({
    queryKey: ['/api/agents'],
    queryFn: async () => {
      const res = await fetch('/api/agents', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });
  const agents = agentsData?.agents ?? [];

  const { data: conversationsData } = useQuery<{ conversations: Conversation[] }>({
    queryKey: ['/api/conversations'],
    queryFn: async () => {
      const res = await fetch('/api/conversations', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });
  const conversations = conversationsData?.conversations ?? [];

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }
    fetch(`/api/conversations/${activeConversationId}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        setMessages(data.messages ?? []);
      })
              .catch(() => {});
  }, [activeConversationId]);

  // Sync conversation ID to URL
  useEffect(() => {
    const url = new URL(window.location.href);
    if (activeConversationId) {
      url.searchParams.set('conv', activeConversationId);
    } else {
      url.searchParams.delete('conv');
    }
    window.history.replaceState(null, '', url.toString());
  }, [activeConversationId]);

  // Restore conversation ID from URL on mount
  useEffect(() => {
    const url = new URL(window.location.href);
    const convId = url.searchParams.get('conv');
    if (convId) setActiveConversationId(convId);
  }, []);

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [messages, isThinking]);

  const autoGrow = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  };

  const createConversation = async (firstMessage: string) => {
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: selectedAgentId || undefined, title: firstMessage.slice(0, 80) }),
      });
      if (!res.ok) throw new Error('Failed');
      const conv = await res.json();
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      return conv.id;
    } catch {
      return null;
    }
  };

  const renameConversation = async (id: string, title: string) => {
    await fetch(`/api/conversations/${id}`, {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    }).catch(() => {});
    queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    setRenamingConv(null);
  };

  const handleSend = async (override?: string) => {
    const trimmed = (override ?? input).trim();
    if (!trimmed || isLoading) return;

    const userMsg: AgentMessage = { id: crypto.randomUUID(), role: "user", content: trimmed };
    setMessages(p => [...p, userMsg]);
    setInput("");
    setFollowUps([]);
    setIsLoading(true);
    setIsThinking(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    let convId = activeConversationId;
    if (!convId) {
      convId = await createConversation(trimmed);
      if (convId) setActiveConversationId(convId);
    }

    try {
      const selectedAgent = agents.find(a => a.id === selectedAgentId);

      // Read attached files as base64
      const fileData = await Promise.all(
        attachedFiles.map(async (file) => {
          const buffer = await file.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
          return { name: file.name, type: file.type, data: base64 };
        })
      );
      setAttachedFiles([]);

      const res = await fetch(`/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: trimmed,
          conversationId: convId,
          agentId: selectedAgentId || undefined,
          workspaceId: undefined,
          spaceId: selectedAgent?.spaceId,
          history: messages.slice(-8).map(m => ({ role: m.role, content: m.content })),
          attachments: fileData.length > 0 ? fileData : undefined,
        }),
      });
      if (!res.ok) throw new Error();
      const reader = res.body?.getReader();
      if (!reader) throw new Error();
      const dec = new TextDecoder();
      let ai: AgentMessage = { id: crypto.randomUUID(), role: "assistant", content: "" };
      setMessages(p => [...p, ai]);
      setIsThinking(false);

      let fullContent = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of dec.decode(value, { stream: true }).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const ds = line.slice(6);
          if (ds === "[DONE]") continue;
          try {
            const data = JSON.parse(ds);
            if (data.type === "content") {
              fullContent += data.text;
              ai.content = fullContent;
              setMessages(p => { const u = [...p]; u[u.length - 1] = { ...ai }; return u; });
            } else if (data.type === "follow-ups") {
              setFollowUps(data.suggestions ?? []);
            } else if (data.type === "error") {
              ai.content = `Error: ${data.message}`;
              setMessages(p => { const u = [...p]; u[u.length - 1] = { ...ai }; return u; });
              break;
            }
          } catch { /* skip */ }
        }
      }
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    } catch {
      setMessages(p => [...p, { id: crypto.randomUUID(), role: "assistant", content: "I hit an issue and couldn't answer. Try again." }]);
    } finally {
      setIsLoading(false);
      setIsThinking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
    setFollowUps([]);
  };

  const deleteConversation = async (id: string) => {
    await fetch(`/api/conversations/${id}`, { method: 'DELETE', credentials: 'include' });
    if (activeConversationId === id) {
      setActiveConversationId(null);
      setMessages([]);
    }
    queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSelectKnowledge = useCallback((item: any) => {
    setInput(`Tell me about: ${item.label || item.fileName || item.content.slice(0, 100)}`);
    setKnowledgePanelOpen(false);
  }, []);

  const selectedAgent = agents.find(a => a.id === selectedAgentId);

  const centerPanel = (
    <div className="flex-1 flex flex-col min-w-0">
      <AppBody style={{ overflow: showWelcome ? 'hidden' : 'auto' }}>
        <div ref={feedRef} className={showWelcome ? "flex-1 flex flex-col justify-end" : ""}>
          {showWelcome ? (
            <div className="flex flex-col items-start justify-end h-full px-10 pb-8">
              <div className="flex items-center gap-3 mb-4">
                {selectedAgent ? (
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-brand/10 flex items-center justify-center">
                      <Bot size={16} className="text-brand" />
                    </div>
                    <div>
                      <h1 className="text-[18px] font-semibold text-foreground leading-tight">{selectedAgent.name}</h1>
                      {selectedAgent.personality && (
                        <p className="text-[12px] text-fg-muted">{selectedAgent.personality}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <h1 className="text-[20px] font-semibold text-foreground leading-[1.3] tracking-[-0.02em]">{greeting}</h1>
                )}
              </div>
              <p className="text-[13px] text-fg-muted mb-4 max-w-[480px]">
                {selectedAgent
                  ? `Chatting with ${selectedAgent.name}. Ask questions, draft replies, or get help with your inbox.`
                  : 'Your AI copilot for customer support. Draft replies, analyze tickets, and get help.'}
              </p>
              <div className="flex flex-col gap-1.5 w-full max-w-[480px]">
                {STARTER_PROMPTS.map(prompt => (
                  <Button key={prompt} onClick={() => handleSend(prompt)} disabled={isLoading}
                    design="secondary" size="xs" className="w-full text-left justify-start"
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-[640px] mx-auto px-6 flex flex-col gap-5 pb-6">
              {messages.map(msg => (
                <div key={msg.id}>
                  {msg.role === "user" ? (
                    <div className="flex justify-end">
                      <div className="max-w-[78%] rounded-[12px] bg-surface-muted px-3.5 py-2.5 text-[13.5px] leading-[1.6] text-foreground whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3 group">
                      <div className="w-[26px] h-[26px] rounded-md bg-surface-muted flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles size={12} className="text-fg-muted" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13.5px] leading-[1.7] text-foreground">
                          <MarkdownContent content={msg.content} />
                        </div>
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {msg.sources.map((s, i) => (
                              <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-brand/5 text-brand border border-brand/20">
                                <FileText size={9} className="inline mr-1 -mt-0.5" />
                                {s.label || s.fileName || `Source ${i + 1}`}
                              </span>
                            ))}
                          </div>
                        )}
                        <Button design="ghost" size="xs" icon={Copy} onClick={() => navigator.clipboard.writeText(msg.content)} className="opacity-0 group-hover:opacity-100">Copy</Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {isThinking && (
                <div className="flex gap-3">
                  <div className="w-[26px] h-[26px] rounded-md bg-surface-muted flex items-center justify-center shrink-0">
                    <Sparkles size={12} className="text-fg-muted" />
                  </div>
                  <div className="pt-1"><ThinkingIndicator /></div>
                </div>
              )}

              {/* Follow-up suggestions */}
              {followUps.length > 0 && !isLoading && (
                <div className="border-t border-border/60 pt-4 mt-2">
                  <p className="text-[11px] font-medium text-fg-muted mb-2 uppercase tracking-wide">Suggested follow-ups</p>
                  <div className="flex flex-wrap gap-2">
                    {followUps.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(q)}
                        className="text-[12px] px-3 py-1.5 rounded-[8px] bg-surface-muted text-fg-muted hover:text-foreground hover:bg-surface-hover border border-border/60 transition-all text-left"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </AppBody>

      {/* Composer */}
      <div className="px-6 py-3 border-t border-border shrink-0">
        {selectedAgent && (
          <div className="max-w-[640px] mx-auto mb-2 flex items-center gap-2">
            <Bot size={12} className="text-fg-muted" />
            <span className="text-[11px] text-fg-muted">Chatting with <span className="font-medium">{selectedAgent.name}</span></span>
            <Button onClick={() => setSelectedAgentId(null)} design="ghost" size="xs" className="hover:underline ml-1">Switch to general</Button>
          </div>
        )}
        <div className="max-w-[640px] mx-auto">
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {attachedFiles.map((file, i) => (
                <span key={i} className="text-[11px] px-2 py-1 rounded-lg bg-surface-muted border border-border/60 flex items-center gap-1">
                  <Paperclip size={10} className="text-fg-muted" />
                  {file.name}
                  <button onClick={() => removeFile(i)} className="text-fg-faint hover:text-red-500 ml-1">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={e => { setInput(e.target.value); autoGrow(); }}
              onKeyDown={handleKeyDown}
              onInput={autoGrow}
              placeholder="Ask anything about your support workflow..."
              rows={1}
              disabled={isLoading}
              className="min-h-[46px] pr-24 resize-none"
            />
            <div className="absolute bottom-2 right-2 flex items-center gap-1">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                multiple
                accept=".txt,.pdf,.png,.jpg,.jpeg,.gif,.csv,.json,.md"
              />
              <IconButton icon={Paperclip} size="xs" design="ghost" onClick={() => fileInputRef.current?.click()} title="Attach file" />
              <IconButton icon={BookOpen} size="xs" design="ghost" onClick={() => setKnowledgePanelOpen(!knowledgePanelOpen)} className={knowledgePanelOpen ? 'bg-brand/10 text-brand' : ''} title="Browse knowledge base" />
              <IconButton icon={ArrowUp} size="xs" design="ghost" onClick={() => handleSend()} disabled={!input.trim() || isLoading} className={`${
                  input.trim() && !isLoading
                    ? 'bg-foreground text-white'
                    : 'bg-surface-muted text-fg-subtle'
                } w-[30px] h-[30px] rounded-[7px]`} />
            </div>
          </div>
          <p className="text-[11px] text-fg-faint text-center mt-2">
            AI can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <AppPage>
      <PageHeader
        title="AI Agent"
        icon={Sparkles}
        iconColor="#8b5cf6"
        actions={
          <div className="flex items-center gap-1.5">
            <Button design="ghost" size="xs" onClick={() => setKnowledgePanelOpen(!knowledgePanelOpen)}>
              {knowledgePanelOpen ? <PanelRightClose size={11} /> : <BookOpen size={11} />}
              {knowledgePanelOpen ? 'Hide KB' : 'Knowledge'}
            </Button>
            {!showWelcome && (
              <Button design="ghost" size="xs" onClick={handleNewChat}>
                <MessageSquarePlus size={11} />
                New chat
              </Button>
            )}
          </div>
        }
      />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Conversations sidebar — desktop inline, mobile overlay */}
        <div className="w-[260px] shrink-0 border-r border-border/60 flex flex-col bg-surface-muted/30">
            <div className="flex items-center px-3 py-2.5 border-b border-border/60">
              <span className="text-[12px] font-semibold text-fg-muted uppercase tracking-wide">Conversations</span>
            </div>

            {/* Agent selector */}
            {agents.length > 0 && (
              <div className="px-3 py-2 border-b border-border/60">
                <select
                  value={selectedAgentId ?? ""}
                  onChange={(e) => setSelectedAgentId(e.target.value || null)}
                  className="w-full text-[12px] rounded-lg border border-border bg-background px-2.5 py-1.5 text-foreground outline-none focus:ring-1 focus:ring-brand"
                >
                  <option value="">General assistant</option>
                  {agents.filter(a => a.active !== false).map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name}{a.description ? ` — ${a.description}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {conversations.length === 0 && (
                <p className="text-[12px] text-fg-faint text-center py-6 px-3">No conversations yet. Start a chat!</p>
              )}
              {conversations.map(conv => {
                const convAgent = agents.find(a => a.id === conv.agentId);
                return (
                  <div key={conv.id} className={`group flex items-center gap-1.5 px-2.5 py-2 rounded-[10px] cursor-pointer transition-colors ${activeConversationId === conv.id ? 'bg-surface-active border border-border/60' : 'hover:bg-surface-hover border border-transparent'}`}>
                    <button
                      onClick={() => setActiveConversationId(conv.id)}
                      className="flex-1 min-w-0 text-left"
                    >
                      {renamingConv === conv.id ? (
                        <TextInput
                          autoFocus
                          value={renameTitle}
                          onChange={e => setRenameTitle(e.target.value)}
                          onBlur={() => renameConversation(conv.id, renameTitle)}
                          onKeyDown={e => { if (e.key === 'Enter') renameConversation(conv.id, renameTitle); if (e.key === 'Escape') setRenamingConv(null); }}
                          className="px-1.5 py-0.5"
                          onClick={e => e.stopPropagation()}
                        />
                      ) : (
                        <>
                          <p className="text-[12.5px] text-foreground truncate font-medium">{conv.title}</p>
                          <p className="text-[10px] text-fg-faint mt-0.5">
                            {new Date(conv.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            {convAgent ? ` · ${convAgent.name}` : ''}
                          </p>
                        </>
                      )}
                    </button>
                    {renamingConv !== conv.id && (
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                        <IconButton icon={RotateCcw} size="xs" design="ghost" onClick={(e) => { e.stopPropagation(); setRenamingConv(conv.id); setRenameTitle(conv.title); }} title="Rename" className="h-6 w-6" />
                        <IconButton icon={Trash2} size="xs" design="ghost" className="hover:text-destructive hover:bg-red-50 h-6 w-6" onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        {centerPanel}

        {/* Knowledge panel */}
        {knowledgePanelOpen && (
          <div className="w-[320px] shrink-0 border-l border-border/60 flex flex-col bg-background">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/60">
              <span className="text-[12px] font-semibold text-fg-muted uppercase tracking-wide">Knowledge</span>
              <button onClick={() => setKnowledgePanelOpen(false)} className="h-6 w-6 flex items-center justify-center rounded text-fg-faint hover:text-fg-muted transition-colors">
                <X size={13} />
              </button>
            </div>
            <KnowledgePanelContent onSelect={handleSelectKnowledge} />
          </div>
        )}
      </div>
    </AppPage>
  );
}

function KnowledgePanelContent({ onSelect }: { onSelect: (item: any) => void }) {
  const [search, setSearch] = useState("");
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/knowledge', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        setKnowledgeItems(data.items ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return knowledgeItems;
    const q = search.toLowerCase();
    return knowledgeItems.filter(k =>
      (k.label || '').toLowerCase().includes(q) ||
      (k.fileName || '').toLowerCase().includes(q) ||
      k.content.toLowerCase().includes(q)
    );
  }, [knowledgeItems, search]);

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <div className="px-3 py-2 border-b border-border/60">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-faint" />
          <TextInput
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search knowledge..."
            variant="default"
            className="pl-7 pr-2.5 py-1.5"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {loading ? (
          <ListSkeleton rows={4} className="px-1" />
        ) : filtered.length === 0 ? (
          <div className="text-center py-6 px-3">
            <BookOpen size={20} className="text-fg-faint mx-auto mb-2" />
            <p className="text-[12px] text-fg-muted mb-2">
              {knowledgeItems.length === 0 ? 'No knowledge items yet.' : 'No results found.'}
            </p>
            <span className="text-[11px] text-fg-faint">
              Knowledge Base
            </span>
          </div>
        ) : (
          filtered.map(item => (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              className="w-full text-left px-2.5 py-2 rounded-[8px] text-[12px] hover:bg-surface-hover transition-colors border border-transparent hover:border-border/60 bg-none cursor-pointer"
            >
              <span className="font-medium text-foreground block truncate">
                {item.label || item.fileName || 'Untitled'}
              </span>
              <span className="text-fg-faint text-[10px] block mt-0.5 truncate">
                {item.content.slice(0, 80)}...
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

const STARTER_PROMPTS = [
  "Help me draft a reply to a customer asking about pricing",
  "What tickets need attention right now?",
  "How do I set up my knowledge base?",
  "Summarize my recent support conversations",
  "What's the best way to handle a billing escalation?",
];

export default function AgentChat() {
  return <AgentContent />;
}
