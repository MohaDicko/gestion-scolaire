import React, { useState } from 'react';
import { Users, Plus, Search, FileDown, FileUp, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGetStudents, useCreateStudent } from '../hooks/useStudents';
import { useAcademicYears, useClassrooms, useCampuses } from '../hooks/useClassrooms';
import { useEnrollments } from '../hooks/useEnrollments';
import { X, Check, Download } from 'lucide-react';
import { exportToExcel } from '../../../lib/excelExport';
import { apiClient } from '../../../lib/apiClient';
import { toast } from '../../../store/toastStore';

export function StudentsPage() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const { data: result, isLoading, error } = useGetStudents({
        search: searchTerm,
        pageNumber: page,
        pageSize: 10
    });

    const createStudent = useCreateStudent();
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: 'Male' as 'Male' | 'Female' | 'Other',
        nationalId: '',
        parentName: '',
        parentPhone: '',
        parentEmail: '',
        parentRelationship: 'Father',
        campusId: ''
    });
    const [enrollData, setEnrollData] = useState({
        academicYearId: '',
        classroomId: ''
    });

    const { data: academicYears } = useAcademicYears();
    const { classrooms } = useClassrooms();
    const { data: campuses } = useCampuses();
    const { enrollStudent } = useEnrollments();

    const [isImporting, setIsImporting] = useState(false);

    // Handle Export Excellence
    const [selectedExportClassId, setSelectedExportClassId] = useState('');

    const handleExportExcellence = async () => {
        if (!selectedExportClassId) {
            toast.warning("Veuillez d'abord sélectionner une classe dans le filtre Export.");
            return;
        }
        try {
            const response = await apiClient.get(
                `/academic/classrooms/${selectedExportClassId}/students/export-high-performers?minScore=15`,
                { responseType: 'blob' }
            );
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Tableau_Excellence_${selectedExportClassId.substring(0, 5)}.xlsx`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            toast.error("Erreur lors de l'exportation.");
        }
    };

    const handleExportAll = async () => {
        try {
            const { data } = await apiClient.get('/academic/students?pageSize=1000');
            const students = data.items.map((s: any) => ({
                'Matricule': s.studentNumber,
                'Prénom': s.firstName,
                'Nom': s.lastName,
                'Genre': s.gender,
                'Date Naissance': new Date(s.dateOfBirth).toLocaleDateString(),
                'Parent': s.parentName,
                'Téléphone Parent': s.parentPhone,
                'Email Parent': s.parentEmail,
                'Statut': s.isActive ? 'Actif' : 'Inactif'
            }));
            exportToExcel(students, 'Liste_Globale_Eleves', 'Students');
        } catch (e) {
            toast.error("Erreur lors de l'exportation.");
        }
    };

    // Handle Import
    const [importSettings, setImportSettings] = useState({ classroomId: '', academicYearId: '' });

    const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!importSettings.classroomId || !importSettings.academicYearId) {
            toast.warning("Veuillez sélectionner une classe et une année pour l'import.");
            return;
        }

        setIsImporting(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('academicYearId', importSettings.academicYearId);

        try {
            await apiClient.post(
                `/academic/classrooms/${importSettings.classroomId}/students/import`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            toast.success('Importation réussie !');
            e.target.value = ''; // Reset input
        } catch (err) {
            toast.error("Erreur d'importation. Vérifiez le format du fichier.");
        } finally {
            setIsImporting(false);
        }
    };

    // Auto-select campus if classroom is chosen
    const handleClassroomChange = (cid: string) => {
        setEnrollData({ ...enrollData, classroomId: cid });
        if (cid) {
            const cls = classrooms.find(c => c.id === cid);
            if (cls) {
                // Find campus by name if ID is not in classroom (we only have names in DTO)
                // Actually, I should probably have added campusId to ClassroomDto but I added campusName.
                // However, the selected campus should ideally be explicitly selected or derived.
                const matchedCampus = campuses?.find(cp => cp.name === cls.campusName);
                if (matchedCampus) {
                    setFormData(prev => ({ ...prev, campusId: matchedCampus.id }));
                }
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.campusId) {
            toast.warning("Le Campus (Site) est obligatoire.");
            return;
        }
        try {
            const studentId = await createStudent.mutateAsync(formData);

            // Auto-enroll if class and year selected
            if (enrollData.academicYearId && enrollData.classroomId && studentId) {
                await enrollStudent.mutateAsync({
                    studentId: typeof studentId === 'object' ? (studentId as any).id || studentId : studentId,
                    classroomId: enrollData.classroomId,
                    academicYearId: enrollData.academicYearId
                });
            }

            setShowForm(false);
            setFormData({
                firstName: '',
                lastName: '',
                dateOfBirth: '',
                gender: 'Male',
                nationalId: '',
                parentName: '',
                parentPhone: '',
                parentEmail: '',
                parentRelationship: 'Father',
                campusId: ''
            });
            setEnrollData({ academicYearId: '', classroomId: '' });
            toast.success('Élève créé et inscrit avec succès !');
        } catch (err: any) {
            toast.error(`Erreur lors de la création de l'élève : ${err?.response?.data?.Message || err.message}`);
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Gestion des Élèves</h1>
                    <p className="page-subtitle">Visualisez et gérez les effectifs scolaires</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <select 
                            style={{ fontSize: '11px', padding: '4px' }}
                            value={importSettings.academicYearId} 
                            onChange={e => setImportSettings({...importSettings, academicYearId: e.target.value})}
                        >
                            <option value="">Année pour Import</option>
                            {academicYears?.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                        </select>
                        <select 
                            style={{ fontSize: '11px', padding: '4px' }}
                            value={importSettings.classroomId} 
                            onChange={e => setImportSettings({...importSettings, classroomId: e.target.value})}
                        >
                            <option value="">Classe pour Import</option>
                            {classrooms?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <label className="btn-primary" style={{ cursor: 'pointer', height: 'fit-content' }}>
                        <FileUp size={16} /> {isImporting ? 'Importation...' : 'Import Excel'}
                        <input type="file" hidden onChange={handleFileImport} accept=".xlsx" />
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                         <select 
                            style={{ fontSize: '11px', padding: '4px' }}
                            value={selectedExportClassId} 
                            onChange={e => setSelectedExportClassId(e.target.value)}
                        >
                            <option value="">Classe pour Export</option>
                            {classrooms?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <button onClick={handleExportExcellence} className="btn-primary" style={{ background: 'var(--success)', height: 'fit-content' }}>
                            <FileDown size={16} /> Export Excellence
                        </button>
                    </div>
                    <button className="btn-primary" style={{ height: 'fit-content' }} onClick={() => setShowForm(true)}><Plus size={16} /> Ajouter</button>
                </div>
            </div>

            {showForm && (
                <div className="card shadow-lg animate-up" style={{ marginBottom: '25px', border: '1px solid var(--primary-light)' }}>
                    <div className="card-header" style={{ background: 'var(--bg-2)', borderBottom: '1px solid var(--border)' }}>
                        <h2 className="card-title">Enregistrement d'un Nouvel Élève</h2>
                        <button className="btn-ghost" onClick={() => setShowForm(false)} title="Fermer"><X size={18} /></button>
                    </div>
                    <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
                        <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                            <div className="form-group">
                                <label>Prénom</label>
                                <input type="text" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Nom</label>
                                <input type="text" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Date de Naissance</label>
                                <input type="date" value={formData.dateOfBirth} onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Genre</label>
                                <select value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value as any })} required>
                                    <option value="Male">Masculin</option>
                                    <option value="Female">Féminin</option>
                                    <option value="Other">Autre</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>ID National / Matricule Prévu</label>
                                <input type="text" value={formData.nationalId} onChange={e => setFormData({ ...formData, nationalId: e.target.value })} required placeholder="Ex: MAT12345" />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Home size={14} className="text-primary" /> Campus (Site d'inscription)</label>
                                <select value={formData.campusId} onChange={e => setFormData({ ...formData, campusId: e.target.value })} required>
                                    <option value="">-- Choisir le site --</option>
                                    {campuses?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div style={{ marginTop: '25px', backgroundColor: 'var(--bg-2)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <h3 style={{ margin: '0 0 15px', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Check size={18} className="text-success" /> Affectation Scolaire Immédiate
                            </h3>
                            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                                <div className="form-group">
                                    <label>Année Académique</label>
                                    <select value={enrollData.academicYearId} onChange={e => setEnrollData({ ...enrollData, academicYearId: e.target.value })}>
                                        <option value="">Ignorer l'inscription pour l'instant</option>
                                        {academicYears?.map(y => (
                                            <option key={y.id} value={y.id}>{y.name} {y.isCurrent ? '(Actuelle)' : ''}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Classe (Affectation)</label>
                                    <select value={enrollData.classroomId} onChange={e => handleClassroomChange(e.target.value)}>
                                        <option value="">Sélectionner une classe...</option>
                                        {classrooms?.map(c => (
                                            <option key={c.id} value={c.id}>{c.name} ({c.level})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            {enrollData.classroomId && (
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '10px' }}>
                                    L'élève sera inscrit dans cette classe et son campus sera automatiquement synchronisé avec celui de la salle sélectionnée.
                                </p>
                            )}
                        </div>

                        <div style={{ marginTop: '25px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                            <h3 style={{ margin: '0 0 15px', fontSize: '14px', fontWeight: 'bold' }}>Parent / Tuteur</h3>
                            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                                <div className="form-group">
                                    <label>Nom du Parent</label>
                                    <input type="text" value={formData.parentName} onChange={e => setFormData({ ...formData, parentName: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Téléphone Mobile</label>
                                    <input type="tel" value={formData.parentPhone} onChange={e => setFormData({ ...formData, parentPhone: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Email Parent</label>
                                    <input type="email" value={formData.parentEmail} onChange={e => setFormData({ ...formData, parentEmail: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Relation</label>
                                    <input type="text" value={formData.parentRelationship} onChange={e => setFormData({ ...formData, parentRelationship: e.target.value })} placeholder="Ex: Père, Mère" required />
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '35px' }}>
                            <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Annuler</button>
                            <button type="submit" className="btn-primary" disabled={createStudent.isPending} style={{ paddingLeft: '25px', paddingRight: '25px' }}>
                                {createStudent.isPending ? 'Enregistrement...' : 'Confirmer l\'Inscription'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="card shadow-sm" style={{ padding: '0' }}>
                <div className="table-toolbar" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="search-box" style={{ maxWidth: '400px' }}>
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Rechercher par nom ou matricule..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                    <div className="flex gap-4">
                        <button className="btn-ghost" onClick={handleExportAll}>
                            <Download size={16} /> Excel Complet
                        </button>
                    </div>
                </div>

                <div className="table-container">
                    {isLoading ? (
                        <div className="loading-state">Initialisation des effectifs...</div>
                    ) : error ? (
                        <div className="error-state">Erreur lors de la récupération des élèves.</div>
                    ) : result?.items.length ? (
                        <>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>N° Matricule</th>
                                        <th>Élève</th>
                                        <th>Genre</th>
                                        <th>Naissance</th>
                                        <th>Parent / Tuteur</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.items.map(student => (
                                        <tr key={student.id}>
                                            <td className="font-mono text-primary" style={{ fontSize: '13px' }}>{student.studentNumber}</td>
                                            <td>
                                                <div className="font-bold">{student.firstName} {student.lastName}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{student.nationalId}</div>
                                            </td>
                                            <td><span className={`badge-${student.gender.toLowerCase() === 'male' ? 'blue' : 'pink'}`}>{student.gender}</span></td>
                                            <td>{new Date(student.dateOfBirth).toLocaleDateString()}</td>
                                            <td>
                                                <div style={{ fontSize: '13px' }}>{student.parentName}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{student.parentPhone}</div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div className="flex justify-end gap-2">
                                                    <button className="btn-ghost text-primary" onClick={() => navigate(`/academic/students/${student.id}/portal`)} title="Portail">Portail</button>
                                                    <button className="btn-ghost" onClick={() => navigate(`/academic/students/${student.id}`)} title="Bulletin">Bulletin</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            
                            <div className="pagination" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)' }}>
                                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Affichage de {result.items.length} sur {result.totalCount} élèves</span>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        disabled={page === 1}
                                        onClick={() => setPage(p => p - 1)}
                                        className="btn-ghost"
                                        style={{ border: '1px solid var(--border)' }}
                                    >Précédent</button>
                                    <div style={{ padding: '6px 12px', background: 'var(--primary)', color: 'white', borderRadius: '6px', fontWeight: 600 }}>{page}</div>
                                    <button
                                        disabled={page >= result.totalPages}
                                        onClick={() => setPage(p => p + 1)}
                                        className="btn-ghost"
                                        style={{ border: '1px solid var(--border)' }}
                                    >Suivant</button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="empty-state" style={{ padding: '80px', textAlign: 'center' }}>
                            <Users size={64} style={{ opacity: 0.1, margin: '0 auto 20px' }} />
                            <h3>Aucun élève dans la base</h3>
                            <p>Vous n'avez pas encore d'élèves enregistrés pour ce filtre.</p>
                            <button className="btn-primary" style={{ marginTop: '20px' }} onClick={() => setShowForm(true)}>Ajouter un élève</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
