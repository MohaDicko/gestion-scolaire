import { useState } from 'react';
import { Award, Download, User, AlertCircle, FileText } from 'lucide-react';
import { useClassrooms, useAcademicYears } from '../hooks/useClassrooms';
import { useEnrollments } from '../hooks/useEnrollments';
import { useStudentBulletin } from '../hooks/useGrades';
import { BulletinService } from '../services/BulletinService';
import { toast } from '../../../store/toastStore';

export function BulletinPage() {
    const { classrooms } = useClassrooms();
    const { data: academicYears } = useAcademicYears();

    const [selectedYear, setSelectedYear] = useState('');
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [period, setPeriod] = useState(1);

    const { enrollments: students, isLoading: loadingStudents } = useEnrollments({
        classroomId: selectedClassId,
        academicYearId: selectedYear
    });

    const { data: bulletin, isLoading: loadingBulletin } = useStudentBulletin(selectedStudentId, period);

    const handleDownload = () => {
        if (!bulletin) {
            toast.error("Données du bulletin non disponibles.");
            return;
        }
        try {
            BulletinService.generatePDF(bulletin);
            toast.success("Téléchargement du bulletin lancé !");
        } catch (error) {
            toast.error("Erreur lors de la génération PDF.");
            console.error(error);
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Bulletins Trimestriels</h1>
                    <p className="page-subtitle">Génération et impression des bulletins officiels</p>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '25px', padding: '20px' }}>
                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                    <div className="form-group">
                        <label>Année Scolaire</label>
                        <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
                            <option value="">Sélectionner...</option>
                            {academicYears?.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Classe</label>
                        <select value={selectedClassId} onChange={e => { setSelectedClassId(e.target.value); setSelectedStudentId(''); }}>
                            <option value="">-- Choisir une classe --</option>
                            {classrooms?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Élève</label>
                        <select 
                            value={selectedStudentId} 
                            onChange={e => setSelectedStudentId(e.target.value)}
                            disabled={!selectedClassId || loadingStudents}
                        >
                            <option value="">-- Sélectionner l'élève --</option>
                            {students.map(s => <option key={s.studentId} value={s.studentId}>{s.studentName}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Période</label>
                        <select value={period} onChange={e => setPeriod(Number(e.target.value))}>
                            <option value={1}>1er Semestre</option>
                            <option value={2}>2ème Semestre</option>
                            <option value={3}>3ème Trimestre (Ettété)</option>
                        </select>
                    </div>
                </div>
            </div>

            {loadingBulletin ? (
                <div className="card text-center" style={{ padding: '60px' }}>
                    <div className="spinner" style={{ margin: '0 auto 20px' }} />
                    <p className="text-muted">Calcul du bulletin en cours...</p>
                </div>
            ) : bulletin ? (
                <div className="animate-up">
                    <div className="card" style={{ padding: '40px', border: '1px solid var(--primary-light)', position: 'relative', overflow: 'hidden' }}>
                        {/* Background Decoration */}
                        <Award size={200} style={{ position: 'absolute', right: '-40px', top: '10%', opacity: 0.03, transform: 'rotate(15deg)' }} />
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
                            <div>
                                <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.5px' }}>
                                    BULLETIN DE NOTES
                                </h2>
                                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{bulletin.academicYear} | Période : {period}</p>
                            </div>
                            <button className="btn-primary" onClick={handleDownload} style={{ padding: '12px 24px' }}>
                                <Download size={18} style={{ marginRight: '8px' }} /> 
                                Télécharger en PDF
                            </button>
                        </div>

                        <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '40px' }}>
                            <div>
                                <h4 style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Informations de l'élève</h4>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ width: '48px', height: '48px', background: 'var(--primary-dim)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                        <User size={24} />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '18px', fontWeight: 700 }}>{bulletin.studentName.toUpperCase()}</p>
                                        <p style={{ color: 'var(--text-muted)' }}>Classe : {bulletin.className}</p>
                                    </div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <h4 style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Performance Académique</h4>
                                <p style={{ fontSize: '32px', fontWeight: 800, color: 'var(--success)' }}>{bulletin.periodAverage.toFixed(2)} <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/ 20</span></p>
                                <p style={{ fontWeight: 600 }}>Rang : {bulletin.rank}</p>
                            </div>
                        </div>

                        <div className="table-container">
                            <table className="data-table">
                                <thead style={{ background: 'var(--primary-dim)' }}>
                                    <tr>
                                        <th>Matière</th>
                                        <th style={{ textAlign: 'center' }}>Moy. Classe</th>
                                        <th style={{ textAlign: 'center' }}>Examen</th>
                                        <th style={{ textAlign: 'center' }}>Coef</th>
                                        <th style={{ textAlign: 'center' }}>Moy. Finale</th>
                                        <th>Appréciation</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bulletin.subjects.map((s, i) => (
                                        <tr key={i}>
                                            <td className="font-bold">{s.subjectName}</td>
                                            <td style={{ textAlign: 'center' }}>{s.classAverage.toFixed(1)}</td>
                                            <td style={{ textAlign: 'center' }}>{s.examScore.toFixed(1)}</td>
                                            <td style={{ textAlign: 'center' }}>{s.coefficient}</td>
                                            <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{s.finalAverage.toFixed(2)}</td>
                                            <td style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '13px' }}>{s.appreciation}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ marginTop: '30px', padding: '20px', background: 'var(--surface-alt)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>ASPECTS DISCIPLINAIRES</p>
                                <p style={{ fontWeight: 600 }}>Absences : <span className="text-danger">{bulletin.attendance.absent}</span> | Retards : {bulletin.attendance.late}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>TOTAL POINTS / COEFF</p>
                                <p style={{ fontWeight: 700 }}>{bulletin.totalPoints.toFixed(2)} / {bulletin.totalCoefficients}</p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : selectedStudentId ? (
                <div className="card text-center" style={{ padding: '60px' }}>
                    <AlertCircle size={48} style={{ margin: '0 auto 20px', color: 'var(--warning)', opacity: 0.4 }} />
                    <h3>Données insuffisantes</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Aucune note trouvée pour cet élève cette période.</p>
                </div>
            ) : (
                <div className="card text-center" style={{ padding: '80px', color: 'var(--text-muted)' }}>
                    <FileText size={64} style={{ margin: '0 auto 20px', opacity: 0.1 }} />
                    <p>Sélectionnez un élève pour prévisualiser son bulletin.</p>
                </div>
            )}
        </div>
    );
}
