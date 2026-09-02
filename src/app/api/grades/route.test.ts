import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    grade: { create: vi.fn() },
    subject: { findUnique: vi.fn() },
  }
}));

vi.mock('@/lib/auth', () => ({
  getSession: vi.fn()
}));

const MOCK_SESSION = { id: 'user-1', tenantId: 'tenant-1', role: 'TEACHER' };

describe('POST /api/grades — Saisie des notes pour un trimestre', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('Retourne 401 si non authentifié', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(null);
    const req = new Request('http://localhost/api/grades', { method: 'POST' });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('Crée des notes pour le Trimestre 2 avec succès', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(MOCK_SESSION as any);
    vi.mocked(prisma.grade.create).mockResolvedValue({ id: 'g1' } as any);

    const payload = {
      subjectId: 'sub-1',
      academicYearId: 'ay-1',
      examType: 2, // 2 = FINAL
      trimestre: 2, // <== Spécification du trimestre
      maxScore: 20,
      grades: [
        { studentId: 'stu-1', score: 15 },
        { studentId: 'stu-2', score: 12 },
      ]
    };

    const req = new Request('http://localhost/api/grades', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' }
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    
    // Vérifier que create a été appelé avec le bon trimestre
    expect(prisma.grade.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ studentId: 'stu-1', trimestre: 2 })
      })
    );
    expect(prisma.grade.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ studentId: 'stu-2', trimestre: 2 })
      })
    );
  });

  it('Par défaut, enregistre les notes pour le Trimestre 1 si non spécifié', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(MOCK_SESSION as any);
    vi.mocked(prisma.grade.create).mockResolvedValue({ id: 'g2' } as any);

    const payload = {
      subjectId: 'sub-1',
      academicYearId: 'ay-1',
      examType: 1, // 1 = MIDTERM
      maxScore: 20,
      grades: [
        { studentId: 'stu-1', score: 18 }
      ]
    };

    const req = new Request('http://localhost/api/grades', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' }
    });

    await POST(req);

    // Vérifier la valeur par défaut du trimestre (1)
    expect(prisma.grade.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ studentId: 'stu-1', trimestre: 1 })
      })
    );
  });
});
