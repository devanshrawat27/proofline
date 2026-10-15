import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import {
  supplierCaseListQuerySchema,
  supplierProposalSchema,
  supplierRespondSchema,
} from "@proofline/shared-types";
import type {
  SupplierCaseListQuery,
  SupplierProposalInput,
  SupplierRespondInput,
} from "@proofline/shared-types";
import { Public } from "../../common/auth/auth.decorators";
import type { SupplierPrincipal } from "../../common/auth/supplier-auth.types";
import { ZodValidationPipe } from "../../common/http/zod-validation.pipe";
import { SupplierAuthGuard, SupplierCurrent } from "./supplier-auth.guard";
import { SupplierCasesService } from "./supplier-cases.service";

@Public()
@UseGuards(SupplierAuthGuard)
@Controller("supplier/cases")
export class SupplierCasesController {
  constructor(private readonly cases: SupplierCasesService) {}

  @Get()
  list(
    @SupplierCurrent() principal: SupplierPrincipal,
    @Query(new ZodValidationPipe(supplierCaseListQuerySchema)) query: SupplierCaseListQuery,
  ) {
    return this.cases.list(principal, query);
  }

  @Get(":id")
  get(@SupplierCurrent() principal: SupplierPrincipal, @Param("id") id: string) {
    return this.cases.get(principal, id);
  }

  @Post(":id/respond")
  respond(
    @SupplierCurrent() principal: SupplierPrincipal,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(supplierRespondSchema)) input: SupplierRespondInput,
  ) {
    return this.cases.respond(principal, id, input);
  }

  @Post(":id/proposals")
  propose(
    @SupplierCurrent() principal: SupplierPrincipal,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(supplierProposalSchema)) input: SupplierProposalInput,
  ) {
    return this.cases.propose(principal, id, input);
  }
}
