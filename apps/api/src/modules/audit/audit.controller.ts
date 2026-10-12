import { Controller, Get, Query } from "@nestjs/common";
import { auditListQuerySchema } from "@proofline/shared-types";
import type { AuditListQuery } from "@proofline/shared-types";
import { CurrentUser, RequirePermissions } from "../../common/auth/auth.decorators";
import type { AuthenticatedUser } from "../../common/auth/auth.types";
import { ZodValidationPipe } from "../../common/http/zod-validation.pipe";
import { AuditService } from "./audit.service";

@Controller("audit-events")
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @RequirePermissions("audit:read")
  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(auditListQuerySchema)) query: AuditListQuery,
  ) {
    return this.audit.list(user.organizationId, query);
  }
}
