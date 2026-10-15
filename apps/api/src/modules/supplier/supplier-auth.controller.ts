import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from "@nestjs/common";
import type { Request, Response } from "express";
import { supplierLoginSchema } from "@proofline/shared-types";
import type { SupplierLoginInput, SupplierMeDto } from "@proofline/shared-types";
import { Public } from "../../common/auth/auth.decorators";
import type { SupplierPrincipal } from "../../common/auth/supplier-auth.types";
import { ZodValidationPipe } from "../../common/http/zod-validation.pipe";
import { env, isProduction } from "../../common/config/env";
import { SupplierAuthGuard, SupplierCurrent } from "./supplier-auth.guard";
import { SupplierAuthService } from "./supplier-auth.service";
import { SupplierSessionService } from "./supplier-session.service";

function present(principal: SupplierPrincipal): SupplierMeDto {
  return {
    user: { id: principal.supplierUserId, email: principal.supplierUserEmail, name: principal.supplierUserName },
    supplier: { id: principal.supplierId, name: principal.supplierName, code: principal.supplierCode },
  };
}

@Public()
@Controller("supplier/auth")
export class SupplierAuthController {
  constructor(
    private readonly auth: SupplierAuthService,
    private readonly sessions: SupplierSessionService,
  ) {}

  private setCookie(res: Response, token: string, expiresAt: Date): void {
    res.cookie(env.SUPPLIER_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      path: "/",
      expires: expiresAt,
    });
  }

  @HttpCode(200)
  @Post("login")
  async login(
    @Body(new ZodValidationPipe(supplierLoginSchema)) input: SupplierLoginInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { session, principal } = await this.auth.login(input, {
      userAgent: req.header("user-agent") ?? undefined,
      ipAddress: req.ip,
    });
    this.setCookie(res, session.token, session.expiresAt);
    return present(principal);
  }

  @HttpCode(204)
  @Post("logout")
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    const token = req.cookies?.[env.SUPPLIER_COOKIE_NAME] as string | undefined;
    if (token) await this.sessions.revokeByToken(token);
    res.clearCookie(env.SUPPLIER_COOKIE_NAME, { path: "/" });
  }

  @UseGuards(SupplierAuthGuard)
  @Get("me")
  me(@SupplierCurrent() principal: SupplierPrincipal) {
    return present(principal);
  }
}
