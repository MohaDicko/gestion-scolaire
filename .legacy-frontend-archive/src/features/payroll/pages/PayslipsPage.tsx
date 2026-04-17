import { useParams, Link } from 'react-router-dom';
import { usePayslipsByRun, Payslip } from '../hooks/usePayroll';
import { FileText, Printer, ArrowLeft, DownloadCloud } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuthStore } from '../../../store/authStore';

const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

export function PayslipsPage() {
    const { runId } = useParams();
    const { data: payslips, isLoading } = usePayslipsByRun(runId || '');

    const { user } = useAuthStore();

    const downloadPayslip = (slip: Payslip) => {
        const doc = new jsPDF();
        const primaryColor = [26, 35, 126]; // Deep Indigo
        
        // Header Rectangle
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(0, 0, 210, 40, "F");
        
        doc.setFontSize(22);
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.text("BULLETIN DE PAIE", 105, 25, { align: "center" });
        
        doc.setFontSize(10);
        doc.setTextColor(200);
        doc.setFont("helvetica", "normal");
        doc.text(`Réf: ${slip.id.substring(0, 8).toUpperCase()} | Période: ${monthNames[slip.periodMonth - 1].toUpperCase()} ${slip.periodYear}`, 105, 33, { align: "center" });

        // School & Employee Info
        doc.setTextColor(40, 44, 52);
        doc.setFontSize(12);
        doc.text("EMPLOYEUR:", 14, 55);
        doc.setFont("helvetica", "bold");
        doc.text(user?.schoolName?.toUpperCase() || "ÉTABLISSEMENT DE SANTÉ", 14, 62);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        doc.text("Bamako, République du Mali", 14, 68);
        doc.text(`Tel: ${(user as any)?.phoneNumber || "70 00 00 00"}`, 14, 74);

        doc.setTextColor(40, 44, 52);
        doc.text("SALARIÉ:", 120, 55);
        doc.setFont("helvetica", "bold");
        doc.text(slip.employeeName, 120, 62);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        doc.text(`Matricule: ${slip.employeeNumber}`, 120, 68);
        doc.text(`Fonction: ${slip.departmentName}`, 120, 74);

        // Period Box
        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setLineWidth(0.5);
        doc.line(14, 82, 196, 82);

        // Table
        const tableBody = [
            ["Salaire de Base", slip.baseSalary.toLocaleString(), ""],
            ...slip.lines.map(line => [
                line.label,
                line.elementType === 'Allowance' ? line.amount.toLocaleString() : '',
                line.elementType === 'Deduction' ? line.amount.toLocaleString() : ''
            ])
        ];

        autoTable(doc, {
            startY: 90,
            head: [['LIBELLÉ', 'GAINS (FCFA)', 'RETENUES (FCFA)']],
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: primaryColor as [number, number, number], halign: 'center' },
            styles: { fontSize: 10, cellPadding: 4 },
            columnStyles: {
                0: { cellWidth: 100 },
                1: { halign: 'right' },
                2: { halign: 'right' }
            }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 10;
        
        // Summary Card
        doc.setFillColor(245, 247, 250);
        doc.rect(120, finalY, 76, 25, "F");
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFontSize(10);
        doc.text("NET À PAYER", 125, finalY + 10);
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text(`${slip.netSalary.toLocaleString()} FCFA`, 125, finalY + 20);

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.setFont("helvetica", "italic");
        doc.text("Établi par le service RH - Document numérique certifié", 105, 285, { align: "center" });

        doc.save(`Fiche_Paie_${slip.employeeName.replace(/\s+/g, '_')}_${slip.periodMonth}_${slip.periodYear}.pdf`);
    };

    return (
        <div className="page">
            <div className="page-header" style={{ alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <Link to="/payroll/runs" className="btn-ghost text-muted" style={{ display: 'inline-flex', padding: 0, fontSize: '12px' }}>
                        <ArrowLeft size={14} /> Retour aux traitements
                    </Link>
                    <h1 className="page-title">Fiches de Paie</h1>
                    <p className="page-subtitle">Liste détaillée par profil employé pour ce lot</p>
                </div>
                <button className="btn-primary" onClick={() => window.print()}>
                    <Printer size={16} /> Imprimer tout le lot
                </button>
            </div>

            <div className="card" style={{ padding: '0' }}>
                <div className="table-container">
                    {isLoading ? (
                        <div className="loading-state">Génération en cours...</div>
                    ) : payslips?.length ? (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>N° Fiche</th>
                                    <th>Employé</th>
                                    <th>Période</th>
                                    <th>Département</th>
                                    <th>Salaire de Base</th>
                                    <th>Net à Payer</th>
                                    <th style={{ textAlign: 'center' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payslips.map(slip => (
                                    <tr key={slip.id}>
                                        <td className="font-mono text-sm text-dim">{slip.id.substring(0, 8)}</td>
                                        <td>
                                            <div className="font-bold">{slip.employeeName}</div>
                                            <div className="text-xs text-muted">{slip.employeeNumber}</div>
                                        </td>
                                        <td><div className="text-sm font-semibold">{monthNames[slip.periodMonth - 1]} {slip.periodYear}</div></td>
                                        <td><span className="badge-outline">{slip.departmentName}</span></td>
                                        <td>{slip.baseSalary.toLocaleString()} FCFA</td>
                                        <td className="font-mono text-success font-bold text-lg">{slip.netSalary.toLocaleString()} FCFA</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button 
                                                className="btn-ghost" 
                                                title="Télécharger"
                                                onClick={() => downloadPayslip(slip)}
                                            >
                                                <DownloadCloud size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="empty-state" style={{ padding: '40px' }}>
                            <FileText size={48} style={{ opacity: 0.2 }} />
                            <h3>Aucune fiche de paie</h3>
                            <p>Lancez un calcul (run) de paie pour peupler ce tableau.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
