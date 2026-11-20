import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { ApprovalsService, DecideDto, ResubmitDto } from './approvals.service'
import { RequirePermissions } from '../../core/auth/decorators'
import { CurrentUser } from '../../core/auth/current-user.decorator'
import { SessionUser } from '../../core/auth/auth.types'
import { ok } from '../../core/http/envelope'

@Controller('approvals')
export class ApprovalsController {
  constructor(private service: ApprovalsService) {}

  @Get('pending')
  @RequirePermissions('dashboard:view')
  async pending(@CurrentUser() user: SessionUser) {
    return ok(await this.service.pending(user))
  }

  @Get('history')
  @RequirePermissions('dashboard:view')
  async history(@Query('mine') mine?: string, @CurrentUser() user?: SessionUser) {
    return ok(await this.service.history(user!, mine === '1'))
  }

  @Get(':id')
  @RequirePermissions('dashboard:view')
  async detail(@Param('id') id: string, @CurrentUser() user: SessionUser) {
    return ok(await this.service.detail(id, user))
  }

  @Post(':id/decide')
  @RequirePermissions('dashboard:view')
  async decide(@Param('id') id: string, @Body() dto: DecideDto, @CurrentUser() user: SessionUser) {
    return ok(await this.service.decide(id, dto, user))
  }

  @Post(':id/resubmit')
  @RequirePermissions('dashboard:view')
  async resubmit(@Param('id') id: string, @Body() dto: ResubmitDto, @CurrentUser() user: SessionUser) {
    return ok(await this.service.resubmit(id, dto, user))
  }
}
