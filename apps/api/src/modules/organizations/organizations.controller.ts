import { Body, Controller, Get, Patch } from "@nestjs/common";
import { updateOrganizationSchema } from "@proofline/shared-types";
import type { UpdateOrganizationInput } from "@proofline/shared-types";
import { CurrentUser, RequirePermissions } from "../../common/auth/auth.decorators";
import type { AuthenticatedUser } from "../../common/auth/auth.types";
import { ZodValidationPipe } from "../../common/http/zod-validation.pipe";
import { OrganizationsService } from "./organizations.service";

@Controller("organization")
export class OrganizationsController {
  constructor(private readonly organizations: OrganizationsService) {}

  @RequirePermissions("org:read")
  @Get()
  get(@CurrentUser() user: AuthenticatedUser) {
    return this.organizations.get(user.organizationId);
  }

  @RequirePermissions("org:update")
  @Patch()
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(updateOrganizationSchema)) input: UpdateOrganizationInput,
  ) {
    return this.organizations.update(user.organizationId, input);
  }
}
