import { Module } from "@nestjs/common";
import { DashboardController, ReportsController } from "./reporting.controller";
import { DashboardService } from "./dashboard.service";
import { ReportsService } from "./reports.service";

@Module({
  controllers: [DashboardController, ReportsController],
  providers: [DashboardService, ReportsService],
})
export class ReportingModule {}
