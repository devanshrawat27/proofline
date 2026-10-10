import type { ExecutionContext } from "@nestjs/common";
import { SetMetadata, createParamDecorator } from "@nestjs/common";
import type { Permission } from "@proofline/shared-types";
import type { AuthenticatedUser } from "./auth.types";

export const IS_PUBLIC_KEY = "auth:isPublic";
export const PERMISSIONS_KEY = "auth:permissions";

/** Marks a route as accessible without authentication (e.g. login, health). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** Requires the authenticated role to hold every listed permission. */
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

/** Injects the authenticated user (populated by SessionAuthGuard). */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    if (!request.user) {
      throw new Error("CurrentUser used on an unauthenticated route");
    }
    return request.user;
  },
);
