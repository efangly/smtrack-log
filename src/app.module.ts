import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LogdayModule } from './logday/logday.module';
import { RabbitmqModule } from './rabbitmq/rabbitmq.module';
import { NotificationModule } from './notification/notification.module';
import { DeviceStrategy, JwtStrategy } from './common/strategies';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { DeviceModule } from './device/device.module';
import { HealthModule } from './health/health.module';
import { InfluxdbModule } from './influxdb/influxdb.module';
import { GraphModule } from './graph/graph.module';
import { ConsumerModule } from './consumer/consumer.module';
import { MobileModule } from './mobile/mobile.module';
import { BackupModule } from './backup/backup.module';
import { LoggerModule } from './common/logger';


@Module({
  imports: [
    ConfigModule.forRoot(),
    PassportModule,
    LoggerModule,
    LogdayModule,
    RabbitmqModule,
    NotificationModule,
    PrismaModule,
    RedisModule,
    DeviceModule,
    HealthModule,
    InfluxdbModule,
    GraphModule,
    ConsumerModule,
    MobileModule,
    BackupModule
  ],
  providers: [JwtStrategy, DeviceStrategy]
})
export class AppModule {}
