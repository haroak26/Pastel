import { useMutation, useQueryClient } from '@tanstack/react-query';

type Method = 'POST' | 'PUT' | 'PATCH' | 'DELETE';

async function apiFetch(url: string, method: Method, body?: unknown) {
  const res = await fetch(url, {
    method, credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.message ?? `${method} ${url} failed`);
  }
  return res.json();
}

export function useSpaceMutations() {
  const qc = useQueryClient();
  const invalidateSpace = (spaceId?: string) => {
    qc.invalidateQueries({ queryKey: ['/api/spaces'] });
    if (spaceId) qc.invalidateQueries({ queryKey: ['/api/spaces', spaceId, 'threads'] });
  };

  return {
    starEmail: useMutation({
      mutationFn: ({ id, starred }: { id: number; starred: boolean }) =>
        apiFetch(`/api/emails/${id}`, 'PATCH', { isStarred: starred }),
      onSuccess: () => invalidateSpace(),
    }),
    markRead: useMutation({
      mutationFn: (id: number) => apiFetch(`/api/emails/${id}`, 'PATCH', { isRead: true }),
      onSuccess: () => invalidateSpace(),
    }),
    deleteEmail: useMutation({
      mutationFn: (id: number) => apiFetch(`/api/emails/${id}`, 'DELETE'),
      onSuccess: () => invalidateSpace(),
    }),
    replyToEmail: useMutation({
      mutationFn: ({ id, body, from }: { id: string; body: string; from?: string }) =>
        apiFetch(`/api/emails/${id}/reply`, 'POST', { body, from }),
      onSuccess: (_data, vars) => invalidateSpace(),
    }),
    composeEmail: useMutation({
      mutationFn: ({ spaceId, ...data }: any) => apiFetch(`/api/spaces/${spaceId}/compose`, 'POST', data),
      onSuccess: () => invalidateSpace(),
    }),
  };
}

export function useTicketMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['/api/tickets'] });

  return {
    updateTicket: useMutation({
      mutationFn: ({ id, ...data }: { id: string; [key: string]: unknown }) =>
        apiFetch(`/api/tickets/${id}`, 'PATCH', data),
      onSuccess: invalidate,
    }),
    deleteTicket: useMutation({
      mutationFn: (id: string) => apiFetch(`/api/tickets/${id}`, 'DELETE'),
      onSuccess: invalidate,
    }),
    generateDescription: useMutation({
      mutationFn: (id: string) => apiFetch(`/api/tickets/${id}/generate-description`, 'POST'),
      onSuccess: invalidate,
    }),
    createActivity: useMutation({
      mutationFn: ({ ticketId, ...data }: { ticketId: string; [key: string]: unknown }) =>
        apiFetch(`/api/tickets/${ticketId}/activities`, 'POST', data),
      onSuccess: invalidate,
    }),
    assignTicket: useMutation({
      mutationFn: ({ ticketId, ...data }: { ticketId: string; [key: string]: unknown }) =>
        apiFetch(`/api/tickets/${ticketId}/assign`, 'POST', data),
      onSuccess: invalidate,
    }),
    routeHuman: useMutation({
      mutationFn: (ticketId: string) => apiFetch(`/api/tickets/${ticketId}/route-human`, 'POST'),
      onSuccess: invalidate,
    }),
  };
}

export function useDomainMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['/api/email-domains'] });

  return {
    addDomain: useMutation({
      mutationFn: (data: { domain: string }) => apiFetch('/api/email-domains', 'POST', data),
      onSuccess: invalidate,
    }),
    deleteDomain: useMutation({
      mutationFn: (id: string) => apiFetch(`/api/email-domains/${id}`, 'DELETE'),
      onSuccess: invalidate,
    }),
    verifyDomain: useMutation({
      mutationFn: async (id: string) => {
        const res = await fetch(`/api/email-domains/${id}/verify`, { credentials: 'include' });
        if (!res.ok) throw new Error('Verification failed');
        return res.json();
      },
    }),
    uploadBimi: useMutation({
      mutationFn: ({ id, svg }: { id: string; svg: string }) =>
        apiFetch(`/api/email-domains/${id}/bimi`, 'POST', { svg }),
      onSuccess: invalidate,
    }),
  };
}

export function useWorkspaceMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['/api/workspaces'] });

  return {
    createWorkspace: useMutation({
      mutationFn: (data: { name: string; domain: string }) => apiFetch('/api/workspaces', 'POST', data),
      onSuccess: invalidate,
    }),
    updateWorkspace: useMutation({
      mutationFn: ({ id, ...data }: { id: string; [key: string]: unknown }) =>
        apiFetch(`/api/workspaces/${id}`, 'PATCH', data),
      onSuccess: invalidate,
    }),
    deleteWorkspace: useMutation({
      mutationFn: (id: string) => apiFetch(`/api/workspaces/${id}`, 'DELETE'),
      onSuccess: invalidate,
    }),
    inviteMember: useMutation({
      mutationFn: ({ workspaceId, ...data }: { workspaceId: string; email: string; role?: string }) =>
        apiFetch(`/api/workspaces/${workspaceId}/members`, 'POST', data),
      onSuccess: invalidate,
    }),
    removeMember: useMutation({
      mutationFn: ({ workspaceId, memberId }: { workspaceId: string; memberId: string }) =>
        apiFetch(`/api/workspaces/${workspaceId}/members/${memberId}`, 'DELETE'),
      onSuccess: invalidate,
    }),
  };
}

export function useAgentMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['/api/agents'] });

  return {
    createAgent: useMutation({
      mutationFn: (data: { spaceId: string; name: string; personality?: string }) =>
        apiFetch('/api/agents', 'POST', data),
      onSuccess: invalidate,
    }),
    updateAgent: useMutation({
      mutationFn: ({ id, ...data }: { id: string; [key: string]: unknown }) =>
        apiFetch(`/api/agents/${id}`, 'PUT', data),
      onSuccess: invalidate,
    }),
    deleteAgent: useMutation({
      mutationFn: (id: string) => apiFetch(`/api/agents/${id}`, 'DELETE'),
      onSuccess: invalidate,
    }),
    addKnowledge: useMutation({
      mutationFn: ({ agentId, ...data }: { agentId: string; type: string; content: string }) =>
        apiFetch(`/api/agents/${agentId}/knowledge`, 'POST', data),
      onSuccess: invalidate,
    }),
  };
}

export function useBillingMutations() {
  return {
    checkout: useMutation({
      mutationFn: (plan: string) => apiFetch('/api/billing/checkout', 'POST', { plan }),
    }),
    cancelSubscription: useMutation({
      mutationFn: () => apiFetch('/api/billing/cancel', 'POST'),
    }),
    portal: useMutation({
      mutationFn: () => apiFetch('/api/billing/portal', 'POST'),
    }),
  };
}
