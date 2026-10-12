import { Module } from "@nestjs/common";
import { DiscrepanciesController } from "./discrepancies.controller";
import { DiscrepanciesService } from "./discrepancies.service";

@Module({
  controllers: [DiscrepanciesController],
  providers: [DiscrepanciesService],
})
export class DiscrepanciesModule {}
