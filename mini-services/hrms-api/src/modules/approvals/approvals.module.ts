import { Module, forwardRef } from '@nestjs/common'
import { ApprovalsController } from './approvals.controller'
import { ApprovalsService } from './approvals.service'
import { LeaveModule } from '../leave/leave.module'
import { AttendanceModule } from '../attendance/attendance.module'
import { PayrollModule } from '../payroll/payroll.module'
import { RecruitmentModule } from '../recruitment/recruitment.module'

@Module({
  imports: [forwardRef(() => LeaveModule), forwardRef(() => AttendanceModule), forwardRef(() => PayrollModule), forwardRef(() => RecruitmentModule)],
  controllers: [ApprovalsController],
  providers: [ApprovalsService],
})
export class ApprovalsModule {}
