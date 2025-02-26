import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Ctx, Payload, RmqContext } from '@nestjs/microservices';
import { ConsumerService } from './consumer.service';
import { CreateDeviceDto } from '../device/dto/create-device.dto';
import { UpdateDeviceDto } from '../device/dto/update-device.dto';

@Controller()
export class ConsumerController {
  constructor(private readonly consumerService: ConsumerService) {}
  private readonly logger = new Logger(ConsumerController.name);

  @EventPattern('add-device')
  async addDevice(@Payload() data: CreateDeviceDto, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const message = context.getMessage();
    try {
      await this.consumerService.createDevice(data);
      channel.ack(message);
    } catch (error) {
      this.logger.error(error);
      channel.nack(message, false, false);
    }
  }

  @EventPattern('update-device')
  async updateDevice(@Payload() data: UpdateDeviceDto, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const message = context.getMessage();
    try {
      await this.consumerService.updateDevice(data);
      channel.ack(message);
    } catch (error) {
      this.logger.error(error);
      channel.nack(message, false, false);
    }
  }
}
