/**
 * ================================================================
 * TESTS D'INTÉGRATION — API Bulletins (/api/reports/bulletins)
 * CFP-PAS de Gao — Multi-tenant, barème /20 et /100, rang
 * ================================================================
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    student: { findFirst: vi.fn() },
    grade: { findMany: vi.fn() },
    enrollment: { findFirst: vi.fn(), findMany: vi.fn() },
    school: { findUnique: vi.fn() },
  }
}));

vi.mock('@/lib/auth', () => ({
  getSession: vi.fn()
}));

const CFPPAS_TENANT_ID = '6220c072-a3ca-4eaa-9c24-ccc9b20e3a91';
const ADMIN_SESSION = {
  id: 'user-admin-1',
  tenantId: CFPPAS_TENANT_ID,
  role: 'SCHOOL_ADMIN',
};

const MOCK_STUDENT = {
  id: 'stu-001',
  tenantId: CFPPAS_TENANT_ID,
  studentNumber: 'RC17PB25G151M',
  firstName: 'Boubacar',
  lastName: 'Abdoulaye',
  dateOfBirth: new Date('2004-03-15'),
  gender: 'MALE',
  campus: { name: 'Campus Principal Gao' },
};

const MOCK_ENROLLMENT = {
  classroom: { id: 'class-1ere-ea', name: '1ère EA', level: '1ère' },
  academicYear: { name: '2025-2026' },
};

const MOCK_GRADES_SCALE20 = [
  {
    score: 14, maxScore: 20, examType: 'FINAL', trimestre: 1, comment: null,
    subject: { name: 'Biologie', code: 'BIO', coefficient: 3 }
  },
  {
    score: 11, maxScore: 20, examType: 'FINAL', trimestre: 1, comment: null,
    subject: { name: 'Mathématiques', code: 'MATH', coefficient: 4 }
  },
];

const MOCK_SCHOOL_SCALE20 = {
  id: CFPPAS_TENANT_ID,
  name: 'CFP-PAS de Gao (Agro-Pastorale)',
  motto: "L'Excellence au Service de l'Agriculture",
  logoUrl: 'https://cdn.example.com/logo.png',
  gradingScale: 20,
  plan: 'FREE',
};

describe('GET /api/reports/bulletins — Bulletin Standard (Barème /20)', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('Retourne 401 si non authentifié', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(null);
    const req = new Request('http://localhost/api/reports/bulletins?studentId=stu-001&academicYearId=ay-001');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('Retourne 400 si studentId est absent', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(ADMIN_SESSION as any);
    const req = new Request('http://localhost/api/reports/bulletins?academicYearId=ay-001');
    const res = await GET(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('studentId');
  });

  it('Retourne 400 si academicYearId est absent', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(ADMIN_SESSION as any);
    const req = new Request('http://localhost/api/reports/bulletins?studentId=stu-001');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('Retourne 404 si l\'élève n\'existe pas dans le tenant', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(ADMIN_SESSION as any);
    vi.mocked(prisma.student.findFirst).mockResolvedValueOnce(null);
    vi.mocked(prisma.grade.findMany).mockResolvedValueOnce([]);
    vi.mocked(prisma.enrollment.findFirst).mockResolvedValueOnce(null);
    vi.mocked(prisma.school.findUnique).mockResolvedValueOnce(MOCK_SCHOOL_SCALE20 as any);

    const req = new Request('http://localhost/api/reports/bulletins?studentId=stu-inexistant&academicYearId=ay-001');
    const res = await GET(req);
    expect(res.status).toBe(404);
  });

  it('Retourne un bulletin complet avec les matières et la moyenne générale', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(ADMIN_SESSION as any);
    vi.mocked(prisma.student.findFirst).mockResolvedValueOnce(MOCK_STUDENT as any);
    vi.mocked(prisma.grade.findMany).mockResolvedValue(MOCK_GRADES_SCALE20 as any);
    vi.mocked(prisma.enrollment.findFirst).mockResolvedValueOnce(MOCK_ENROLLMENT as any);
    vi.mocked(prisma.school.findUnique).mockResolvedValueOnce(MOCK_SCHOOL_SCALE20 as any);
    vi.mocked(prisma.enrollment.findMany).mockResolvedValueOnce([{ studentId: 'stu-001' }] as any);

    const req = new Request('http://localhost/api/reports/bulletins?studentId=stu-001&academicYearId=ay-001&trimestre=1');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.school.name).toBe('CFP-PAS de Gao (Agro-Pastorale)');
    expect(data.student.firstName).toBe('Boubacar');
    expect(data.subjectResults).toHaveLength(2);
    expect(data.summary.totalCoeff).toBe(7); // 3 + 4
  });

  it('Calcule correctement la moyenne sur /20 (14 Biologie coeff 3, 11 Maths coeff 4)', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(ADMIN_SESSION as any);
    vi.mocked(prisma.student.findFirst).mockResolvedValueOnce(MOCK_STUDENT as any);
    vi.mocked(prisma.grade.findMany).mockResolvedValue(MOCK_GRADES_SCALE20 as any);
    vi.mocked(prisma.enrollment.findFirst).mockResolvedValueOnce(MOCK_ENROLLMENT as any);
    vi.mocked(prisma.school.findUnique).mockResolvedValueOnce(MOCK_SCHOOL_SCALE20 as any);
    vi.mocked(prisma.enrollment.findMany).mockResolvedValueOnce([{ studentId: 'stu-001' }] as any);

    const req = new Request('http://localhost/api/reports/bulletins?studentId=stu-001&academicYearId=ay-001&trimestre=1');
    const res = await GET(req);
    const data = await res.json();

    // avg_bio = 14/20 * 20 = 14, weighted = 14 * 3 = 42
    // avg_math = 11/20 * 20 = 11, weighted = 11 * 4 = 44
    // générale = (42 + 44) / 7 = 86 / 7 ≈ 12.29
    const expectedAvg = Math.round(((14 * 3 + 11 * 4) / 7) * 100) / 100;
    expect(data.summary.generalAverage).toBeCloseTo(expectedAvg, 1);
  });

  it('La mention générale est correcte (Passable pour ~12.29)', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(ADMIN_SESSION as any);
    vi.mocked(prisma.student.findFirst).mockResolvedValueOnce(MOCK_STUDENT as any);
    vi.mocked(prisma.grade.findMany).mockResolvedValue(MOCK_GRADES_SCALE20 as any);
    vi.mocked(prisma.enrollment.findFirst).mockResolvedValueOnce(MOCK_ENROLLMENT as any);
    vi.mocked(prisma.school.findUnique).mockResolvedValueOnce(MOCK_SCHOOL_SCALE20 as any);
    vi.mocked(prisma.enrollment.findMany).mockResolvedValueOnce([{ studentId: 'stu-001' }] as any);

    const req = new Request('http://localhost/api/reports/bulletins?studentId=stu-001&academicYearId=ay-001');
    const res = await GET(req);
    const data = await res.json();
    // 12.29/20 ≈ 61% → Assez Bien
    expect(['Assez Bien', 'Passable']).toContain(data.summary.generalMention);
  });

  it('Le trimestre 1 est le défaut si non précisé', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(ADMIN_SESSION as any);
    vi.mocked(prisma.student.findFirst).mockResolvedValueOnce(MOCK_STUDENT as any);
    vi.mocked(prisma.grade.findMany).mockResolvedValue(MOCK_GRADES_SCALE20 as any);
    vi.mocked(prisma.enrollment.findFirst).mockResolvedValueOnce(MOCK_ENROLLMENT as any);
    vi.mocked(prisma.school.findUnique).mockResolvedValueOnce(MOCK_SCHOOL_SCALE20 as any);
    vi.mocked(prisma.enrollment.findMany).mockResolvedValueOnce([{ studentId: 'stu-001' }] as any);

    const req = new Request('http://localhost/api/reports/bulletins?studentId=stu-001&academicYearId=ay-001');
    const res = await GET(req);
    const data = await res.json();
    expect(data.trimestre).toBe(1);
  });

  it('Retourne l\'infos de l\'école (nom, motto, logo)', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(ADMIN_SESSION as any);
    vi.mocked(prisma.student.findFirst).mockResolvedValueOnce(MOCK_STUDENT as any);
    vi.mocked(prisma.grade.findMany).mockResolvedValue(MOCK_GRADES_SCALE20 as any);
    vi.mocked(prisma.enrollment.findFirst).mockResolvedValueOnce(MOCK_ENROLLMENT as any);
    vi.mocked(prisma.school.findUnique).mockResolvedValueOnce(MOCK_SCHOOL_SCALE20 as any);
    vi.mocked(prisma.enrollment.findMany).mockResolvedValueOnce([{ studentId: 'stu-001' }] as any);

    const req = new Request('http://localhost/api/reports/bulletins?studentId=stu-001&academicYearId=ay-001');
    const res = await GET(req);
    const data = await res.json();
    expect(data.school.name).toContain('CFP-PAS');
    expect(data.school.logoUrl).toBeTruthy();
  });
});

describe('GET /api/reports/bulletins — Barème /100 (Multi-tenant CFPPAS)', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  const MOCK_SCHOOL_SCALE100 = { ...MOCK_SCHOOL_SCALE20, gradingScale: 100 };

  const MOCK_GRADES_SCALE100 = [
    {
      score: 72, maxScore: 100, examType: 'FINAL', trimestre: 1, comment: null,
      subject: { name: 'Biologie', code: 'BIO', coefficient: 3 }
    },
    {
      score: 55, maxScore: 100, examType: 'FINAL', trimestre: 1, comment: null,
      subject: { name: 'Agropastorale', code: 'AGR', coefficient: 4 }
    },
  ];

  it('Les notes sont ramenées sur /100 et la moyenne est cohérente', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(ADMIN_SESSION as any);
    vi.mocked(prisma.student.findFirst).mockResolvedValueOnce(MOCK_STUDENT as any);
    vi.mocked(prisma.grade.findMany).mockResolvedValue(MOCK_GRADES_SCALE100 as any);
    vi.mocked(prisma.enrollment.findFirst).mockResolvedValueOnce(MOCK_ENROLLMENT as any);
    vi.mocked(prisma.school.findUnique).mockResolvedValueOnce(MOCK_SCHOOL_SCALE100 as any);
    vi.mocked(prisma.enrollment.findMany).mockResolvedValueOnce([{ studentId: 'stu-001' }] as any);

    const req = new Request('http://localhost/api/reports/bulletins?studentId=stu-001&academicYearId=ay-001');
    const res = await GET(req);
    const data = await res.json();

    // avg_bio = (72/100)*100 = 72, weighted = 72 * 3 = 216
    // avg_agr = (55/100)*100 = 55, weighted = 55 * 4 = 220
    // générale = (216 + 220) / 7 ≈ 62.29
    expect(data.summary.generalAverage).toBeCloseTo(62.29, 0);
    expect(data.summary.generalMention).toBe('Assez Bien'); // 62.29/100 ≥ 60%
  });

  it('Les matières ont le bon maxScore selon le barème de l\'école', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(ADMIN_SESSION as any);
    vi.mocked(prisma.student.findFirst).mockResolvedValueOnce(MOCK_STUDENT as any);
    vi.mocked(prisma.grade.findMany).mockResolvedValue(MOCK_GRADES_SCALE100 as any);
    vi.mocked(prisma.enrollment.findFirst).mockResolvedValueOnce(MOCK_ENROLLMENT as any);
    vi.mocked(prisma.school.findUnique).mockResolvedValueOnce(MOCK_SCHOOL_SCALE100 as any);
    vi.mocked(prisma.enrollment.findMany).mockResolvedValueOnce([{ studentId: 'stu-001' }] as any);

    const req = new Request('http://localhost/api/reports/bulletins?studentId=stu-001&academicYearId=ay-001');
    const res = await GET(req);
    const data = await res.json();

    data.subjectResults.forEach((sr: any) => {
      expect(sr.maxScore).toBe(100);
    });
  });
});
