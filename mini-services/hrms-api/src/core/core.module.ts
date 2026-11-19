import { Global, Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { JwtModule } from '@nestjs/jwt'
import { PrismaModule } from '../prisma/prisma.module'
import { PrismaService } from '../prisma/prisma.service'
import { AuthGuard } from './auth/auth.guard'
import { PermissionRegistry } from './rbac/registry.service'
import { AuditService } from './audit/audit.service'
import { ApprovalEngine } from './approvals/approval-engine.service'

@Global()
@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'hrms-dev-secret',
      signOptions: { expiresIn: 604800 },
    }),
  ],
  providers: [
    PrismaService,
    PermissionRegistry,
    AuditService,
    ApprovalEngine,
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
  exports: [PrismaService, JwtModule, PermissionRegistry, AuditService, ApprovalEngine],
})
export class CoreModule {}
