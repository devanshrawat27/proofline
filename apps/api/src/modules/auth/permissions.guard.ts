import type { CanActivate, ExecutionContext } from "@nestjs/common";
import { Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Permission } from "@goodsignal/shared-types";
import { roleHasPermission } from "@goodsignal/shared-types";
import { AppError } from "../../common/errors/app-error";
import { IS_PUBLIC_KEY, PERMISSIONS_KEY } from "../../common/auth/auth.decorators";
import type { AuthenticatedUser } from "../../common/auth/auth.types";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const required = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;
    if (!user) throw AppError.unauthorized();

    const allowed = required.every((permission) => roleHasPermission(user.role, permission));
    if (!allowed) {
      throw AppError.forbidden("Your role does not permit this action.");
    }
    return true;
  }
}
