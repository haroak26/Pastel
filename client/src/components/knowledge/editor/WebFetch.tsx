import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Globe, Loader2, ExternalLink, AlertCircle, FileText, CheckCircle2, XCircle, Search, BookOpen, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/button';
import { TextInput } from '@/components/text-input';
import { useToast } from '@/hooks/use-toast';
import { useKnowledge } from '../KnowledgeContext';

interface ExtractedPageResult {
  url: string;
  title: string;
  articleTitle: string;
  articleContent: string;
  summary: string;
  tags: string[];
  knowledgeId: string;
  error?: string;
}

interface ScrapeResponse {
  extracted: boolean;
  sourceName: string;
  type: string;
  pagesScraped: number;
  totalDiscovered: number;
  articlesCreated: number;
  pages: ExtractedPageResult[];
}

interface WebFetchProps {
  scopeId: string;
  onSave: () => void;
  onCancel: () => void;
}

type Phase = 'idle' | 'discovering' | 'fetching' | 'extracting' | 'generating' | 'done' | 'error';

interface PhaseStep {
  id: Phase;
  label: string;
  icon: typeof Search;
}

const PIPELINE: PhaseStep[] = [
  { id: 'discovering', label: 'Discovering pages', icon: Search },
  { id: 'fetching', label: 'Fetching page content', icon: Globe },
  { id: 'extracting', label: 'Extracting via Parallel.ai', icon: Loader2 },
  { id: 'generating', label: 'Generating articles via GPT', icon: BookOpen },
];

export function WebFetch({ scopeId, onSave, onCancel }: WebFetchProps) {
  const { toast } = useToast();
  const { navigateToNew } = useKnowledge();
  const [url, setUrl] = useState('');
  const [currentPhase, setCurrentPhase] = useState<Phase>('idle');
  const [phaseMessage, setPhaseMessage] = useState('');
  const [results, setResults] = useState<ScrapeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPage, setSelectedPage] = useState<ExtractedPageResult | null>(null);
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());
  const [pageStatuses, setPageStatuses] = useState<Map<string, Phase>>(new Map());
  const [phaseProgress, setPhaseProgress] = useState({ current: 0, total: 0 });
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (results && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [results]);

  const isValidUrl = (s: string) => {
    try { new URL(s); return true; } catch { return false; }
  };

  const updatePageStatuses = (urls: string[], phase: Phase) => {
    setPageStatuses(prev => {
      const next = new Map(prev);
      for (const url of urls) next.set(url, phase);
      return next;
    });
  };

  const handleStart = async () => {
    if (!url.trim()) {
      toast({ title: 'Enter a URL', variant: 'destructive' });
      return;
    }

    let urlStr = url.trim();
    if (!urlStr.startsWith('http://') && !urlStr.startsWith('https://')) {
      urlStr = `https://${urlStr}`;
    }

    setError(null);
    setResults(null);
    setSelectedPage(null);
    setExpandedPages(new Set());
    setPageStatuses(new Map());

    try {
      // Phase 1: Discovering
      setCurrentPhase('discovering');
      setPhaseMessage('Scanning sitemap and searching for pages...');
      setPhaseProgress({ current: 0, total: 0 });

      // Phase 2-4: The actual API call handles all phases server-side
      setCurrentPhase('fetching');
      setPhaseMessage('Fetching pages from the domain...');
      setPhaseProgress({ current: 0, total: 1 });

      const res = await fetch(`/api/workspaces/${scopeId}/knowledge/scrape`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlStr }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Scraping failed');
      }

      const data: ScrapeResponse = await res.json();
      setResults(data);

      // Populate page statuses
      if (data.pages) {
        const discovered = new Map<string, Phase>();
        for (const page of data.pages) {
          discovered.set(page.url, page.error ? 'error' : 'done');
        }
        setPageStatuses(discovered);
      }

      if (data.pages && data.pages.length > 0) {
        setSelectedPage(data.pages[0]);
        setExpandedPages(new Set(data.pages.slice(0, 5).map(p => p.url)));
      }

      setCurrentPhase('done');
      setPhaseMessage(`Created ${data.articlesCreated} articles from ${data.pagesScraped} pages`);
      toast({ title: 'Fetch complete', variant: 'success' });
    } catch (err) {
      setCurrentPhase('error');
      setError(err instanceof Error ? err.message : 'Scraping failed');
      toast({ title: 'Fetch failed', variant: 'destructive' });
    }
  };

  const togglePageExpanded = (url: string) => {
    setExpandedPages(prev => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url); else next.add(url);
      return next;
    });
  };

  const phaseIcon = (phaseId: Phase) => {
    if (currentPhase === phaseId) return <Loader2 size={14} className="animate-spin text-brand" />;
    const order = ['discovering', 'fetching', 'extracting', 'generating'];
    const phaseIdx = order.indexOf(phaseId);
    const currentIdx = order.indexOf(currentPhase === 'done' ? 'generating' : currentPhase === 'error' ? 'idle' : currentPhase);
    if (currentIdx > phaseIdx || currentPhase === 'done') return <CheckCircle2 size={14} className="text-[hsl(152 60% 40%)]" />;
    return <div className="w-[14px] h-[14px] rounded-full border-2 border-fg-subtle" />;
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-background">
      <div className="flex items-center justify-between h-[46px] px-4 border-b border-border/60">
        <div className="flex items-center gap-2">
          <Button design="ghost" size="sm" onClick={onCancel} className="shrink-0">
            <ArrowLeft size={14} strokeWidth={1.5} />
          </Button>
          <div className="flex items-center gap-1.5">
            <Globe size={14} strokeWidth={1.5} className="text-[#34D399]" />
            <span className="text-[13px] font-medium text-foreground">Web Fetch</span>
          </div>
        </div>
        {currentPhase === 'done' && results && (
          <Button size="sm" onClick={onSave}>
            Done
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[720px] px-6 py-8">
          {/* URL Input */}
          <div className="space-y-4 mb-8">
            <div>
              <label className="text-[12px] font-medium text-fg-muted block mb-1.5">Website URL</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Globe size={14} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle pointer-events-none" />
                  <TextInput
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="https://docs.example.com"
                    size="sm"
                    className="w-full pl-9"
                    onKeyDown={e => { if (e.key === 'Enter' && currentPhase !== 'discovering' && currentPhase !== 'fetching') handleStart(); }}
                    disabled={currentPhase === 'fetching'}
                  />
                </div>
                <Button
                  onClick={handleStart}
                  disabled={!url.trim() || currentPhase === 'fetching'}
                  className="h-[36px]"
                >
                  {currentPhase === 'fetching' ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : 'Start Fetch'}
                </Button>
              </div>
              {url && !isValidUrl(url) && !url.startsWith('http') && (
                <p className="text-[11px] text-[hsl(var(--danger))] mt-1">Enter a valid URL (e.g. https://example.com)</p>
              )}
            </div>
          </div>

          {/* Pipeline Progress */}
          {currentPhase !== 'idle' && currentPhase !== 'done' && currentPhase !== 'error' && (
            <div className="mb-8 p-4 rounded-[10px] bg-[hsl(var(--surface-muted))] border border-[hsl(var(--border-subtle))]">
              <div className="space-y-3">
                {PIPELINE.map((step) => {
                  const order = ['discovering', 'fetching', 'extracting', 'generating'];
                  const stepIdx = order.indexOf(step.id);
                  const cp = currentPhase;
                  const currentIdx = order.indexOf(cp);
                  const isActive = step.id === cp;
                  const isPast = currentIdx > stepIdx;

                  return (
                    <div key={step.id} className="flex items-center gap-3">
                      <div className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center shrink-0',
                        isActive ? 'bg-brand/20' : isPast ? 'bg-[hsl(152 60% 40%)]/20' : 'bg-[hsl(var(--surface-hover))]',
                      )}>
                        {isActive ? (
                          <Loader2 size={12} className="animate-spin text-brand" />
                        ) : isPast ? (
                          <CheckCircle2 size={12} className="text-[hsl(152 60% 40%)]" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-fg-subtle" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={cn(
                          'text-[13px]',
                          isActive ? 'text-foreground font-medium' : isPast ? 'text-fg-muted' : 'text-fg-subtle',
                        )}>{step.label}</p>
                      </div>
                      {isActive && phaseProgress.total > 0 && (
                        <span className="text-[11px] text-fg-subtle">{phaseProgress.current}/{phaseProgress.total}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-[10px] bg-red-50 border border-red-200 mb-6">
              <AlertCircle size={15} className="text-[hsl(var(--danger))] shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] font-medium text-red-800 mb-0.5">Fetch Failed</p>
                <p className="text-[12px] text-red-600">{error}</p>
              </div>
            </div>
          )}

          {/* Results */}
          {results && currentPhase === 'done' && (
            <div ref={resultsRef}>
              {/* Summary Banner */}
              <div className="flex items-center gap-3 mb-6 p-4 rounded-[10px] bg-[hsl(var(--surface-muted))] border border-[hsl(var(--border-subtle))]">
                <div className="w-10 h-10 rounded-lg bg-[hsl(152 60% 40%)]/10 flex items-center justify-center">
                  <CheckCircle2 size={20} className="text-[hsl(152 60% 40%)]" />
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-medium text-foreground">Fetch Complete</p>
                  <p className="text-[12px] text-fg-muted">
                    {results.articlesCreated} article{results.articlesCreated !== 1 ? 's' : ''} created from {results.pagesScraped} page{results.pagesScraped !== 1 ? 's' : ''}
                    {results.totalDiscovered > results.pagesScraped && ` (${results.totalDiscovered} discovered)`}
                  </p>
                </div>
                <Button size="sm" onClick={() => navigateToNew('text')}>
                  <FileText size={13} strokeWidth={1.75} /> New Article
                </Button>
              </div>

              {/* Pages List */}
              {results.pages && results.pages.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-[12px] font-medium text-fg-muted uppercase tracking-wider mb-3">Pages</h3>
                  {results.pages.map((page) => {
                    const isExpanded = expandedPages.has(page.url);
                    const isError = !!page.error;

                    return (
                      <div key={page.url} className="rounded-[8px] border border-border/60 overflow-hidden">
                        <button
                          onClick={() => togglePageExpanded(page.url)}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-[hsl(var(--surface-hover))] transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown size={12} strokeWidth={1.5} className="text-fg-subtle shrink-0" />
                          ) : (
                            <ChevronRight size={12} strokeWidth={1.5} className="text-fg-subtle shrink-0" />
                          )}
                          {isError ? (
                            <XCircle size={14} className="text-[hsl(var(--danger))] shrink-0" />
                          ) : (
                            <CheckCircle2 size={14} className="text-[hsl(152 60% 40%)] shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] text-foreground truncate font-medium">
                              {page.articleTitle || page.title}
                            </p>
                            <p className="text-[11px] text-fg-subtle truncate">{page.url}</p>
                          </div>
                          {!isError && page.knowledgeId && (
                            <span className="text-[11px] text-[hsl(152 60% 40%)] shrink-0">Article created</span>
                          )}
                        </button>

                        {isExpanded && !isError && (
                          <div className="px-3 pb-3 pt-1 border-t border-border/40">
                            {page.summary && (
                              <p className="text-[12px] text-fg-muted mb-2 italic">— {page.summary}</p>
                            )}
                            {page.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {page.tags.map(tag => (
                                  <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[hsl(var(--surface-muted))] text-fg-subtle border border-border/40">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <a
                                href={page.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-brand hover:underline flex items-center gap-1"
                                onClick={e => e.stopPropagation()}
                              >
                                <ExternalLink size={10} strokeWidth={1.5} /> Open original
                              </a>
                              {page.knowledgeId && (
                                <a
                                  href={`/home/knowledge/edit/${page.knowledgeId}`}
                                  className="text-[11px] text-brand hover:underline"
                                  onClick={e => e.stopPropagation()}
                                >
                                  Edit article
                                </a>
                              )}
                            </div>
                          </div>
                        )}

                        {isExpanded && isError && (
                          <div className="px-3 pb-3 pt-1 border-t border-border/40">
                            <p className="text-[12px] text-red-600">{page.error}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WebFetch;
