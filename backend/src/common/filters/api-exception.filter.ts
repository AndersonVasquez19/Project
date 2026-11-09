import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

/** Códigos estables que el frontend puede usar sin comparar textos. */
export const ERROR_CODES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHENTICATED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.PAYLOAD_TOO_LARGE]: 'PAYLOAD_TOO_LARGE',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'VALIDATION_FAILED',
  [HttpStatus.TOO_MANY_REQUESTS]: 'TOO_MANY_REQUESTS',
};

type ErrorBody = {
  statusCode: number;
  code: string;
  message: string | string[];
  errors?: Record<string, string[]>;
  [key: string]: unknown;
};

function prismaCode(exception: unknown): string | null {
  if (
    typeof exception === 'object' &&
    exception !== null &&
    'code' in exception &&
    typeof exception.code === 'string' &&
    /^P\d{4}$/.test(exception.code)
  ) {
    return exception.code;
  }
  return null;
}

export function codeFor(status: number): string {
  return ERROR_CODES[status] ?? (status >= 500 ? 'INTERNAL_ERROR' : 'ERROR');
}

/**
 * Unifica el cuerpo de error: conserva `message` y `errors` (que ya consume el
 * frontend) y añade `statusCode` y un `code` estable. Oculta los fallos internos.
 */
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const { status, body } = this.normalize(exception);
    response.status(status).json(body);
  }

  private normalize(exception: unknown): { status: number; body: ErrorBody } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const raw = exception.getResponse();
      const details: Record<string, unknown> =
        typeof raw === 'string' ? { message: raw } : { ...raw };
      // Nest repite el estado y el nombre; ya van en statusCode y code.
      delete details.error;
      delete details.statusCode;

      return {
        status,
        body: {
          message: 'Ocurrió un error.',
          ...details,
          statusCode: status,
          code:
            typeof details.code === 'string' ? details.code : codeFor(status),
        },
      };
    }

    // Red de seguridad para errores de Prisma no capturados por los servicios.
    const prisma = prismaCode(exception);
    if (prisma === 'P2002') {
      return this.simple(
        HttpStatus.CONFLICT,
        'Ya existe un registro con esos datos.',
      );
    }
    if (prisma === 'P2025') {
      return this.simple(HttpStatus.NOT_FOUND, 'El registro no existe.');
    }

    this.logger.error(
      exception instanceof Error ? exception.stack : String(exception),
    );
    return this.simple(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Ocurrió un error interno. Inténtalo nuevamente.',
    );
  }

  private simple(
    status: number,
    message: string,
  ): { status: number; body: ErrorBody } {
    return {
      status,
      body: { statusCode: status, code: codeFor(status), message },
    };
  }
}
