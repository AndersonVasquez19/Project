import { ConflictException } from '@nestjs/common';
import { CotizacionesService } from './cotizaciones.service';

describe('CotizacionesService', () => {
  const prisma = {
    solicitudes_cotizacion: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    servicios_tecnologicos: { findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  };
  let service: CotizacionesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CotizacionesService(prisma as never);
  });

  it('returns a redacted and stable request summary', async () => {
    prisma.solicitudes_cotizacion.findMany.mockResolvedValue([
      {
        id: 2n,
        codigo: 'COT-2026-ABCD1234',
        recibida_at: new Date('2026-11-08T12:00:00.000Z'),
        servicio_nombre_historico: 'Soporte',
        necesidad_cliente: 'Necesito soporte para una instalación.',
        contacto_nombre: 'Ana Pérez',
        contacto_email: 'ana@example.com',
        contacto_telefono: null,
        estado: 'recibida',
        responsable_id: null,
        ultimo_seguimiento_at: null,
        proximo_seguimiento: null,
        revision: 1,
        origen: 'administrativo',
        servicios_tecnologicos: null,
        users_solicitudes_cotizacion_responsable_idTousers: null,
        creacion_clave_hash: 'not-returned',
      },
    ]);
    prisma.solicitudes_cotizacion.count.mockResolvedValue(1);

    const result = await service.findAll({ search: 'Ana' });

    expect(result.data[0]).toMatchObject({
      codigo: 'COT-2026-ABCD1234',
      contacto_nombre: 'Ana Pérez',
      servicio: 'Soporte',
    });
    expect(JSON.stringify(result)).not.toContain('not-returned');
    expect(result.limite).toBe(200);
  });

  it('rejects stale updates before writing histories', async () => {
    const transaction = {
      solicitudes_cotizacion: {
        findUnique: jest.fn().mockResolvedValue({
          id: 3n,
          codigo: 'COT-1',
          revision: 4,
          estado: 'recibida',
          proximo_seguimiento: null,
          responsable_id: null,
        }),
        updateMany: jest.fn(),
      },
      cotizacion_historial: { create: jest.fn() },
      audit_logs: { create: jest.fn() },
    };
    prisma.user.findUnique.mockResolvedValue({ name: 'Operador' });
    prisma.$transaction.mockImplementation(
      async (callback: (tx: typeof transaction) => Promise<unknown>) =>
        callback(transaction),
    );

    await expect(
      service.update('3', { revision: 3, estado: 'en_seguimiento' }, '8'),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(
      transaction.solicitudes_cotizacion.updateMany,
    ).not.toHaveBeenCalled();
    expect(transaction.cotizacion_historial.create).not.toHaveBeenCalled();
  });
});
