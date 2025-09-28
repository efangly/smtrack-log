import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) {}

  // Server Configuration
  get port(): number {
    return this.configService.get<number>('PORT', 8080);
  }

  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV', 'development');
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  // Database Configuration
  get databaseUrl(): string {
    return this.configService.get<string>('DATABASE_URL');
  }

  // Redis Configuration
  get redisHost(): string {
    return this.configService.get<string>('RADIS_HOST'); // Keep typo for backward compatibility
  }

  get redisPassword(): string {
    return this.configService.get<string>('RADIS_PASSWORD'); // Keep typo for backward compatibility
  }

  // RabbitMQ Configuration
  get rabbitmqUrl(): string {
    return this.configService.get<string>('RABBITMQ');
  }

  // InfluxDB Configuration
  get influxdbUrl(): string {
    return this.configService.get<string>('INFLUXDB_URL');
  }

  get influxdbToken(): string {
    return this.configService.get<string>('INFLUXDB_TOKEN');
  }

  get influxdbOrg(): string {
    return this.configService.get<string>('INFLUXDB_ORG');
  }

  get influxdbBucket(): string {
    return this.configService.get<string>('INFLUXDB_BUCKET');
  }

  // JWT Configuration
  get jwtSecret(): string {
    return this.configService.get<string>('JWT_SECRET');
  }

  get jwtExpire(): string {
    return this.configService.get<string>('JWT_EXPIRE', '1d');
  }

  get deviceJwtSecret(): string {
    return this.configService.get<string>('DEVICE_JWT_SECRET');
  }

  get deviceJwtExpire(): string {
    return this.configService.get<string>('DEVICE_JWT_EXPIRE', '30d');
  }

  // Validation
  validateRequiredEnvVars(): void {
    const requiredVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'DEVICE_JWT_SECRET',
    ];

    const missingVars = requiredVars.filter(varName => !this.configService.get(varName));

    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
  }
}