import { Injectable } from "@nestjs/common";
import type { UpdateOrganizationInput } from "@proofline/shared-types";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AppError } from "../../common/errors/app-error";

const ORG_SELECT = {
  id: true,
  name: true,
  slug: true,
  timezone: true,
  defaultCurrency: true,
  isDemo: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(organizationId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: ORG_SELECT,
    });
    if (!organization) throw AppError.notFound("Organization not found");
    return organization;
  }

  async update(organizationId: string, input: UpdateOrganizationInput) {
    // Scope the write by id only after confirming the caller's org (enforced by guard).
    return this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
        ...(input.defaultCurrency !== undefined ? { defaultCurrency: input.defaultCurrency } : {}),
      },
      select: ORG_SELECT,
    });
  }
}
