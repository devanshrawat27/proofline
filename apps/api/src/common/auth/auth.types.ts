import type { OrgRole } from "@goodsignal/shared-types";

/** The authenticated principal resolved from a valid session. */
export interface AuthenticatedUser {
  userId: string;
  email: string;
  name: string;
  sessionId: string;
  organizationId: string;
  membershipId: string;
  role: OrgRole;
}
