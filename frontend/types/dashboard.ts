export interface DashboardSummary {
  counts: {
    students: number | null;
    courses: number | null;
    enrollments: number | null;
    pendingEnrollments: number | null;
    services: number | null;
    users: number | null;
  };
  recentEnrollments: Array<{
    id: string;
    date: string;
    status: string;
    student: string;
    course: string;
  }>;
}
