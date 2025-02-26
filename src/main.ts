import { NestFactory, Reflector } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConsumerModule } from './consumer/consumer.module';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const reflector = app.get(Reflector);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.useGlobalInterceptors(new ResponseInterceptor(reflector));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.setGlobalPrefix('log');
  const microservice = await NestFactory.createMicroservice<MicroserviceOptions>(ConsumerModule, {
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ],
      queue: 'device_queue',
      queueOptions: { durable: true },
      noAck: false,
      prefetchCount: 1
    },
  });
  await microservice.listen();
  await app.listen(process.env.PORT ?? 8080);
}
bootstrap();
