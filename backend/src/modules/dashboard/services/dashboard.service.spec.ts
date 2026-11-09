import { PrismaService } from '../../../prisma/prisma.service';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  const prisma = {
    estudiantes: { count: jest.fn() },
    cursos: { count: jest.fn() },
    matriculas: { count: jest.fn(), findMany: jest.fn() },
    servicios_tecnologicos: { count: jest.fn() },
    user: { count: jest.fn() },
  };
  const service = new DashboardService(prisma as unknown as PrismaService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not query data outside the supplied permissions', async () => {
    await expect(service.getSummary([])).resolves.toEqual({
      counts: {
        students: null,
        courses: null,
        enrollments: null,
        pendingEnrollments: null,
        services: null,
        users: null,
      },
      recentEnrollments: [],
    });
    expect(prisma.estudiantes.count).not.toHaveBeenCalled();
    expect(prisma.matriculas.findMany).not.toHaveBeenCalled();
  });

  it('returns only permitted metrics and recent enrollment activity', async () => {
    prisma.matriculas.count.mockResolvedValueOnce(3).mockResolvedValueOnce(1);
    prisma.matriculas.findMany.mockResolvedValue([
      {
        id: 8n,
        fecha_matricula: new Date('2026-10-10T00:00:00.000Z'),
        estado: 'pendiente',
        estudiantes: { nombres: 'Ana', apellidos: 'Pérez' },
        cursos: { nombre: 'Excel' },
      },
    ]);

    await expect(service.getSummary(['matriculas.ver'])).resolves.toMatchObject(
      {
        counts: {
          students: null,
          courses: null,
          enrollments: 3,
          pendingEnrollments: 1,
          services: null,
          users: null,
        },
        recentEnrollments: [
          {
            id: '8',
            date: '2026-10-10',
            status: 'pendiente',
            student: 'Ana Pérez',
            course: 'Excel',
          },
        ],
      },
    );
    expect(prisma.estudiantes.count).not.toHaveBeenCalled();
    expect(prisma.matriculas.findMany).toHaveBeenCalledTimes(1);
  });
});
