import { Injectable } from "@nestjs/common";
import type { SupplierLoginInput } from "@proofline/shared-types";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AppError } from "../../common/errors/app-error";
import type { SupplierPrincipal } from "../../common/auth/supplier-auth.types";
import { PasswordService } from "../auth/password.service";
import { SupplierSessionService } from "./supplier-session.service";
import type { CreatedSupplierSession, SupplierSessionMetadata } from "./supplier-session.service";

@Injectable()
export class SupplierAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly sessions: SupplierSessionService,
  ) {}

  async login(
    input: SupplierLoginInput,
    meta: SupplierSessionMetadata,
  ): Promise<{ session: CreatedSupplierSession; principal: SupplierPrincipal }> {
    const user = await this.prisma.supplierUser.findUnique({
      where: { email: input.email },
      include: { supplier: { select: { id: true, name: true, code: true, organizationId: true } } },
    });

    if (!user) throw AppError.unauthorized("Invalid email or password.");
    const ok = await this.passwords.verify(input.password, user.passwordHash);
    if (!ok) throw AppError.unauthorized("Invalid email or password.");
    if (user.status !== "ACTIVE") throw AppError.forbidden("This supplier account is disabled.");

    await this.prisma.supplierUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const session = await this.sessions.create(user.id, meta);
    const principal: SupplierPrincipal = {
      supplierUserId: user.id,
      supplierUserEmail: user.email,
      supplierUserName: user.name,
      supplierId: user.supplier.id,
      supplierName: user.supplier.name,
      supplierCode: user.supplier.code,
      organizationId: user.supplier.organizationId,
    };
    return { session, principal };
  }
}
