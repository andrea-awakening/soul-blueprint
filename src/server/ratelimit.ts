// Basic rate limiting per IP address (best effort: per server instance). Nothing is logged or stored on disk.
// Kept apart from the chart engine so light routes (city search) do not load it.
const buckets = new Map<string, number[]>();

export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  return (fwd ? fwd.split(',')[0] : req.headers.get('x-real-ip') || 'local').trim();
}

/** True if this IP is still under `max` requests per hour for this bucket. */
export function allow(req: Request, bucket: string, max: number): boolean {
  const key = `${bucket}:${clientIp(req)}`;
  const now = Date.now();
  const list = (buckets.get(key) || []).filter((t) => now - t < 3600_000);
  if (list.length >= max) { buckets.set(key, list); return false; }
  list.push(now);
  buckets.set(key, list);
  if (buckets.size > 5000) buckets.clear();
  return true;
}

export const tooMany = () => Response.json({ status: 'error', message: 'Too many requests from this connection. Please wait a little and try again.' }, { status: 429 });
