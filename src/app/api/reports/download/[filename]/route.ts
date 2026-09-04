import { NextResponse } from 'next/server';

export async function POST(req: Request, { params }: { params: { filename: string } }) {
  try {
    const formData = await req.formData();
    const base64 = formData.get('base64') as string;
    const filename = decodeURIComponent(params.filename) || 'document.pdf';

    if (!base64) {
      return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 });
    }

    // Extraction des données base64 (suppression du préfixe data:application/pdf;base64,)
    const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
    const buffer = Buffer.from(base64Data, 'base64');

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Erreur lors du téléchargement PDF:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
