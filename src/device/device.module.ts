import { Module, Global } from '@nestjs/common';
import { DeviceService } from './device.service';
import { DeviceController } from './device.controller';
import { RabbitmqModule } from '../rabbitmq/rabbitmq.module';

@Global()
@Module({
  imports: [ RabbitmqModule ],
  controllers: [DeviceController],
  providers: [DeviceService],
  exports: [DeviceService]
})
export class DeviceModule {}
