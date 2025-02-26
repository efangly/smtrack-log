import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class RabbitmqService {
  constructor(@Inject('RABBITMQ_SERVICE') private readonly client: ClientProxy) {}

  send<T>(queue: string, payload: T) {
    this.client.emit(queue, payload);
  }
}
