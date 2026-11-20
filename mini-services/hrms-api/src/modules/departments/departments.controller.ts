import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common'
import { DepartmentsService, CreateCampusDto, CreateDepartmentDto, CreateDesignationDto, UpdateDepartmentDto } from './departments.service'
import { RequirePermissions } from '../../core/auth/decorators'
import { CurrentUser } from '../../core/auth/current-user.decorator'
import { SessionUser } from '../../core/auth/auth.types'
import { ok } from '../../core/http/envelope'

@Controller('departments')
export class DepartmentsController {
  constructor(private service: DepartmentsService) {}

  @Get()
  @RequirePermissions('departments:read')
  async list(@CurrentUser() user: SessionUser) {
    return ok(await this.service.list(user))
  }

  @Get(':id')
  @RequirePermissions('departments:read')
  async detail(@Param('id') id: string, @CurrentUser() user: SessionUser) {
    return ok(await this.service.detail(id, user))
  }

  @Post()
  @RequirePermissions('departments:manage')
  async create(@Body() dto: CreateDepartmentDto, @CurrentUser() user: SessionUser) {
    return ok(await this.service.create(dto, user))
  }

  @Put(':id')
  @RequirePermissions('departments:manage')
  async update(@Param('id') id: string, @Body() dto: UpdateDepartmentDto, @CurrentUser() user: SessionUser) {
    return ok(await this.service.update(id, dto, user))
  }

  @Post('campuses')
  @RequirePermissions('departments:manage')
  async createCampus(@Body() dto: CreateCampusDto, @CurrentUser() user: SessionUser) {
    return ok(await this.service.createCampus(dto, user))
  }

  @Post('designations')
  @RequirePermissions('departments:manage')
  async createDesignation(@Body() dto: CreateDesignationDto, @CurrentUser() user: SessionUser) {
    return ok(await this.service.createDesignation(dto, user))
  }
}
