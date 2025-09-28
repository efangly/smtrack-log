import { Injectable, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { APP_CONFIG } from '../common/config';
import { JsonLogger } from '../common/logger/json.logger';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(@Inject(JsonLogger) private readonly logger: JsonLogger) {
    super({
      log: APP_CONFIG.NODE_ENV === 'development' 
        ? ['query', 'info', 'warn', 'error'] 
        : ['error'],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      
      // Add custom middleware for logging slow queries in development
      if (APP_CONFIG.NODE_ENV === 'development') {
        this.$use(async (params, next) => {
          const before = Date.now();
          const result = await next(params);
          const after = Date.now();
          
          if (after - before > 1000) { // Log queries that take more than 1 second
            this.logger.logWarning(`Slow query detected: ${params.model}.${params.action} took ${after - before}ms`, 'PrismaService');
          }
          
          return result;
        });
      }
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

  /**
   * Enable graceful shutdown hooks
   */
  async enableShutdownHooks(app: any) {
    process.on('SIGINT', async () => {
      await this.$disconnect();
      await app.close();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      await this.$disconnect();
      await app.close();
      process.exit(0);
    });
  }
}