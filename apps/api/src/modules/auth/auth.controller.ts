import { Body, Controller, Get, HttpCode, Post, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { loginSchema, signupSchema } from "@proofline/shared-types";
import type { LoginInput, SignupInput } from "@proofline/shared-types";
import { CurrentUser, Public } from "../../common/auth/auth.decorators";
import type { AuthenticatedUser } from "../../common/auth/auth.types";
import { ZodValidationPipe } from "../../common/http/zod-validation.pipe";
import { env, isProduction } from "../../common/config/env";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuthService } from "./auth.service";
import type { AuthResult } from "./auth.service";

function sessionMetadata(req: Request) {
  return {
    userAgent: req.header("user-agent") ?? undefined,
    ipAddress: req.ip,
  };
}

@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  private setSessionCookie(res: Response, token: string, expiresAt: Date): void {
    res.cookie(env.SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: isProduction ? "none" : "lax",
      secure: isProduction,
      path: "/",
      expires: expiresAt,
    });
  }

  private async present(user: AuthenticatedUser) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: {
        id: true,
        name: true,
        slug: true,
        timezone: true,
        defaultCurrency: true,
        isDemo: true,
      },
    });
    return {
      user: { id: user.userId, email: user.email, name: user.name },
      organization,
      membership: { id: user.membershipId, role: user.role },
    };
  }

  @Public()
  @Post("signup")
  async signup(
    @Body(new ZodValidationPipe(signupSchema)) input: SignupInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result: AuthResult = await this.auth.signup(input, sessionMetadata(req));
    this.setSessionCookie(res, result.session.token, result.session.expiresAt);
    return this.present(result.user);
  }

  @Public()
  @HttpCode(200)
  @Post("login")
  async login(
    @Body(new ZodValidationPipe(loginSchema)) input: LoginInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result: AuthResult = await this.auth.login(input, sessionMetadata(req));
    this.setSessionCookie(res, result.session.token, result.session.expiresAt);
    return this.present(result.user);
  }

  @HttpCode(204)
  @Post("logout")
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    const token = req.cookies?.[env.SESSION_COOKIE_NAME] as string | undefined;
    await this.auth.logout(token);
    res.clearCookie(env.SESSION_COOKIE_NAME, { path: "/" });
  }

  @Get("me")
  async me(@CurrentUser() user: AuthenticatedUser) {
    return this.present(user);
  }
}
