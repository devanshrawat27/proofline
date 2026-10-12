import { Injectable } from "@nestjs/common";
import type { Supplier } from "@prisma/client";
import type {
  CreateSupplierInput,
  SupplierDto,
  SupplierListQuery,
  UpdateSupplierInput,
} from "@proofline/shared-types";
import type { Paginated } from "@proofline/shared-types";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AppError } from "../../common/errors/app-error";

function toDto(supplier: Supplier): SupplierDto {
  return {
    id: supplier.id,
    code: supplier.code,
    name: supplier.name,
    contactName: supplier.contactName,
    email: supplier.email,
    phone: supplier.phone,
    gstin: supplier.gstin,
    addressLine1: supplier.addressLine1,
    city: supplier.city,
    state: supplier.state,
    postalCode: supplier.postalCode,
    country: supplier.country,
    notes: supplier.notes,
    status: supplier.status,
    createdAt: supplier.createdAt.toISOString(),
    updatedAt: supplier.updatedAt.toISOString(),
  };
}

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(organizationId: string, query: SupplierListQuery): Promise<Paginated<SupplierDto>> {
    const { search, status, page, pageSize } = query;
    const where = {
      organizationId,
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { code: { contains: search, mode: "insensitive" as const } },
              { name: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [total, suppliers] = await this.prisma.$transaction([
      this.prisma.supplier.count({ where }),
      this.prisma.supplier.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return { items: suppliers.map(toDto), total, page, pageSize };
  }

  async get(organizationId: string, id: string): Promise<SupplierDto> {
    const supplier = await this.prisma.supplier.findFirst({ where: { id, organizationId } });
    if (!supplier) throw AppError.notFound("Supplier not found");
    return toDto(supplier);
  }

  async create(organizationId: string, input: CreateSupplierInput): Promise<SupplierDto> {
    const existing = await this.prisma.supplier.findUnique({
      where: { organizationId_code: { organizationId, code: input.code } },
      select: { id: true },
    });
    if (existing) {
      throw AppError.conflict("DUPLICATE_SUPPLIER_CODE", "A supplier with this code already exists.");
    }

    const supplier = await this.prisma.supplier.create({
      data: {
        organizationId,
        code: input.code,
        name: input.name,
        contactName: input.contactName ?? null,
        email: input.email ?? null,
        phone: input.phone ?? null,
        gstin: input.gstin ?? null,
        addressLine1: input.addressLine1 ?? null,
        city: input.city ?? null,
        state: input.state ?? null,
        postalCode: input.postalCode ?? null,
        country: input.country,
        notes: input.notes ?? null,
        status: input.status,
      },
    });

    return toDto(supplier);
  }

  async update(
    organizationId: string,
    id: string,
    input: UpdateSupplierInput,
  ): Promise<SupplierDto> {
    const current = await this.prisma.supplier.findFirst({
      where: { id, organizationId },
      select: { id: true, code: true },
    });
    if (!current) throw AppError.notFound("Supplier not found");

    if (input.code && input.code !== current.code) {
      const clash = await this.prisma.supplier.findUnique({
        where: { organizationId_code: { organizationId, code: input.code } },
        select: { id: true },
      });
      if (clash) {
        throw AppError.conflict("DUPLICATE_SUPPLIER_CODE", "A supplier with this code already exists.");
      }
    }

    const supplier = await this.prisma.supplier.update({
      where: { id },
      data: {
        ...(input.code !== undefined ? { code: input.code } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.contactName !== undefined ? { contactName: input.contactName ?? null } : {}),
        ...(input.email !== undefined ? { email: input.email ?? null } : {}),
        ...(input.phone !== undefined ? { phone: input.phone ?? null } : {}),
        ...(input.gstin !== undefined ? { gstin: input.gstin ?? null } : {}),
        ...(input.addressLine1 !== undefined ? { addressLine1: input.addressLine1 ?? null } : {}),
        ...(input.city !== undefined ? { city: input.city ?? null } : {}),
        ...(input.state !== undefined ? { state: input.state ?? null } : {}),
        ...(input.postalCode !== undefined ? { postalCode: input.postalCode ?? null } : {}),
        ...(input.country !== undefined ? { country: input.country } : {}),
        ...(input.notes !== undefined ? { notes: input.notes ?? null } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      },
    });

    return toDto(supplier);
  }
}
