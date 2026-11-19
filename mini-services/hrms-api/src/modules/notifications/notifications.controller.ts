import { Controller, Get, Param, Post } from '@nestjs/common'
import { NotificationsService } from './notifications.service'
import { RequirePermissions } from '../../core/auth/decorators'
import { CurrentUser } from '../../core/auth/current-user.decorator'
import { SessionUser } from '../../core/auth/auth.types'
import { ok } from '../../core/http/envelope'

@Controller('notifications')
export class NotificationsController {
  constructor(private service: NotificationsService) {}

  @Get()
  async list(@CurrentUser() user: SessionUser) {
    return ok(await this.service.list(user))
  }

  @Get('activity')
  @RequirePermissions('dashboard:view')
  async activity(@CurrentUser() user: SessionUser) {
    return ok(await this.service.activity(user))
  }

  @Post(':id/read')
  async markRead(@Param('id') id: string, @CurrentUser() user: SessionUser) {
    return ok(await this.service.markRead(id, user))
  }

  @Post('read-all')
  async markAllRead(@CurrentUser() user: SessionUser) {
    return ok(await this.service.markAllRead(user))
  }
}
