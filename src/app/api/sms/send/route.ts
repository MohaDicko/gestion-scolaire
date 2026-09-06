import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { sendSMS } from '@/lib/sms';

export async function POST(request: Request) {
  const session = await getSession();
  
  if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'SCHOOL_ADMIN' && session.role !== 'HR_MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { to, message } = body;

    if (!to || !message) {
      return NextResponse.json({ error: 'Numéro et message requis' }, { status: 400 });
    }

    const result = await sendSMS({ to, message });

    if (result.success) {
      return NextResponse.json({ message: 'SMS envoyé avec succès', messageId: result.messageId });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
