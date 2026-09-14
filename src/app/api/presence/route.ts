/**
 * Live listener count.
 *
 * Each open tab sends a heartbeat; anything that hasn't checked in recently is
 * dropped. Route Handlers are dynamic by default in Next 16, so there's no
 * caching config to opt out of here, and the Node runtime is the default.
 *
 * State is module-scope, which means it is per server instance. That's exact for
 * `next dev`, `next start` and any single-container host. On a platform that
 * fans requests across several instances (Vercel's serverless functions, say)
 * each instance would only see its own share, so back it with Redis there —
 * swap the two helpers below and nothing else changes.
 */
const TTL_MS = 45_000;

const seen = new Map<string, number>();

function sweep(now: number) {
  for (const [id, last] of seen) {
    if (now - last > TTL_MS) seen.delete(id);
  }
}

function count(): number {
  const now = Date.now();
  sweep(now);
  return seen.size;
}

export async function GET() {
  return Response.json({ count: count() }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  let id: unknown;
  let leaving = false;
  try {
    const body = await request.json();
    id = body?.id;
    leaving = body?.leave === true;
  } catch {
    /* malformed body — fall through and just report the count */
  }

  if (typeof id === "string" && id.length > 0 && id.length <= 64) {
    if (leaving) seen.delete(id);
    else seen.set(id, Date.now());
  }

  return Response.json({ count: count() }, { headers: { "cache-control": "no-store" } });
}
