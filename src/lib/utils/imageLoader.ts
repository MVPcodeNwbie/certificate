// Lightweight image preloading & in‑memory status cache
// Client-only. Safe no-ops during SSR.

export type ImageStatus = 'pending' | 'loaded' | 'error';

interface CacheEntry {
  status: ImageStatus;
  error?: any;
  // Reuse same promise for concurrent calls
  promise?: Promise<void>;
  // Expiration (ms epoch). Default 15 minutes.
  expires: number;
  lastAccess: number;
}

const CACHE = new Map<string, CacheEntry>();
const DEFAULT_TTL = 15 * 60 * 1000; // 15 min
const MAX_ITEMS = 300; // crude cap to avoid unbounded growth

function pruneIfNeeded() {
  if (CACHE.size <= MAX_ITEMS) return;
  // remove oldest by lastAccess
  const entries = Array.from(CACHE.entries());
  entries.sort((a, b) => a[1].lastAccess - b[1].lastAccess);
  for (let i = 0; i < Math.ceil(entries.length / 5); i++) {
    CACHE.delete(entries[i][0]);
  }
}

export function getCachedStatus(src: string): ImageStatus | undefined {
  if (typeof window === 'undefined') return undefined;
  const e = CACHE.get(src);
  if (!e) return undefined;
  if (Date.now() > e.expires) {
    CACHE.delete(src);
    return undefined;
  }
  e.lastAccess = Date.now();
  return e.status;
}

interface PreloadOptions {
  timeoutMs?: number; // default 10s
  ttl?: number; // override default ttl
  useFetchHead?: boolean; // try HEAD fetch first (can detect 404 faster)
}

export async function preloadImage(src: string, opts: PreloadOptions = {}): Promise<void> {
  if (!src) return;
  if (typeof window === 'undefined') return; // SSR skip
  const existing = CACHE.get(src);
  if (existing && existing.status === 'loaded') return;
  if (existing && existing.status === 'pending' && existing.promise) return existing.promise;
  if (existing && existing.status === 'error') {
    // Allow retry after expiration only
    if (Date.now() < existing.expires) throw existing.error || new Error('previous error');
  }

  const ttl = opts.ttl ?? DEFAULT_TTL;
  const entry: CacheEntry = {
    status: 'pending',
    expires: Date.now() + ttl,
    lastAccess: Date.now()
  };
  CACHE.set(src, entry);
  pruneIfNeeded();

  const timeoutMs = opts.timeoutMs ?? 10000;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  async function viaFetchHead(): Promise<void> {
    try {
      const r = await fetch(src, { method: 'HEAD', mode: 'no-cors', signal: controller.signal });
      // In no-cors we can't inspect status; fall back to image decode
    } catch (e) {
      // ignore fetch errors; fallback to image method
    }
  }

  const p = (async () => {
    if (opts.useFetchHead) {
      await viaFetchHead();
    }
    await new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Image load error'));
      img.src = src;
    });
    try {
      // Modern browsers: wait for decode for rendering quality
      const img = new Image();
      img.src = src;
      if ((img as any).decode) {
        await (img as any).decode();
      }
    } catch {
      // ignore decode failures
    }
  })();

  entry.promise = p.then(() => {
    entry.status = 'loaded';
  }).catch((err) => {
    entry.status = 'error';
    entry.error = err;
    throw err;
  }).finally(() => {
    clearTimeout(timeout);
  });

  return entry.promise;
}

export function warmImages(urls: string[], opts?: PreloadOptions) {
  if (typeof window === 'undefined') return;
  for (const u of urls) preloadImage(u, opts).catch(() => {});
}

// Optional helper: wait until all given images either load or error
export async function awaitAll(urls: string[], opts?: PreloadOptions): Promise<{ loaded: string[]; failed: string[]; }> {
  const loaded: string[] = [];
  const failed: string[] = [];
  await Promise.all(urls.map(u => preloadImage(u, opts).then(() => loaded.push(u)).catch(() => failed.push(u))));
  return { loaded, failed };
}
