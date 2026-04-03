import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StudentBulletin } from '../hooks/useGrades';

export class BulletinService {
    static generatePDF(bulletin: StudentBulletin) {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // 🏫 En-tête (Header)
        doc.setFontSize(22);
        doc.setTextColor(41, 128, 185); // Professional Blue
        doc.text('BULLETIN SCOLAIRE', pageWidth / 2, 20, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Année Académique : ${bulletin.academicYear}`, pageWidth / 2, 28, { align: 'center' });
        doc.text(`Période : ${bulletin.period === 1 ? '1er Semestre' : bulletin.period === 2 ? '2ème Semestre' : '3ème Trimestre'}`, pageWidth / 2, 33, { align: 'center' });

        // 👤 Infos Élève
        doc.setDrawColor(200);
        doc.line(20, 40, pageWidth - 20, 40);

        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.setFont('helvetica', 'bold');
        doc.text('ÉLÈVE :', 20, 50);
        doc.setFont('helvetica', 'normal');
        doc.text(bulletin.studentName.toUpperCase(), 40, 50);

        doc.setFont('helvetica', 'bold');
        doc.text('CLASSE :', 20, 57);
        doc.setFont('helvetica', 'normal');
        doc.text(bulletin.className, 42, 57);

        doc.setFont('helvetica', 'bold');
        doc.text('RANG :', pageWidth - 60, 57);
        doc.setFont('helvetica', 'normal');
        doc.text(bulletin.rank, pageWidth - 45, 57);

        // 📊 Tableau des Notes
        autoTable(doc, {
            startY: 65,
            head: [['MATIÈRE', 'MOY. CLASSE', 'NOTE EXAMEN', 'COEF', 'MOY. GÉNÉRALE', 'POINTS', 'APPRÉCIATION']],
            body: bulletin.subjects.map(attr => [
                attr.subjectName,
                attr.classAverage.toFixed(2),
                attr.examScore.toFixed(2),
                attr.coefficient,
                attr.finalAverage.toFixed(2),
                attr.points.toFixed(2),
                attr.appreciation
            ]),
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: { fillColor: [41, 128, 185], textColor: 255, halign: 'center' },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 45 },
                1: { halign: 'center' },
                2: { halign: 'center' },
                3: { halign: 'center' },
                4: { halign: 'center', fontStyle: 'bold' },
                5: { halign: 'center' },
                6: { fontStyle: 'italic' }
            }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 10;

        // 📈 Résumé de la Période
        doc.setDrawColor(230);
        doc.setFillColor(245, 247, 250);
        doc.rect(20, finalY, pageWidth - 40, 25, 'F');
        
        doc.setFontSize(11);
        doc.setTextColor(0);
        doc.text(`TOTAL POINTS : ${bulletin.totalPoints.toFixed(2)}`, 25, finalY + 10);
        doc.text(`TOTAL COEF : ${bulletin.totalCoefficients}`, 25, finalY + 18);
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`MOYENNE : ${bulletin.periodAverage.toFixed(2)} / 20`, pageWidth - 85, finalY + 15);

        // 🕒 Présence & Conduite
        const attendanceY = finalY + 35;
        doc.setFontSize(11);
        doc.text('CONDUITE & PRÉSENCE', 20, attendanceY);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Absences : ${bulletin.attendance.absent} | Retards : ${bulletin.attendance.late}`, 20, attendanceY + 7);

        // ✍️ Signatures
        const footerY = 260;
        doc.line(20, footerY - 5, pageWidth - 20, footerY - 5);
        doc.setFontSize(9);
        doc.text('Signature du Parent', 30, footerY);
        doc.text('Signature du Maître / Professeur Principal', pageWidth / 2, footerY, { align: 'center' });
        doc.text('Le Directeur', pageWidth - 50, footerY, { align: 'center' });

        // Save the PDF
        doc.save(`Bulletin_${bulletin.studentName.replace(/\s/g, '_')}_P${bulletin.period}.pdf`);
    }
}
