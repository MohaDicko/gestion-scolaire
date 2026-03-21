import { useState, useEffect } from 'react';
import { Save, AlertCircle, BookOpen } from 'lucide-react';
import { useAcademicYears, useClassrooms } from '../hooks/useClassrooms';
import { useSubjects, useGrades, useSubmitGrades, GradeEntry } from '../hooks/useGrades';
import { useEnrollments } from '../hooks/useEnrollments';
import { toast } from '../../../store/toastStore';

export function GradesPage() {
    const { data: academicYears } = useAcademicYears();
    const { classrooms } = useClassrooms();
    const { data: subjects } = useSubjects();

    const [selectedYear, setSelectedYear] = useState<string>('');
    const [selectedClassroom, setSelectedClassroom] = useState<string>('');
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [semester, setSemester] = useState<number>(1);
    const [examType, setExamType] = useState<number>(0); // 0: Continuous, 1: Midterm, 2: Final
    const [maxScore, setMaxScore] = useState<number>(20);

    const { enrollments: students, isLoading: loadingStudents } = useEnrollments({
        classroomId: selectedClassroom,
        academicYearId: selectedYear
    });

    const { data: existingGrades, isLoading: loadingGrades } = useGrades(
        selectedClassroom,
        selectedSubject,
        selectedYear,
        semester,
        examType
    );

    const submitGradesMutation = useSubmitGrades();

    // Local state to store input values
    const [gradesForm, setGradesForm] = useState<Record<string, { score: string; comment: string }>>({});

    // When existingGrades or students change, initialize the form
    useEffect(() => {
        if (!students) return;
        const newForm: Record<string, { score: string; comment: string }> = {};
        students.forEach(student => {
            const existing = existingGrades?.find(g => g.studentId === student.studentId);
            newForm[student.studentId] = {
                score: existing ? existing.score.toString() : '',
                comment: existing?.comment || ''
            };
        });
        setGradesForm(newForm);
    }, [students, existingGrades]);

    // Handle input changes
    const handleGradeChange = (studentId: string, field: 'score' | 'comment', value: string) => {
        setGradesForm(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [field]: value
            }
        }));
    };

    const handleSave = async () => {
        if (!selectedSubject || !selectedYear || !selectedClassroom) return;

        const gradesToSubmit: GradeEntry[] = [];

        for (const [studentId, data] of Object.entries(gradesForm)) {
            const numScore = parseFloat(data.score);
            if (!isNaN(numScore)) {
                gradesToSubmit.push({
                    studentId,
                    score: numScore,
                    comment: data.comment || null
                });
            }
        }

        if (gradesToSubmit.length === 0) {
            toast.warning('Veuillez saisir au moins une note valide.');
            return;
        }

        try {
            await submitGradesMutation.mutateAsync({
                subjectId: selectedSubject,
                academicYearId: selectedYear,
                semester,
                examType,
                maxScore,
                grades: gradesToSubmit
            });
            toast.success('Notes enregistrées avec succès !');
        } catch (error) {
            toast.error("Erreur lors de l'enregistrement des notes.");
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Saisie des Notes</h1>
                    <p className="page-subtitle">Remplissez les grilles de notation des élèves.</p>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '20px' }}>
                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                    <div className="form-group">
                        <label>Année Académique</label>
                        <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                            <option value="">Sélectionner...</option>
                            {academicYears?.map(y => (
                                <option key={y.id} value={y.id}>{y.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Classe</label>
                        <select value={selectedClassroom} onChange={(e) => setSelectedClassroom(e.target.value)}>
                            <option value="">Sélectionner...</option>
                            {classrooms?.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Matière</label>
                        <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
                            <option value="">Sélectionner...</option>
                            {subjects?.map(s => (
                                <option key={s.id} value={s.id}>{s.name} (Coef: {s.coefficient})</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Semestre / Trimestre</label>
                        <select value={semester} onChange={(e) => setSemester(Number(e.target.value))}>
                            <option value={1}>Semestre 1</option>
                            <option value={2}>Semestre 2</option>
                            <option value={3}>Semestre 3</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Type d'Évaluation</label>
                        <select value={examType} onChange={(e) => setExamType(Number(e.target.value))}>
                            <option value={0}>Contrôle Continu / Interro</option>
                            <option value={1}>Devoir / Partiel</option>
                            <option value={2}>Examen Final</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Note sur (Barème)</label>
                        <input type="number" value={maxScore} onChange={(e) => setMaxScore(Number(e.target.value))} min={1} />
                    </div>
                </div>
            </div>

            {selectedClassroom && selectedSubject && selectedYear ? (
                <div className="card" style={{ padding: '0' }}>
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', borderBottom: '1px solid #efefef' }}>
                        <h3 className="card-title" style={{ margin: 0, fontSize: '16px' }}>
                            <BookOpen size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
                            Grille de Saisie ({students.length} élèves)
                        </h3>
                        <button
                            className="btn-primary"
                            style={{ background: 'var(--success)', padding: '8px 16px' }}
                            onClick={handleSave}
                            disabled={submitGradesMutation.isPending || loadingStudents || loadingGrades}
                        >
                            <Save size={16} style={{ marginRight: '6px' }} />
                            {submitGradesMutation.isPending ? 'Enregistrement...' : 'Enregistrer les notes'}
                        </button>
                    </div>

                    <div className="table-container">
                        {(loadingStudents || loadingGrades) ? (
                            <div className="loading-state">Chargement de la grille...</div>
                        ) : students.length > 0 ? (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '15%' }}>Matricule</th>
                                        <th style={{ width: '30%' }}>Nom Complet</th>
                                        <th style={{ width: '15%' }}>Note ( / {maxScore})</th>
                                        <th style={{ width: '40%' }}>Appréciation / Commentaire</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map(student => (
                                        <tr key={student.studentId}>
                                            <td className="font-mono text-primary text-sm">{student.studentNumber}</td>
                                            <td className="font-bold">{student.studentName}</td>
                                            <td>
                                                <input
                                                    type="number"
                                                    style={{ width: '80px', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                    min={0}
                                                    max={maxScore}
                                                    step={0.5}
                                                    value={gradesForm[student.studentId]?.score ?? ''}
                                                    onChange={e => handleGradeChange(student.studentId, 'score', e.target.value)}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                    placeholder="Optionnel..."
                                                    value={gradesForm[student.studentId]?.comment ?? ''}
                                                    onChange={e => handleGradeChange(student.studentId, 'comment', e.target.value)}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="empty-state" style={{ padding: '30px', textAlign: 'center' }}>
                                <p>Aucun élève trouvé dans cette classe pour cette année.</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="card text-center" style={{ padding: '40px', color: '#666' }}>
                    <AlertCircle size={48} style={{ margin: '0 auto 15px', opacity: 0.3 }} />
                    <p>Veuillez sélectionner l'année, la classe et la matière pour afficher la grille de saisie.</p>
                </div>
            )}
        </div>
    );
}
