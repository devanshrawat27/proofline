import { createHash, randomBytes } from "node:crypto";
import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { SupplierPrincipal } from "../../common/auth/supplier-auth.types";
import { env } from "../../common/config/env";

export interface SupplierSessionMetadata {
  userAgent?: string;
  ipAddress?: string;
}

export interface CreatedSupplierSession {
  token: string;
  expiresAt: Date;
}

@Injectable()
export class SupplierSessionService {
  private readonly logger = new Logger(SupplierSessionService.name);

  constructor(private readonly prisma: PrismaService) {}

  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  async create(
    supplierUserId: string,
    meta: SupplierSessionMetadata,
  ): Promise<CreatedSupplierSession> {
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + env.SESSION_TTL_HOURS * 60 * 60 * 1000);

    await this.prisma.supplierSession.create({
      data: {
        supplierUserId,
        tokenHash: this.hashToken(token),
        expiresAt,
        userAgent: meta.userAgent?.slice(0, 512),
        ipAddress: meta.ipAddress?.slice(0, 64),
      },
    });

    return { token, expiresAt };
  }

  async resolve(token: string): Promise<SupplierPrincipal | null> {
    const session = await this.prisma.supplierSession.findUnique({
      where: { tokenHash: this.hashToken(token) },
      include: { supplierUser: { include: { supplier: { select: { id: true, name: true, code: true, organizationId: true } } } } },
    });

    if (!session) return null;
    if (session.revokedAt) return null;
    if (session.expiresAt.getTime() <= Date.now()) return null;
    if (session.supplierUser.status !== "ACTIVE") return null;

    const lastUsed = session.lastUsedAt?.getTime() ?? 0;
    if (Date.now() - lastUsed > 5 * 60 * 1000) {
      this.prisma.supplierSession
        .update({ where: { id: session.id }, data: { lastUsedAt: new Date() } })
        .catch((err: unknown) => this.logger.warn(`Failed to refresh supplier session: ${String(err)}`));
    }

    const user = session.supplierUser;
    return {
      supplierUserId: user.id,
      supplierUserEmail: user.email,
      supplierUserName: user.name,
      supplierId: user.supplier.id,
      supplierName: user.supplier.name,
      supplierCode: user.supplier.code,
      organizationId: user.supplier.organizationId,
    };
  }

  async revokeByToken(token: string): Promise<void> {
    await this.prisma.supplierSession.updateMany({
      where: { tokenHash: this.hashToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
