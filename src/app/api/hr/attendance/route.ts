import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const dateStr = url.searchParams.get('date');

  try {
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    
    const employees = await prisma.employee.findMany({
      where: { isActive: true },
      include: {
        department: true,
        StaffAttendance: {
          where: {
            date: {
              gte: new Date(targetDate.setHours(0, 0, 0, 0)),
              lte: new Date(targetDate.setHours(23, 59, 59, 999))
            }
          }
        }
      }
    });

    const result = employees.map(emp => ({
      id: emp.id,
      name: `${emp.firstName} ${emp.lastName}`,
      department: emp.department?.name,
      status: emp.StaffAttendance[0]?.status || 'PRESENT',
      checkIn: emp.StaffAttendance[0]?.checkIn || '',
      checkOut: emp.StaffAttendance[0]?.checkOut || ''
    }));

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { date, records } = await request.json();
    const targetDate = new Date(date);

    await Promise.all(records.map(async (rec: any) => {
      const existing = await prisma.staffAttendance.findFirst({
        where: {
          employeeId: rec.id,
          date: {
            gte: new Date(targetDate.setHours(0, 0, 0, 0)),
            lte: new Date(targetDate.setHours(23, 59, 59, 999))
          }
        }
      });

      if (existing) {
        return prisma.staffAttendance.update({
          where: { id: existing.id },
          data: { status: rec.status, checkIn: rec.checkIn, checkOut: rec.checkOut }
        });
      } else {
        return prisma.staffAttendance.create({
          data: {
            tenantId: '1',
            employeeId: rec.id,
            date: targetDate,
            status: rec.status,
            checkIn: rec.checkIn,
            checkOut: rec.checkOut
          }
        });
      }
    }));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
