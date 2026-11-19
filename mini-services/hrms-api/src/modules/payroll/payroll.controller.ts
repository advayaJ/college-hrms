import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { AdjustPayslipDto, CreateRunDto, PayrollService } from './payroll.service'
import { RequirePermissions } from '../../core/auth/decorators'
import { CurrentUser } from '../../core/auth/current-user.decorator'
import { SessionUser } from '../../core/auth/auth.types'
import { ok } from '../../core/http/envelope'

@Controller('payroll')
export class PayrollController {
  constructor(private service: PayrollService) {}

  @Get('runs')
  @RequirePermissions('payroll:read_all')
  async runs(@CurrentUser() user: SessionUser) {
    return ok(await this.service.runs(user))
  }

  @Get('runs/:id')
  @RequirePermissions('payroll:read_all')
  async runDetail(@Param('id') id: string, @CurrentUser() user: SessionUser) {
    return ok(await this.service.runDetail(id, user))
  }

  @Get('runs/:id/by-department')
  @RequirePermissions('payroll:read_reports', 'payroll:read_all')
  async byDepartment(@Param('id') id: string) {
    return ok(await this.service.payrollByDepartment(id))
  }

  @Post('runs')
  @RequirePermissions('payroll:process')
  async createRun(@Body() dto: CreateRunDto, @CurrentUser() user: SessionUser) {
    return ok(await this.service.createRun(dto, user))
  }

  @Post('runs/:id/compute')
  @RequirePermissions('payroll:process')
  async compute(@Param('id') id: string, @CurrentUser() user: SessionUser) {
    return ok(await this.service.computeRun(id, user))
  }

  @Post('runs/:id/submit')
  @RequirePermissions('payroll:process')
  async submit(@Param('id') id: string, @CurrentUser() user: SessionUser) {
    return ok(await this.service.submitRun(id, user))
  }

  @Post('runs/:id/disburse')
  @RequirePermissions('payroll:approve', 'payroll:process')
  async disburse(@Param('id') id: string, @CurrentUser() user: SessionUser) {
    return ok(await this.service.disburse(id, user))
  }

  @Get('structures')
  @RequirePermissions('payroll:read_all')
  async structures(@CurrentUser() user: SessionUser) {
    return ok(await this.service.structures(user))
  }

  @Get('my-structure')
  @RequirePermissions('payroll:read_self')
  async myStructure(@CurrentUser() user: SessionUser) {
    return ok(await this.service.myStructure(user))
  }

  @Get('my-payslips')
  @RequirePermissions('payroll:read_self')
  async myPayslips(@CurrentUser() user: SessionUser) {
    return ok(await this.service.myPayslips(user))
  }

  @Get('payslips/:payslipNo')
  @RequirePermissions('payroll:read_self', 'payroll:read_all')
  async payslip(@Param('payslipNo') payslipNo: string, @CurrentUser() user: SessionUser) {
    return ok(await this.service.payslip(payslipNo, user))
  }

  @Post('payslips/:payslipNo/adjust')
  @RequirePermissions('payroll:process')
  async adjust(@Param('payslipNo') payslipNo: string, @Body() dto: AdjustPayslipDto, @CurrentUser() user: SessionUser) {
    return ok(await this.service.adjustPayslip(payslipNo, dto, user))
  }

  @Get('cost-trend')
  @RequirePermissions('payroll:read_reports', 'payroll:read_all')
  async costTrend(@CurrentUser() user: SessionUser) {
    return ok(await this.service.costTrend(user))
  }
}
