export type AdminNavItem = {
  href: string;
  label: string;
  icon: string;
  permission?: string;
  adminOnly?: boolean;
};

export type AdminNavGroup = {
  heading: string;
  items: AdminNavItem[];
};

export const adminNavGroups: AdminNavGroup[] = [
  {
    heading: "Principal",
    items: [{ href: "/admin", label: "Panel de Control", icon: "fa-chart-line" }],
  },
  {
    heading: "Gestión académica",
    items: [
      {
        href: "/admin/estudiantes",
        label: "Estudiantes",
        icon: "fa-user-graduate",
        permission: "estudiantes.ver",
      },
      {
        href: "/admin/cursos",
        label: "Cursos",
        icon: "fa-book-open",
        permission: "cursos.ver",
      },
      {
        href: "/admin/matriculas",
        label: "Matrículas",
        icon: "fa-clipboard-check",
        permission: "matriculas.ver",
      },
    ],
  },
  {
    heading: "Comercial y atención",
    items: [
      {
        href: "/admin/servicios",
        label: "Servicios tecnológicos",
        icon: "fa-network-wired",
        permission: "servicios.ver",
      },
      {
        href: "/admin/cotizaciones",
        label: "Solicitudes de cotización",
        icon: "fa-file-lines",
        permission: "cotizaciones.ver",
        adminOnly: true,
      },
      {
        href: "/admin/reclamaciones",
        label: "Libro de Reclamaciones",
        icon: "fa-book-bookmark",
        permission: "reclamaciones.ver",
      },
      {
        href: "/admin/asistente",
        label: "Asistente Virtual",
        icon: "fa-robot",
        permission: "asistente.ver",
      },
    ],
  },
  {
    heading: "Operación interna",
    items: [
      {
        href: "/admin/aprobaciones",
        label: "Aprobaciones",
        icon: "fa-check-to-slot",
        permission: "aprobaciones.ver",
      },
      {
        href: "/admin/notificaciones",
        label: "Notificaciones",
        icon: "fa-bell",
      },
      {
        href: "/admin/reportes",
        label: "Reportes",
        icon: "fa-file-export",
        permission: "reportes.ver",
      },
      {
        href: "/admin/buscar",
        label: "Buscar",
        icon: "fa-magnifying-glass",
      },
    ],
  },
  {
    heading: "Sistema y seguridad",
    items: [
      {
        href: "/admin/usuarios",
        label: "Usuarios",
        icon: "fa-users",
        permission: "usuarios.ver",
      },
      {
        href: "/admin/roles",
        label: "Roles",
        icon: "fa-shield-halved",
        permission: "roles.ver",
      },
      {
        href: "/admin/configuracion",
        label: "Configuración",
        icon: "fa-gear",
        permission: "configuracion.ver",
      },
      {
        href: "/admin/auditoria",
        label: "Auditoría",
        icon: "fa-clipboard-list",
        permission: "auditoria.ver",
      },
      {
        href: "/admin/respaldo",
        label: "Respaldo",
        icon: "fa-database",
        permission: "respaldo.ver",
      },
    ],
  },
];

export function adminPageTitle(pathname: string): string {
  const item = adminNavGroups
    .flatMap((group) => group.items)
    .filter((entry) => pathname === entry.href || pathname.startsWith(`${entry.href}/`))
    .sort((left, right) => right.href.length - left.href.length)[0];

  return item?.label ?? "Panel de Control";
}
