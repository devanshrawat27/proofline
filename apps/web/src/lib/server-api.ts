import { cookies } from "next/headers";
import type { OrgRole } from "@goodsignal/shared-types";
import { SERVER_API_BASE_URL } from "./config";

export interface SessionContext {
  user: { id: string; email: string; name: string };
  organization: {
    id: string;
    name: string;
    slug: string;
    timezone: string;
    defaultCurrency: string;
    isDemo: boolean;
  } | null;
  membership: { id: string; role: OrgRole };
}

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "goodsignal_session";

/**
 * Reads the authenticated session on the server by forwarding the session
 * cookie to the API. Returns null when unauthenticated or the API is unreachable.
 */
export async function getSessionContext(): Promise<SessionContext | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const response = await fetch(`${SERVER_API_BASE_URL}/api/v1/auth/me`, {
      headers: { cookie: `${COOKIE_NAME}=${token}` },
      cache: "no-store",
    });
    if (!response.ok) return null;
    return (await response.json()) as SessionContext;
  } catch {
    return null;
  }
}

export interface ServerResult<T> {
  status: number;
  data: T | null;
}

/**
 * Server-side GET forwarding the session cookie. Returns the status so pages
 * can distinguish permission-denied (403) and not-found (404) from success.
 */
export async function serverGet<T>(path: string): Promise<ServerResult<T>> {
  const token = cookies().get(COOKIE_NAME)?.value;
  try {
    const response = await fetch(`${SERVER_API_BASE_URL}${path}`, {
      headers: token ? { cookie: `${COOKIE_NAME}=${token}` } : {},
      cache: "no-store",
    });
    if (!response.ok) return { status: response.status, data: null };
    return { status: response.status, data: (await response.json()) as T };
  } catch {
    return { status: 503, data: null };
  }
}
