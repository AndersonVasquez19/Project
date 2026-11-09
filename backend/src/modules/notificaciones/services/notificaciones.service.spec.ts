import { NotFoundException } from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service';

describe('NotificacionesService', () => {
  const prisma = {
    notificaciones_internas: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
    },
  };
  let service: NotificacionesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NotificacionesService(prisma as never);
  });

  it('returns only the authenticated user’s notifications', async () => {
    prisma.notificaciones_internas.findMany.mockResolvedValue([
      {
        id: 7n,
        titulo: 'Matrícula actualizada',
        mensaje: 'Se registró un cambio.',
        tipo: 'info',
        leida: false,
        vinculo: '/admin/matriculas',
        created_at: new Date('2026-11-08T12:00:00.000Z'),
      },
    ]);

    await expect(service.findForUser('3')).resolves.toMatchObject({
      no_leidas: 1,
      data: [{ id: '7', leida: false }],
    });
    expect(prisma.notificaciones_internas.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { user_id: 3n }, take: 100 }),
    );
  });

  it('does not allow marking another user’s notification as read', async () => {
    prisma.notificaciones_internas.updateMany.mockResolvedValue({ count: 0 });
    prisma.notificaciones_internas.findFirst.mockResolvedValue(null);

    await expect(service.markRead('7', '3')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.notificaciones_internas.findFirst).toHaveBeenCalledWith({
      where: { id: 7n, user_id: 3n },
      select: { id: true },
    });
  });
});
