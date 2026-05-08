import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { BlockReminderJob } from './block-reminder.job';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [BlockReminderJob],
})
export class BlockReminderModule {}
