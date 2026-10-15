import type { CanActivate, ExecutionContext } from "@nestjs/common";
import { Injectable, createParamDecorator } from "@nestjs/common";
import type { Request } from "express";
import { AppError } from "../../common/errors/app-error";
import type { SupplierPrincipal } from "../../common/auth/supplier-auth.types";
import { env } from "../../common/config/env";
import { SupplierSessionService } from "./supplier-session.service";

@Injectable()
export class SupplierAuthGuard implements CanActivate {
  constructor(private readonly sessions: SupplierSessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { supplier?: SupplierPrincipal }>();
    const token = request.cookies?.[env.SUPPLIER_COOKIE_NAME] as string | undefined;
    if (!token) throw AppError.unauthorized("Supplier sign-in required.");

    const principal = await this.sessions.resolve(token);
    if (!principal) throw AppError.unauthorized("Your session has expired. Please sign in again.");

    request.supplier = principal;
    return true;
  }
}

export const SupplierCurrent = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SupplierPrincipal => {
    const request = ctx.switchToHttp().getRequest<{ supplier?: SupplierPrincipal }>();
    if (!request.supplier) {
      throw new Error("SupplierCurrent used on a route without SupplierAuthGuard");
    }
    return request.supplier;
  },
);
