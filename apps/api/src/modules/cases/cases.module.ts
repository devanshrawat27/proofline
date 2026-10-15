import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { CasesController } from "./cases.controller";
import { CasesService } from "./cases.service";

@Module({
  imports: [NotificationsModule],
  controllers: [CasesController],
  providers: [CasesService],
})
export class CasesModule {}
