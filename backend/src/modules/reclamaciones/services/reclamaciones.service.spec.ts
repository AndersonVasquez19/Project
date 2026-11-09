import { ReclamacionesService } from './reclamaciones.service';

describe('ReclamacionesService', () => {
  const prisma = {
    reclamaciones: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  let service: ReclamacionesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ReclamacionesService(prisma as never);
  });

  it('returns only authorized operational fields and never exposes the submission token', async () => {
    prisma.reclamaciones.findMany.mockResolvedValue([
      {
        id: 4n,
        numero: 'R-2026-000001',
        token_envio: 'private-token',
        estado: 'abierto',
        recibida_at: new Date('2026-11-08T12:00:00.000Z'),
        fecha_limite: new Date('2026-12-08T00:00:00.000Z'),
        nombres: 'Ana',
        apellidos: 'Pérez',
        tipo_documento: 'DNI',
        numero_documento: '12345678',
        telefono: '999999999',
        email: 'ana@example.com',
        canal_respuesta: 'correo',
        tipo: 'reclamo',
        bien_tipo: null,
        bien_descripcion: null,
        monto_bien: null,
        detalle: 'Detalle del reclamo.',
        pedido: 'Solicito respuesta.',
        respuesta: null,
        respondida_at: null,
        responsable_id: null,
        users: null,
        reclamacion_historial: [],
      },
    ]);
    prisma.reclamaciones.count.mockResolvedValue(1);

    const result = await service.findAll({ search: 'Ana' });

    expect(result.data[0]).toMatchObject({
      numero: 'R-2026-000001',
      nombres: 'Ana',
      detalle: 'Detalle del reclamo.',
    });
    expect(JSON.stringify(result)).not.toContain('private-token');
    expect(result.limite).toBe(200);
  });

  it('assigns the authenticated user and records an internal history entry', async () => {
    const transaction = {
      reclamaciones: {
        findUnique: jest.fn().mockResolvedValue({
          id: 4n,
          responsable_id: null,
        }),
        update: jest.fn(),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({ name: 'Operador' }),
      },
      reclamacion_historial: { create: jest.fn() },
      audit_logs: { create: jest.fn() },
    };
    prisma.$transaction.mockImplementation(
      async (callback: (tx: typeof transaction) => Promise<unknown>) =>
        callback(transaction),
    );

    await expect(service.assignToSelf('4', '9')).resolves.toEqual({
      id: '4',
      asignada: true,
    });
    expect(transaction.reclamaciones.update).toHaveBeenCalledTimes(1);
    expect(transaction.reclamacion_historial.create).toHaveBeenCalledTimes(1);
    expect(transaction.audit_logs.create).toHaveBeenCalledTimes(1);
  });
});
