import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common'
import {
  AssignRoleDto, SettingsService, UpdateInstitutionDto, UpdateRolePermissionsDto, UpdateSettingDto, UpdateStageDto,
} from './settings.service'
import { RequirePermissions } from '../../core/auth/decorators'
import { CurrentUser } from '../../core/auth/current-user.decorator'
import { SessionUser } from '../../core/auth/auth.types'
import { ok } from '../../core/http/envelope'

@Controller('settings')
export class SettingsController {
  constructor(private service: SettingsService) {}

  @Get('institution')
  @RequirePermissions('settings:read', 'settings:manage')
  async institution(@CurrentUser() user: SessionUser) {
    return ok(await this.service.institution(user))
  }

  @Put('institution')
  @RequirePermissions('settings:manage')
  async updateInstitution(@Body() dto: UpdateInstitutionDto, @CurrentUser() user: SessionUser) {
    return ok(await this.service.updateInstitution(dto, user))
  }

  @Get('settings')
  @RequirePermissions('settings:read', 'settings:manage')
  async settings(@CurrentUser() user: SessionUser) {
    return ok(await this.service.settings(user))
  }

  @Put('settings')
  @RequirePermissions('settings:manage')
  async updateSetting(@Body() dto: UpdateSettingDto, @CurrentUser() user: SessionUser) {
    return ok(await this.service.updateSetting(dto, user))
  }

  @Get('workflows')
  @RequirePermissions('settings:read', 'settings:manage')
  async workflows(@CurrentUser() user: SessionUser) {
    return ok(await this.service.workflows(user))
  }

  @Put('workflows/stages/:id')
  @RequirePermissions('settings:manage')
  async updateStage(@Param('id') id: string, @Body() dto: UpdateStageDto, @CurrentUser() user: SessionUser) {
    return ok(await this.service.updateStage(id, dto, user))
  }

  @Post('workflows/:id/active')
  @RequirePermissions('settings:manage')
  async setWorkflowActive(@Param('id') id: string, @Body() dto: { active: boolean }, @CurrentUser() user: SessionUser) {
    return ok(await this.service.setWorkflowActive(id, dto.active, user))
  }

  @Get('users')
  @RequirePermissions('settings:users_read', 'settings:users_manage')
  async users(@Query('q') q?: string, @Query('page') page?: string, @CurrentUser() user?: SessionUser) {
    return ok(await this.service.users(user!, q, page ? Number(page) : 1))
  }

  @Post('users/assign-role')
  @RequirePermissions('settings:users_manage')
  async assignRole(@Body() dto: AssignRoleDto, @CurrentUser() user: SessionUser) {
    return ok(await this.service.assignRole(dto, user))
  }

  @Post('users/:id/roles/:roleKey/remove')
  @RequirePermissions('settings:users_manage')
  async removeRole(@Param('id') id: string, @Param('roleKey') roleKey: string, @CurrentUser() user: SessionUser) {
    return ok(await this.service.removeRole(id, roleKey, user))
  }

  @Post('users/:id/status')
  @RequirePermissions('settings:users_manage')
  async setUserStatus(@Param('id') id: string, @Body() dto: { status: 'ACTIVE' | 'SUSPENDED' }, @CurrentUser() user: SessionUser) {
    return ok(await this.service.setUserStatus(id, dto.status, user))
  }

  @Post('users/:id/reset-password')
  @RequirePermissions('settings:users_manage')
  async resetPassword(@Param('id') id: string, @CurrentUser() user: SessionUser) {
    return ok(await this.service.resetPassword(id, user))
  }

  @Get('roles')
  @RequirePermissions('settings:read', 'settings:roles_manage', 'settings:users_read')
  async roles(@CurrentUser() user: SessionUser) {
    return ok(await this.service.roles(user))
  }

  @Put('roles/permissions')
  @RequirePermissions('settings:roles_manage')
  async updateRolePermissions(@Body() dto: UpdateRolePermissionsDto, @CurrentUser() user: SessionUser) {
    return ok(await this.service.updateRolePermissions(dto, user))
  }

  @Get('audit')
  @RequirePermissions('settings:audit_read')
  async auditLog(@Query('module') module?: string, @Query('q') q?: string, @Query('page') page?: string, @CurrentUser() user?: SessionUser) {
    return ok(await this.service.auditLog(user!, module, q, page ? Number(page) : 1))
  }
}
