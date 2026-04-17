import React, { useState } from 'react';
import { UserPlus, Search, GraduationCap, X, CheckCircle } from 'lucide-react';
import { useEnrollments } from '../hooks/useEnrollments';
import { useGetStudents } from '../hooks/useStudents';
import { useClassrooms, useAcademicYears } from '../hooks/useClassrooms';
import { toast } from '../../../store/toastStore';


export function EnrollmentsPage() {
    const { enrollments: allEnrollments, isLoading, enrollStudent } = useEnrollments();
    const { classrooms } = useClassrooms();
    const { data: years } = useAcademicYears();

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [studentSearch, setStudentSearch] = useState('');
    const { data: studentsResult } = useGetStudents({ search: studentSearch, pageSize: 5 });

    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [selectedClassroomId, setSelectedClassroomId] = useState('');
    const [selectedYearId, setSelectedYearId] = useState('');

    // Transfer state
    const [showTransferForm, setShowTransferForm] = useState(false);
    const [transferData, setTransferData] = useState({ 
        enrollmentId: '', 
        studentId: '', 
        studentName: '', 
        oldClassroomName: '',
        academicYearId: '',
        newClassroomId: '' 
    });

    const { transferStudent } = useEnrollments();

    const handleEnrollSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudentId || !selectedClassroomId || !selectedYearId) return;

        try {
            await enrollStudent.mutateAsync({
                studentId: selectedStudentId,
                classroomId: selectedClassroomId,
                academicYearId: selectedYearId
            });
            setShowForm(false);
            setSelectedStudentId('');
            setStudentSearch('');
            toast.success("Élève inscrit avec succès !");
        } catch (err: any) {
            toast.error(err.response?.data?.Message || "Erreur lors de l'inscription.");
        }
    };

    const handleTransferSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!transferData.studentId || !transferData.newClassroomId || !transferData.academicYearId) return;

        try {
            await transferStudent.mutateAsync({
                studentId: transferData.studentId,
                newClassroomId: transferData.newClassroomId,
                academicYearId: transferData.academicYearId
            });
            setShowTransferForm(false);
            toast.success("Transfert effectué avec succès !");
        } catch (err: any) {
            toast.error(err.response?.data?.Message || "Erreur lors du transfert.");
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Inscriptions</h1>
                    <p className="page-subtitle">Gérer les affectations des élèves aux classes</p>
                </div>
                <button
                    className="btn-primary"
                    onClick={() => {
                        setShowForm(true);
                        if (years?.length && !selectedYearId) setSelectedYearId(years.find(y => y.isCurrent)?.id || years[0].id);
                    }}
                >
                    <UserPlus size={16} /> Nouvelle inscription
                </button>
            </div>

            {showForm && (
                <div className="card" style={{ marginBottom: '24px', border: '1px solid var(--primary-light)' }}>
                    <div className="card-header">
                        <h2 className="card-title">Inscrire un élève</h2>
                        <button className="btn-ghost" onClick={() => setShowForm(false)}><X size={18} /></button>
                    </div>
                    <form onSubmit={handleEnrollSubmit} style={{ padding: '20px' }}>
                        <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                            <div className="form-group">
                                <label>1. Rechercher l'élève</label>
                                <div className="search-box">
                                    <Search size={16} />
                                    <input
                                        type="text"
                                        placeholder="Nom ou matricule..."
                                        value={studentSearch}
                                        onChange={e => {
                                            setStudentSearch(e.target.value);
                                            setSelectedStudentId('');
                                        }}
                                    />
                                </div>
                                {studentSearch && !selectedStudentId && studentsResult?.items && (
                                    <div className="search-results-dropdown" style={{ border: '1px solid #ddd', borderRadius: '4px', marginTop: '5px', maxHeight: '150px', overflowY: 'auto', background: 'white' }}>
                                        {studentsResult.items.map(s => (
                                            <div
                                                key={s.id}
                                                onClick={() => {
                                                    setSelectedStudentId(s.id);
                                                    setStudentSearch(s.fullName);
                                                }}
                                                style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                                                className="hover-bg-light"
                                            >
                                                <strong>{s.fullName}</strong> - {s.studentNumber}
                                            </div>
                                        ))}
                                        {studentsResult.items.length === 0 && <div style={{ padding: '10px', color: '#888' }}>Aucun élève trouvé.</div>}
                                    </div>
                                )}
                                {selectedStudentId && <div style={{ color: 'var(--success)', fontSize: '12px', marginTop: '5px' }}><CheckCircle size={12} style={{ display: 'inline', marginBottom: '2px' }} /> Élève sélectionné</div>}
                            </div>

                            <div className="form-group">
                                <label>2. Choisir la Classe</label>
                                <select value={selectedClassroomId} onChange={e => setSelectedClassroomId(e.target.value)} required>
                                    <option value="">Sélectionner...</option>
                                    {classrooms.map(c => (
                                        <option key={c.id} value={c.id}>{c.name} ({c.studentCount}/{c.maxCapacity})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>3. Année Académique</label>
                                <select value={selectedYearId} onChange={e => setSelectedYearId(e.target.value)} required>
                                    {years?.map(y => (
                                        <option key={y.id} value={y.id}>{y.name} {y.isCurrent ? '(Actuelle)' : ''}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                            <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Annuler</button>
                            <button type="submit" className="btn-primary" disabled={enrollStudent.isPending || !selectedStudentId}>
                                {enrollStudent.isPending ? 'Inscription...' : 'Confirmer l\'inscription'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {showTransferForm && (
                <div className="card" style={{ marginBottom: '24px', border: '1px solid var(--warning)' }}>
                    <div className="card-header">
                        <h2 className="card-title">Transférer l'élève: {transferData.studentName}</h2>
                        <button className="btn-ghost" onClick={() => setShowTransferForm(false)}><X size={18} /></button>
                    </div>
                    <form onSubmit={handleTransferSubmit} style={{ padding: '20px' }}>
                        <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                            <div className="form-group">
                                <label>Classe Actuelle</label>
                                <input type="text" value={transferData.oldClassroomName} disabled />
                            </div>
                            <div className="form-group">
                                <label>Nouvelle Classe</label>
                                <select 
                                    value={transferData.newClassroomId} 
                                    onChange={e => setTransferData({ ...transferData, newClassroomId: e.target.value })} 
                                    required
                                >
                                    <option value="">Sélectionner une classe...</option>
                                    {classrooms
                                        .filter(c => c.name !== transferData.oldClassroomName)
                                        .map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))
                                    }
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                            <button type="button" className="btn-ghost" onClick={() => setShowTransferForm(false)}>Annuler</button>
                            <button type="submit" className="btn-primary" style={{ background: 'var(--warning)', color: 'black' }} disabled={transferStudent.isPending}>
                                {transferStudent.isPending ? 'Transfert en cours...' : 'Effectuer le transfert'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="card" style={{ padding: '0' }}>
                {isLoading ? (
                    <div className="loading-state" style={{ padding: '40px' }}>Chargement des inscriptions...</div>
                ) : allEnrollments.length > 0 ? (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Élève</th>
                                    <th>Matricule</th>
                                    <th>Classe</th>
                                    <th>Année Académique</th>
                                    <th>Date d'inscription</th>
                                    <th>Statut</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allEnrollments.map(e => (
                                    <tr key={e.id}>
                                        <td className="font-bold">{e.studentName}</td>
                                        <td><span className="badge-outline">{e.studentNumber}</span></td>
                                        <td>{e.classroomName}</td>
                                        <td>{e.academicYearName}</td>
                                        <td>{new Date(e.enrollmentDate).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`badge-${e.status === 'Active' ? 'success' : 'outline'}`}>
                                                {e.status === 'Active' ? 'Inscrit' : e.status}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            {e.status === 'Active' && (
                                                <button 
                                                    className="btn-ghost" 
                                                    style={{ color: 'var(--primary)', fontSize: '13px' }}
                                                    onClick={() => {
                                                        setTransferData({
                                                            enrollmentId: e.id,
                                                            studentId: e.studentId,
                                                            studentName: e.studentName,
                                                            oldClassroomName: e.classroomName,
                                                            academicYearId: years?.find(y => y.name === e.academicYearName)?.id || '',
                                                            newClassroomId: ''
                                                        });
                                                        setShowTransferForm(true);
                                                    }}
                                                >
                                                    Transférer
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty-state" style={{ padding: '60px', textAlign: 'center' }}>
                        <GraduationCap size={48} style={{ opacity: 0.2, margin: '0 auto 15px' }} />
                        <h3>Aucune inscription</h3>
                        <p>Commencez par inscrire des élèves dans les classes configurées.</p>
                        {!showForm && <button className="btn-primary" style={{ marginTop: '20px' }} onClick={() => setShowForm(true)}>Inscrire mon premier élève</button>}
                    </div>
                )}
            </div>
        </div>
    );
}
