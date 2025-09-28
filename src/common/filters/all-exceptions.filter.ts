import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { APP_CONFIG } from '../config';
import { HTTP_CONSTANTS, PRISMA_ERROR_CODES } from '../constants';
import { JsonLogger } from '../logger/json.logger';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(@Inject(JsonLogger) private readonly logger: JsonLogger) {}
  
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string = HTTP_CONSTANTS.MESSAGES.INTERNAL_ERROR;
    let errorCode: string | undefined;

    // Handle different types of exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || exception.message;
      } else {
        message = exceptionResponse.toString();
      }
    } else if (exception instanceof PrismaClientKnownRequestError) {
      const prismaError = this.handlePrismaError(exception);
      status = prismaError.status;
      message = prismaError.message;
      errorCode = exception.code;
    } else if (exception instanceof Error) {
      message = exception.message;
      
      // Handle specific error types
      if (exception.name === 'ValidationError') {
        status = HttpStatus.BAD_REQUEST;
        message = HTTP_CONSTANTS.MESSAGES.VALIDATION_ERROR;
      } else if (exception.name === 'UnauthorizedError') {
        status = HttpStatus.UNAUTHORIZED;
        message = HTTP_CONSTANTS.MESSAGES.UNAUTHORIZED;
      }
    }

    // Log errors based on severity
    const logContext = {
      path: request.url,
      method: request.method,
      statusCode: status,
      errorCode,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
    };

    if (status >= 500) {
      this.logger.logError(`Internal Server Error: ${message}`, exception instanceof Error ? exception : new Error(message), 'AllExceptionsFilter', logContext);
    } else if (status >= 400) {
      this.logger.logWarning(`Client Error: ${message}`, 'AllExceptionsFilter', logContext);
    }

    // Build response
    const errorResponse = {
      success: false,
      message,
      data: null,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      statusCode: status,
      ...(errorCode && { errorCode }),
      ...(APP_CONFIG.NODE_ENV === 'development' && exception instanceof Error && {
        stack: exception.stack,
      }),
    };

    response.status(status).json(errorResponse);
  }

  private handlePrismaError(exception: PrismaClientKnownRequestError): { status: number; message: string } {
    switch (exception.code) {
      case 'P2002':
        return {
          status: HttpStatus.CONFLICT,
          message: `The value for field '${exception.meta?.target}' already exists`,
        };
      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Foreign key constraint failed',
        };
      case 'P2014':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Invalid ID provided',
        };
      case 'P2021':
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Table does not exist in the database',
        };
      case 'P2022':
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Column does not exist in the database',
        };
      case 'P2024':
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Timed out fetching a new connection from the connection pool',
        };
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'The requested resource was not found',
        };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: exception.message || 'Database operation failed',
        };
    }
  }
}
