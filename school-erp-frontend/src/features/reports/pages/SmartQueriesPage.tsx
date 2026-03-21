import { useState } from 'react';
import { Download, Printer, Users, Briefcase, Sparkles, AlertCircle } from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';
import { useAuthStore } from '../../../store/authStore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { exportToExcel } from '../../../lib/excelExport';
import { toast } from '../../../store/toastStore';

type QueryType = 'arrears' | 'low_salary' | 'none';

export function SmartQueriesPage() {
    const { user } = useAuthStore();
    const [queryType, setQueryType] = useState<QueryType>('none');
    const [threshold, setThreshold] = useState<number>(200000); // Default threshold for low salary
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const runQuery = async (type: QueryType) => {
        setIsLoading(true);
        setQueryType(type);
        try {
            if (type === 'arrears') {
                const { data } = await apiClient.get('/finance/invoices?onlyWithArrears=true');
                setResults(data);
            } else if (type === 'low_salary') {
                const { data } = await apiClient.get(`/hr/employees?MaxBaseSalary=${threshold}&PageSize=1000`);
                setResults(data.items);
            }
        } catch (err) {
            console.error(err);
            toast.error("Erreur lors de l'exécution de la requête.");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrint = async () => {
        const doc = new jsPDF();
        
        // School Header
        doc.setFillColor(30, 41, 59);
        doc.rect(0, 0, 210, 30, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14); doc.setFont('helvetica', 'bold');
        doc.text(user?.schoolName?.toUpperCase() || 'ÉTABLISSEMENT SCOLAIRE', 20, 15);
        
        doc.setFontSize(8); doc.setFont('helvetica', 'normal');
        doc.text(user?.schoolAddress || 'Abidjan, Côte d\'Ivoire', 20, 22);
        
        const title = queryType === 'arrears' ? "Liste des Élèves avec Arriérés de Paiement" : `Personnel avec Salaire < ${threshold.toLocaleString()} FCFA`;
        
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(16); doc.setFont('helvetica', 'bold');
        doc.text(title, 14, 45);
        doc.setFontSize(10); doc.setFont('helvetica', 'normal');
        doc.text(`ÉMIS LE: ${new Date().toLocaleDateString('fr-FR')}`, 14, 53);

        if (queryType === 'arrears') {
            autoTable(doc, {
                startY: 60,
                head: [['N° Facture', 'Élève', 'Total', 'Restant', 'Statut']],
                body: results.map(r => [r.invoiceNumber, r.studentName, r.amount, r.remainingAmount, r.status]),
                headStyles: { fillColor: [124, 58, 237] }
            });
        } else {
            autoTable(doc, {
                startY: 60,
                head: [['Nom Complet', 'Poste', 'Contact']],
                body: results.map(r => [`${r.firstName} ${r.lastName}`, r.employeeType, r.email]),
                headStyles: { fillColor: [59, 130, 246] }
            });
        }

        doc.save(`${queryType}_report.pdf`);
    };

    const handleExportExcel = () => {
        if (queryType === 'arrears') {
            const data = results.map(r => ({
                'N° Facture': r.invoiceNumber,
                'Élève': r.studentName,
                'Montant Total': r.amount,
                'Reste à Payer': r.remainingAmount,
                'Statut': r.status
            }));
            exportToExcel(data, 'Eleves_Insolvables', 'Arrears');
        } else {
            const data = results.map(r => ({
                'Prénom': r.firstName,
                'Nom': r.lastName,
                'Poste': r.employeeType,
                'Email': r.email,
                'Téléphone': r.phoneNumber
            }));
            exportToExcel(data, `Salaires_Inferieurs_${threshold}`, 'Employees');
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Sparkles size={24} className="text-primary" /> Requêtes Intelligentes
                    </h1>
                    <p className="page-subtitle">Exécutez des rapports ciblés en un clic</p>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '25px' }}>
                <h3 className="card-title" style={{ marginBottom: '15px' }}>Quel rapport souhaitez-vous ?</h3>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    <button 
                        className={`btn-${queryType === 'arrears' ? 'primary' : 'ghost'}`}
                        onClick={() => runQuery('arrears')}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--border)' }}
                    >
                        <Users size={18} /> Élèves ayant des impayés
                    </button>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'var(--bg-2)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <Briefcase size={18} />
                        <span>Salaire {'>'} </span>
                        <input 
                            type="number" 
                            value={threshold} 
                            onChange={e => setThreshold(Number(e.target.value))}
                            style={{ width: '100px', padding: '4px' }}
                        />
                        <button 
                            className={`btn-${queryType === 'low_salary' ? 'primary' : 'ghost'}`}
                            onClick={() => runQuery('low_salary')}
                            style={{ padding: '6px 12px' }}
                        >
                            Filtrer
                        </button>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="loading-state">Analyse des données en cours...</div>
            ) : queryType !== 'none' && (
                <div className="card animate-fade" style={{ padding: 0 }}>
                    <div className="table-toolbar" style={{ padding: '15px 20px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ padding: '6px 12px', background: 'var(--primary-dim)', color: 'var(--primary)', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
                                {results.length} résultats trouvés
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn-ghost" onClick={handleExportExcel}><Download size={16} /> Excel</button>
                            <button className="btn-primary" onClick={handlePrint}><Printer size={16} /> Imprimer Rapport</button>
                        </div>
                    </div>

                    <div className="table-container">
                        {results.length > 0 ? (
                            <table className="data-table">
                                <thead>
                                    {queryType === 'arrears' ? (
                                        <tr>
                                            <th>Facture</th>
                                            <th>Élève</th>
                                            <th>Total</th>
                                            <th style={{ textAlign: 'right' }}>Dette</th>
                                            <th>Statut</th>
                                        </tr>
                                    ) : (
                                        <tr>
                                            <th>Employé</th>
                                            <th>Poste</th>
                                            <th>Contact</th>
                                            <th style={{ textAlign: 'right' }}>Actions</th>
                                        </tr>
                                    )}
                                </thead>
                                <tbody>
                                    {results.map((r, i) => (
                                        <tr key={i}>
                                            {queryType === 'arrears' ? (
                                                <>
                                                    <td>{r.invoiceNumber}</td>
                                                    <td className="font-bold">{r.studentName}</td>
                                                    <td>{r.amount.toLocaleString()}</td>
                                                    <td style={{ textAlign: 'right', color: 'var(--danger)', fontWeight: 700 }}>
                                                        {r.remainingAmount.toLocaleString()} FCFA
                                                    </td>
                                                    <td><span className="badge-outline">{r.status}</span></td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="font-bold">{r.firstName} {r.lastName}</td>
                                                    <td>{r.employeeType}</td>
                                                    <td>{r.email}</td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <button 
                                                            className="btn-ghost"
                                                            onClick={() => window.location.href = `/hr/employees/${r.id}`}
                                                        >
                                                            Fiche
                                                        </button>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="empty-state" style={{ padding: '40px' }}>
                                <AlertCircle size={40} style={{ opacity: 0.2 }} />
                                <h3>Aucun résultat</h3>
                                <p>Tous vos critères sont à jour !</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
