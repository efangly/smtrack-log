import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { APP_CONFIG } from '../common/config';
import { JsonLogger } from '../common/logger/json.logger';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new JsonLogger();

  async onModuleInit() {
    try {
      await this.$connect();
    } catch (error) {
      this.logger.logError('Failed to connect to database', error, 'PrismaService');
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
    } catch (error) {
      this.logger.logError('Error disconnecting from database', error, 'PrismaService');
    }
  }
}