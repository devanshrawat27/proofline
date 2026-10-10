import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { PrismaModule } from "./common/prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { SessionAuthGuard } from "./modules/auth/session-auth.guard";
import { PermissionsGuard } from "./modules/auth/permissions.guard";
import { OrganizationsModule } from "./modules/organizations/organizations.module";
import { MembersModule } from "./modules/members/members.module";
import { HealthModule } from "./modules/health/health.module";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    OrganizationsModule,
    MembersModule,
    HealthModule,
  ],
  providers: [
    // Order matters: authenticate first, then authorize.
    { provide: APP_GUARD, useClass: SessionAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
