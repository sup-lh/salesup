import { Module } from '@nestjs/common';
import { CoachingReviewController } from './coaching-review.controller';
import { CoachingReviewService } from './coaching-review.service';

@Module({
  controllers: [CoachingReviewController],
  providers: [CoachingReviewService],
})
export class CoachingReviewModule {}
