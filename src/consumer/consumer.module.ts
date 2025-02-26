import { Module } from '@nestjs/common';
import { ConsumerService } from './consumer.service';
import { ConsumerController } from './consumer.controller';
import { DeviceModule } from '../device/device.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot(), DeviceModule],
  providers: [ConsumerService],
  controllers: [ConsumerController]
})
export class ConsumerModule {}
