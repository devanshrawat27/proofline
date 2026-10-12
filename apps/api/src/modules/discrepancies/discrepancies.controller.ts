import { Controller, Get, Param, Query } from "@nestjs/common";
import { discrepancyListQuerySchema } from "@proofline/shared-types";
import type { DiscrepancyListQuery } from "@proofline/shared-types";
import { CurrentUser, RequirePermissions } from "../../common/auth/auth.decorators";
import type { AuthenticatedUser } from "../../common/auth/auth.types";
import { ZodValidationPipe } from "../../common/http/zod-validation.pipe";
import { DiscrepanciesService } from "./discrepancies.service";

@Controller("discrepancies")
export class DiscrepanciesController {
  constructor(private readonly discrepancies: DiscrepanciesService) {}

  @RequirePermissions("discrepancy:read")
  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(discrepancyListQuerySchema)) query: DiscrepancyListQuery,
  ) {
    return this.discrepancies.list(user.organizationId, query);
  }

  @RequirePermissions("discrepancy:read")
  @Get(":id")
  get(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.discrepancies.get(user.organizationId, id);
  }
}
