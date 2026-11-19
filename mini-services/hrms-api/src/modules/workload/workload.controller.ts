import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { CreateSubjectDto, WorkloadService } from './workload.service'
import { RequirePermissions } from '../../core/auth/decorators'
import { CurrentUser } from '../../core/auth/current-user.decorator'
import { SessionUser } from '../../core/auth/auth.types'
import { ok } from '../../core/http/envelope'

@Controller('workload')
export class WorkloadController {
  constructor(private service: WorkloadService) {}

  @Get('terms')
  @RequirePermissions('workload:read_self', 'workload:read_dept', 'workload:read_all')
  async terms(@CurrentUser() user: SessionUser) {
    return ok(await this.service.terms(user))
  }

  @Get('overview')
  @RequirePermissions('workload:read_all', 'workload:read_dept', 'workload:read_self')
  async overview(@Query('termId') termId?: string, @Query('departmentId') departmentId?: string, @CurrentUser() user?: SessionUser) {
    return ok(await this.service.overview(user!, termId, departmentId))
  }

  @Get('self')
  @RequirePermissions('workload:read_self')
  async self(@CurrentUser() user: SessionUser) {
    return ok(await this.service.selfView(user))
  }

  @Post('subjects')
  @RequirePermissions('workload:manage_allocations')
  async createSubject(@Body() dto: CreateSubjectDto, @CurrentUser() user: SessionUser) {
    return ok(await this.service.createSubject(dto, user))
  }

  @Post('subjects/:id/reassign')
  @RequirePermissions('workload:manage_allocations')
  async reassign(@Param('id') id: string, @Body() dto: { employeeCode: string }, @CurrentUser() user: SessionUser) {
    return ok(await this.service.reassignSubject(id, dto.employeeCode, user))
  }

  @Post('recompute')
  @RequirePermissions('workload:manage_allocations')
  async recompute(@Body() dto: { termId: string; departmentId: string }, @CurrentUser() user: SessionUser) {
    return ok(await this.service.recompute(dto.termId, dto.departmentId, user))
  }
}
