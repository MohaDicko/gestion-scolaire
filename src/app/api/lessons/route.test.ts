/**
 * ================================================================
 * TESTS D'INTÉGRATION — API Cahier de Texte (/api/lessons)
 * CFP-PAS de Gao — Journal pédagogique et émargement
 * ================================================================
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    lessonLog: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    employee: {
      findFirst: vi.fn(),
    },
  }
}));

vi.mock('@/lib/auth', () => ({
  getSession: vi.fn()
}));

const CFPPAS_TENANT_ID = '6220c072-a3ca-4eaa-9c24-ccc9b20e3a91';
const TEACHER_SESSION = {
  id: 'user-teacher-1',
  tenantId: CFPPAS_TENANT_ID,
  role: 'TEACHER',
  email: 'alkassoum.youssouf@cfppas-gao.ml',
};
const ADMIN_SESSION = {
  id: 'user-admin-1',
  tenantId: CFPPAS_TENANT_ID,
  role: 'SCHOOL_ADMIN',
  email: 'admin@cfppas-gao.ml',
};

const MOCK_LESSON = {
  id: 'lesson-001',
  tenantId: CFPPAS_TENANT_ID,
  classroomId: 'class-1ere-te',
  subjectId: 'module-biologie',
  employeeId: 'employee-alkassoum',
  title: 'Biologie animale — Anatomie des bovins',
  content: 'Introduction à l\'anatomie bovine. Points clés : tube digestif, reproduction.',
  homework: 'Lire chapitre 3 du manuel',
  date: new Date('2026-08-13'),
  hoursCount: 2,
  status: 'COMPLETED',
  createdAt: new Date('2026-08-13T08:00:00Z'),
  classroom: { name: '1ère TE' },
  subject: { name: 'Module 5 : Biologie animal', code: 'MOD-05' },
  teacher: { id: 'employee-alkassoum', firstName: 'Alkassoum', lastName: 'Youssouf' },
};

describe('GET /api/lessons — Journal pédagogique', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('Retourne 401 si non authentifié', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(null);
    const req = new Request('http://localhost/api/lessons');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('Retourne la liste des cours du cahier de texte', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(ADMIN_SESSION as any);
    vi.mocked(prisma.lessonLog.findMany).mockResolvedValueOnce([MOCK_LESSON] as any);

    const req = new Request('http://localhost/api/lessons');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(1);
    expect(data[0].title).toBe('Biologie animale — Anatomie des bovins');
  });

  it('Filtre par classroomId', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(ADMIN_SESSION as any);
    vi.mocked(prisma.lessonLog.findMany).mockResolvedValueOnce([] as any);

    const req = new Request('http://localhost/api/lessons?classroomId=class-1ere-te');
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(vi.mocked(prisma.lessonLog.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ classroomId: 'class-1ere-te' })
      })
    );
  });

  it('Filtre par subjectId', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(ADMIN_SESSION as any);
    vi.mocked(prisma.lessonLog.findMany).mockResolvedValueOnce([] as any);

    const req = new Request('http://localhost/api/lessons?subjectId=module-biologie');
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(vi.mocked(prisma.lessonLog.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ subjectId: 'module-biologie' })
      })
    );
  });

  it('Retourne un tableau vide si aucun cours n\'existe', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(ADMIN_SESSION as any);
    vi.mocked(prisma.lessonLog.findMany).mockResolvedValueOnce([] as any);

    const req = new Request('http://localhost/api/lessons');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual([]);
  });
});

describe('POST /api/lessons — Saisie d\'un cours (Émargement)', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('Retourne 401 si non authentifié', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(null);
    const req = new Request('http://localhost/api/lessons', {
      method: 'POST',
      body: JSON.stringify({ classroomId: 'c1', subjectId: 's1', title: 'Test', content: 'Contenu' })
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('Retourne 400 si les champs obligatoires sont manquants', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(ADMIN_SESSION as any);
    const req = new Request('http://localhost/api/lessons', {
      method: 'POST',
      body: JSON.stringify({ classroomId: 'c1' }) // title et content manquants
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('Crée un cours avec hoursCount et retourne 201', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(ADMIN_SESSION as any);
    vi.mocked(prisma.employee.findFirst).mockResolvedValueOnce({
      id: 'employee-alkassoum'
    } as any);
    vi.mocked(prisma.lessonLog.create).mockResolvedValueOnce(MOCK_LESSON as any);

    const req = new Request('http://localhost/api/lessons', {
      method: 'POST',
      body: JSON.stringify({
        classroomId: 'class-1ere-te',
        subjectId: 'module-biologie',
        title: 'Biologie animale — Anatomie des bovins',
        content: 'Introduction à l\'anatomie bovine.',
        hoursCount: 2,
        date: '2026-08-13',
      })
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(vi.mocked(prisma.lessonLog.create)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          hoursCount: 2,
          status: 'COMPLETED',
        })
      })
    );
  });

  it('Un professeur peut saisir son propre cours (auto-identification par email)', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(TEACHER_SESSION as any);
    vi.mocked(prisma.employee.findFirst).mockResolvedValueOnce({
      id: 'employee-alkassoum'
    } as any);
    vi.mocked(prisma.lessonLog.create).mockResolvedValueOnce(MOCK_LESSON as any);

    const req = new Request('http://localhost/api/lessons', {
      method: 'POST',
      body: JSON.stringify({
        classroomId: 'class-1ere-te',
        subjectId: 'module-biologie',
        title: 'Cours de biologie',
        content: 'Contenu du cours',
        hoursCount: 1.5,
        date: '2026-08-13',
      })
    });

    const res = await POST(req);
    // Auto-identification doit trouver l'employé par email
    expect(vi.mocked(prisma.employee.findFirst)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          email: TEACHER_SESSION.email,
          tenantId: CFPPAS_TENANT_ID,
        })
      })
    );
    expect(res.status).toBe(201);
  });

  it('Retourne 400 si aucun profil enseignant n\'est trouvé', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(TEACHER_SESSION as any);
    vi.mocked(prisma.employee.findFirst).mockResolvedValueOnce(null);

    const req = new Request('http://localhost/api/lessons', {
      method: 'POST',
      body: JSON.stringify({
        classroomId: 'c1',
        subjectId: 's1',
        title: 'Test',
        content: 'Contenu',
      })
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('enseignant');
  });
});
