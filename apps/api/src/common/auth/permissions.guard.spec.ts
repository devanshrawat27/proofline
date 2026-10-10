import type { ExecutionContext } from "@nestjs/common";
import type { Reflector } from "@nestjs/core";
import { roleHasPermission, type OrgRole, type Permission } from "@goodsignal/shared-types";
import { AppError } from "../errors/app-error";
import { PermissionsGuard } from "../../modules/auth/permissions.guard";
import type { AuthenticatedUser } from "./auth.types";

function makeContext(user: Partial<AuthenticatedUser> | undefined): ExecutionContext {
  return {
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

function makeGuard(isPublic: boolean, required?: Permission[]): PermissionsGuard {
  const reflector = {
    getAllAndOverride: (key: string) =>
      key === "auth:isPublic" ? isPublic : required,
  } as unknown as Reflector;
  return new PermissionsGuard(reflector);
}

describe("role permission policy", () => {
  it("grants owners every permission", () => {
    expect(roleHasPermission("OWNER", "member:invite")).toBe(true);
    expect(roleHasPermission("OWNER", "resolution:verify")).toBe(true);
  });

  it("restricts receivers from financial and member administration", () => {
    expect(roleHasPermission("RECEIVER", "receipt:write")).toBe(true);
    expect(roleHasPermission("RECEIVER", "member:invite")).toBe(false);
    expect(roleHasPermission("RECEIVER", "resolution:verify")).toBe(false);
  });

  it("allows finance to verify resolutions but not invite members", () => {
    expect(roleHasPermission("FINANCE", "resolution:verify")).toBe(true);
    expect(roleHasPermission("FINANCE", "member:invite")).toBe(false);
  });
});

describe("PermissionsGuard", () => {
  it("allows public routes without a user", () => {
    expect(makeGuard(true, ["member:invite"] as Permission[]).canActivate(makeContext(undefined))).toBe(
      true,
    );
  });

  it("allows routes with no declared permissions", () => {
    expect(makeGuard(false).canActivate(makeContext({ role: "RECEIVER" }))).toBe(true);
  });

  it("denies when the role lacks a required permission", () => {
    const guard = makeGuard(false, ["member:invite"] as Permission[]);
    try {
      guard.canActivate(makeContext({ role: "RECEIVER" }));
      throw new Error("expected guard to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).statusCode).toBe(403);
    }
  });

  it("allows when the role holds the required permission", () => {
    const guard = makeGuard(false, ["member:invite"] as Permission[]);
    expect(guard.canActivate(makeContext({ role: "OWNER" as OrgRole }))).toBe(true);
  });
});
