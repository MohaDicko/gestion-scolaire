import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    student: { findFirst: vi.fn(), findMany: vi.fn() },
    grade: { findMany: vi.fn() },
    enrollment: { findFirst: vi.fn(), findMany: vi.fn() },
    school: { findUnique: vi.fn() },
  }
}));

vi.mock('@/lib/auth', () => ({
  getSession: vi.fn()
}));

const MOCK_SESSION = { id: 'admin-1', tenantId: 'tenant-1', role: 'SCHOOL_ADMIN' };

describe('GET /api/reports/bulletins — Génération de bulletin par Trimestre', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('Filtre les notes selon le trimestre demandé (ex: Trimestre 2)', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(MOCK_SESSION as any);
    
    // Mocks des données requises
    vi.mocked(prisma.student.findFirst).mockResolvedValueOnce({ id: 'stu-1' } as any);
    vi.mocked(prisma.school.findUnique).mockResolvedValueOnce({ gradingScale: 20 } as any);
    vi.mocked(prisma.enrollment.findFirst).mockResolvedValueOnce({ 
      classroom: { id: 'class-1' }, 
      academicYear: { name: '2025-2026' } 
    } as any);
    vi.mocked(prisma.enrollment.findMany).mockResolvedValueOnce([{ studentId: 'stu-1' }] as any);
    
    // Simuler des notes renvoyées par Prisma (appelé plusieurs fois)
    vi.mocked(prisma.grade.findMany).mockResolvedValue([
      { studentId: 'stu-1', score: 14, maxScore: 20, subject: { name: 'Math', coefficient: 2 }, trimestre: 2 }
    ] as any);

    const req = new Request('http://localhost/api/reports/bulletins?studentId=stu-1&academicYearId=ay-1&trimestre=2');
    const res = await GET(req);
    
    expect(res.status).toBe(200);
    const data = await res.json();
    
    // Vérifie que Prisma a été appelé avec le filtre trimestre: 2
    expect(prisma.grade.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          studentId: 'stu-1',
          academicYearId: 'ay-1',
          trimestre: 2 // <== Le paramètre crucial
        })
      })
    );

    // Vérifie que la structure du bulletin retourne le bon trimestre
    expect(data.trimestre).toBe(2);
  });
});
