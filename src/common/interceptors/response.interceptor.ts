import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HTTP_CONSTANTS } from '../constants';

export interface StandardResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  statusCode: number;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, StandardResponse<T>> {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<StandardResponse<T>> {
    const skip = this.reflector.get<boolean>(
      'skipInterceptor',
      context.getHandler(),
    );
    
    if (skip) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    return next.handle().pipe(
      map((data: T) => {
        // Determine appropriate success message based on HTTP method
        let message: string = HTTP_CONSTANTS.MESSAGES.SUCCESS;
        
        switch (request.method) {
          case 'POST':
            message = HTTP_CONSTANTS.MESSAGES.CREATED;
            break;
          case 'PUT':
          case 'PATCH':
            message = HTTP_CONSTANTS.MESSAGES.UPDATED;
            break;
          case 'DELETE':
            message = HTTP_CONSTANTS.MESSAGES.DELETED;
            break;
          default:
            message = HTTP_CONSTANTS.MESSAGES.SUCCESS;
        }

        return {
          success: true,
          message,
          data: data || null,
          timestamp: new Date().toISOString(),
          statusCode: response.statusCode || 200,
        };
      }),
    );
  }
}
