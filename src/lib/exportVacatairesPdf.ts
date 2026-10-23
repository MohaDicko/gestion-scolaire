import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { DIRECTOR_STAMP_BASE64 } from './directorStampData';

export interface VacataireSummaryItem {
  number: number;
  id: string;
  name: string;
  employeeNumber?: string;
  subjects: string;
  classes: string;
  totalHours: number;
  absentHours?: number;
  hourlyRate: number;
  grossAmount: number;
  deductions: number;
  netAmount: number;
}

export function generateVacatairesEtatPdf(
  items: VacataireSummaryItem[],
  periodStart: string,
  periodEnd: string,
  schoolName: string = 'CFP-PAS de Gao (Agro-Pastorale)'
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // ── En-tête officiel CFPPAS ──
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'bold');
  doc.text('RÉPUBLIQUE DU MALI', 20, 15);
  doc.setFont('helvetica', 'normal');
  doc.text('Un Peuple - Un But - Une Foi', 20, 20);
  doc.text('MINISTÈRE DE L\'AGRICULTURE ET DE L\'ÉLEVAGE', 20, 25);
  doc.text('CENTRE DE FORMATION PROFESSIONNELLE AGRO-PASTORALE (CFP-PAS)', 20, 30);

  // Devise officielle (vue sur Photo 1)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(22, 163, 74); // Vert Agriculture CFPPAS
  doc.text('« DE L\'AGRICULTURE AU SAHEL »', pageWidth - 20, 18, { align: 'right' });
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text('Gao - Quartier Château, Route de Bourem', pageWidth - 20, 24, { align: 'right' });
  doc.text('Email: contact@cfppas-gao.ml | Tél: +223 70 12 34 56', pageWidth - 20, 29, { align: 'right' });

  // ── Titre du Document (conforme Photo 1) ──
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('ÉTAT DE PAIEMENT DES HONORAIRES DES PROFESSEURS VACATAIRES', pageWidth / 2, 42, { align: 'center' });

  // Période
  const dStart = new Date(periodStart).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const dEnd = new Date(periodEnd).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Période : Du ${dStart} au ${dEnd}`, pageWidth / 2, 48, { align: 'center' });

  // ── Données du Tableau (10 Colonnes conformes à la Photo 1) ──
  const tableRows = items.map((item, idx) => [
    (idx + 1).toString(),
    item.name,
    item.subjects || 'Modules Agro-Pastoraux',
    item.classes || '1ère A',
    `${item.totalHours} h`,
    `${item.hourlyRate.toLocaleString('fr-FR')} F`,
    `${item.grossAmount.toLocaleString('fr-FR')} F`,
    item.deductions > 0 ? `${item.deductions.toLocaleString('fr-FR')} F` : '0 F',
    `${item.netAmount.toLocaleString('fr-FR')} F`,
    '' // Colonne émargement manuscrit
  ]);

  const totalHours = items.reduce((sum, i) => sum + i.totalHours, 0);
  const totalGross = items.reduce((sum, i) => sum + i.grossAmount, 0);
  const totalDeductions = items.reduce((sum, i) => sum + i.deductions, 0);
  const totalNet = items.reduce((sum, i) => sum + i.netAmount, 0);

  // Ligne Total
  tableRows.push([
    '',
    'TOTAL GÉNÉRAL',
    '',
    '',
    `${totalHours} h`,
    '',
    `${totalGross.toLocaleString('fr-FR')} F`,
    `${totalDeductions.toLocaleString('fr-FR')} F`,
    `${totalNet.toLocaleString('fr-FR')} F`,
    ''
  ]);

  (doc as any).autoTable({
    startY: 54,
    head: [[
      'N°',
      'Prénoms & Noms',
      'Matières Enseignées',
      'Classe',
      'Total Heures',
      'T.H (F/h)',
      'Montant Brut',
      'Retenue',
      'Net à Payer',
      'Émargement'
    ]],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 8.5
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [15, 23, 42]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'left', fontStyle: 'bold', cellWidth: 45 },
      2: { halign: 'left', cellWidth: 55 },
      3: { halign: 'center', cellWidth: 25 },
      4: { halign: 'center', fontStyle: 'bold', cellWidth: 20 },
      5: { halign: 'right', cellWidth: 20 },
      6: { halign: 'right', cellWidth: 24 },
      7: { halign: 'right', cellWidth: 18 },
      8: { halign: 'right', fontStyle: 'bold', textColor: [22, 101, 52], cellWidth: 26 },
      9: { halign: 'center', cellWidth: 34 } // Espace pour émarger
    },
    didParseCell: (data: any) => {
      // Style spécifique de la ligne TOTAL
      if (data.row.index === tableRows.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [241, 245, 249];
        data.cell.styles.textColor = [15, 23, 42];
      }
    }
  });

  // ── Signatures & Cachets en bas de page ──
  const finalY = (doc as any).lastAutoTable.finalY + 12;

  // Cadre Comptabilité / Établi par
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Le Chef du Service Comptable', 30, finalY);
  doc.setFont('helvetica', 'normal');
  doc.text('Aïssata Cissé', 30, finalY + 6);
  doc.text('(Signature & Date)', 30, finalY + 12);

  // Cadre Directeur / Approuvé par
  doc.setFont('helvetica', 'bold');
  doc.text('Le Directeur du CFP-PAS de Gao', pageWidth - 70, finalY);
  doc.setFont('helvetica', 'normal');
  doc.text('Ousmane Maïga', pageWidth - 70, finalY + 6);

  // Apposer le cachet officiel si disponible
  try {
    if (DIRECTOR_STAMP_BASE64) {
      doc.addImage(DIRECTOR_STAMP_BASE64, 'PNG', pageWidth - 75, finalY + 8, 38, 22);
    }
  } catch {
    // Fallback sans image si invalide
  }

  // Téléchargement
  const filename = `Etat_Vacataires_CFPPAS_${periodStart}_au_${periodEnd}.pdf`;
  doc.save(filename);
}
