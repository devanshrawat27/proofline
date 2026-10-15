import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { SupplierAuthController } from "./supplier-auth.controller";
import { SupplierAuthGuard } from "./supplier-auth.guard";
import { SupplierAuthService } from "./supplier-auth.service";
import { SupplierCasesController } from "./supplier-cases.controller";
import { SupplierCasesService } from "./supplier-cases.service";
import { SupplierNotificationsController } from "./supplier-notifications.controller";
import { SupplierSessionService } from "./supplier-session.service";

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [SupplierAuthController, SupplierCasesController, SupplierNotificationsController],
  providers: [SupplierAuthService, SupplierCasesService, SupplierSessionService, SupplierAuthGuard],
  exports: [SupplierSessionService, SupplierAuthGuard],
})
export class SupplierModule {}

