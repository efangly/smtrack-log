import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class RabbitmqService {
  constructor(
    @Inject('RABBITMQ_SERVICE') private readonly log: ClientProxy,
    @Inject('RABBITMQ_SERVICE_DEVICE') private readonly device: ClientProxy,
    @Inject('RABBITMQ_SERVICE_NOTIFICATION') private readonly notification: ClientProxy,
    @Inject('RABBITMQ_SERVICE_BACKUP') private readonly backup: ClientProxy
  ) {}

  sendToLog<T>(queue: string, payload: T) {
    this.log.emit(queue, payload);
  }

  sendToDevice<T>(queue: string, payload: T) {
    this.device.emit(queue, payload);
  }

  sendToNotification<T>(queue: string, payload: T) {
    this.notification.emit(queue, payload);
  }

  sendToBackup<T>(queue: string, payload: T) {
    this.backup.emit(queue, payload);
  }
}
