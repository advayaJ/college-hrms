import { Module, forwardRef } from '@nestjs/common'
import { PayrollController } from './payroll.controller'
import { PayrollService } from './payroll.service'

@Module({
  controllers: [PayrollController],
  providers: [PayrollService],
  exports: [PayrollService],
})
export class PayrollModule {}
