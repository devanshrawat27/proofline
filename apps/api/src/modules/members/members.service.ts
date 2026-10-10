import { createHash, randomBytes } from "node:crypto";
import { Injectable, Logger } from "@nestjs/common";
import type {
  AcceptInvitationInput,
  InviteMemberInput,
  OrgRole,
} from "@goodsignal/shared-types";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AppError } from "../../common/errors/app-error";
import { isProduction } from "../../common/config/env";
import type { AuthenticatedUser } from "../../common/auth/auth.types";
import { PasswordService } from "../auth/password.service";
import { SessionService } from "../auth/session.service";
import type { SessionMetadata } from "../auth/session.service";

const INVITE_TTL_HOURS = 72;

@Injectable()
export class MembersService {
  private readonly logger = new Logger(MembersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly sessions: SessionService,
  ) {}

  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  async listMembers(organizationId: string) {
    const members = await this.prisma.organizationMember.findMany({
      where: { organizationId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        role: true,
        status: true,
        createdAt: true,
        user: { select: { id: true, email: true, name: true } },
      },
    });
    return members.map((m) => ({
      id: m.id,
      role: m.role,
      status: m.status,
      createdAt: m.createdAt,
      userId: m.user.id,
      email: m.user.email,
      name: m.user.name,
    }));
  }

  async listInvitations(organizationId: string) {
    const invitations = await this.prisma.invitation.findMany({
      where: { organizationId, acceptedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, role: true, expiresAt: true, createdAt: true },
    });
    return invitations;
  }

  async invite(
    organizationId: string,
    actorUserId: string,
    input: InviteMemberInput,
  ): Promise<{ id: string; email: string; role: OrgRole; expiresAt: Date; acceptToken?: string }> {
    const existingMember = await this.prisma.organizationMember.findFirst({
      where: { organizationId, user: { email: input.email } },
    });
    if (existingMember) {
      throw AppError.conflict("ALREADY_MEMBER", "This person is already a member of the organization.");
    }

    const token = randomBytes(24).toString("base64url");
    const expiresAt = new Date(Date.now() + INVITE_TTL_HOURS * 60 * 60 * 1000);

    const invitation = await this.prisma.invitation.create({
      data: {
        organizationId,
        email: input.email,
        role: input.role,
        tokenHash: this.hashToken(token),
        invitedByUserId: actorUserId,
        expiresAt,
      },
      select: { id: true, email: true, role: true, expiresAt: true },
    });

    // Email delivery is a later phase; in non-production we surface the token so
    // the invite flow is testable end-to-end without a mail provider.
    return {
      ...invitation,
      ...(isProduction ? {} : { acceptToken: token }),
    };
  }

  async acceptInvitation(input: AcceptInvitationInput, meta: SessionMetadata) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { tokenHash: this.hashToken(input.token) },
      include: { organization: { select: { id: true, name: true, slug: true } } },
    });

    if (!invitation || invitation.acceptedAt || invitation.expiresAt.getTime() <= Date.now()) {
      throw AppError.badRequest("INVALID_INVITATION", "This invitation is invalid or has expired.");
    }

    this.passwords.assertStrongEnough(input.password);

    const result = await this.prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({ where: { email: invitation.email } });

      if (user) {
        const ok = await this.passwords.verify(input.password, user.passwordHash);
        if (!ok) {
          throw AppError.unauthorized("An account already exists for this email; the password did not match.");
        }
      } else {
        const passwordHash = await this.passwords.hash(input.password);
        user = await tx.user.create({
          data: { email: invitation.email, name: input.name, passwordHash },
        });
      }

      const membership = await tx.organizationMember.upsert({
        where: { organizationId_userId: { organizationId: invitation.organizationId, userId: user.id } },
        create: {
          organizationId: invitation.organizationId,
          userId: user.id,
          role: invitation.role,
          status: "ACTIVE",
        },
        update: { role: invitation.role, status: "ACTIVE" },
      });

      await tx.invitation.update({ where: { id: invitation.id }, data: { acceptedAt: new Date() } });

      return { user, membership };
    });

    const session = await this.sessions.create(
      result.user.id,
      invitation.organizationId,
      meta,
    );

    const user: AuthenticatedUser = {
      userId: result.user.id,
      email: result.user.email,
      name: result.user.name,
      sessionId: "",
      organizationId: invitation.organizationId,
      membershipId: result.membership.id,
      role: result.membership.role as OrgRole,
    };

    this.logger.log(`Invitation accepted for ${invitation.email} in org ${invitation.organization.slug}`);
    return { session, user, organization: invitation.organization };
  }
}
