import { Controller, Inject } from '@nestjs/common';
import { EventPattern, Ctx, Payload, RmqContext } from '@nestjs/microservices';
import { ConsumerService } from './consumer.service';
import { CreateDeviceDto } from '../device/dto/create-device.dto';
import { UpdateDeviceDto } from '../device/dto/update-device.dto';
import { RABBITMQ_CONSTANTS } from '../common/constants';
import { JsonLogger } from '../common/logger/json.logger';

@Controller()
export class ConsumerController {
  constructor(
    private readonly consumerService: ConsumerService,
    @Inject(JsonLogger) private readonly logger: JsonLogger
  ) {}

  @EventPattern(RABBITMQ_CONSTANTS.EVENTS.ADD_DEVICE)
  async addDevice(@Payload() data: CreateDeviceDto, @Ctx() context: RmqContext) {
    return this.handleMessage(
      async () => await this.consumerService.createDevice(data),
      context,
      'addDevice',
      data,
    );
  }

  @EventPattern(RABBITMQ_CONSTANTS.EVENTS.UPDATE_DEVICE)
  async updateDevice(@Payload() data: UpdateDeviceDto, @Ctx() context: RmqContext) {
    return this.handleMessage(
      async () => await this.consumerService.updateDevice(data),
      context,
      'updateDevice',
      data,
    );
  }

  /**
   * Generic message handler with proper error handling and logging
   */
  private async handleMessage<T>(
    operation: () => Promise<any>,
    context: RmqContext,
    operationName: string,
    payload: T,
  ): Promise<void> {
    const channel = context.getChannelRef();
    const message = context.getMessage();
    const startTime = Date.now();

    try {
      await operation();
      
      const duration = Date.now() - startTime;
      channel.ack(message);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.logError(`Failed to process ${operationName} after ${duration}ms`, error, 'ConsumerController', {
        payload,
        duration
      });
      
      // Reject message without requeue to prevent infinite loops
      // Consider implementing a dead letter queue in production
      channel.nack(message, false, false);
    }
  }
}
