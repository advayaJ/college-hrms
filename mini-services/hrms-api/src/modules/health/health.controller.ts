import { Controller, Get } from '@nestjs/common'
import { Public } from '../../core/auth/decorators'
import { ok } from '../../core/http/envelope'
import { PrismaService } from '../../prisma/prisma.service'

@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Get()
  async health() {
    let db = 'up'
    try {
      await this.prisma.$queryRaw`SELECT 1`
    } catch {
      db = 'down'
    }
    return ok({ service: 'hrms-api', status: 'healthy', database: db, time: new Date().toISOString() })
  }
}
