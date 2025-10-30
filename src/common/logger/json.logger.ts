import { Injectable, LoggerService, LogLevel } from '@nestjs/common';

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: string;
  trace?: string;
  metadata?: Record<string, any>;
  service: string;
  environment: string;
}

@Injectable()
export class JsonLogger implements LoggerService {
  private readonly serviceName = 'device-service';
  private readonly environment = process.env.NODE_ENV || 'development';

  /**
   * Write a 'log' level log.
   */
  log(message: any, context?: string): void {
    // Don't log regular messages - only warn and error
    return;
  }

  /**
   * Write an 'error' level log.
   */
  error(message: any, trace?: string, context?: string): void {
    this.writeLog('error', message, context, trace);
  }

  /**
   * Write a 'warn' level log.
   */
  warn(message: any, context?: string): void {
    this.writeLog('warn', message, context);
  }

  /**
   * Write a 'debug' level log.
   */
  debug(message: any, context?: string): void {
    // Don't log debug messages - only warn and error
    return;
  }

  /**
   * Write a 'verbose' level log.
   */
  verbose(message: any, context?: string): void {
    // Don't log verbose messages - only warn and error
    return;
  }

  /**
   * Set log levels
   */
  setLogLevels?(levels: LogLevel[]): void {
    // Implementation for setting log levels if needed
  }

  private writeLog(
    level: 'error' | 'warn',
    message: any,
    context?: string,
    trace?: string,
    metadata?: Record<string, any>
  ): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: this.formatMessage(message),
      service: this.serviceName,
      environment: this.environment,
    };

    if (context) {
      logEntry.context = context;
    }

    if (trace) {
      logEntry.trace = trace;
    }

    if (metadata) {
      logEntry.metadata = metadata;
    }

    // Output to stdout as JSON for Grafana Loki
    console.log(JSON.stringify(logEntry));
  }

  private formatMessage(message: any): string {
    if (typeof message === 'string') {
      return message;
    }
    
    if (message instanceof Error) {
      return message.message;
    }

    if (typeof message === 'object') {
      return JSON.stringify(message);
    }

    return String(message);
  }

  /**
   * Log an error with additional metadata
   */
  logError(
    message: string,
    error?: Error,
    context?: string,
    metadata?: Record<string, any>
  ): void {
    const trace = error?.stack;
    const errorMessage = error ? `${message}: ${error.message}` : message;
    
    this.writeLog('error', errorMessage, context, trace, {
      ...metadata,
      errorName: error?.name,
    });
  }

  /**
   * Log a warning with additional metadata
   */
  logWarning(
    message: string,
    context?: string,
    metadata?: Record<string, any>
  ): void {
    this.writeLog('warn', message, context, undefined, metadata);
  }
}