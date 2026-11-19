import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import {
  CreateCandidateDto, CreateVacancyDto, FeedbackDto, OfferDto, OnboardDto, RecruitmentService, ScheduleInterviewDto,
} from './recruitment.service'
import { RequirePermissions } from '../../core/auth/decorators'
import { CurrentUser } from '../../core/auth/current-user.decorator'
import { SessionUser } from '../../core/auth/auth.types'
import { ok } from '../../core/http/envelope'

@Controller('recruitment')
export class RecruitmentController {
  constructor(private service: RecruitmentService) {}

  @Get('vacancies')
  @RequirePermissions('recruitment:read', 'recruitment:manage')
  async vacancies(@Query('status') status?: string, @Query('q') q?: string, @CurrentUser() user?: SessionUser) {
    return ok(await this.service.vacancies(user!, { status, q }))
  }

  @Get('vacancies/:id')
  @RequirePermissions('recruitment:read', 'recruitment:manage')
  async vacancyDetail(@Param('id') id: string, @CurrentUser() user: SessionUser) {
    return ok(await this.service.vacancyDetail(id, user))
  }

  @Post('vacancies')
  @RequirePermissions('recruitment:manage')
  async createVacancy(@Body() dto: CreateVacancyDto, @CurrentUser() user: SessionUser) {
    return ok(await this.service.createVacancy(dto, user))
  }

  @Post('vacancies/:id/submit')
  @RequirePermissions('recruitment:manage')
  async submitVacancy(@Param('id') id: string, @CurrentUser() user: SessionUser) {
    return ok(await this.service.submitVacancy(id, user))
  }

  @Get('candidates')
  @RequirePermissions('recruitment:manage', 'recruitment:shortlist')
  async candidates(@Query('q') q?: string, @CurrentUser() user?: SessionUser) {
    return ok(await this.service.candidates(user!, q))
  }

  @Post('candidates')
  @RequirePermissions('recruitment:manage')
  async createCandidate(@Body() dto: CreateCandidateDto, @CurrentUser() user: SessionUser) {
    return ok(await this.service.createCandidate(dto, user))
  }

  @Post('applications')
  @RequirePermissions('recruitment:manage', 'recruitment:shortlist')
  async createApplication(@Body() dto: { vacancyId: string; candidateCode: string }, @CurrentUser() user: SessionUser) {
    return ok(await this.service.createApplication(dto.vacancyId, dto.candidateCode, user))
  }

  @Post('applications/:id/shortlist')
  @RequirePermissions('recruitment:shortlist', 'recruitment:manage')
  async shortlist(@Param('id') id: string, @Body() dto: { note?: string; rating?: number }, @CurrentUser() user: SessionUser) {
    return ok(await this.service.shortlist(id, dto.note, dto.rating, user))
  }

  @Post('applications/:id/reject')
  @RequirePermissions('recruitment:shortlist', 'recruitment:manage')
  async reject(@Param('id') id: string, @Body() dto: { reason: string }, @CurrentUser() user: SessionUser) {
    return ok(await this.service.rejectApplication(id, dto.reason, user))
  }

  @Post('applications/:id/interviews')
  @RequirePermissions('recruitment:shortlist', 'recruitment:manage')
  async scheduleInterview(@Param('id') id: string, @Body() dto: ScheduleInterviewDto, @CurrentUser() user: SessionUser) {
    return ok(await this.service.scheduleInterview(id, dto, user))
  }

  @Post('interviews/:id/feedback')
  @RequirePermissions('recruitment:shortlist', 'recruitment:manage')
  async feedback(@Param('id') id: string, @Body() dto: FeedbackDto, @CurrentUser() user: SessionUser) {
    return ok(await this.service.recordFeedback(id, dto, user))
  }

  @Post('applications/:id/offer')
  @RequirePermissions('recruitment:decide')
  async offer(@Param('id') id: string, @Body() dto: OfferDto, @CurrentUser() user: SessionUser) {
    return ok(await this.service.makeOffer(id, dto, user))
  }

  @Post('applications/:id/offer-response')
  @RequirePermissions('recruitment:decide')
  async offerResponse(@Param('id') id: string, @Body() dto: { accepted: boolean }, @CurrentUser() user: SessionUser) {
    return ok(await this.service.offerResponse(id, dto.accepted, user))
  }

  @Post('applications/:id/onboard')
  @RequirePermissions('recruitment:decide')
  async onboard(@Param('id') id: string, @Body() dto: OnboardDto, @CurrentUser() user: SessionUser) {
    return ok(await this.service.onboard(id, dto, user))
  }

  @Get('pipeline')
  @RequirePermissions('recruitment:read', 'recruitment:manage')
  async pipeline(@CurrentUser() user: SessionUser) {
    return ok(await this.service.pipeline(user))
  }
}
