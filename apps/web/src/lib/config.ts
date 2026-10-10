/** Public API base URL. Must be reachable from the browser in the deployment. */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/** Server-side API base URL (container-to-container in production). */
export const SERVER_API_BASE_URL =
  process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
