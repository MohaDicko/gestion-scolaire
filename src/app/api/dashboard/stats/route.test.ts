import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    student: { count: vi.fn() },
    employee: { count: vi.fn() },
    invoice: { aggregate: vi.fn() },
  }
}));

vi.mock('@/lib/auth', () => ({
  getSession: vi.fn()
}));

describe('GET /api/dashboard/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 401 if tenantId is missing in session', async () => {
    vi.mocked(getSession).mockResolvedValueOnce({ id: 'user_1' } as any);

    const response = await GET();
    
    expect(response.status).toBe(401);
  });

  it('should return stats if user is authenticated with a tenantId', async () => {
    vi.mocked(getSession).mockResolvedValueOnce({ id: 'user_1', tenantId: 'tenant_1' } as any);
    
    vi.mocked(prisma.student.count).mockResolvedValueOnce(150);
    vi.mocked(prisma.employee.count).mockResolvedValueOnce(15);
    
    // Mock the first aggregate call (total invoices)
    vi.mocked(prisma.invoice.aggregate).mockResolvedValueOnce({
      _sum: { amount: 50000 }
    } as any);

    // Mock the second aggregate call (paid invoices)
    vi.mocked(prisma.invoice.aggregate).mockResolvedValueOnce({
      _sum: { amount: 25000 }
    } as any);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      studentsCount: 150,
      employeesCount: 15,
      invoicesTotal: 50000,
      invoicesPaid: 25000
    });
  });

  it('should handle database errors gracefully', async () => {
    vi.mocked(getSession).mockResolvedValueOnce({ id: 'user_1', tenantId: 'tenant_1' } as any);
    
    vi.mocked(prisma.student.count).mockRejectedValueOnce(new Error('DB Error'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal Server Error');
  });
});
