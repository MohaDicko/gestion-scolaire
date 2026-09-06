import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logAudit } from '../audit';
import { prisma } from '../prisma';
import { getSession } from '../auth';

// Mock dependencies
vi.mock('../prisma', () => ({
  prisma: {
    auditLog: {
      create: vi.fn().mockResolvedValue({ id: 'audit-1' }),
    },
  },
}));

vi.mock('../auth', () => ({
  getSession: vi.fn(),
}));

describe('logAudit function', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not log if there is no session tenantId', async () => {
    (getSession as any).mockResolvedValue(null);
    await logAudit({
      action: 'LOGIN',
      entityType: 'User',
      entityId: 'user-1'
    });
    
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });

  it('should create an audit log if session is valid', async () => {
    (getSession as any).mockResolvedValue({
      tenantId: 'tenant-1',
      id: 'user-1',
      role: 'SUPER_ADMIN',
      email: 'test@example.com'
    });

    await logAudit({
      action: 'UPDATE',
      entityType: 'Invoice',
      entityId: 'inv-123',
      oldValues: { amount: 100 },
      newValues: { amount: 200 }
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-1',
        userId: 'user-1',
        action: 'UPDATE',
        entityType: 'Invoice',
        entityId: 'inv-123',
        oldValues: { amount: 100 },
        newValues: { amount: 200 }
      })
    });
  });
});
