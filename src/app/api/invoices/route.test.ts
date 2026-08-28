/**
 * ================================================================
 * TESTS D'INTÉGRATION — API Facturation (/api/invoices)
 * CFP-PAS de Gao — Frais de scolarité 200 000 FCFA, virement bancaire
 * ================================================================
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    invoice: { findMany: vi.fn(), create: vi.fn() },
    student: { findFirst: vi.fn() },
  }
}));

vi.mock('@/lib/auth', () => ({
  getSession: vi.fn()
}));

vi.mock('@/lib/audit', () => ({
  logAudit: vi.fn()
}));

const CFPPAS_TENANT_ID = '6220c072-a3ca-4eaa-9c24-ccc9b20e3a91';

const ACCOUNTANT_SESSION = {
  id: 'user-compta-1',
  tenantId: CFPPAS_TENANT_ID,
  role: 'ACCOUNTANT',
  email: 'compta@cfppas-gao.ml',
};

const ADMIN_SESSION = {
  id: 'user-admin-1',
  tenantId: CFPPAS_TENANT_ID,
  role: 'SCHOOL_ADMIN',
  email: 'admin@cfppas-gao.ml',
};

const TEACHER_SESSION = {
  id: 'user-prof-1',
  tenantId: CFPPAS_TENANT_ID,
  role: 'TEACHER',
  email: 'prof@cfppas-gao.ml',
};

const MOCK_INVOICE = {
  id: 'inv-001',
  tenantId: CFPPAS_TENANT_ID,
  invoiceNumber: 'INV-2026-123456',
  studentId: 'stu-001',
  title: 'Frais de scolarité 2025-2026',
  type: 'TUITION',
  amount: 200000,
  status: 'UNPAID',
  dueDate: new Date('2026-01-31'),
  paymentMethod: 'VIREMENT',
  createdAt: new Date(),
  student: {
    firstName: 'Boubacar',
    lastName: 'Abdoulaye',
    studentNumber: 'RC17PB25G151M',
  },
};

// ─────────────────────────────────────────────
// GET /api/invoices
// ─────────────────────────────────────────────
describe('GET /api/invoices — Liste des factures', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('Retourne 401 si non authentifié', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(null);
    const req = new Request('http://localhost/api/invoices');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('Retourne toutes les factures du tenant', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(ADMIN_SESSION as any);
    vi.mocked(prisma.invoice.findMany).mockResolvedValueOnce([MOCK_INVOICE] as any);

    const req = new Request('http://localhost/api/invoices');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(1);
    expect(data[0].amount).toBe(200000);
    expect(data[0].paymentMethod).toBe('VIREMENT');
  });

  it('Filtre par studentId', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(ADMIN_SESSION as any);
    vi.mocked(prisma.invoice.findMany).mockResolvedValueOnce([MOCK_INVOICE] as any);

    const req = new Request('http://localhost/api/invoices?studentId=stu-001');
    await GET(req);

    expect(vi.mocked(prisma.invoice.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ studentId: 'stu-001' })
      })
    );
  });

  it('L\'isolation multi-tenant est appliquée (where.tenantId)', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(ADMIN_SESSION as any);
    vi.mocked(prisma.invoice.findMany).mockResolvedValueOnce([] as any);

    const req = new Request('http://localhost/api/invoices');
    await GET(req);

    expect(vi.mocked(prisma.invoice.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: CFPPAS_TENANT_ID })
      })
    );
  });

  it('Inclut les informations de l\'élève dans la réponse', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(ADMIN_SESSION as any);
    vi.mocked(prisma.invoice.findMany).mockResolvedValueOnce([MOCK_INVOICE] as any);

    const req = new Request('http://localhost/api/invoices');
    const res = await GET(req);
    const data = await res.json();

    expect(data[0].student.firstName).toBe('Boubacar');
    expect(data[0].student.studentNumber).toBe('RC17PB25G151M');
  });
});

// ─────────────────────────────────────────────
// POST /api/invoices — Création de facture
// ─────────────────────────────────────────────
describe('POST /api/invoices — Émission d\'une facture', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  const invoiceBody = {
    studentId: 'stu-001',
    title: 'Frais de scolarité 2025-2026',
    amount: 200000,
    dueDate: '2026-01-31',
    type: 'TUITION',
    paymentMethod: 'VIREMENT',
  };

  it('Retourne 401 si non authentifié', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(null);
    const req = new Request('http://localhost/api/invoices', {
      method: 'POST',
      body: JSON.stringify(invoiceBody),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('Retourne 403 si l\'utilisateur est un enseignant (droits insuffisants)', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(TEACHER_SESSION as any);
    const req = new Request('http://localhost/api/invoices', {
      method: 'POST',
      body: JSON.stringify(invoiceBody),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain('droits insuffisants');
  });

  it('Retourne 400 si les champs obligatoires sont manquants', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(ACCOUNTANT_SESSION as any);
    const req = new Request('http://localhost/api/invoices', {
      method: 'POST',
      body: JSON.stringify({ studentId: 'stu-001' }), // amount, dueDate, title manquants
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('Retourne 400 si le montant est nul ou négatif', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(ACCOUNTANT_SESSION as any);
    const req = new Request('http://localhost/api/invoices', {
      method: 'POST',
      body: JSON.stringify({ ...invoiceBody, amount: -500 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Montant invalide');
  });

  it('Retourne 400 si le montant n\'est pas un nombre', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(ACCOUNTANT_SESSION as any);
    const req = new Request('http://localhost/api/invoices', {
      method: 'POST',
      body: JSON.stringify({ ...invoiceBody, amount: 'DEUX_CENT_MILLE' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('Retourne 403 si l\'élève n\'appartient pas au tenant', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(ACCOUNTANT_SESSION as any);
    vi.mocked(prisma.student.findFirst).mockResolvedValueOnce(null); // élève inexistant
    const req = new Request('http://localhost/api/invoices', {
      method: 'POST',
      body: JSON.stringify(invoiceBody),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain('introuvable');
  });

  it('Crée une facture CFPPAS de 200 000 FCFA par virement et retourne 201', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(ACCOUNTANT_SESSION as any);
    vi.mocked(prisma.student.findFirst).mockResolvedValueOnce({ id: 'stu-001' } as any);
    vi.mocked(prisma.invoice.create).mockResolvedValueOnce(MOCK_INVOICE as any);

    const req = new Request('http://localhost/api/invoices', {
      method: 'POST',
      body: JSON.stringify(invoiceBody),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.amount).toBe(200000);
    expect(data.paymentMethod).toBe('VIREMENT');
  });

  it('Un numéro de facture unique (INV-YYYY-XXXXXX) est générée automatiquement', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(ACCOUNTANT_SESSION as any);
    vi.mocked(prisma.student.findFirst).mockResolvedValueOnce({ id: 'stu-001' } as any);
    vi.mocked(prisma.invoice.create).mockResolvedValueOnce(MOCK_INVOICE as any);

    const req = new Request('http://localhost/api/invoices', {
      method: 'POST',
      body: JSON.stringify(invoiceBody),
    });
    await POST(req);

    const createCall = vi.mocked(prisma.invoice.create).mock.calls[0][0];
    expect(createCall.data.invoiceNumber).toMatch(/^INV-\d{4}-\d{6}$/);
  });

  it('La méthode de paiement par défaut est ESPECES si non précisée', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(ACCOUNTANT_SESSION as any);
    vi.mocked(prisma.student.findFirst).mockResolvedValueOnce({ id: 'stu-001' } as any);
    vi.mocked(prisma.invoice.create).mockResolvedValueOnce({ ...MOCK_INVOICE, paymentMethod: 'ESPECES' } as any);

    const req = new Request('http://localhost/api/invoices', {
      method: 'POST',
      body: JSON.stringify({ ...invoiceBody, paymentMethod: undefined }),
    });
    await POST(req);

    const createCall = vi.mocked(prisma.invoice.create).mock.calls[0][0];
    expect(createCall.data.paymentMethod).toBe('ESPECES');
  });

  it('Le statut par défaut est UNPAID', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(ACCOUNTANT_SESSION as any);
    vi.mocked(prisma.student.findFirst).mockResolvedValueOnce({ id: 'stu-001' } as any);
    vi.mocked(prisma.invoice.create).mockResolvedValueOnce(MOCK_INVOICE as any);

    const req = new Request('http://localhost/api/invoices', {
      method: 'POST',
      body: JSON.stringify({ ...invoiceBody, status: undefined }),
    });
    await POST(req);

    const createCall = vi.mocked(prisma.invoice.create).mock.calls[0][0];
    expect(createCall.data.status).toBe('UNPAID');
  });

  it('Un comptable peut créer une facture (ACCOUNTANT autorisé)', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(ACCOUNTANT_SESSION as any);
    vi.mocked(prisma.student.findFirst).mockResolvedValueOnce({ id: 'stu-001' } as any);
    vi.mocked(prisma.invoice.create).mockResolvedValueOnce(MOCK_INVOICE as any);

    const req = new Request('http://localhost/api/invoices', {
      method: 'POST',
      body: JSON.stringify(invoiceBody),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });
});
