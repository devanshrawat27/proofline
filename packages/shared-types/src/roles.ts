import { z } from "zod";

/**
 * Internal organization roles. Supplier users are a separate identity type and
 * are NOT organization members (see the data model / supplier portal).
 */
export const ORG_ROLES = ["OWNER", "PROCUREMENT_MANAGER", "RECEIVER", "FINANCE"] as const;
export type OrgRole = (typeof ORG_ROLES)[number];
export const orgRoleSchema = z.enum(ORG_ROLES);

export const MEMBERSHIP_STATUSES = ["INVITED", "ACTIVE", "DEACTIVATED"] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];
export const membershipStatusSchema = z.enum(MEMBERSHIP_STATUSES);

/**
 * Coarse-grained permissions. Server-side RBAC maps roles -> permissions and
 * every protected route declares the permission(s) it requires. Hiding UI is
 * never a substitute for these server checks.
 */
export const PERMISSIONS = [
  "org:read",
  "org:update",
  "member:read",
  "member:invite",
  "member:update",
  "supplier:read",
  "supplier:write",
  "po:read",
  "po:write",
  "receipt:read",
  "receipt:write",
  "invoice:read",
  "invoice:write",
  "document:read",
  "document:write",
  "document:review",
  "discrepancy:read",
  "case:read",
  "case:write",
  "case:approve",
  "resolution:verify",
  "report:read",
  "audit:read",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const RECEIVER_PERMISSIONS: Permission[] = [
  "org:read",
  "po:read",
  "receipt:read",
  "receipt:write",
  "document:read",
  "document:write",
];

const FINANCE_PERMISSIONS: Permission[] = [
  "org:read",
  "supplier:read",
  "po:read",
  "receipt:read",
  "invoice:read",
  "invoice:write",
  "document:read",
  "discrepancy:read",
  "case:read",
  "resolution:verify",
  "report:read",
];

const PROCUREMENT_PERMISSIONS: Permission[] = [
  "org:read",
  "member:read",
  "supplier:read",
  "supplier:write",
  "po:read",
  "po:write",
  "receipt:read",
  "receipt:write",
  "invoice:read",
  "invoice:write",
  "document:read",
  "document:write",
  "document:review",
  "discrepancy:read",
  "case:read",
  "case:write",
  "case:approve",
  "report:read",
];

const OWNER_PERMISSIONS: Permission[] = [...PERMISSIONS];

export const ROLE_PERMISSIONS: Record<OrgRole, readonly Permission[]> = {
  OWNER: OWNER_PERMISSIONS,
  PROCUREMENT_MANAGER: PROCUREMENT_PERMISSIONS,
  RECEIVER: RECEIVER_PERMISSIONS,
  FINANCE: FINANCE_PERMISSIONS,
};

export function roleHasPermission(role: OrgRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
