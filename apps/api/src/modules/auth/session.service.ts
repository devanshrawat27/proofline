import { createHash, randomBytes } from "node:crypto";
import { Injectable, Logger } from "@nestjs/common";
import type { OrgRole } from "@goodsignal/shared-types";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthenticatedUser } from "../../common/auth/auth.types";
import { env } from "../../common/config/env";

export interface SessionMetadata {
  userAgent?: string;
  ipAddress?: string;
}

export interface CreatedSession {
  token: string;
  expiresAt: Date;
}

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(private readonly prisma: PrismaService) {}

  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  async create(userId: string, orgId: string | null, meta: SessionMetadata): Promise<CreatedSession> {
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + env.SESSION_TTL_HOURS * 60 * 60 * 1000);

    await this.prisma.session.create({
      data: {
        userId,
        tokenHash: this.hashToken(token),
        activeOrganizationId: orgId,
        expiresAt,
        userAgent: meta.userAgent?.slice(0, 512),
        ipAddress: meta.ipAddress?.slice(0, 64),
      },
    });

    return { token, expiresAt };
  }

  async resolve(token: string): Promise<AuthenticatedUser | null> {
    const session = await this.prisma.session.findUnique({
      where: { tokenHash: this.hashToken(token) },
      include: {
        user: {
          include: {
            memberships: {
              where: { status: "ACTIVE" },
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    });

    if (!session) return null;
    if (session.revokedAt) return null;
    if (session.expiresAt.getTime() <= Date.now()) return null;
    if (session.user.status !== "ACTIVE") return null;

    const memberships = session.user.memberships;
    if (memberships.length === 0) return null;

    const active =
      memberships.find((m) => m.organizationId === session.activeOrganizationId) ?? memberships[0]!;

    // Refresh lastUsedAt opportunistically (at most once per 5 minutes).
    const lastUsed = session.lastUsedAt?.getTime() ?? 0;
    if (Date.now() - lastUsed > 5 * 60 * 1000) {
      this.prisma.session
        .update({ where: { id: session.id }, data: { lastUsedAt: new Date() } })
        .catch((err: unknown) => this.logger.warn(`Failed to refresh session lastUsedAt: ${String(err)}`));
    }

    return {
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name,
      sessionId: session.id,
      organizationId: active.organizationId,
      membershipId: active.id,
      role: active.role as OrgRole,
    };
  }

  async revokeByToken(token: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { tokenHash: this.hashToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
