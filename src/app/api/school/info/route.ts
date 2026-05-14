import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const host = request.headers.get('host') || '';
  const isLocal = host.includes('localhost');
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';
  
  const subdomain = isLocal 
    ? (host !== 'localhost:3000' ? host.split('.')[0] : null)
    : (host !== rootDomain && !host.includes('vercel.app') ? host.replace(`.${rootDomain}`, '') : null);

  if (!subdomain || subdomain === 'www') {
    // En production, si on est sur le domaine principal ou Vercel, on peut retourner la première école par défaut
    // ou marquer comme site principal. Ici, on va chercher l'école par défaut pour le branding.
    const defaultSchool = await prisma.school.findFirst({
      select: { name: true, logoUrl: true, motto: true, address: true, city: true }
    });
    return NextResponse.json(defaultSchool || { isMain: true });
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
      // Fallback de sécurité : retourner la première école trouvée
      const fallbackSchool = await prisma.school.findFirst({
        select: { name: true, logoUrl: true, motto: true, address: true, city: true }
      });
      return NextResponse.json(fallbackSchool || { error: 'School not found' }, { status: fallbackSchool ? 200 : 404 });
    }

    return NextResponse.json(school);
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
