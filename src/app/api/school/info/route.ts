import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const host = request.headers.get('host') || '';
  const isLocal = host.includes('localhost');
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';
  
  const subdomain = isLocal 
    ? (host !== 'localhost:3000' ? host.split('.')[0] : null)
    : (host !== rootDomain ? host.replace(`.${rootDomain}`, '') : null);

  if (!subdomain || subdomain === 'www') {
    return NextResponse.json({ isMain: true });
  }

  try {
    const school = await prisma.school.findFirst({
      where: { OR: [{ subdomain }, { customDomain: host }] },
      select: {
        name: true,
        logoUrl: true,
        motto: true,
        address: true,
        city: true
      }
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    return NextResponse.json(school);
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
