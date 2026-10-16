import type { NextRequest } from "next/server";
import { SERVER_API_BASE_URL } from "@/lib/config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Same-origin API proxy (BFF). The browser calls the web origin (`/api/v1/...`)
 * and this forwards to the API. This keeps the session cookie first-party,
 * avoiding third-party-cookie blocking when web and API are on different hosts.
 */
async function handle(
  request: NextRequest,
  context: { params: { path: string[] } },
): Promise<Response> {
  const { path } = context.params;
  const target = `${SERVER_API_BASE_URL}/api/${path.join("/")}${request.nextUrl.search}`;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");

  const hasBody = !["GET", "HEAD", "OPTIONS"].includes(request.method);
  const body = hasBody ? Buffer.from(await request.arrayBuffer()) : undefined;

  const upstream = await fetch(target, {
    method: request.method,
    headers,
    body,
    redirect: "manual",
    cache: "no-store",
  });

  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (["content-encoding", "content-length", "transfer-encoding", "connection"].includes(lower)) return;
    if (lower === "set-cookie") return;
    responseHeaders.append(key, value);
  });
  const cookies = upstream.headers.getSetCookie?.() ?? [];
  for (const cookie of cookies) responseHeaders.append("set-cookie", cookie);

  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;
export const HEAD = handle;
