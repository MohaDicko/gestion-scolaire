import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const dateStr = url.searchParams.get('date');

  try {
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const employees = await prisma.employee.findMany({
      where: { 
        tenantId: session.tenantId,
        isActive: true 
      },
      include: {
        department: true,
        StaffAttendance: {
          where: {
            date: {
              gte: startOfDay,
              lte: endOfDay
            }
          }
        }
      }
    });

    const result = employees.map(emp => ({
      id: emp.id,
      name: `${emp.firstName} ${emp.lastName}`,
      employeeNumber: emp.employeeNumber,
      department: emp.department?.name,
      status: emp.StaffAttendance[0]?.status || 'PRESENT',
      checkIn: emp.StaffAttendance[0]?.checkIn || '',
      checkOut: emp.StaffAttendance[0]?.checkOut || ''
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('[STAFF ATTENDANCE GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { date, records } = await request.json();
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    await Promise.all(records.map(async (rec: any) => {
      // Security check: ensure employee belongs to tenant
      const employee = await prisma.employee.findFirst({
          where: { id: rec.id, tenantId: session.tenantId }
      });
      if (!employee) return;

      const existing = await prisma.staffAttendance.findFirst({
        where: {
          employeeId: rec.id,
          date: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      });

      if (existing) {
        return prisma.staffAttendance.update({
          where: { id: existing.id },
          data: { 
              status: rec.status, 
              checkIn: rec.checkIn || null, 
              checkOut: rec.checkOut || null 
          }
        });
      } else {
        return prisma.staffAttendance.create({
          data: {
            tenantId: session.tenantId,
            employeeId: rec.id,
            date: targetDate,
            status: rec.status,
            checkIn: rec.checkIn || null,
            checkOut: rec.checkOut || null
          }
        });
      }
    }));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[STAFF ATTENDANCE POST]', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
