import { UnprocessableEntityException } from '@nestjs/common';
import { ConfiguracionService } from './configuracion.service';

describe('ConfiguracionService', () => {
  const prisma = {
    system_settings: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    audit_logs: { create: jest.fn() },
  };
  let service: ConfiguracionService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ConfiguracionService(prisma as never);
  });

  it('returns only allowlisted settings and applies safe defaults', async () => {
    prisma.system_settings.findMany.mockResolvedValue([
      { key: 'system.name', value: 'Horus Admin' },
      { key: 'server.secret', value: 'hidden' },
    ]);

    const result = await service.findAll();
    expect(result.data).toHaveLength(5);
    expect(result.data.find(({ key }) => key === 'system.name')?.value).toBe(
      'Horus Admin',
    );
    expect(
      result.data.find(({ key }) => key === 'system.timezone')?.value,
    ).toBe('America/Lima');
    expect(
      result.data.find(({ key }) => key === 'system.currency')?.value,
    ).toBe('PEN');
    expect(prisma.system_settings.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          key: {
            in: [
              'system.name',
              'system.timezone',
              'system.currency',
              'reports.company_name',
              'reports.footer',
            ],
          },
        },
      }),
    );
  });

  it('rejects unsupported timezone values and persists allowed ones', async () => {
    await expect(
      service.save({ key: 'system.timezone', value: 'UTC+5' }, '9'),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(prisma.system_settings.upsert).not.toHaveBeenCalled();

    await expect(
      service.save({ key: 'system.timezone', value: 'UTC' }, '9'),
    ).resolves.toEqual({ key: 'system.timezone', value: 'UTC' });
    expect(prisma.system_settings.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.audit_logs.create).toHaveBeenCalledTimes(1);
  });
});
