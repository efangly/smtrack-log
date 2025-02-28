import { Module } from '@nestjs/common';
import { LogdayService } from './logday.service';
import { LogdayController } from './logday.controller';
import { RabbitmqModule } from '../rabbitmq/rabbitmq.module';

@Module({
  imports: [ RabbitmqModule ],
  controllers: [LogdayController],
  providers: [LogdayService],
})
export class LogdayModule {}
