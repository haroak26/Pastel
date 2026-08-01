import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-user';
import { useWorkspace } from '@/contexts/workspace-context';

interface ApiSpace {
  id: string;
  name: string;
  emailAddress: string;
  domain: string;
  spaceType: string;
  senderAvatar: string | null;
  unreadCount: number;
  createdAt?: string;
}

interface SpaceContextType {
  spaceList: ApiSpace[];
  activeSpaceId: string | null;
  setActiveSpaceId: (id: string | null) => void;
  activeSpace: ApiSpace | null;
  activeSpaceType: string | null;
  isLoading: boolean;
  switchingSpace: boolean;
  switchingPhase: 'idle' | 'logging-out' | 'totp' | 'signing-in';
  switchingSpaceName: string;
  requireTotp: boolean;
  totpError: string;
  verifyTotpForSpace: (code: string) => Promise<void>;
  cancelTotp: () => void;
  selectedDomain: string | null;
  setSelectedDomain: (d: string | null) => void;
  domains: string[];
  filteredSpaces: ApiSpace[];
}

const SpaceContext = createContext<SpaceContextType | null>(null);

function getVerifiedInboxes(): Set<string> {
  try {
    const raw = window.localStorage.getItem('pastel.verifiedSpaces');
    if (raw) return new Set(JSON.parse(raw));
  } catch {}
  return new Set();
}

function saveVerifiedInboxes(set: Set<string>) {
  try {
    window.localStorage.setItem('pastel.verifiedSpaces', JSON.stringify([...set]));
  } catch {}
}

export function SpaceProvider({ children }: { children: React.ReactNode }) {
  const { data: user } = useUser();
  const { activeWorkspaceId } = useWorkspace();
  const [activeSpaceId, setActiveSpaceIdState] = useState<string | null>(() => {
    try {
      const stored = window.localStorage.getItem('pastel.activeSpaceId');
      return stored ? stored : null;
    } catch {
      return null;
    }
  });

  const [selectedDomain, setSelectedDomain] = useState<string | null>(() => {
    try {
      return window.localStorage.getItem('pastel.selectedDomain') || null;
    } catch {
      return null;
    }
  });

  const [switchingSpace, setSwitchingSpace] = useState(false);
  const [switchingPhase, setSwitchingPhase] = useState<'idle' | 'logging-out' | 'totp' | 'signing-in'>('idle');
  const [switchingSpaceName, setSwitchingSpaceName] = useState('');
  const [pendingSpaceId, setPendingSpaceId] = useState<string | null>(null);
  const [totpError, setTotpError] = useState('');

  const totpEnabled = !!(user as { totpEnabled?: boolean } | null)?.totpEnabled;

  const { data: spaceList = [], isLoading } = useQuery<ApiSpace[]>({
    queryKey: ['/api/spaces', activeWorkspaceId],
    queryFn: async () => {
      const params = activeWorkspaceId ? `?workspaceId=${encodeURIComponent(activeWorkspaceId)}` : '';
      const res = await fetch(`/api/spaces${params}`, { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    select: (data) => (Array.isArray(data) ? data : []),
    enabled: !!user && !!activeWorkspaceId,
    refetchInterval: 30_000,
  });

  const domains = [...new Set(spaceList.map(i => i.domain).filter(Boolean))].sort();

  useEffect(() => {
    if (selectedDomain && !domains.includes(selectedDomain)) {
      setSelectedDomain(null);
    }
  }, [domains, selectedDomain]);

  const filteredSpaces = selectedDomain
    ? spaceList.filter(i => i.domain === selectedDomain)
    : spaceList;

  // If we have spaces but no activeSpaceId, pick the first one immediately (synchronous, not in an effect)
  const resolvedActiveSpaceId = activeSpaceId ?? filteredSpaces[0]?.id ?? null;

  useEffect(() => {
    if (filteredSpaces.length === 0) return;
    if (!activeSpaceId) {
      const firstId = filteredSpaces[0].id;
      setActiveSpaceIdState(firstId);
      try { window.localStorage.setItem('pastel.activeSpaceId', firstId); } catch {}
    }
  }, [filteredSpaces, activeSpaceId]);

  const completeSwitch = useCallback((id: string) => {
    setActiveSpaceIdState(id);
    try { window.localStorage.setItem('pastel.activeSpaceId', id); } catch {}
    setSwitchingSpace(false);
    setSwitchingPhase('idle');
    setPendingSpaceId(null);
    setTotpError('');
  }, []);

  const verifyTotpForSpace = useCallback(async (code: string) => {
    setTotpError('');
    try {
      const res = await fetch('/api/me/2fa/totp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Incorrect code' }));
        throw new Error(err.message);
      }
      const verified = getVerifiedInboxes();
      if (pendingSpaceId !== null) {
        verified.add(pendingSpaceId);
        saveVerifiedInboxes(verified);
      }
      if (pendingSpaceId !== null) completeSwitch(pendingSpaceId);
    } catch (err) {
      setTotpError(err instanceof Error ? err.message : 'Verification failed');
    }
  }, [pendingSpaceId, completeSwitch]);

  const cancelTotp = useCallback(() => {
    setSwitchingSpace(false);
    setSwitchingPhase('idle');
    setPendingSpaceId(null);
    setTotpError('');
  }, []);

  const setActiveSpaceId = (id: string | null) => {
    if (id === activeSpaceId || id === null) return;
    const target = spaceList.find(i => i.id === id);
    const targetName = target?.name ?? 'Space';
    const currentName = activeSpace?.name ?? 'Space';
    const verified = getVerifiedInboxes();
    const needsTotp = totpEnabled && !verified.has(id);

    if (needsTotp) {
      setSwitchingSpace(true);
      setSwitchingSpaceName(targetName);
      setPendingSpaceId(id);
      setSwitchingPhase('totp');
    } else {
      completeSwitch(id);
    }
  };

  const handleSetSelectedDomain = (d: string | null) => {
    setSelectedDomain(d);
    if (d) {
      try { window.localStorage.setItem('pastel.selectedDomain', d); } catch {}
    } else {
      try { window.localStorage.removeItem('pastel.selectedDomain'); } catch {}
    }
    setActiveSpaceIdState(null);
  };

  const activeSpace = filteredSpaces.find(i => i.id === resolvedActiveSpaceId) ?? null;
  const activeSpaceType = activeSpace?.spaceType ?? null;

  return (
    <SpaceContext.Provider value={{
      spaceList, activeSpaceId: resolvedActiveSpaceId, setActiveSpaceId: setActiveSpaceId, activeSpace, activeSpaceType, isLoading,
      switchingSpace, switchingPhase, switchingSpaceName,
      requireTotp: switchingPhase === 'totp',
      totpError, verifyTotpForSpace, cancelTotp,
      selectedDomain, setSelectedDomain: handleSetSelectedDomain,
      domains, filteredSpaces,
    }}>
      {children}
    </SpaceContext.Provider>
  );
}

export function useSpace() {
  const ctx = useContext(SpaceContext);
  if (!ctx) throw new Error('useSpace must be used within SpaceProvider');
  return ctx;
}
