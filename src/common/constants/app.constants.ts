export const REDIS_CONSTANTS = {
  CONNECTION: {
    RECONNECT_STRATEGY: 5000,
    RETRY_DELAY_ON_FAIL: 1000,
    MAX_RETRIES: 3,
  },
  CACHE: {
    DEFAULT_TTL: 3600, // 1 hour
    LONG_TTL: 86400, // 24 hours
    SHORT_TTL: 300, // 5 minutes
  },
} as const;

export const RABBITMQ_CONSTANTS = {
  QUEUES: {
    DEVICE_QUEUE: 'device_queue',
    NOTIFICATION_QUEUE: 'notification_queue',
    LOG_QUEUE: 'log_queue',
  },
  EVENTS: {
    ADD_DEVICE: 'add-device',
    UPDATE_DEVICE: 'update-device',
    DEVICE_OFFLINE: 'device-offline',
    DEVICE_ONLINE: 'device-online',
  },
  OPTIONS: {
    DURABLE: true,
    NO_ACK: false,
    PREFETCH_COUNT: 1,
  },
} as const;

export const HTTP_CONSTANTS = {
  STATUS: {
    SUCCESS: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
  },
  MESSAGES: {
    SUCCESS: 'Request Successfully',
    CREATED: 'Resource Created Successfully',
    UPDATED: 'Resource Updated Successfully',
    DELETED: 'Resource Deleted Successfully',
    NOT_FOUND: 'Resource Not Found',
    UNAUTHORIZED: 'Unauthorized Access',
    FORBIDDEN: 'Access Forbidden',
    VALIDATION_ERROR: 'Validation Error',
    INTERNAL_ERROR: 'Internal Server Error',
  },
} as const;

export const PRISMA_ERROR_CODES = {
  P2002: 'UNIQUE_CONSTRAINT_VIOLATION',
  P2003: 'FOREIGN_KEY_CONSTRAINT_VIOLATION',
  P2024: 'CONNECTION_TIMEOUT',
  P2025: 'RECORD_NOT_FOUND',
  P2014: 'INVALID_ID',
  P2021: 'TABLE_NOT_FOUND',
  P2022: 'COLUMN_NOT_FOUND',
} as const;