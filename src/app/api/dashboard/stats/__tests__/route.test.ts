import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redis } from '@/lib/redis';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    student: { count: vi.fn().mockResolvedValue(10) },
    employee: { count: vi.fn().mockResolvedValue(5) },
    classroom: { count: vi.fn().mockResolvedValue(3) },
    subject: { count: vi.fn().mockResolvedValue(8) },
    timetable: { count: vi.fn().mockResolvedValue(2) },
    invoice: { aggregate: vi.fn().mockResolvedValue({ _sum: { amount: 1000 } }) }
  }
}));

vi.mock('@/lib/auth', () => ({
  getSession: vi.fn()
}));

vi.mock('@/lib/redis', () => ({
  redis: {
    get: vi.fn(),
    set: vi.fn()
  }
}));

describe('Dashboard Stats API (GET)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if unauthorized', async () => {
    (getSession as any).mockResolvedValue(null);
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it('should return cached data if available in redis', async () => {
    (getSession as any).mockResolvedValue({ tenantId: 'tenant-1' });
    
    const cachedStats = { studentsCount: 100 };
    (redis?.get as any).mockResolvedValue(cachedStats);
    
    const response = await GET();
    const data = await response.json();
    
    expect(redis?.get).toHaveBeenCalledWith('dashboard_stats_tenant-1');
    expect(data).toEqual(cachedStats);
    // Prisma shouldn't be called if cache hits
    expect(prisma.student.count).not.toHaveBeenCalled();
  });

  it('should fetch from DB and cache if redis is empty', async () => {
    (getSession as any).mockResolvedValue({ tenantId: 'tenant-1' });
    (redis?.get as any).mockResolvedValue(null); // cache miss
    
    const response = await GET();
    const data = await response.json();
    
    expect(prisma.student.count).toHaveBeenCalled();
    expect(redis?.set).toHaveBeenCalledWith(
      'dashboard_stats_tenant-1',
      expect.any(Object),
      { ex: 300 }
    );
    expect(data.studentsCount).toBe(10);
  });
});
