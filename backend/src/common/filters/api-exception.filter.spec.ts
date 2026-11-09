import {
  ArgumentsHost,
  ConflictException,
  ForbiddenException,
  HttpException,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ApiExceptionFilter } from './api-exception.filter';

function run(exception: unknown) {
  const json = jest.fn<void, [Record<string, unknown>]>();
  const status = jest.fn<{ json: typeof json }, [number]>(() => ({ json }));
  const host = {
    switchToHttp: () => ({ getResponse: () => ({ status }) }),
  } as unknown as ArgumentsHost;

  new ApiExceptionFilter().catch(exception, host);

  return {
    status: status.mock.calls[0][0],
    body: json.mock.calls[0][0],
  };
}

describe('ApiExceptionFilter', () => {
  it('adds a stable code and keeps message and field errors', () => {
    const { status, body } = run(
      new UnprocessableEntityException({
        message: 'Revisa los datos ingresados.',
        errors: { email: ['Correo inválido.'] },
      }),
    );

    expect(status).toBe(422);
    expect(body).toEqual({
      statusCode: 422,
      code: 'VALIDATION_FAILED',
      message: 'Revisa los datos ingresados.',
      errors: { email: ['Correo inválido.'] },
    });
  });

  it('maps common HTTP exceptions to codes', () => {
    expect(run(new ForbiddenException('No.')).body).toMatchObject({
      code: 'FORBIDDEN',
      message: 'No.',
    });
    expect(run(new ConflictException('Dup')).body.code).toBe('CONFLICT');
    expect(run(new HttpException('Mucho', 429)).body.code).toBe(
      'TOO_MANY_REQUESTS',
    );
  });

  it('lets a service choose its own code', () => {
    const { body } = run(
      new ConflictException({ message: 'Sin cupos.', code: 'COURSE_FULL' }),
    );
    expect(body.code).toBe('COURSE_FULL');
  });

  it('maps unhandled Prisma errors to 409 and 404', () => {
    expect(run({ code: 'P2002' })).toMatchObject({
      status: 409,
      body: { code: 'CONFLICT' },
    });
    expect(run({ code: 'P2025' })).toMatchObject({
      status: 404,
      body: { code: 'NOT_FOUND' },
    });
  });

  it('hides internal failures behind a generic 500', () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const { status, body } = run(new Error('SELECT * FROM secret'));

    expect(status).toBe(500);
    expect(body).toEqual({
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'Ocurrió un error interno. Inténtalo nuevamente.',
    });
  });
});
