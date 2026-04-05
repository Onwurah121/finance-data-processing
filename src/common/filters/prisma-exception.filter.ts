import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { Request, Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    switch (exception.code) {
      case 'P2002':
        // Unique constraint violation
        status = HttpStatus.CONFLICT;
        message = `Duplicate entry: ${this.extractFieldFromMeta(exception.meta)}`;
        break;
      case 'P2025':
        // Record not found
        status = HttpStatus.NOT_FOUND;
        message = 'Record not found';
        break;
      case 'P2003':
        // Foreign key constraint failed
        status = HttpStatus.BAD_REQUEST;
        message = 'Invalid reference to related record';
        break;
      case 'P2014':
        // Required relation violation
        status = HttpStatus.BAD_REQUEST;
        message = 'Required relation is missing';
        break;
      default:
        this.logger.error(
          `Unhandled Prisma error code: ${exception.code}`,
          exception.stack,
        );
    }

    const errorResponse = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      error: 'Database Error',
    };

    this.logger.error(`Prisma Error: ${JSON.stringify(errorResponse)}`);

    response.status(status).json(errorResponse);
  }

  private extractFieldFromMeta(meta: unknown): string {
    if (!meta || typeof meta !== 'object') {
      return 'unknown field';
    }

    const target = (meta as { target?: string | string[] }).target;
    if (target) {
      return Array.isArray(target) ? target.join(', ') : target;
    }
    return 'unknown field';
  }
}
