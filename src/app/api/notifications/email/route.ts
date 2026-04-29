import { NextResponse } from 'next/server';
import { sendInvoiceNotification, sendAbsenceAlert } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, parentEmail, studentName, amount, dueDate, date } = body;

    if (!parentEmail || !studentName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let result;

    if (type === 'INVOICE') {
      result = await sendInvoiceNotification(
        parentEmail, 
        studentName, 
        amount || 0, 
        dueDate || new Date().toLocaleDateString('fr-FR')
      );
    } else if (type === 'ABSENCE') {
      result = await sendAbsenceAlert(
        parentEmail, 
        studentName, 
        date || new Date().toLocaleDateString('fr-FR')
      );
    } else {
      return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
    }

    if (result.success) {
      return NextResponse.json({ message: 'Email sent successfully', mock: result.mock });
    } else {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

  } catch (error) {
    console.error('Email API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
