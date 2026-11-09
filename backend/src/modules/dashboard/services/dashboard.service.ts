import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

const ACCESS = {
  students: 'estudiantes.ver',
  courses: 'cursos.ver',
  enrollments: 'matriculas.ver',
  services: 'servicios.ver',
  users: 'usuarios.ver',
} as const;

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(permissions: string[]) {
    const can = (permission: string) => permissions.includes(permission);
    const [
      students,
      courses,
      enrollments,
      pendingEnrollments,
      services,
      users,
      recentEnrollments,
    ] = await Promise.all([
      can(ACCESS.students)
        ? this.prisma.estudiantes.count({ where: { deleted_at: null } })
        : null,
      can(ACCESS.courses)
        ? this.prisma.cursos.count({ where: { deleted_at: null } })
        : null,
      can(ACCESS.enrollments)
        ? this.prisma.matriculas.count({ where: { deleted_at: null } })
        : null,
      can(ACCESS.enrollments)
        ? this.prisma.matriculas.count({
            where: { deleted_at: null, estado: 'pendiente' },
          })
        : null,
      can(ACCESS.services) ? this.prisma.servicios_tecnologicos.count() : null,
      can(ACCESS.users) ? this.prisma.user.count() : null,
      can(ACCESS.enrollments)
        ? this.prisma.matriculas.findMany({
            where: { deleted_at: null },
            select: {
              id: true,
              fecha_matricula: true,
              estado: true,
              estudiantes: { select: { nombres: true, apellidos: true } },
              cursos: { select: { nombre: true } },
            },
            orderBy: [{ fecha_matricula: 'desc' }, { id: 'desc' }],
            take: 6,
          })
        : [],
    ]);

    return {
      counts: {
        students,
        courses,
        enrollments,
        pendingEnrollments,
        services,
        users,
      },
      recentEnrollments: recentEnrollments.map((enrollment) => ({
        id: enrollment.id.toString(),
        date: enrollment.fecha_matricula.toISOString().slice(0, 10),
        status: enrollment.estado,
        student: `${enrollment.estudiantes.nombres} ${enrollment.estudiantes.apellidos}`,
        course: enrollment.cursos.nombre,
      })),
    };
  }
}
