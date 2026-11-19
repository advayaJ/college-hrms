import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common'
import { ApplyLeaveDto, LeaveService, UpdateLeaveApplicationDto } from './leave.service'
import { RequirePermissions } from '../../core/auth/decorators'
import { CurrentUser } from '../../core/auth/current-user.decorator'
import { SessionUser } from '../../core/auth/auth.types'
import { ok } from '../../core/http/envelope'

@Controller('leave')
export class LeaveController {
  constructor(private service: LeaveService) {}

  @Get('types')
  @RequirePermissions('leave:read_self', 'leave:read_dept', 'leave:read_all')
  async types(@CurrentUser() user: SessionUser) {
    return ok(await this.service.types(user))
  }

  @Get('balances')
  @RequirePermissions('leave:read_self', 'leave:read_dept', 'leave:read_all')
  async balances(@Query('employeeCode') employeeCode?: string, @CurrentUser() user?: SessionUser) {
    return ok(await this.service.balances(user!, employeeCode))
  }

  @Get('applications')
  @RequirePermissions('leave:read_self', 'leave:read_dept', 'leave:read_all')
  async applications(
    @Query('status') status?: string,
    @Query('employeeCode') employeeCode?: string,
    @Query('departmentId') departmentId?: string,
    @Query('mine') mine?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @CurrentUser() user?: SessionUser
  ) {
    return ok(
      await this.service.applications(
        user!,
        { status, employeeCode, departmentId, mine: mine === '1' },
        page ? Number(page) : 1,
        Math.min(100, pageSize ? Number(pageSize) : 25)
      )
    )
  }

  @Get('applications/:refNo')
  @RequirePermissions('leave:read_self', 'leave:read_dept', 'leave:read_all')
  async myApplication(@Param('refNo') refNo: string, @CurrentUser() user: SessionUser) {
    return ok(await this.service.myApplication(refNo, user))
  }

  @Get('calendar')
  @RequirePermissions('leave:read_self', 'leave:read_dept', 'leave:read_all')
  async calendar(@Query('month') month?: string, @Query('year') year?: string, @CurrentUser() user?: SessionUser) {
    const now = new Date()
    return ok(await this.service.calendar(user!, month ? Number(month) : now.getUTCMonth() + 1, year ? Number(year) : now.getUTCFullYear()))
  }

  @Post('apply')
  @RequirePermissions('leave:apply')
  async apply(@Body() dto: ApplyLeaveDto, @CurrentUser() user: SessionUser) {
    return ok(await this.service.apply(dto, user))
  }

  @Post('applications/:refNo/cancel')
  @RequirePermissions('leave:cancel')
  async cancel(@Param('refNo') refNo: string, @CurrentUser() user: SessionUser) {
    return ok(await this.service.cancel(refNo, user))
  }

  @Put('applications/:refNo')
  @RequirePermissions('leave:apply')
  async updateReturned(@Param('refNo') refNo: string, @Body() dto: UpdateLeaveApplicationDto, @CurrentUser() user: SessionUser) {
    return ok(await this.service.updateReturned(refNo, dto, user))
  }
}
