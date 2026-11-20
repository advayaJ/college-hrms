import { Module } from '@nestjs/common'
import { CoreModule } from './core/core.module'
import { AuthModule } from './modules/auth/auth.module'
import { EmployeesModule } from './modules/employees/employees.module'
import { DepartmentsModule } from './modules/departments/departments.module'
import { AttendanceModule } from './modules/attendance/attendance.module'
import { LeaveModule } from './modules/leave/leave.module'
import { ApprovalsModule } from './modules/approvals/approvals.module'
import { PayrollModule } from './modules/payroll/payroll.module'
import { RecruitmentModule } from './modules/recruitment/recruitment.module'
import { WorkloadModule } from './modules/workload/workload.module'
import { AppraisalModule } from './modules/appraisal/appraisal.module'
import { DocumentsModule } from './modules/documents/documents.module'
import { ReportsModule } from './modules/reports/reports.module'
import { NotificationsModule } from './modules/notifications/notifications.module'
import { SettingsModule } from './modules/settings/settings.module'
import { DashboardModule } from './modules/dashboard/dashboard.module'
import { HealthController } from './modules/health/health.controller'

@Module({
  imports: [
    CoreModule,
    AuthModule,
    EmployeesModule,
    DepartmentsModule,
    AttendanceModule,
    LeaveModule,
    PayrollModule,
    RecruitmentModule,
    WorkloadModule,
    AppraisalModule,
    DocumentsModule,
    ReportsModule,
    NotificationsModule,
    SettingsModule,
    DashboardModule,
    ApprovalsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
