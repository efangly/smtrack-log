import { Module } from '@nestjs/common';
import { LogdayService } from './logday.service';
import { LogdayController } from './logday.controller';

@Module({
  controllers: [LogdayController],
  providers: [LogdayService],
})
export class LogdayModule {}
