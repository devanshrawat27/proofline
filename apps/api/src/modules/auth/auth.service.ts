import { Injectable, Logger } from "@nestjs/common";
import type { OrgRole, SignupInput, LoginInput } from "@proofline/shared-types";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AppError } from "../../common/errors/app-error";
import type { AuthenticatedUser } from "../../common/auth/auth.types";
import { PasswordService } from "./password.service";
import { SessionService, type CreatedSession, type SessionMetadata } from "./session.service";

export interface AuthResult {
  session: CreatedSession;
  user: AuthenticatedUser;
}

function slugify(value: string): string {
  const base = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base.length > 0 ? base : "org";
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly sessions: SessionService,
  ) {}

  async signup(input: SignupInput, meta: SessionMetadata): Promise<AuthResult> {
    this.passwords.assertStrongEnough(input.password);

    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw AppError.conflict("EMAIL_IN_USE", "An account with this email already exists.");
    }

    const passwordHash = await this.passwords.hash(input.password);
    const slug = await this.uniqueSlug(input.organizationName);

    const { user, membership, organization } = await this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: input.organizationName,
          slug,
          timezone: input.timezone,
          defaultCurrency: input.defaultCurrency,
          isDemo: false,
        },
      });

      const user = await tx.user.create({
        data: {
          email: input.email,
          name: input.name,
          passwordHash,
          lastLoginAt: new Date(),
        },
      });

      const membership = await tx.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          role: "OWNER",
          status: "ACTIVE",
        },
      });

      return { user, membership, organization };
    });

    const session = await this.sessions.create(user.id, organization.id, meta);
    this.logger.log(`New organization created: ${organization.slug}`);

    return {
      session,
      user: {
        userId: user.id,
        email: user.email,
        name: user.name,
        sessionId: "",
        organizationId: organization.id,
        membershipId: membership.id,
        role: "OWNER" satisfies OrgRole,
      },
    };
  }

  async login(input: LoginInput, meta: SessionMetadata): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
      include: {
        memberships: { where: { status: "ACTIVE" }, orderBy: { createdAt: "asc" } },
      },
    });

    // Generic failure message prevents user enumeration.
    const invalid = AppError.unauthorized("Incorrect email or password.");
    if (!user || user.status !== "ACTIVE") {
      // Still perform a hash comparison to reduce timing signal.
      await this.passwords.verify(input.password, "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin");
      throw invalid;
    }

    const ok = await this.passwords.verify(input.password, user.passwordHash);
    if (!ok) throw invalid;

    const membership = user.memberships[0];
    if (!membership) {
      throw AppError.forbidden("Your account is not a member of any active organization.");
    }

    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const session = await this.sessions.create(user.id, membership.organizationId, meta);

    return {
      session,
      user: {
        userId: user.id,
        email: user.email,
        name: user.name,
        sessionId: "",
        organizationId: membership.organizationId,
        membershipId: membership.id,
        role: membership.role as OrgRole,
      },
    };
  }

  async logout(token: string | undefined): Promise<void> {
    if (token) await this.sessions.revokeByToken(token);
  }

  private async uniqueSlug(name: string): Promise<string> {
    const base = slugify(name);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidate = attempt === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 7)}`;
      const clash = await this.prisma.organization.findUnique({ where: { slug: candidate } });
      if (!clash) return candidate;
    }
    return `${base}-${Date.now().toString(36)}`;
  }
}
