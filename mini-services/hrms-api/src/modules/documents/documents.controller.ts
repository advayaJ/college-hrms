import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common'
import { Response } from 'express'
import { DocumentsService, UploadDocumentDto } from './documents.service'
import { RequirePermissions } from '../../core/auth/decorators'
import { CurrentUser } from '../../core/auth/current-user.decorator'
import { SessionUser } from '../../core/auth/auth.types'
import { ok } from '../../core/http/envelope'

@Controller('documents')
export class DocumentsController {
  constructor(private service: DocumentsService) {}

  @Get()
  @RequirePermissions('documents:read_all', 'documents:read_dept', 'documents:read_self')
  async list(
    @Query('q') q?: string,
    @Query('categoryId') categoryId?: string,
    @Query('employeeCode') employeeCode?: string,
    @Query('expiringInDays') expiringInDays?: string,
    @Query('page') page?: string,
    @CurrentUser() user?: SessionUser
  ) {
    return ok(
      await this.service.list(user!, {
        q, categoryId, employeeCode,
        expiringInDays: expiringInDays ? Number(expiringInDays) : undefined,
        page: page ? Number(page) : undefined,
      })
    )
  }

  @Get('categories')
  @RequirePermissions('documents:read_all', 'documents:read_dept', 'documents:read_self')
  async categories(@CurrentUser() user: SessionUser) {
    return ok(await this.service.categories(user))
  }

  @Get('expiring')
  @RequirePermissions('documents:read_all', 'documents:read_dept', 'documents:read_self')
  async expiring(@Query('days') days?: string, @CurrentUser() user?: SessionUser) {
    return ok(await this.service.expiring(days ? Number(days) : 30, user!))
  }

  @Post('expiring/notify')
  @RequirePermissions('documents:verify', 'settings:manage')
  async notifyExpiring(@Query('days') days?: string, @CurrentUser() user?: SessionUser) {
    return ok(await this.service.notifyExpiring(days ? Number(days) : 30, user!))
  }

  @Post()
  @RequirePermissions('documents:upload')
  async upload(@Body() dto: UploadDocumentDto, @CurrentUser() user: SessionUser) {
    return ok(await this.service.upload(dto, user))
  }

  @Post(':id/verify')
  @RequirePermissions('documents:verify')
  async verify(@Param('id') id: string, @CurrentUser() user: SessionUser) {
    return ok(await this.service.verify(id, user))
  }

  @Post(':id/download')
  @RequirePermissions('documents:read_all', 'documents:read_dept', 'documents:read_self')
  async download(@Param('id') id: string, @CurrentUser() user: SessionUser, @Res() res: Response) {
    await this.service.download(id, user, res)
    return res
  }
}
