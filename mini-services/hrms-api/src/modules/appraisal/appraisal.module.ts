import { Module } from '@nestjs/common'
import { AppraisalController } from './appraisal.controller'
import { AppraisalService } from './appraisal.service'

@Module({
  controllers: [AppraisalController],
  providers: [AppraisalService],
  exports: [AppraisalService],
})
export class AppraisalModule {}
