import { Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JsonLogger } from '../logger/json.logger';

export abstract class BaseService {
  protected readonly context: string;
  
  constructor(
    protected readonly prisma: PrismaService,
    @Inject(JsonLogger) protected readonly logger: JsonLogger,
    loggerContext?: string,
  ) {
    this.context = loggerContext || this.constructor.name;
  }

  /**
   * Execute a database transaction with automatic error handling and logging
   */
  protected async executeTransaction<T>(
    operation: (prisma: PrismaService) => Promise<T>,
    context?: string,
  ): Promise<T> {
    const operationContext = context || 'Transaction';
    
    try {
      const result = await this.prisma.$transaction(async (prisma) => {
        return await operation(prisma as PrismaService);
      });
      
      return result;
    } catch (error) {
      this.logger.logError(`${operationContext} failed`, error, this.context);
      throw error;
    }
  }

  /**
   * Execute a database operation with automatic error handling and logging
   */
  protected async executeOperation<T>(
    operation: () => Promise<T>,
    context?: string,
  ): Promise<T> {
    const operationContext = context || 'Operation';
    
    try {
      const result = await operation();
      return result;
    } catch (error) {
      this.logger.logError(`${operationContext} failed`, error, this.context);
      throw error;
    }
  }

  /**
   * Build pagination options for Prisma queries
   */
  protected buildPaginationOptions(page?: string, perPage?: string) {
    const pageNum = parseInt(page || '1', 10);
    const limitNum = parseInt(perPage || '10', 10);
    
    // Validate and set limits
    const validPage = Math.max(1, pageNum);
    const validLimit = Math.min(Math.max(1, limitNum), 100); // Max 100 items per page
    
    return {
      skip: (validPage - 1) * validLimit,
      take: validLimit,
      page: validPage,
      limit: validLimit,
    };
  }

  /**
   * Build date range filter for queries
   */
  protected buildDateRangeFilter(startDate?: string, endDate?: string) {
    const filter: any = {};
    
    if (startDate) {
      filter.gte = new Date(startDate);
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // End of day
      filter.lte = end;
    }
    
    return Object.keys(filter).length > 0 ? filter : undefined;
  }

  /**
   * Log performance metrics for operations
   */
  protected async measurePerformance<T>(
    operation: () => Promise<T>,
    operationName: string,
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await operation();
      const duration = Date.now() - startTime;
      
      if (duration > 1000) {
        this.logger.logWarning(`Slow operation detected: ${operationName} took ${duration}ms`, this.context);
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.logError(`${operationName} failed after ${duration}ms`, error, this.context);
      throw error;
    }
  }
}