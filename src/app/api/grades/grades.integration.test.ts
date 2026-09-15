/**
 * ================================================================
 * TEST D'INTÉGRATION — API Grades (GET + POST /api/grades)
 * Prisma est mocké via vitest-mock-extended
 * Session est mockée via @/lib/auth
 * ================================================================
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── 1. Mock Prisma ────────────────────────────────────────────────
vi.mock('@/lib/prisma', async () => {
  const { mockDeep } = await import('vitest-mock-extended');
  return { prisma: mockDeep() };
});

// ── 2. Mock Auth (getSession) ────────────────────────────────────
vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
  getSessionUniversal: vi.fn(),
  encrypt: vi.fn().mockResolvedValue('mocked_token'),
}));

// ── 3. Mock Audit ────────────────────────────────────────────────
vi.mock('@/lib/audit', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { GET, POST } from '@/app/api/grades/route';

const prismaMock = prisma as any;
const getSessionMock = getSession as ReturnType<typeof vi.fn>;

// ── Session de référence (TEACHER du CFPPAS) ─────────────────────
const TEACHER_SESSION = {
  id:       'user-teacher-1',
  email:    'prof@cfppas-gao.ml',
  role:     'TEACHER',
  tenantId: 'tenant-cfppas',
};

const ADMIN_SESSION = {
  id:       'user-admin-1',
  email:    'admin@cfppas-gao.ml',
  role:     'SCHOOL_ADMIN',
  tenantId: 'tenant-cfppas',
};

const PARENT_SESSION = {
  id:       'user-parent-1',
  email:    'parent@cfppas-gao.ml',
  role:     'PARENT',
  tenantId: 'tenant-cfppas',
};

// ── Données de référence ──────────────────────────────────────────
const MOCK_GRADE = {
  id:           'grade-001',
  studentId:    'stu-001',
  subjectId:    'sub-bio',
  academicYearId: 'year-2025',
  examType:     'CONTINUOUS',
  trimestre:    1,
  score:        15,
  maxScore:     20,
  comment:      null,
  student: {
    id:            'stu-001',
    firstName:     'Boubacar',
    lastName:      'Abdoulaye',
    studentNumber: 'RC17PB25G001M',
    tenantId:      'tenant-cfppas',
  },
};

// ─────────────────────────────────────────────────────────────────
// GET /api/grades
// ─────────────────────────────────────────────────────────────────
describe('GET /api/grades — Récupération des notes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Retourne 401 si aucune session n\'est active', async () => {
    getSessionMock.mockResolvedValue(null);
    const req = new Request('http://localhost/api/grades');
    const res = await GET(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('Retourne les notes filtrées par tenant (sans filtre classroomId)', async () => {
    getSessionMock.mockResolvedValue(TEACHER_SESSION);
    prismaMock.grade.findMany.mockResolvedValue([MOCK_GRADE]);

    const req = new Request('http://localhost/api/grades');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    // La route filtre par tenantId → seules les notes de ce tenant sont retournées
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(1);
    expect(body[0].id).toBe('grade-001');
  });

  it('Exclut les notes d\'un autre tenant même si Prisma les retourne', async () => {
    getSessionMock.mockResolvedValue(TEACHER_SESSION);
    const gradeOtherTenant = {
      ...MOCK_GRADE,
      id: 'grade-other',
      student: { ...MOCK_GRADE.student, tenantId: 'autre-tenant' },
    };
    prismaMock.grade.findMany.mockResolvedValue([MOCK_GRADE, gradeOtherTenant]);

    const req = new Request('http://localhost/api/grades');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    // Seule la note du bon tenant passe le filtre
    expect(body).toHaveLength(1);
    expect(body[0].id).toBe('grade-001');
  });

  it('Retourne 403 si la classe appartient à un autre tenant', async () => {
    getSessionMock.mockResolvedValue(TEACHER_SESSION);
    // Prisma.classroom.findFirst retourne null → classe non trouvée pour ce tenant
    prismaMock.classroom.findFirst.mockResolvedValue(null);

    const req = new Request('http://localhost/api/grades?classroomId=class-autre-tenant');
    const res = await GET(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('accès non autorisé');
  });

  it('Retourne les notes filtrées par classroomId (classe du même tenant)', async () => {
    getSessionMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.classroom.findFirst.mockResolvedValue({ id: 'class-1', tenantId: 'tenant-cfppas' });
    prismaMock.enrollment.findMany.mockResolvedValue([{ studentId: 'stu-001' }]);
    prismaMock.grade.findMany.mockResolvedValue([MOCK_GRADE]);

    const req = new Request('http://localhost/api/grades?classroomId=class-1');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    // Vérifie que le filtre studentId a bien été transmis à Prisma
    expect(prismaMock.grade.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ studentId: { in: ['stu-001'] } }),
      })
    );
  });

  it('Retourne un tableau vide si aucune note n\'existe pour ce tenant', async () => {
    getSessionMock.mockResolvedValue(TEACHER_SESSION);
    prismaMock.grade.findMany.mockResolvedValue([]);

    const req = new Request('http://localhost/api/grades');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────
// POST /api/grades
// ─────────────────────────────────────────────────────────────────
describe('POST /api/grades — Saisie des notes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validBody = {
    grades:        [{ studentId: 'stu-001', score: '15', comment: '' }],
    subjectId:     'sub-bio',
    academicYearId: 'year-2025',
    examType:      1, // MIDTERM
    trimestre:     1,
    maxScore:      '20',
  };

  it('Retourne 401 si aucune session n\'est active', async () => {
    getSessionMock.mockResolvedValue(null);
    const req = new Request('http://localhost/api/grades', {
      method: 'POST',
      body: JSON.stringify(validBody),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('Retourne 403 si le rôle est PARENT (non autorisé à saisir des notes)', async () => {
    getSessionMock.mockResolvedValue(PARENT_SESSION);
    const req = new Request('http://localhost/api/grades', {
      method: 'POST',
      body: JSON.stringify(validBody),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('droits insuffisants');
  });

  it('Retourne 400 si le tableau grades est absent', async () => {
    getSessionMock.mockResolvedValue(TEACHER_SESSION);
    const req = new Request('http://localhost/api/grades', {
      method: 'POST',
      body: JSON.stringify({ subjectId: 'sub-bio', academicYearId: 'year-2025', examType: 1 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('invalides ou incomplètes');
  });

  it('Retourne 400 si subjectId est absent', async () => {
    getSessionMock.mockResolvedValue(TEACHER_SESSION);
    const req = new Request('http://localhost/api/grades', {
      method: 'POST',
      body: JSON.stringify({ grades: [{ studentId: 'stu-1', score: '10' }], academicYearId: 'y1', examType: 1 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('Retourne 400 si une note dépasse le maxScore', async () => {
    getSessionMock.mockResolvedValue(TEACHER_SESSION);
    const req = new Request('http://localhost/api/grades', {
      method: 'POST',
      body: JSON.stringify({
        ...validBody,
        grades: [{ studentId: 'stu-001', score: '25', comment: '' }], // 25 > maxScore 20
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Note invalide');
  });

  it('Retourne 400 si une note est négative', async () => {
    getSessionMock.mockResolvedValue(TEACHER_SESSION);
    const req = new Request('http://localhost/api/grades', {
      method: 'POST',
      body: JSON.stringify({
        ...validBody,
        grades: [{ studentId: 'stu-001', score: '-5', comment: '' }],
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('Crée les notes et retourne 200 avec le count pour un TEACHER autorisé', async () => {
    getSessionMock.mockResolvedValue(TEACHER_SESSION);
    prismaMock.grade.create.mockResolvedValue({ ...MOCK_GRADE, id: 'grade-new-001' });
    prismaMock.auditLog.create.mockResolvedValue({});

    const req = new Request('http://localhost/api/grades', {
      method: 'POST',
      body: JSON.stringify(validBody),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.count).toBe(1);
    expect(prismaMock.grade.create).toHaveBeenCalledTimes(1);
  });

  it('Crée plusieurs notes en batch et retourne le bon count', async () => {
    getSessionMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.grade.create
      .mockResolvedValueOnce({ id: 'g-1' })
      .mockResolvedValueOnce({ id: 'g-2' })
      .mockResolvedValueOnce({ id: 'g-3' });
    prismaMock.auditLog.create.mockResolvedValue({});

    const req = new Request('http://localhost/api/grades', {
      method: 'POST',
      body: JSON.stringify({
        ...validBody,
        grades: [
          { studentId: 'stu-001', score: '15' },
          { studentId: 'stu-002', score: '12' },
          { studentId: 'stu-003', score: '18' },
        ],
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.count).toBe(3);
    expect(prismaMock.grade.create).toHaveBeenCalledTimes(3);
  });

  it('Mappe correctement examType 1→MIDTERM, 2→FINAL, 3→CONTINUOUS', async () => {
    getSessionMock.mockResolvedValue(TEACHER_SESSION);
    prismaMock.grade.create.mockResolvedValue({ id: 'g-final' });
    prismaMock.auditLog.create.mockResolvedValue({});

    const req = new Request('http://localhost/api/grades', {
      method: 'POST',
      body: JSON.stringify({ ...validBody, examType: 2 }), // FINAL
    });
    await POST(req);
    expect(prismaMock.grade.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ examType: 'FINAL' }),
      })
    );
  });

  it('Le rôle SCHOOL_ADMIN peut aussi saisir des notes', async () => {
    getSessionMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.grade.create.mockResolvedValue({ id: 'g-admin' });
    prismaMock.auditLog.create.mockResolvedValue({});

    const req = new Request('http://localhost/api/grades', {
      method: 'POST',
      body: JSON.stringify(validBody),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
