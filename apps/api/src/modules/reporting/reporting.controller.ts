import { Controller, Get } from "@nestjs/common";
import { CurrentUser, RequirePermissions } from "../../common/auth/auth.decorators";
import type { AuthenticatedUser } from "../../common/auth/auth.types";
import { DashboardService } from "./dashboard.service";
import { ReportsService } from "./reports.service";

@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get("summary")
  summary(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboard.summary(user.organizationId);
  }
}

@Controller("reports")
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @RequirePermissions("report:read")
  @Get("discrepancies")
  discrepancies(@CurrentUser() user: AuthenticatedUser) {
    return this.reports.discrepancies(user.organizationId);
  }

  @RequirePermissions("report:read")
  @Get("suppliers")
  suppliers(@CurrentUser() user: AuthenticatedUser) {
    return this.reports.suppliers(user.organizationId);
  }
}
