'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, Search, Loader2, Award, ChevronRight, Filter, ExternalLink } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function BulletinsPage() {
    const toast = useToast();
    const [classrooms, setClassrooms] = useState<any[]>([]);
    const [years, setYears] = useState<any[]>([]);
    const [schoolInfo, setSchoolInfo] = useState<any>(null);

    const [form, setForm] = useState({
        classroomId: '',
        academicYearId: '',
        trimestre: '1'
    });

    const [results, setResults] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        Promise.all([
            fetch('/api/classrooms').then(r => r.json()),
            fetch('/api/academic-years').then(r => r.json()),
            fetch('/api/school/config').then(r => r.json())
        ]).then(([cData, yData, sData]) => {
            if (Array.isArray(cData)) setClassrooms(cData);
            if (Array.isArray(yData)) {
                setYears(yData);
                const active = yData.find(y => y.isActive);
                if (active) setForm(f => ({ ...f, academicYearId: active.id }));
            }
            if (sData) setSchoolInfo(sData);
        }).catch(() => toast.error('Erreur lors du chargement des configurations.'));
    }, [toast]);

    const handleCalculate = async () => {
        if (!form.classroomId || !form.academicYearId) {
            toast.warning('Veuillez sélectionner une classe et une année.');
            return;
        }

        setIsLoading(true);
        setResults(null);
        try {
            const res = await fetch(`/api/reports/bulletin?classroomId=${form.classroomId}&academicYearId=${form.academicYearId}&trimestre=${form.trimestre}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erreur lors du calcul');
            setResults(data);
            if (data.bulletins.length === 0) toast.info('Aucune note trouvée pour cette sélection.');
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const generateSinglePDF = (bulletin: any) => {
        const doc = new jsPDF();
        const schoolName = schoolInfo?.name?.toUpperCase() || 'LYCEE PUBLIC DE NIAMANA';
        const schoolDren = schoolInfo?.drenCode || 'DREN RIVE DROITE / CAP BAMAKO';
        const yearName = years.find(y => y.id === form.academicYearId)?.name || '2025-2026';
        const className = classrooms.find(c => c.id === form.classroomId)?.name || '';

        // -- Header Layout (Official Malian Style) --
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(schoolName, 20, 20);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(schoolDren, 20, 26);
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(`${form.trimestre}${form.trimestre === '1' ? 'er' : 'ème'} Trimestre ${yearName}`, 200, 20, { align: 'right' });

        doc.setLineWidth(0.8);
        doc.line(10, 32, 200, 32);

        // -- Student Profile --
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Élève : ${bulletin.studentName}`, 20, 42);
        doc.text(`Matricule : ${bulletin.studentNumber}`, 140, 42);
        doc.text(`Classe : ${className}`, 20, 48);

        // -- Grades Table (Refined with Moy Classe/Comp/Produit) --
        const tableBody = bulletin.subjects.map((s: any) => [
            s.subjectName.toUpperCase(),
            s.moyenneClasse.toFixed(2),
            s.moyenneComposition.toFixed(2),
            s.coefficient,
            s.average.toFixed(2),
            s.weightedAverage.toFixed(2),
            s.mention
        ]);

        autoTable(doc, {
            startY: 55,
            head: [['Matières enseignées', 'Moy Classe', 'Moy Comp', 'Coef', 'Moyenne', 'Produit', 'Appréciation']],
            body: tableBody,
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.1 },
            columnStyles: {
                0: { fontStyle: 'bold', fontSize: 8, cellWidth: 50 },
                3: { fontStyle: 'bold', halign: 'center' },
                4: { fontStyle: 'bold', halign: 'center' },
                5: { fontStyle: 'bold', halign: 'center' }
            }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 10;

        // -- Summary Footer --
        doc.setLineWidth(0.2);
        doc.rect(10, finalY, 190, 15);
        doc.setFontSize(9);
        doc.text(`Total des Coeff : ${bulletin.totalCoefficients}`, 15, finalY + 9);
        doc.text(`Total des points : ${bulletin.totalPoints.toFixed(2)}`, 60, finalY + 9);
        
        // General Average Highlight
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.rect(115, finalY + 2, 25, 11);
        doc.text(bulletin.generalAverage.toFixed(2), 127.5, finalY + 10, { align: 'center' });
        doc.setFontSize(9);
        doc.text(`Moyenne trimestrielle / 20`, 112, finalY - 2);

        // Rank
        doc.rect(150, finalY + 2, 45, 11);
        doc.text(`Rang : ${bulletin.rank} éme / ${bulletin.classSize}`, 172.5, finalY + 10, { align: 'center' });

        doc.text('LE PROVISEUR', 170, finalY + 30, { align: 'center' });

        doc.save(`Bulletin_${bulletin.studentNumber}_T${form.trimestre}.pdf`);
    };

    return (
        <AppLayout
            title="Considérant les résultats..."
            subtitle="Calcul des bulletins selon le modèle Lycée (Moyenne Classe + 2x Composition)"
            breadcrumbs={[{ label: 'Accueil', href: '/dashboard' }, { label: 'Rapports' }, { label: 'Bulletins' }]}
        >
            <div className="card shadow-sm" style={{ padding: '24px', marginBottom: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', alignItems: 'flex-end' }}>
                    <div className="form-group">
                        <label>Année Scolaire</label>
                        <select value={form.academicYearId} onChange={e => setForm({...form, academicYearId: e.target.value})} className="form-input">
                            <option value="">-- Sélectionner --</option>
                            {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Classe</label>
                        <select value={form.classroomId} onChange={e => setForm({...form, classroomId: e.target.value})} className="form-input">
                            <option value="">-- Sélectionner --</option>
                            {classrooms.map(c => <option key={c.id} value={c.id}>{c.name} ({c.level})</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Trimestre</label>
                        <select value={form.trimestre} onChange={e => setForm({...form, trimestre: e.target.value})} className="form-input">
                            <option value="1">1er Trimestre</option>
                            <option value="2">2ème Trimestre</option>
                            <option value="3">3ème Trimestre</option>
                        </select>
                    </div>
                    <button className="btn-primary" onClick={handleCalculate} disabled={isLoading} style={{ height: '42px' }}>
                        {isLoading ? <><Loader2 size={16} className="spin" /> Calcul en cours...</> : <><Filter size={16} /> Calculer les Bulletins</>}
                    </button>
                </div>
            </div>

            {results && results.bulletins.length > 0 ? (
                <div className="card shadow-sm" style={{ padding: 0 }}>
                    <div className="card-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Award size={20} className="text-warning" />
                            Résultats du {form.trimestre}{form.trimestre === '1' ? 'er' : 'ème'} Trimestre
                        </h3>
                    </div>

                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '80px', textAlign: 'center' }}>Rang</th>
                                    <th>Élève</th>
                                    <th>Moy. G</th>
                                    <th>Mention</th>
                                    <th>Points / Coeffs</th>
                                    <th style={{ textAlign: 'right' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.bulletins.map((b: any) => (
                                    <tr key={b.studentId}>
                                        <td style={{ textAlign: 'center' }}>
                                            <span className={`badge ${b.rank === 1 ? 'badge-warning' : b.rank <= 3 ? 'badge-primary' : 'badge-info'}`} style={{ width: '32px', height: '32px', display: 'inline-grid', placeItems: 'center', borderRadius: '50%', padding: 0, fontWeight: 700 }}>
                                                {b.rank}
                                            </span>
                                        </td>
                                        <td>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{b.studentName}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{b.studentNumber}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <strong style={{ fontSize: '15px', color: b.generalAverage >= 10 ? 'var(--success)' : 'var(--danger)' }}>
                                                {b.generalAverage.toFixed(2)}
                                            </strong>
                                        </td>
                                        <td>
                                            <span className={`badge ${b.generalAverage >= 12 ? 'badge-success' : b.generalAverage >= 10 ? 'badge-info' : 'badge-danger'}`}>
                                                {b.mention}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '12px' }}>
                                                {b.totalPoints.toFixed(2)} / {b.totalCoefficients}
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button className="btn-icon text-primary" onClick={() => generateSinglePDF(b)} title="Télécharger le bulletin">
                                                <Download size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : results ? (
                <div className="card text-center" style={{ padding: '80px 20px', color: 'var(--text-muted)' }}>
                    <FileText size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
                    <p>Aucune note enregistrée pour cette classe sur ce trimestre.</p>
                </div>
            ) : (
                <div className="card text-center" style={{ padding: '80px 20px', color: 'var(--text-muted)', border: '1px dashed var(--border-md)' }}>
                    <Award size={48} style={{ opacity: 0.1, margin: '0 auto 20px' }} />
                    <h3>Modèle Lycée (Mali) Activé</h3>
                    <p>Sélectionnez une classe pour générer les bulletins avec la pondération 1/3 Classe et 2/3 Composition.</p>
                </div>
            )}
        </AppLayout>
    );
}
