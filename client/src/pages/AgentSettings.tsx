import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AppBody, SplitContentPanels, ListSkeleton } from '@/components/ds';
import { Sparkles, Plus, Bot } from 'lucide-react';
import { Button } from '@/components/button';
import { useSpace } from '@/contexts/space-context';
import { AgentEditor } from '@/components/agents/AgentEditor';

interface Agent {
  id: string;
  spaceId: string;
  name: string;
  description: string;
  personality: string;
  active: boolean;
  autoEscalate: boolean;
  model: string;
  maxCapacity: number;
  timezone: string | null;
  businessHours: { start: string; end: string } | null;
  actions?: any[];
}

export default function AgentSettings() {
  const { spaceList, activeSpaceId } = useSpace();
  const qc = useQueryClient();

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);

  const { data: agentsData, isLoading: agentsLoading } = useQuery<{ agents: Agent[] }>({
    queryKey: ['/api/agents'],
    queryFn: async () => {
      const res = await fetch('/api/agents', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const agents = agentsData?.agents ?? [];

  const filteredAgents = activeSpaceId ? agents.filter(a => a.spaceId === activeSpaceId) : agents;
  const selectedAgent = agents.find(a => a.id === selectedAgentId) ?? null;

  const showDetail = isCreatingAgent || !!selectedAgentId;

  const handleSelectAgent = (id: string) => {
    setSelectedAgentId(id);
    setIsCreatingAgent(false);
  };

  const handleNewAgent = () => {
    setSelectedAgentId(null);
    setIsCreatingAgent(true);
  };

  const clearDetail = () => {
    setSelectedAgentId(null);
    setIsCreatingAgent(false);
  };

  const handleAgentSaved = (saved: Agent) => {
    qc.invalidateQueries({ queryKey: ['/api/agents'] });
    setSelectedAgentId(saved.id);
    setIsCreatingAgent(false);
  };

  const linkedSpace = (id: string) => spaceList.find(s => s.id === id);

  return (
    <SplitContentPanels
      leftSize={30}
      rightSize={70}
      left={
        <div className="flex flex-col h-full">
          {/* ── Header bar (matches inbox pattern) ──────────────── */}
          <div className="flex items-center justify-between px-4 md:pt-1 md:pb-1.5 border-b border-border/40 shrink-0 md:min-h-[32px] max-md:min-h-[52px]">
            <span className="text-[14px] font-medium text-foreground">Agents</span>
            <div className="flex items-center gap-0.5 shrink-0">
              <Button size="xs" onClick={handleNewAgent} disabled={!activeSpaceId}>
                <Plus size={12} /> New Agent
              </Button>
            </div>
          </div>

          {/* ── Agent list ─────────────────────────────────────── */}
          <AppBody>
            {agentsLoading ? (
              <div className="p-4"><ListSkeleton rows={5} /></div>
            ) : filteredAgents.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <div className="w-10 h-10 rounded-[10px] bg-brand/10 flex items-center justify-center mx-auto mb-3">
                  <Sparkles size={18} className="text-brand" />
                </div>
                <p className="text-[13px] font-medium text-foreground">No agents yet</p>
                <p className="text-[12px] text-fg-muted mt-1 mb-4 max-w-[240px] mx-auto">
                  Create your first AI agent to start auto-replying to emails.
                </p>
                {activeSpaceId && (
                  <Button size="xs" onClick={handleNewAgent}>
                    <Plus size={12} /> Create Agent
                  </Button>
                )}
                {!activeSpaceId && (
                  <p className="text-[12px] text-amber bg-amber-muted px-3 py-2 rounded-lg border border-amber-border max-w-[240px] mx-auto">
                    Select an inbox from the sidebar to create agents
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-0.5 px-2 py-2">
                {filteredAgents.map(agent => {
                  const space = linkedSpace(agent.spaceId);
                  const isSelected = selectedAgentId === agent.id;
                  return (
                    <button
                      key={agent.id}
                      onClick={() => handleSelectAgent(agent.id)}
                      className={`w-full text-left flex items-start gap-2.5 px-3 py-3 rounded-xl transition-colors ${
                        isSelected
                          ? 'bg-surface-active border border-border/60'
                          : 'hover:bg-surface-hover border border-transparent'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        agent.active ? 'bg-brand/10' : 'bg-surface-muted'
                      }`}>
                        <Bot size={14} className={agent.active ? 'text-brand' : 'text-fg-faint'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] font-medium text-foreground truncate">{agent.name}</span>
                          <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${agent.active ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                        </div>
                        {agent.description && (
                          <p className="text-[12px] text-fg-muted truncate mt-0.5">{agent.description}</p>
                        )}
                        {space && (
                          <p className="text-[11px] text-fg-faint truncate mt-0.5">{space.name}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </AppBody>
        </div>
      }
      right={
        <>
          {showDetail ? (
            <AgentEditor
              agent={selectedAgent}
              spaceId={activeSpaceId}
              onSaved={handleAgentSaved}
              onDeleted={clearDetail}
              onCancel={() => {
                if (isCreatingAgent) clearDetail();
                else if (selectedAgent) {
                  qc.invalidateQueries({ queryKey: ['/api/agents'] });
                }
              }}
            />
          ) : (
            <AgentEmptyState
              hasAgents={filteredAgents.length > 0}
              hasInbox={!!activeSpaceId}
              onNew={handleNewAgent}
            />
          )}
        </>
      }
    />
  );
}

function AgentEmptyState({ hasAgents, hasInbox, onNew }: { hasAgents: boolean; hasInbox: boolean; onNew: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-[340px]">
        <div className="w-12 h-12 rounded-[14px] bg-brand/10 flex items-center justify-center mx-auto mb-4">
          <Bot size={22} className="text-brand" />
        </div>
        <h3 className="text-[15px] font-semibold text-foreground mb-2">
          {hasAgents ? 'Select an agent' : 'No agents yet'}
        </h3>
        <p className="text-[13px] text-fg-muted leading-relaxed mb-5">
          {hasAgents
            ? 'Pick an agent from the list to view and edit its settings.'
            : 'AI agents auto-reply to emails using your knowledge base and personality settings.'}
        </p>
        {!hasAgents && hasInbox && (
          <Button size="sm" onClick={onNew}>
            <Plus size={13} /> Create First Agent
          </Button>
        )}
        {!hasInbox && (
          <p className="text-[12px] text-amber bg-amber-muted px-3 py-2 rounded-lg border border-amber-border">
            Select an inbox from the sidebar to create agents
          </p>
        )}
      </div>
    </div>
  );
}
