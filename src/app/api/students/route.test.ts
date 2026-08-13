/**
 * ================================================================
 * TESTS D'INTÉGRATION — API Élèves (/api/students)
 * CFP-PAS de Gao — Gestion des 131 apprenants
 * ================================================================
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    student: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    school: {
      findUnique: vi.fn(),
    },
    user: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  }
}));

vi.mock('@/lib/auth', () => ({
  getSession: vi.fn()
}));

vi.mock('@/lib/plans', () => ({
  getStudentLimit: vi.fn().mockReturnValue(500)
}));

vi.mock('@/lib/audit', () => ({
  logAudit: vi.fn()
}));

const CFPPAS_TENANT_ID = '6220c072-a3ca-4eaa-9c24-ccc9b20e3a91';
const ADMIN_SESSION = {
  id: 'user-admin-1',
  tenantId: CFPPAS_TENANT_ID,
  role: 'SCHOOL_ADMIN',
  email: 'admin@cfppas-gao.ml',
};

const MOCK_STUDENT_1 = {
  id: 'stu-001',
  tenantId: CFPPAS_TENANT_ID,
  studentNumber: 'RC17PB25G151M',
  firstName: 'Boubacar',
  lastName: 'Abdoulaye',
  gender: 'MALE',
  dateOfBirth: new Date('2004-03-15'),
  nationalId: 'RC17PB25G151M',
  parentName: 'Tuteur de Boubacar Abdoulaye',
  parentPhone: '+223 00000000',
  parentEmail: 'parent.rc17pb25g151m@cfppas-gao.ml',
  parentRelationship: 'PARENT',
  isActive: true,
  campusId: '70ebdbb8-e41a-432d-86c8-6544d1a481a2',
  enrollments: [{ classroom: { name: '1ère EA' } }],
  createdAt: new Date(),
};

const MOCK_STUDENT_2 = {
  ...MOCK_STUDENT_1,
  id: 'stu-002',
  studentNumber: 'RC17PB25G724M',
  firstName: 'Oumar',
  lastName: 'Ag Albachar',
  enrollments: [{ classroom: { name: '1ère TE' } }],
};

describe('GET /api/students — Liste des apprenants CFPPAS', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('Retourne 401 si non authentifié', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(null);
    const req = new Request('http://localhost/api/students');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('Retourne la liste paginée des élèves avec leur classe', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(ADMIN_SESSION as any);
    vi.mocked(prisma.student.findMany).mockResolvedValueOnce([MOCK_STUDENT_1, MOCK_STUDENT_2] as any);
    vi.mocked(prisma.student.count).mockResolvedValueOnce(131);

    const req = new Request('http://localhost/api/students?pageNumber=1&pageSize=15');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.items).toHaveLength(2);
    expect(data.totalCount).toBe(131);
    expect(data.totalPages).toBe(Math.ceil(131 / 15));
  });

  it('La réponse doit inclure les inscriptions (classe) de chaque élève', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(ADMIN_SESSION as any);
    vi.mocked(prisma.student.findMany).mockResolvedValueOnce([MOCK_STUDENT_1] as any);
    vi.mocked(prisma.student.count).mockResolvedValueOnce(1);

    const req = new Request('http://localhost/api/students');
    const res = await GET(req);
    const data = await res.json();

    expect(data.items[0].enrollments[0].classroom.name).toBe('1ère EA');
  });

  it('Filtre les élèves par nom (recherche)', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(ADMIN_SESSION as any);
    vi.mocked(prisma.student.findMany).mockResolvedValueOnce([MOCK_STUDENT_2] as any);
    vi.mocked(prisma.student.count).mockResolvedValueOnce(1);

    const req = new Request('http://localhost/api/students?search=Oumar');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.items[0].firstName).toBe('Oumar');
  });

  it('Retourne un résultat vide avec pagination correcte si aucun élève ne correspond', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(ADMIN_SESSION as any);
    vi.mocked(prisma.student.findMany).mockResolvedValueOnce([] as any);
    vi.mocked(prisma.student.count).mockResolvedValueOnce(0);

    const req = new Request('http://localhost/api/students?search=XYZ_INEXISTANT');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.items).toHaveLength(0);
    expect(data.totalCount).toBe(0);
    expect(data.totalPages).toBe(0);
  });
});

describe('POST /api/students — Inscription d\'un nouvel apprenant', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  const newStudentBody = {
    firstName: 'Aissata',
    lastName: 'Dicko',
    dateOfBirth: '2005-06-20',
    gender: 'FEMALE',
    nationalId: 'RC18PB26G001F',
    parentName: 'Moussa Dicko',
    parentPhone: '+223 76001122',
    parentEmail: 'moussa.dicko@example.ml',
    parentRelationship: 'FATHER',
    campusId: '70ebdbb8-e41a-432d-86c8-6544d1a481a2',
    createStudentAccount: false,
    createParentAccount: false,
  };

  it('Retourne 401 si non authentifié', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(null);
    const req = new Request('http://localhost/api/students', {
      method: 'POST',
      body: JSON.stringify(newStudentBody),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('Crée un élève avec succès et retourne 201', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(ADMIN_SESSION as any);
    vi.mocked(prisma.school.findUnique).mockResolvedValueOnce({ id: CFPPAS_TENANT_ID, plan: 'BUSINESS' } as any);
    vi.mocked(prisma.student.count).mockResolvedValueOnce(131);
    const createdStudent = { id: 'stu-new', studentNumber: 'STU-2026-99999' };
    vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn: any) => fn({
      student: { create: vi.fn().mockResolvedValueOnce(createdStudent) },
      user: { create: vi.fn(), findUnique: vi.fn().mockResolvedValueOnce(null) },
    }));

    const req = new Request('http://localhost/api/students', {
      method: 'POST',
      body: JSON.stringify(newStudentBody),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('Retourne 403 si la limite du plan est atteinte', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(ADMIN_SESSION as any);
    vi.mocked(prisma.school.findUnique).mockResolvedValueOnce({ id: CFPPAS_TENANT_ID, plan: 'STARTER' } as any);
    vi.mocked(prisma.student.count).mockResolvedValueOnce(500);

    const req = new Request('http://localhost/api/students', {
      method: 'POST',
      body: JSON.stringify(newStudentBody),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain('limité');
  });
});
