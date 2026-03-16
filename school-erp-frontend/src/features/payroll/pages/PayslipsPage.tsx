import { useParams, Link } from 'react-router-dom';
import { usePayslipsByRun, Payslip } from '../hooks/usePayroll';
import { FileText, Printer, ArrowLeft, DownloadCloud } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export function PayslipsPage() {
    const { runId } = useParams();
    const { data: payslips, isLoading } = usePayslipsByRun(runId || '');

    const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
        "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

    const downloadPayslip = (slip: Payslip) => {
        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(22);
        doc.setTextColor(40, 44, 52);
        doc.text("FICHE DE PAIE", 105, 20, { align: "center" });
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Référence: ${slip.id.substring(0, 8).toUpperCase()}`, 105, 27, { align: "center" });

        // Company & Employee Info
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text("ENTREPRISE:", 14, 45);
        doc.setFont("helvetica", "bold");
        doc.text("GROUPE SCOLAIRE EXCELLENCE", 14, 52);
        doc.setFont("helvetica", "normal");
        doc.text("Abidjan, Côte d'Ivoire", 14, 58);

        doc.text("EMPLOYÉ:", 120, 45);
        doc.setFont("helvetica", "bold");
        doc.text(slip.employeeName, 120, 52);
        doc.setFont("helvetica", "normal");
        doc.text(`Matricule: ${slip.employeeNumber}`, 120, 58);
        doc.text(`Département: ${slip.departmentName}`, 120, 64);

        // Period
        doc.setFillColor(245, 247, 250);
        doc.rect(14, 75, 182, 12, "F");
        doc.setFont("helvetica", "bold");
        doc.text(`Période de paie: ${monthNames[slip.periodMonth - 1].toUpperCase()} ${slip.periodYear}`, 105, 83, { align: "center" });

        // Table
        const tableBody = slip.lines.map(line => [
            line.label,
            line.elementType === 'Allowance' ? line.amount.toLocaleString() : '',
            line.elementType === 'Deduction' ? line.amount.toLocaleString() : ''
        ]);

        autoTable(doc, {
            startY: 95,
            head: [['Description', 'Gains (XOF)', 'Retenues (XOF)']],
            body: tableBody,
            theme: 'striped',
            headStyles: { fillColor: [40, 44, 52] },
            foot: [['TOTAL', 
                slip.lines.filter(l => l.elementType === 'Allowance').reduce((acc, l) => acc + l.amount, 0).toLocaleString(), 
                slip.lines.filter(l => l.elementType === 'Deduction').reduce((acc, l) => acc + l.amount, 0).toLocaleString()
            ]],
            footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
        });

        // Net Salary
        const finalY = (doc as any).lastAutoTable.finalY + 15;
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text("NET À PAYER:", 120, finalY);
        doc.setFontSize(18);
        doc.setTextColor(16, 185, 129); // Success color
        doc.text(`${slip.netSalary.toLocaleString()} FCFA`, 120, finalY + 10);

        // Footer
        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.text("Cette fiche de paie est générée électroniquement et ne nécessite pas de signature.", 105, 285, { align: "center" });

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
