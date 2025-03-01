import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RabbitmqService } from './rabbitmq.service';

@Module({
  imports: [ 
    ClientsModule.register([
      {
        name: 'RABBITMQ_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ],
          queue: 'log_queue',
          queueOptions: { durable: true }
        }
      },
      {
        name: 'RABBITMQ_SERVICE_DEVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ],
          queue: 'log_device_queue',
          queueOptions: { durable: true }
        }
      },
      {
        name: 'RABBITMQ_SERVICE_NOTIFICATION',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ],
          queue: 'notification_queue',
          queueOptions: { durable: true }
        }
      }
    ])
  ],
  providers: [RabbitmqService],
  exports: [RabbitmqService]
})
export class RabbitmqModule {}
