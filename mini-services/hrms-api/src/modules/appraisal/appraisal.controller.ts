import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import {
  AppraisalService, CreateCycleDto, CreateGoalDto, GoalProgressDto, ReviewerReviewDto, SelfAssessmentDto,
} from './appraisal.service'
import { RequirePermissions } from '../../core/auth/decorators'
import { CurrentUser } from '../../core/auth/current-user.decorator'
import { SessionUser } from '../../core/auth/auth.types'
import { ok } from '../../core/http/envelope'

@Controller('appraisal')
export class AppraisalController {
  constructor(private service: AppraisalService) {}

  @Get('cycles')
  @RequirePermissions('appraisal:read_self', 'appraisal:read_dept', 'appraisal:read_all', 'appraisal:manage_cycles')
  async cycles(@CurrentUser() user: SessionUser) {
    return ok(await this.service.cycles(user))
  }

  @Get('self')
  @RequirePermissions('appraisal:read_self')
  async self(@CurrentUser() user: SessionUser) {
    return ok(await this.service.selfView(user))
  }

  @Get('team')
  @RequirePermissions('appraisal:read_dept', 'appraisal:read_all')
  async team(@Query('cycleId') cycleId?: string, @CurrentUser() user?: SessionUser) {
    return ok(await this.service.team(user!, cycleId))
  }

  @Get('summary')
  @RequirePermissions('appraisal:read_all', 'appraisal:finalize')
  async summary(@CurrentUser() user: SessionUser) {
    return ok(await this.service.summary(user))
  }

  @Post('cycles')
  @RequirePermissions('appraisal:manage_cycles')
  async createCycle(@Body() dto: CreateCycleDto, @CurrentUser() user: SessionUser) {
    return ok(await this.service.createCycle(dto, user))
  }

  @Post('cycles/:id/activate')
  @RequirePermissions('appraisal:manage_cycles')
  async activateCycle(@Param('id') id: string, @CurrentUser() user: SessionUser) {
    return ok(await this.service.activateCycle(id, user))
  }

  @Post('goals')
  @RequirePermissions('appraisal:review', 'appraisal:manage_cycles')
  async createGoal(@Body() dto: CreateGoalDto, @CurrentUser() user: SessionUser) {
    return ok(await this.service.createGoal(dto, user))
  }

  @Post('goals/:id/progress')
  @RequirePermissions('appraisal:self_assess')
  async goalProgress(@Param('id') id: string, @Body() dto: GoalProgressDto, @CurrentUser() user: SessionUser) {
    return ok(await this.service.updateGoalProgress(id, dto, user))
  }

  @Post('self/submit')
  @RequirePermissions('appraisal:self_assess')
  async submitSelf(@Body() dto: SelfAssessmentDto, @CurrentUser() user: SessionUser) {
    return ok(await this.service.submitSelfAssessment(dto, user))
  }

  @Post('reviews/:id/review')
  @RequirePermissions('appraisal:review')
  async submitReview(@Param('id') id: string, @Body() dto: ReviewerReviewDto, @CurrentUser() user: SessionUser) {
    return ok(await this.service.submitReview(id, dto, user))
  }
}
