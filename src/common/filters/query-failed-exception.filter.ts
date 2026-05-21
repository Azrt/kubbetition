import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';

const INVALID_UUID_MESSAGE = 'invalid input syntax for type uuid';
const PG_INVALID_TEXT_REPRESENTATION = '22P02';

/**
 * Catches TypeORM QueryFailedError and converts invalid UUID (and similar
 * invalid type) errors to 400 Bad Request instead of 500.
 */
@Catch(QueryFailedError)
export class QueryFailedExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(QueryFailedExceptionFilter.name);

  catch(exception: QueryFailedError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const driverError = exception.driverError as { code?: string; message?: string } | undefined;
    const message = (driverError?.message ?? exception.message) || '';

    const isInvalidUuid =
      message.includes(INVALID_UUID_MESSAGE) ||
      driverError?.code === PG_INVALID_TEXT_REPRESENTATION;

    if (isInvalidUuid) {
      this.logger.debug(`Invalid UUID/type in request: ${message}`);
      const badRequest = new BadRequestException('Invalid ID format. Expected a valid UUID.');
      response.status(HttpStatus.BAD_REQUEST).json(badRequest.getResponse());
      return;
    }

    this.logger.error(exception.message, exception.stack);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  }
}
