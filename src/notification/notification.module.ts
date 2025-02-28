import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { RabbitmqModule } from '../rabbitmq/rabbitmq.module';

@Module({
  imports: [ RabbitmqModule ],
  controllers: [NotificationController],
  providers: [NotificationService],
})
export class NotificationModule {}
