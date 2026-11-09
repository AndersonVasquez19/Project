import { AuditoriaService } from './auditoria.service';

describe('AuditoriaService', () => {
  const prisma = {
    audit_logs: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };
  let service: AuditoriaService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuditoriaService(prisma as never);
  });

  it('paginates audit entries and omits change payloads', async () => {
    prisma.audit_logs.findMany.mockResolvedValue([
      {
        id: 8n,
        action: 'aprobaciones.aprobada',
        model_type: 'aprobaciones_internas',
        model_id: 3n,
        created_at: new Date('2026-11-08T12:00:00.000Z'),
        users: { name: 'Admin' },
        changes: { secret: 'private' },
      },
    ]);
    prisma.audit_logs.count.mockResolvedValue(1);

    const result = await service.findAll({ page: 1, limit: 50 });

    expect(result.data[0]).toEqual({
      id: '8',
      action: 'aprobaciones.aprobada',
      model_type: 'aprobaciones_internas',
      model_id: '3',
      created_at: '2026-11-08T12:00:00.000Z',
      actor: 'Admin',
    });
    expect(prisma.audit_logs.findMany).toHaveBeenCalledTimes(1);
  });
});
