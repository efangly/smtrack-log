import { Injectable, OnModuleDestroy, OnModuleInit, Inject } from '@nestjs/common';
import { createClient } from 'redis';
import type { RedisClientType } from 'redis';
import { APP_CONFIG } from '../common/config';
import { REDIS_CONSTANTS } from '../common/constants';
import { JsonLogger } from '../common/logger/json.logger';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;
  private isConnected = false;
  
  constructor(@Inject(JsonLogger) private readonly logger: JsonLogger) {}
  
  async set(key: string, value: string, expire: number = REDIS_CONSTANTS.CACHE.DEFAULT_TTL): Promise<boolean> {
    if (!this.isConnected) {
      this.logger.logWarning('Redis not connected, skipping set operation', 'RedisService');
      return false;
    }
    
    try {
      await this.client.setEx(key, expire, value);
      return true;
    } catch (error) {
      this.logger.logError(`Redis set error for key ${key}`, error, 'RedisService');
      return false;
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.isConnected) {
      this.logger.logWarning('Redis not connected, skipping get operation', 'RedisService');
      return null;
    }
    
    try {
      const result = await this.client.get(key);
      return result;
    } catch (error) {
      this.logger.logError(`Redis get error for key ${key}`, error, 'RedisService');
      return null;
    }
  }

  async del(key: string): Promise<number> {
    if (!this.isConnected) {
      this.logger.warn('Redis not connected, skipping delete operation');
      return 0;
    }
    
    try {
      const pattern = key.includes('*') ? key : `${key}*`;
      const keys = await this.client.keys(pattern);
      
      if (keys.length === 0) {
        this.logger.debug(`Redis DEL: No keys found for pattern ${pattern}`);
        return 0;
      }
      
      const deletedCount = await this.client.del(keys);
      this.logger.debug(`Redis DEL: Deleted ${deletedCount} keys for pattern ${pattern}`);
      return deletedCount;
    } catch (error) {
      this.logger.error(`Redis delete error for key ${key}:`, error);
      return 0;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }
    
    try {
      const exists = await this.client.exists(key);
      return exists === 1;
    } catch (error) {
      this.logger.error(`Redis exists error for key ${key}:`, error);
      return false;
    }
  }

  async flushAll(): Promise<boolean> {
    if (!this.isConnected) {
      this.logger.warn('Redis not connected, skipping flush operation');
      return false;
    }
    
    try {
      await this.client.flushAll();
      this.logger.log('Redis: All keys flushed');
      return true;
    } catch (error) {
      this.logger.error('Redis flush error:', error);
      return false;
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  async onModuleInit() {
    try {
      this.client = createClient({
        url: APP_CONFIG.REDIS_HOST,
        password: APP_CONFIG.REDIS_PASSWORD,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > REDIS_CONSTANTS.CONNECTION.MAX_RETRIES) {
              this.logger.error('Redis max retries exceeded, giving up');
              return false;
            }
            return Math.min(retries * REDIS_CONSTANTS.CONNECTION.RETRY_DELAY_ON_FAIL, REDIS_CONSTANTS.CONNECTION.RECONNECT_STRATEGY);
          },
        },
      });

      // Event listeners
      this.client.on('connect', () => {
        this.logger.log('Redis client connected');
      });

      this.client.on('ready', () => {
        this.isConnected = true;
        this.logger.log('Redis client ready');
      });

      this.client.on('error', (error) => {
        this.isConnected = false;
        this.logger.error('Redis client error:', error);
      });

      this.client.on('reconnecting', () => {
        this.isConnected = false;
        this.logger.log('Redis client reconnecting...');
      });

      this.client.on('end', () => {
        this.isConnected = false;
        this.logger.log('Redis client connection ended');
      });

      await this.client.connect();
      
      // Only flush in development mode
      if (APP_CONFIG.NODE_ENV === 'development') {
        await this.flushAll();
      }
      
    } catch (error) {
      this.logger.logError('Redis connection initialization error', error, 'RedisService');
      this.isConnected = false;
    }
  }

  async onModuleDestroy() {
    try {
      if (this.client && this.isConnected) {
        await this.client.quit();
        this.logger.log('Redis client disconnected');
      }
    } catch (error) {
      this.logger.logError('Redis disconnect error', error, 'RedisService');
    } finally {
      this.isConnected = false;
    }
  }
}
