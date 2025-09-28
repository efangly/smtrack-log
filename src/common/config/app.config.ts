export const APP_CONFIG = {
  // Server Configuration
  PORT: process.env.PORT || 8080,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database Configuration
  DATABASE_URL: process.env.DATABASE_URL,
  
  // Redis Configuration
  REDIS_HOST: process.env.RADIS_HOST, // Keep typo for backward compatibility
  REDIS_PASSWORD: process.env.RADIS_PASSWORD, // Keep typo for backward compatibility
  REDIS_RECONNECT_STRATEGY: 5000,
  
  // RabbitMQ Configuration
  RABBITMQ_URL: process.env.RABBITMQ,
  RABBITMQ_QUEUE: 'device_queue',
  RABBITMQ_PREFETCH_COUNT: 1,
  
  // InfluxDB Configuration
  INFLUXDB_URL: process.env.INFLUXDB_URL,
  INFLUXDB_TOKEN: process.env.INFLUXDB_TOKEN,
  INFLUXDB_ORG: process.env.INFLUXDB_ORG,
  INFLUXDB_BUCKET: process.env.INFLUXDB_BUCKET,
  
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRE: process.env.JWT_EXPIRE || '1d',
  DEVICE_JWT_SECRET: process.env.DEVICE_JWT_SECRET,
  DEVICE_JWT_EXPIRE: process.env.DEVICE_JWT_EXPIRE || '30d',
  
  // Global Prefix
  GLOBAL_PREFIX: 'log',
  
  // Validation Configuration
  VALIDATION_PIPE: {
    whitelist: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  },
} as const;

export type AppConfig = typeof APP_CONFIG;