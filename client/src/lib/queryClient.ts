import { QueryClient, QueryFunction } from "@tanstack/react-query";

function getCsrfToken(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function buildHeaders(headers?: Record<string, string>): Record<string, string> {
  const h: Record<string, string> = { ...headers };
  const unsafeMethods = ["POST", "PUT", "PATCH", "DELETE"];
  const method = h["X-Method"] || "GET";
  // We don't know the method here, but apiRequest will set it. For safety, the server
  // skips CSRF check for /api/ paths, but we still inject the token when available.
  const token = getCsrfToken();
  if (token) h["x-csrf-token"] = token;
  return h;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = {};
  if (data) headers["Content-Type"] = "application/json";
  const token = getCsrfToken();
  if (token) headers["x-csrf-token"] = token;

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 1,
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: false,
    },
  },
});

export async function prefetchAppData(qc: QueryClient = queryClient) {
  await Promise.allSettled([
    qc.prefetchQuery({
      queryKey: ['/api/me'],
      queryFn: async () => {
        const res = await fetch('/api/me', { credentials: 'include' });
        if (!res.ok) return null;
        return res.json();
      },
    }),
    qc.prefetchQuery({
      queryKey: ['/api/tickets'],
      queryFn: async () => {
        const res = await fetch('/api/tickets', { credentials: 'include' });
        if (!res.ok) return { tickets: [] };
        return res.json();
      },
    }),
    qc.prefetchQuery({
      queryKey: ['/api/helpdesks'],
      queryFn: async () => {
        const res = await fetch('/api/helpdesks', { credentials: 'include' });
        if (!res.ok) return [];
        return res.json();
      },
    }),
    qc.prefetchQuery({
      queryKey: ['/api/templates'],
      queryFn: async () => {
        const res = await fetch('/api/templates', { credentials: 'include' });
        if (!res.ok) return [];
        return res.json();
      },
    }),
    qc.prefetchQuery({
      queryKey: ['/api/email-domains'],
      queryFn: async () => {
        const res = await fetch('/api/email-domains', { credentials: 'include' });
        if (!res.ok) return [];
        return res.json();
      },
    }),
  ]);
}
