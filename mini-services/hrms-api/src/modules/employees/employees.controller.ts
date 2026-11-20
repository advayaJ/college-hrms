import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common'
import { EmployeesService } from './employees.service'
import { CreateEmployeeDto, SeparateEmployeeDto, UpdateEmployeeDto } from './dto'
import { RequirePermissions } from '../../core/auth/decorators'
import { CurrentUser } from '../../core/auth/current-user.decorator'
import { SessionUser } from '../../core/auth/auth.types'
import { ok } from '../../core/http/envelope'

@Controller('employees')
export class EmployeesController {
  constructor(private service: EmployeesService) {}

  @Get()
  @RequirePermissions('employees:read_all', 'employees:read_dept', 'employees:read_self')
  async list(
    @Query('q') q?: string,
    @Query('departmentId') departmentId?: string,
    @Query('campusId') campusId?: string,
    @Query('staffType') staffType?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @CurrentUser() user?: SessionUser
  ) {
    return ok(
      await this.service.list(
        {
          q,
          departmentId,
          campusId,
          staffType,
          status,
          page: page ? Number(page) : undefined,
          pageSize: pageSize ? Number(pageSize) : undefined,
        },
        user!
      )
    )
  }

  @Get('form-data')
  @RequirePermissions('employees:read_all', 'employees:read_dept', 'employees:read_self')
  async formData(@CurrentUser() user: SessionUser) {
    return ok(await this.service.formData(user))
  }

  @Get(':code')
  @RequirePermissions('employees:read_all', 'employees:read_dept', 'employees:read_self')
  async profile(@Param('code') code: string, @CurrentUser() user: SessionUser) {
    return ok(await this.service.profile(code, user))
  }

  @Post()
  @RequirePermissions('employees:create')
  async create(@Body() dto: CreateEmployeeDto, @CurrentUser() user: SessionUser) {
    return ok(await this.service.create(dto, user))
  }

  @Put(':code')
  @RequirePermissions('employees:update')
  async update(@Param('code') code: string, @Body() dto: UpdateEmployeeDto, @CurrentUser() user: SessionUser) {
    return ok(await this.service.update(code, dto, user))
  }

  @Post(':code/separate')
  @RequirePermissions('employees:separate')
  async separate(@Param('code') code: string, @Body() dto: SeparateEmployeeDto, @CurrentUser() user: SessionUser) {
    return ok(await this.service.separate(code, dto, user))
  }
}
