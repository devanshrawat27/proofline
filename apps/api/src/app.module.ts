import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { PrismaModule } from "./common/prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { SessionAuthGuard } from "./modules/auth/session-auth.guard";
import { PermissionsGuard } from "./modules/auth/permissions.guard";
import { OrganizationsModule } from "./modules/organizations/organizations.module";
import { MembersModule } from "./modules/members/members.module";
import { SuppliersModule } from "./modules/suppliers/suppliers.module";
import { PurchaseOrdersModule } from "./modules/purchase-orders/purchase-orders.module";
import { ReceiptsModule } from "./modules/receipts/receipts.module";
import { InvoicesModule } from "./modules/invoices/invoices.module";
import { DiscrepanciesModule } from "./modules/discrepancies/discrepancies.module";
import { CasesModule } from "./modules/cases/cases.module";
import { ReportingModule } from "./modules/reporting/reporting.module";
import { AuditModule } from "./modules/audit/audit.module";
import { SupplierModule } from "./modules/supplier/supplier.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { DocumentsModule } from "./modules/documents/documents.module";
import { HealthModule } from "./modules/health/health.module";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    OrganizationsModule,
    MembersModule,
    SuppliersModule,
    PurchaseOrdersModule,
    ReceiptsModule,
    InvoicesModule,
    DiscrepanciesModule,
    CasesModule,
    ReportingModule,
    AuditModule,
    SupplierModule,
    NotificationsModule,
    DocumentsModule,
    HealthModule,
  ],
  providers: [
    // Order matters: authenticate first, then authorize.
    { provide: APP_GUARD, useClass: SessionAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
