import { Body, Controller, Get, HttpCode, Post, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { acceptInvitationSchema, inviteMemberSchema } from "@proofline/shared-types";
import type { AcceptInvitationInput, InviteMemberInput } from "@proofline/shared-types";
import { CurrentUser, Public, RequirePermissions } from "../../common/auth/auth.decorators";
import type { AuthenticatedUser } from "../../common/auth/auth.types";
import { ZodValidationPipe } from "../../common/http/zod-validation.pipe";
import { env, isProduction } from "../../common/config/env";
import { MembersService } from "./members.service";

@Controller("members")
export class MembersController {
  constructor(private readonly members: MembersService) {}

  @RequirePermissions("member:read")
  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.members.listMembers(user.organizationId);
  }

  @RequirePermissions("member:read")
  @Get("invitations")
  listInvitations(@CurrentUser() user: AuthenticatedUser) {
    return this.members.listInvitations(user.organizationId);
  }

  @RequirePermissions("member:invite")
  @Post("invitations")
  invite(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(inviteMemberSchema)) input: InviteMemberInput,
  ) {
    return this.members.invite(user.organizationId, user.userId, input);
  }

  @Public()
  @HttpCode(200)
  @Post("invitations/accept")
  async accept(
    @Body(new ZodValidationPipe(acceptInvitationSchema)) input: AcceptInvitationInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.members.acceptInvitation(input, {
      userAgent: req.header("user-agent") ?? undefined,
      ipAddress: req.ip,
    });
    res.cookie(env.SESSION_COOKIE_NAME, result.session.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      path: "/",
      expires: result.session.expiresAt,
    });
    return {
      user: { id: result.user.userId, email: result.user.email, name: result.user.name },
      organization: result.organization,
      membership: { id: result.user.membershipId, role: result.user.role },
    };
  }
}
