import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { connect } from 'amqplib';
import { DeviceService } from '../device/device.service';
import { dateFormat } from '../common/utils';
import { CreateDeviceDto } from 'src/device/dto/create-device.dto';
import type { Connection, ConsumeMessage } from 'amqplib';

@Injectable()
export class ConsumerService implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly device: DeviceService) {}
  private conn: Connection;
  private readonly logger = new Logger(ConsumerService.name);

  async onModuleInit() {
    const queue = 'add-device';
    this.conn = await connect(String(process.env.RABBITMQ));
    const channel = await this.conn.createChannel();
    await channel.assertExchange(process.env.NODE_ENV === "production" ? "smtrack" : "smtrack-test", 'direct', { durable: true });
    await channel.assertQueue(queue, { durable: true });
    await channel.prefetch(1);
    channel.consume(queue, async (payload: ConsumeMessage | null) => {
      try {
        const device = JSON.parse(payload.content.toString()) as CreateDeviceDto;
        device.createAt = dateFormat(new Date());
        device.updateAt = dateFormat(new Date());
        await this.device.create(device);
        channel.ack(payload);
      } catch (err) {
        channel.ack(payload);
        this.logger.error(err);
      }
    });
  }

  async onModuleDestroy() {
    this.conn.close();
  }
}
