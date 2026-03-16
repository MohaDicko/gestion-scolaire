import { usePayments, PaymentDto } from '../hooks/usePayments';
import { jsPDF } from 'jspdf';
import { exportToExcel } from '../../../lib/excelExport';
import { Download, Printer, Search, Filter, Wallet, FileText, ArrowUpRight } from 'lucide-react';

export function PaymentsPage() {
    const { data: payments, isLoading } = usePayments();

    const generateReceipt = (payment: PaymentDto) => {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [148, 210] // A5 format
        });

        // Header / School Info
        doc.setFontSize(16);
        doc.setTextColor(40, 44, 52);
        doc.setFont("helvetica", "bold");
        doc.text("REÇU DE PAIEMENT", 74, 15, { align: "center" });
        
        doc.setFontSize(10);
        doc.text("GROUPE SCOLAIRE EXCELLENCE", 74, 22, { align: "center" });
        doc.setFont("helvetica", "normal");
        doc.text("Abidjan, Côte d'Ivoire | Tel: +225 00 00 00 00", 74, 27, { align: "center" });

        // Line
        doc.setDrawColor(200);
        doc.line(10, 32, 138, 32);

        // Content
        doc.setFontSize(11);
        doc.text(`N° Reçu: REC-${payment.id.substring(0, 8).toUpperCase()}`, 10, 40);
        doc.text(`Date: ${new Date(payment.paymentDate).toLocaleDateString('fr-FR')}`, 90, 40);

        doc.setFont("helvetica", "bold");
        doc.text("REÇU DE :", 10, 50);
        doc.setFont("helvetica", "normal");
        doc.text(payment.studentName, 40, 50);

        doc.setFont("helvetica", "bold");
        doc.text("POUR :", 10, 58);
        doc.setFont("helvetica", "normal");
        doc.text(`Facture ${payment.invoiceNumber}`, 40, 58);

        doc.setFont("helvetica", "bold");
        doc.text("MODE :", 10, 66);
        doc.setFont("helvetica", "normal");
        doc.text(`${payment.paymentMethod} ${payment.referenceNumber ? `(Réf: ${payment.referenceNumber})` : ''}`, 40, 66);

        // Amount Box
        doc.setFillColor(245, 247, 250);
        doc.rect(10, 75, 128, 15, "F");
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(`MONTANT PAYÉ : ${payment.amount.toLocaleString()} FCFA`, 74, 85, { align: "center" });

        // Footer
        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(100);
        doc.text("Merci pour votre confiance.", 74, 105, { align: "center" });
        
        doc.setFont("helvetica", "normal");
        doc.text("Cachet et Signature", 100, 120);
        
        doc.save(`Recu_${payment.invoiceNumber}_${payment.studentName.replace(/\s+/g, '_')}.pdf`);
    };

    const handleExportExcel = () => {
        if (!payments) return;
        const data = payments.map(p => ({
            'Date': new Date(p.paymentDate).toLocaleString('fr-FR'),
            'Facture': p.invoiceNumber,
            'Élève': p.studentName,
            'Mode': p.paymentMethod,
            'Référence': p.referenceNumber || 'N/A',
            'Montant': p.amount
        }));
        exportToExcel(data, 'Paiements_Recus', 'Payments');
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Paiements Reçus</h1>
                    <p className="page-subtitle">Historique des transactions réglées par les élèves / parents.</p>
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--primary-dim)', color: 'var(--primary)' }}><Wallet size={24} /></div>
                    <div className="stat-body">
                        <p className="stat-label">Total Transactions</p>
                        <p className="stat-value">{payments?.length || 0}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)' }}><ArrowUpRight size={24} /></div>
                    <div className="stat-body">
                        <p className="stat-label">Volume Encaissé</p>
                        <p className="stat-value text-success">
                            {payments?.reduce((acc, p) => acc + p.amount, 0).toLocaleString()} F
                        </p>
                    </div>
                </div>
            </div>

            <div className="card" style={{ padding: '0' }}>
                <div className="table-toolbar" style={{ padding: '20px' }}>
                    <div className="search-box">
                        <Search size={16} />
                        <input type="text" placeholder="Rechercher par élève ou facture..." />
                    </div>
                    <button className="btn-ghost" onClick={handleExportExcel}><Download size={16} /> Exporter Excel</button>
                    <button className="btn-ghost"><Filter size={16} /> Filtrer par mode de paiement</button>
                </div>

                <div className="table-container">
                    {isLoading ? (
                        <div className="loading-state">Chargement des transactions...</div>
                    ) : payments && payments.length > 0 ? (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Lié à la Facture</th>
                                    <th>Élève</th>
                                    <th>Mode de Paiement</th>
                                    <th>Référence</th>
                                    <th style={{ textAlign: 'right' }}>Montant Encaissé</th>
                                    <th style={{ textAlign: 'center' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map(payment => (
                                    <tr key={payment.id}>
                                        <td>{new Date(payment.paymentDate).toLocaleString('fr-FR')}</td>
                                        <td className="font-mono text-sm text-dim">{payment.invoiceNumber}</td>
                                        <td className="font-bold">{payment.studentName}</td>
                                        <td><span className="badge-outline">{payment.paymentMethod}</span></td>
                                        <td className="font-mono text-xs text-muted">{payment.referenceNumber || 'N/A'}</td>
                                        <td className="font-mono font-bold text-success" style={{ textAlign: 'right' }}>
                                            + {payment.amount.toLocaleString()} FCFA
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button className="btn-ghost" onClick={() => generateReceipt(payment)} title="Imprimer le reçu">
                                                <Printer size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="empty-state" style={{ padding: '40px' }}>
                            <FileText size={48} style={{ opacity: 0.2 }} />
                            <h3>Aucun paiement trouvé</h3>
                            <p>Les transactions validées apparaîtront ici.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
