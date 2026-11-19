import { Controller, Get, Param, Query, Res } from '@nestjs/common'
import { Response } from 'express'
import { ReportsService } from './reports.service'
import { RequirePermissions } from '../../core/auth/decorators'
import { CurrentUser } from '../../core/auth/current-user.decorator'
import { SessionUser } from '../../core/auth/auth.types'
import { ok } from '../../core/http/envelope'

@Controller('reports')
export class ReportsController {
  constructor(private service: ReportsService) {}

  @Get('headcount')
  @RequirePermissions('reports:read', 'reports:read_dept')
  async headcount(@CurrentUser() user: SessionUser) {
    return ok(await this.service.headcount(user))
  }

  @Get('attendance')
  @RequirePermissions('reports:read', 'reports:read_dept')
  async attendance(@Query('month') month?: string, @Query('year') year?: string, @CurrentUser() user?: SessionUser) {
    const now = new Date()
    return ok(await this.service.attendanceReport(month ? Number(month) : now.getUTCMonth() + 1, year ? Number(year) : now.getUTCFullYear(), user!))
  }

  @Get('leave')
  @RequirePermissions('reports:read', 'reports:read_dept')
  async leave(@Query('year') year?: string, @CurrentUser() user?: SessionUser) {
    return ok(await this.service.leaveReport(year ? Number(year) : new Date().getFullYear(), user!))
  }

  @Get('payroll')
  @RequirePermissions('payroll:read_reports')
  async payroll(@Query('year') year?: string, @CurrentUser() user?: SessionUser) {
    return ok(await this.service.payrollReport(year ? Number(year) : new Date().getFullYear(), user!))
  }

  @Get('employee-directory.csv')
  @RequirePermissions('reports:export')
  async directoryCsv(@CurrentUser() user: SessionUser, @Res() res: Response) {
    await this.service.directoryCsv(user, res)
    return res
  }
}
