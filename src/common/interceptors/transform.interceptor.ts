import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RESPONSE_MESSAGE_METADATA_KEY } from '../decorators/response-message.decorator';

export interface StandardResponse<T = unknown> {
  success: true;
  message?: string;
  data: T;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, StandardResponse<T>>
{
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<StandardResponse<T>> {
    const customMessage = this.reflector.getAllAndOverride<string>(
      RESPONSE_MESSAGE_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    return next.handle().pipe(
      map((data) => {
        const response: StandardResponse<T> = { success: true, data };
        if (customMessage) {
          response.message = customMessage;
        }
        return response;
      }),
    );
  }
}
