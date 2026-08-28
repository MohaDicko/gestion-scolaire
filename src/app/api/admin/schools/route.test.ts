/**
 * ================================================================
 * TESTS D'INTÉGRATION — API Administration Multi-Tenant
 * /api/admin/schools — Création et gestion des établissements
 * ================================================================
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    school: { findMany: vi.fn(), create: vi.fn() },
    student: { count: vi.fn() },
    employee: { count: vi.fn() },
    invoice: { groupBy: vi.fn() },
    user: { create: vi.fn() },
    $transaction: vi.fn(),
  }
}));

vi.mock('@/lib/auth', () => ({
  getSession: vi.fn()
}));

vi.mock('@/lib/audit', () => ({
  logAudit: vi.fn()
}));

vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true })
}));

const SUPER_ADMIN_SESSION = {
  id: 'super-admin-1',
  tenantId: null,
  role: 'SUPER_ADMIN',
  email: 'superadmin@schoolerp.pro',
};

const CFPPAS_SCHOOL = {
  id: '6220c072-a3ca-4eaa-9c24-ccc9b20e3a91',
  name: 'CFP-PAS de Gao (Agro-Pastorale)',
  code: 'CFPPAS',
  type: 'AGRO',
  email: 'contact@cfppas-gao.ml',
  plan: 'FREE',
  gradingScale: 20,
  defaultPaymentMethod: 'VIREMENT',
  defaultTuition: 200000,
  campuses: [{ id: 'campus-1', _count: { students: 131, classrooms: 8 } }],
  _count: { campuses: 1, academicYears: 1 },
  academicYears: [{ name: '2025-2026' }],
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ─────────────────────────────────────────────
// GET /api/admin/schools — Accès Super Admin
// ─────────────────────────────────────────────
describe('GET /api/admin/schools — Liste des établissements (Super Admin)', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('Retourne 403 si l\'utilisateur n\'est pas SUPER_ADMIN', async () => {
    vi.mocked(getSession).mockResolvedValueOnce({ id: 'u1', role: 'SCHOOL_ADMIN' } as any);
    const res = await GET();
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain('Super Administrateur');
  });

  it('Retourne 403 si non authentifié', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(null);
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it('Retourne la liste enrichie des établissements pour SUPER_ADMIN', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(SUPER_ADMIN_SESSION as any);
    vi.mocked(prisma.school.findMany).mockResolvedValueOnce([CFPPAS_SCHOOL] as any);
    vi.mocked(prisma.student.count).mockResolvedValueOnce(131);
    vi.mocked(prisma.employee.count).mockResolvedValueOnce(12);
    vi.mocked(prisma.invoice.groupBy).mockResolvedValueOnce([
      { status: 'PAID', _sum: { amount: 15_000_000 }, _count: 75 },
      { status: 'PENDING', _sum: { amount: 11_200_000 }, _count: 56 },
    ] as any);

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data[0].name).toBe('CFP-PAS de Gao (Agro-Pastorale)');
    expect(data[0].stats).toBeDefined();
    expect(data[0].stats.studentCount).toBe(131);
    expect(data[0].stats.employeeCount).toBe(12);
  });

  it('Calcule le taux de collecte correctement', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(SUPER_ADMIN_SESSION as any);
    vi.mocked(prisma.school.findMany).mockResolvedValueOnce([CFPPAS_SCHOOL] as any);
    vi.mocked(prisma.student.count).mockResolvedValueOnce(131);
    vi.mocked(prisma.employee.count).mockResolvedValueOnce(12);
    vi.mocked(prisma.invoice.groupBy).mockResolvedValueOnce([
      { status: 'PAID', _sum: { amount: 10_000_000 }, _count: 50 },
      { status: 'PENDING', _sum: { amount: 10_000_000 }, _count: 50 },
    ] as any);

    const res = await GET();
    const data = await res.json();
    // 10M payé sur 20M total → 50%
    expect(data[0].stats.collectionRate).toBe(50);
  });
});

// ─────────────────────────────────────────────
// POST /api/admin/schools — Création d'un tenant
// ─────────────────────────────────────────────
describe('POST /api/admin/schools — Création d\'un nouveau tenant', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  const newSchoolBody = {
    name: 'Lycée Technique de Bamako',
    code: 'LTB',
    type: 'LYCEE',
    email: 'contact@ltb.ml',
    phoneNumber: '+223 20 22 00 00',
    address: 'Rue 200, Hippodrome',
    city: 'Bamako',
    country: 'Mali',
    plan: 'STARTER',
    adminEmail: 'admin@ltb.ml',
    adminPassword: 'LtbBamako2026!',
    adminFirstName: 'Mamadou',
    adminLastName: 'Coulibaly',
  };

  it('Retourne 403 si non SUPER_ADMIN', async () => {
    vi.mocked(getSession).mockResolvedValueOnce({ id: 'u1', role: 'SCHOOL_ADMIN' } as any);
    const req = new Request('http://localhost/api/admin/schools', {
      method: 'POST',
      body: JSON.stringify(newSchoolBody),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('Retourne 400 si les champs obligatoires sont absents', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(SUPER_ADMIN_SESSION as any);
    const req = new Request('http://localhost/api/admin/schools', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test' }), // code, type, adminEmail manquants
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('Crée une école et un admin et retourne 201', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(SUPER_ADMIN_SESSION as any);
    const createdSchool = { id: 'new-school-id', ...newSchoolBody };
    vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn: any) => fn({
      school: { create: vi.fn().mockResolvedValueOnce(createdSchool) },
      user: { create: vi.fn().mockResolvedValueOnce({}) },
    }));

    const req = new Request('http://localhost/api/admin/schools', {
      method: 'POST',
      body: JSON.stringify(newSchoolBody),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('Retourne 400 si le code d\'établissement existe déjà (contrainte Prisma P2002)', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(SUPER_ADMIN_SESSION as any);
    const prismaUniqueError = Object.assign(new Error('Unique constraint failed'), { code: 'P2002' });
    vi.mocked(prisma.$transaction).mockRejectedValueOnce(prismaUniqueError);

    const req = new Request('http://localhost/api/admin/schools', {
      method: 'POST',
      body: JSON.stringify(newSchoolBody),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('existe déjà');
  });

  it('La transaction est atomique (école + admin créés ensemble)', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(SUPER_ADMIN_SESSION as any);
    const txFn = vi.fn().mockResolvedValueOnce({ id: 'new-school-id', name: newSchoolBody.name });
    vi.mocked(prisma.$transaction).mockImplementationOnce(txFn);

    const req = new Request('http://localhost/api/admin/schools', {
      method: 'POST',
      body: JSON.stringify(newSchoolBody),
    });
    await POST(req);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });
});
