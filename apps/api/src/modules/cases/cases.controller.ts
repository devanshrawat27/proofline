import { Body, Controller, Get, HttpCode, Param, Post, Query } from "@nestjs/common";
import {
  caseAssignSchema,
  caseListQuerySchema,
  caseMessageSchema,
  caseTransitionSchema,
  createCaseSchema,
  proposeResolutionSchema,
} from "@proofline/shared-types";
import type {
  CaseAssignInput,
  CaseListQuery,
  CaseMessageInput,
  CaseTransitionInput,
  CreateCaseInput,
  ProposeResolutionInput,
} from "@proofline/shared-types";
import { CurrentUser, RequirePermissions } from "../../common/auth/auth.decorators";
import type { AuthenticatedUser } from "../../common/auth/auth.types";
import { ZodValidationPipe } from "../../common/http/zod-validation.pipe";
import { CasesService } from "./cases.service";

@Controller("cases")
export class CasesController {
  constructor(private readonly cases: CasesService) {}

  @RequirePermissions("case:read")
  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(caseListQuerySchema)) query: CaseListQuery,
  ) {
    return this.cases.list(user.organizationId, query);
  }

  @RequirePermissions("case:read")
  @Get(":id")
  get(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.cases.get(user.organizationId, id);
  }

  @RequirePermissions("case:write")
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createCaseSchema)) input: CreateCaseInput,
  ) {
    return this.cases.create(user.organizationId, user.userId, input);
  }

  @RequirePermissions("case:write")
  @HttpCode(200)
  @Post(":id/transitions")
  transition(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(caseTransitionSchema)) input: CaseTransitionInput,
  ) {
    return this.cases.transition(user.organizationId, user.userId, id, input);
  }

  @RequirePermissions("case:write")
  @HttpCode(200)
  @Post(":id/assign")
  assign(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(caseAssignSchema)) input: CaseAssignInput,
  ) {
    return this.cases.assign(user.organizationId, user.userId, id, input);
  }

  @RequirePermissions("case:write")
  @Post(":id/messages")
  message(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(caseMessageSchema)) input: CaseMessageInput,
  ) {
    return this.cases.addMessage(user.organizationId, user.userId, id, input);
  }

  @RequirePermissions("case:write")
  @Post(":id/resolutions")
  proposeResolution(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(proposeResolutionSchema)) input: ProposeResolutionInput,
  ) {
    return this.cases.proposeResolution(user.organizationId, user.userId, id, input);
  }

  @RequirePermissions("case:approve")
  @HttpCode(200)
  @Post(":id/resolutions/:resolutionId/approve")
  approve(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Param("resolutionId") resolutionId: string,
  ) {
    return this.cases.approveResolution(user.organizationId, user.userId, id, resolutionId);
  }

  @RequirePermissions("resolution:verify")
  @HttpCode(200)
  @Post(":id/resolutions/:resolutionId/verify")
  verify(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Param("resolutionId") resolutionId: string,
  ) {
    return this.cases.verifyResolution(user.organizationId, user.userId, id, resolutionId);
  }
}
