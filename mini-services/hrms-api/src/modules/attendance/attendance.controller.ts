import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common'
import { AttendanceService, CorrectionDto, ManualEntryDto } from './attendance.service'
import { RequirePermissions } from '../../core/auth/decorators'
import { CurrentUser } from '../../core/auth/current-user.decorator'
import { SessionUser } from '../../core/auth/auth.types'
import { ok } from '../../core/http/envelope'

const DATE = /^\d{4}-\d{2}-\d{2}$/

@Controller('attendance')
export class AttendanceController {
  constructor(private service: AttendanceService) {}

  @Get('overview')
  @RequirePermissions('attendance:read_all', 'attendance:read_dept', 'attendance:read_self')
  async overview(@CurrentUser() user: SessionUser) {
    return ok(await this.service.overview(user))
  }

  @Get('day/:date')
  @RequirePermissions('attendance:read_all', 'attendance:read_dept', 'attendance:read_self')
  async day(
    @Param('date') date: string,
    @Query('departmentId') departmentId?: string,
    @Query('campusId') campusId?: string,
    @CurrentUser() user?: SessionUser
  ) {
    if (!DATE.test(date)) return ok({ error: 'date must be YYYY-MM-DD' })
    return ok(await this.service.dayView(date, departmentId, campusId, user!))
  }

  @Get('monthly')
  @RequirePermissions('attendance:read_all', 'attendance:read_dept', 'attendance:read_self')
  async monthly(
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('departmentId') departmentId?: string,
    @CurrentUser() user?: SessionUser
  ) {
    const now = new Date()
    return ok(await this.service.monthly(month ? Number(month) : now.getUTCMonth() + 1, year ? Number(year) : now.getUTCFullYear(), user!, departmentId))
  }

  @Get('self')
  @RequirePermissions('attendance:read_self')
  async self(@Query('from') from?: string, @Query('to') to?: string, @CurrentUser() user?: SessionUser) {
    const toS = to ?? new Date().toISOString().slice(0, 10)
    const fromS = from ?? new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString().slice(0, 10)
    return ok(await this.service.self(fromS, toS, user!))
  }

  @Post('manual')
  @RequirePermissions('attendance:mark_manual')
  async manual(@Body() dto: ManualEntryDto, @CurrentUser() user: SessionUser) {
    return ok(await this.service.manualEntry(dto, user))
  }

  @Post('corrections')
  @RequirePermissions('attendance:request_correction')
  async requestCorrection(@Body() dto: CorrectionDto, @CurrentUser() user: SessionUser) {
    return ok(await this.service.requestCorrection(dto, user))
  }

  @Get('corrections')
  @RequirePermissions('attendance:read_all', 'attendance:read_dept', 'attendance:read_self')
  async corrections(@Query('status') status?: string, @CurrentUser() user?: SessionUser) {
    return ok(await this.service.corrections(user!, status))
  }
}
