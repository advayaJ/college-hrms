import { Controller, Get } from '@nestjs/common'
import { DashboardService } from './dashboard.service'
import { RequirePermissions } from '../../core/auth/decorators'
import { CurrentUser } from '../../core/auth/current-user.decorator'
import { SessionUser } from '../../core/auth/auth.types'
import { ok } from '../../core/http/envelope'

@Controller('dashboard')
export class DashboardController {
  constructor(private service: DashboardService) {}

  @Get()
  @RequirePermissions('dashboard:view')
  async dashboard(@CurrentUser() user: SessionUser) {
    return ok(await this.service.dashboard(user))
  }
}
