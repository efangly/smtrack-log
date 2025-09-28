import { NestFactory, Reflector } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { APP_CONFIG } from './common/config';
import { RABBITMQ_CONSTANTS } from './common/constants';
import { JsonLogger } from './common/logger';

async function bootstrap() {
  const logger = new JsonLogger();
  
  try {
    const app = await NestFactory.create(AppModule, {
      logger: false, // Disable NestJS built-in logger completely
    });
    const reflector = app.get(Reflector);
    app.useGlobalPipes(new ValidationPipe(APP_CONFIG.VALIDATION_PIPE));
    app.useGlobalInterceptors(new ResponseInterceptor(reflector));
    app.useGlobalFilters(new AllExceptionsFilter(new JsonLogger()));
    app.setGlobalPrefix('log');
    const microservice = app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
      options: {
        urls: [APP_CONFIG.RABBITMQ_URL],
        queue: RABBITMQ_CONSTANTS.QUEUES.DEVICE_QUEUE,
        queueOptions: { durable: RABBITMQ_CONSTANTS.OPTIONS.DURABLE },
        noAck: RABBITMQ_CONSTANTS.OPTIONS.NO_ACK,
        prefetchCount: RABBITMQ_CONSTANTS.OPTIONS.PREFETCH_COUNT,
      },
    });
    
    await microservice.listen();
    
    await app.listen(APP_CONFIG.PORT);
    
  } catch (error) {
    logger.logError('Failed to start application', error, 'Bootstrap');
    process.exit(1);
  }
}
bootstrap();
