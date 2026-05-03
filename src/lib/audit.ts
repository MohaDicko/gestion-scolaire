import { prisma } from './prisma';
import { getSession } from './auth';

export type AuditAction = 
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'EXPORT' 
  | 'APPROVE' 
  | 'REJECT';

interface AuditLogOptions {
  action: AuditAction;
  entityType: string;
  entityId: string;
  description?: string;
  oldValues?: any;
  newValues?: any;
  request?: Request; // Optionally pass request to extract IP/UserAgent
}

/**
 * Log an action to the AuditTrail (Enterprise Feature)
 */
export async function logAudit(options: AuditLogOptions) {
  try {
    const session = await getSession();
    if (!session?.tenantId) return; // Cannot log without a tenant context

    let ipAddress = 'unknown';
    let userAgent = 'unknown';

    if (options.request) {
      ipAddress = options.request.headers.get('x-forwarded-for') || 'unknown';
      userAgent = options.request.headers.get('user-agent') || 'unknown';
    }

    await prisma.auditLog.create({
      data: {
        tenantId: session.tenantId,
        userId: session.id || null,
        userRole: session.role || 'UNKNOWN',
        userEmail: session.email || 'SYSTEM',
        action: options.action,
        entityType: options.entityType,
        entityId: options.entityId,
        oldValues: options.oldValues ? JSON.parse(JSON.stringify(options.oldValues)) : null,
        newValues: options.newValues ? JSON.parse(JSON.stringify(options.newValues)) : null,
        description: options.description,
        ipAddress,
        userAgent,
      }
    });
  } catch (error) {
    console.error('Audit Log Error:', error);
    // We intentionally don't throw here so that audit logging failure 
    // doesn't block the main application flow, but it should be monitored.
  }
}
