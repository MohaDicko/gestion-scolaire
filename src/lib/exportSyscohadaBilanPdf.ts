import jsPDF from 'jspdf';
import 'jspdf-autotable';

export interface SyscohadaActifRow {
  ref: string;
  label: string;
  brutN: number | null;
  netN: number;
  netN1: number;
  isTotal?: boolean;
}

export interface SyscohadaPassifRow {
  ref: string;
  label: string;
  netN: number | null;
  netN1: number | null;
  isTotal?: boolean;
}

export interface SyscohadaBilanData {
  schoolName: string;
  sigle: string;
  address: string;
  phone: string;
  nif: string;
  year: number;
  durationMonths: number;
  actif: SyscohadaActifRow[];
  passif: SyscohadaPassifRow[];
  totals?: {
    actifBrut?: number;
    actifNet?: number;
    passifNet?: number;
    solvabilite?: string;
    tresorerie?: number;
  };
}

export function generateSyscohadaBilanPdf(data: SyscohadaBilanData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const drawHeader = (pageTitle: string, pageNum: string, pageTopNum: string) => {
    // Numéro de page officiel centré en haut (- 8 - ou - 9 -)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`- ${pageTopNum} -`, pageW / 2, 12, { align: 'center' });

    // Cartouche officiel en haut à droite
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.4);
    doc.rect(pageW - 68, 14, 54, 12);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('BILAN SYSTEME ALLEGE', pageW - 41, 19, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text(`PAGE ${pageNum}`, pageW - 41, 23.5, { align: 'center' });

    // Titre centré
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text('BILAN', pageW / 2, 26, { align: 'center' });

    // Dénomination sociale
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Dénomination sociale de l\'entreprise :', 14, 34);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(data.schoolName.toUpperCase(), pageW / 2 + 5, 34, { align: 'center' });

    // Ligne sous le nom & Sigle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Sigle usuel :  ${data.sigle}`, pageW - 14, 38, { align: 'right' });

    // Adresse, NIF, Date de clôture
    doc.text(`Adresse :  ${data.address} - Cell: ${data.phone}`, 14, 43);

    doc.text(`N° d'identification fiscale :  ${data.nif}`, 14, 48);
    doc.text(`Exercice clos le : 31/12/${data.year}`, pageW / 2 - 10, 48);
    doc.text(`Durée ( en mois ) : ${data.durationMonths} mois`, pageW - 14, 48, { align: 'right' });

    doc.setDrawColor(200, 200, 200);
    doc.line(14, 51, pageW - 14, 51);
  };

  // ═════════════════════════════════════════════════════════════════════
  // PAGE 1 : ACTIF (Emplois & Patrimoine)
  // ═════════════════════════════════════════════════════════════════════
  drawHeader('ACTIF', '1/2', '8');

  const actifTableBody = data.actif.map(row => [
    row.ref,
    row.label,
    row.brutN !== null ? row.brutN.toLocaleString('fr-FR') : '',
    row.netN !== null && row.netN !== undefined ? row.netN.toLocaleString('fr-FR') : '',
    row.netN1 !== null && row.netN1 !== undefined ? row.netN1.toLocaleString('fr-FR') : ''
  ]);

  (doc as any).autoTable({
    startY: 53,
    head: [
      [
        { content: 'Réf.', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'ACTIF', rowSpan: 2, styles: { halign: 'left', valign: 'middle' } },
        { content: `Exercice ${data.year}`, colSpan: 2, styles: { halign: 'center' } },
        { content: `Exercice ${data.year - 1}`, rowSpan: 2, styles: { halign: 'center', valign: 'middle' } }
      ],
      [
        { content: 'Brut 01', styles: { halign: 'right' } },
        { content: 'Net 02', styles: { halign: 'right' } },
        { content: 'Net 03', styles: { halign: 'right' } }
      ]
    ],
    body: actifTableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [248, 250, 252],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      lineWidth: 0.2,
      lineColor: [30, 41, 59],
      fontSize: 8
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [15, 23, 42],
      lineWidth: 0.15,
      lineColor: [148, 163, 184]
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 86, halign: 'left' },
      2: { cellWidth: 28, halign: 'right' },
      3: { cellWidth: 28, halign: 'right' },
      4: { cellWidth: 28, halign: 'right' }
    },
    didParseCell: (hookData: any) => {
      const rowIndex = hookData.row.index;
      const rowItem = data.actif[rowIndex];
      if (rowItem?.isTotal) {
        hookData.cell.styles.fillColor = [226, 232, 240];
        hookData.cell.styles.fontStyle = 'bold';
      }
    }
  });

  // ═════════════════════════════════════════════════════════════════════
  // PAGE 2 : PASSIF (Ressources & Capitaux)
  // ═════════════════════════════════════════════════════════════════════
  doc.addPage();
  drawHeader('PASSIF', '2/2', '9');

  const passifTableBody = data.passif.map(row => [
    row.ref,
    row.label,
    row.netN !== null && row.netN !== undefined ? row.netN.toLocaleString('fr-FR') : '',
    row.netN1 !== null && row.netN1 !== undefined ? row.netN1.toLocaleString('fr-FR') : ''
  ]);

  (doc as any).autoTable({
    startY: 53,
    head: [
      [
        { content: 'Réf.', styles: { halign: 'center', valign: 'middle' } },
        { content: 'PASSIF', styles: { halign: 'left', valign: 'middle' } },
        { content: `Exercice ${data.year}\nNet 01`, styles: { halign: 'right' } },
        { content: `Exercice ${data.year - 1}\nNet 02`, styles: { halign: 'right' } }
      ]
    ],
    body: passifTableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [248, 250, 252],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      lineWidth: 0.2,
      lineColor: [30, 41, 59],
      fontSize: 8
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [15, 23, 42],
      lineWidth: 0.15,
      lineColor: [148, 163, 184]
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 114, halign: 'left' },
      2: { cellWidth: 28, halign: 'right' },
      3: { cellWidth: 28, halign: 'right' }
    },
    didParseCell: (hookData: any) => {
      const rowIndex = hookData.row.index;
      const rowItem = data.passif[rowIndex];
      if (rowItem?.isTotal) {
        hookData.cell.styles.fillColor = [226, 232, 240];
        hookData.cell.styles.fontStyle = 'bold';
      }
    }
  });

  const filename = `Bilan_SYSCOHADA_${data.sigle}_${data.year}.pdf`;
  doc.save(filename);
}
