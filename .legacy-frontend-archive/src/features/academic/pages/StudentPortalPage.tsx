import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    GraduationCap, UserCheck, DollarSign, Clock,
    AlertCircle, CheckCircle, BookOpen,
    Calendar, ArrowLeft, Download, CreditCard, ClipboardCheck,
    ShieldAlert, X, Gavel
} from 'lucide-react';
import { useStudentPortal, useAddSanction } from '../hooks/useStudentPortal';
import { useAcademicYears, AcademicYear } from '../hooks/useClassrooms';
import { toast } from '../../../store/toastStore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatCurrency = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n);

const STATUS_STYLE: Record<string, { color: string; bg: string; label: string }> = {
    Present: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', label: 'Présent' },
    Absent: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'Absent' },
    Late: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Retard' },
    Excused: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', label: 'Excusé' },
};

const INVOICE_STATUS: Record<string, { color: string; label: string; bg: string }> = {
    Paid: { color: '#10b981', label: 'PAYÉ', bg: 'rgba(16,185,129,0.1)' },
    Unpaid: { color: '#ef4444', label: 'IMPAYÉ', bg: 'rgba(239,68,68,0.1)' },
    PartiallyPaid: { color: '#f59e0b', label: 'PARTIEL', bg: 'rgba(245,158,11,0.1)' },
    Overdue: { color: '#dc2626', label: 'RETARD', bg: 'rgba(220,38,38,0.1)' },
};

const SANCTION_COLORS: Record<string, string> = {
    Warning: '#f59e0b',
    Blame: '#f97316',
    Detention: '#ef4444',
    Suspension: '#991b1b',
    Expulsion: '#000000'
};

export function StudentPortalPage() {
    const { id } = useParams<{ id: string }>();
    const { data, isLoading, error } = useStudentPortal(id!);
    const { data: years } = useAcademicYears();
    const addSanction = useAddSanction();

    const [showSanctionModal, setShowSanctionModal] = useState(false);
    const [sanctionForm, setSanctionForm] = useState({
        type: 1,
        reason: '',
        dateIncurred: new Date().toISOString().split('T')[0],
        durationDays: 0,
        remarks: ''
    });

    const handlePrintPDF = () => {
        if (!data) return;
        const doc = new jsPDF();
        const maxBarème = data.maxSectionGrade || 20;

        doc.setFillColor(41, 128, 185);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setFontSize(24); doc.setTextColor(255, 255, 255);
        doc.text('RELEVÉ DE NOTES', 105, 25, { align: 'center' });
        
        doc.setFontSize(12); doc.setTextColor(60, 60, 60);
        doc.text(`Élève : ${data.fullName}`, 14, 50);
        doc.text(`Matricule : ${data.studentNumber}`, 14, 57);
        doc.text(`Classe : ${data.className}`, 120, 50);
        doc.text(`Année Scolaire : ${data.academicYear}`, 120, 57);

        doc.setFillColor(245, 247, 250);
        doc.roundedRect(14, 65, 182, 20, 3, 3, 'F');
        doc.setFontSize(16); doc.setTextColor(41, 128, 185);
        doc.text(`Moyenne Générale : ${data.averageGrade ?? '—'} / ${maxBarème}`, 105, 78, { align: 'center' });

        autoTable(doc, {
            startY: 95,
            head: [['Matière', 'Moyenne Obtenue', 'Barème']],
            body: data.grades.map(g => [
                g.subjectName,
                g.average.toFixed(2),
                `/${g.maxScore}`
            ]),
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185], halign: 'center' },
            styles: { fontSize: 11, cellPadding: 5 }
        });

        doc.save(`Dossier_${data.fullName.replace(/\s+/g, '_')}.pdf`);
    };

    const handleAddSanction = async (e: React.FormEvent) => {
        e.preventDefault();
        const currentYearId = years?.find((y: AcademicYear) => y.isCurrent)?.id || years?.[0]?.id;
        if (!currentYearId) {
            toast.error("Aucune année académique active trouvée.");
            return;
        }

        try {
            await addSanction.mutateAsync({
                studentId: id,
                academicYearId: currentYearId,
                type: Number(sanctionForm.type),
                reason: sanctionForm.reason,
                dateIncurred: sanctionForm.dateIncurred,
                durationDays: sanctionForm.durationDays > 0 ? sanctionForm.durationDays : null,
                remarks: sanctionForm.remarks
            });
            setShowSanctionModal(false);
            setSanctionForm({ type: 1, reason: '', dateIncurred: new Date().toISOString().split('T')[0], durationDays: 0, remarks: '' });
            toast.success("Sanction enregistrée !");
        } catch (err: any) {
            toast.error("Erreur lors de l'enregistrement de la sanction.");
        }
    };

    if (isLoading) return (
        <div className="flex items-center justify-center h-screen bg-slate-50">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-sm font-medium text-slate-500">Ouverture du dossier scolaire...</p>
            </div>
        </div>
    );

    if (error || !data) return (
        <div className="page p-8 text-center">
            <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <AlertCircle size={48} className="text-danger mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Accès Impossible</h2>
                <p className="text-slate-500 mb-6 font-medium">Erreur de synchronisation du dossier.</p>
                <Link to="/academic/students" className="btn-primary w-full flex justify-center items-center gap-2">
                    <ArrowLeft size={18} /> Retour
                </Link>
            </div>
        </div>
    );

    const maxBarème = data.maxSectionGrade || 20;
    const avgNormalized = data.averageGrade !== null ? data.averageGrade : null;
    const successRatio = avgNormalized !== null ? (avgNormalized / maxBarème) : 0;
    const avgColor = avgNormalized === null ? 'var(--text-muted)' :
        successRatio >= 0.7 ? '#10b981' : successRatio >= 0.5 ? '#f59e0b' : '#ef4444';

    return (
        <div className="page bg-slate-50 min-h-screen">
            <div className="page-header bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8 mt-2 mx-4 flex flex-wrap gap-5 justify-between">
                <div className="flex items-center gap-5">
                    <Link to="/academic/students" className="flex p-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                        <ArrowLeft size={20} className="text-slate-600" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black text-slate-800">{data.fullName}</h1>
                            <span className="badge-primary text-[10px] py-0.5">DOSSIER PREMIUM</span>
                        </div>
                        <p className="text-slate-500 font-medium text-sm mt-1">
                            {data.studentNumber} &bull; {data.className} &bull; {data.academicYear}
                        </p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button className="btn-ghost border border-slate-200 text-slate-700 flex items-center gap-2" onClick={() => setShowSanctionModal(true)}>
                        <ShieldAlert size={18} className="text-danger" /> Ajouter Sanction
                    </button>
                    <button className="btn-primary flex items-center gap-2 px-6 shadow-lg shadow-primary/20" onClick={handlePrintPDF}>
                        <Download size={18} /> Télécharger Dossier
                    </button>
                </div>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl" style={{ background: `${avgColor}15`, color: avgColor }}>
                         <GraduationCap size={32} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Moyenne / {maxBarème}</p>
                        <h3 className="text-lg font-black" style={{ color: avgColor }}>{avgNormalized !== null ? avgNormalized : '—'}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-red-50 text-red-500">
                        <UserCheck size={32} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Absences (30j)</p>
                        <h3 className="text-xl font-black text-red-600">{data.totalAbsences}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-amber-50 text-amber-500">
                        <Clock size={32} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sanctions</p>
                        <h3 className="text-sm font-black text-slate-600">{data.sanctions.length} Dossiers</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-emerald-50 text-emerald-500 text-lg">
                        <CreditCard size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Solde</p>
                        <h3 className="text-sm font-black text-slate-600">{formatCurrency(data.totalOutstanding)}</h3>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 px-4 pb-12">
                <div className="space-y-8">
                    {/* Notes Detail */}
                    <div className="card shadow-sm border-none rounded-3xl p-8 bg-white">
                        <h3 className="text-lg font-black flex items-center gap-3 mb-8">
                            <BookOpen size={22} className="text-primary" /> Moyennes par matière
                        </h3>
                        <div className="space-y-5">
                            {data.grades.map(g => {
                                const ratio = g.maxScore > 0 ? g.average / g.maxScore : 0;
                                const barColor = ratio >= 0.7 ? '#10b981' : ratio >= 0.5 ? '#f59e0b' : '#ef4444';
                                return (
                                    <div key={g.subjectName}>
                                        <div className="flex justify-between items-center mb-1.5 text-xs font-bold">
                                            <span className="text-slate-600">{g.subjectName}</span>
                                            <span style={{ color: barColor }}>{g.average.toFixed(2)} / {g.maxScore}</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full" style={{ width: `${ratio * 100}%`, background: barColor }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Sanctions List */}
                    <div className="card shadow-sm border-none rounded-3xl p-8 bg-white">
                        <h3 className="text-lg font-black flex items-center gap-3 mb-6">
                            <Gavel size={22} className="text-danger" /> Vie Scolaire & Discipline
                        </h3>
                        {data.sanctions.length === 0 ? (
                            <div className="text-center py-8 opacity-40">
                                <CheckCircle size={32} className="mx-auto mb-2 text-success" />
                                <p className="text-xs font-bold">Élève sans antécédent disciplinaire.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {data.sanctions.map(s => (
                                    <div key={s.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${SANCTION_COLORS[s.type]}20`, color: SANCTION_COLORS[s.type] }}>
                                            <ShieldAlert size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between mb-1">
                                                <p className="text-sm font-black text-slate-800">{s.type}</p>
                                                <p className="text-[10px] font-bold text-slate-400">{new Date(s.date).toLocaleDateString()}</p>
                                            </div>
                                            <p className="text-xs text-slate-600 leading-relaxed">{s.reason}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-8">
                     {/* Programme du jour */}
                     <div className="card shadow-sm border-none rounded-3xl p-8 bg-white">
                        <h3 className="text-lg font-black flex items-center gap-3 mb-6">
                            <Calendar size={22} className="text-primary" /> Emploi du temps
                        </h3>
                        <div className="space-y-4">
                            {data.todaySchedule.length === 0 ? (
                                <div className="p-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    <CheckCircle size={32} className="text-success mx-auto mb-3 opacity-40" />
                                    <p className="text-slate-400 font-bold text-sm">Repos ou temps libre</p>
                                </div>
                            ) : (
                                data.todaySchedule.map((s, i) => (
                                    <div key={i} className="flex items-center gap-5 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="min-w-[80px] bg-white p-2 rounded-xl text-center shadow-sm border border-slate-200">
                                            <p className="text-xs font-black text-primary">{s.startTime}</p>
                                            <p className="text-[10px] text-slate-400 font-bold tracking-tighter">{s.endTime}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-800">{s.subjectName}</p>
                                            <p className="text-xs text-slate-500 font-medium">Prof. {s.teacherName}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Attendance Heatmap */}
                    <div className="card shadow-sm border-none rounded-3xl p-8 bg-white">
                        <h3 className="text-lg font-black flex items-center gap-3 mb-6">
                            <ClipboardCheck size={22} className="text-primary" /> Présences Recentes
                        </h3>
                        <div className="grid grid-cols-7 gap-2">
                            {data.recentAttendance.map((a, i) => {
                                const st = STATUS_STYLE[a.status] || STATUS_STYLE['Present'];
                                return (
                                    <div key={i} className="group relative flex flex-col items-center">
                                        <div className="w-8 h-8 rounded-lg shadow-sm mb-1" style={{ background: st.bg, border: `1px solid ${st.color}30` }}></div>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">{new Date(a.date).toLocaleDateString('fr-FR', { day: '2-digit' })}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Finances Simple */}
                    <div className="card shadow-sm border-none rounded-3xl p-8 bg-slate-900 text-white">
                        <h3 className="text-lg font-black flex items-center gap-3 mb-6">
                            <DollarSign size={22} className="text-amber-400" /> État des Frais
                        </h3>
                        <div className="space-y-3">
                            {data.invoices.map(inv => {
                                const st = INVOICE_STATUS[inv.status] || { color: '#fff', label: inv.status, bg: 'transparent' };
                                return (
                                    <div key={inv.invoiceId} className="flex justify-between items-center p-4 bg-white/10 rounded-2xl border border-white/5">
                                        <p className="text-sm font-bold">{inv.description}</p>
                                        <span className="text-[9px] font-black px-2 py-1 rounded-lg" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sanction Modal */}
            {showSanctionModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-up">
                        <div className="bg-slate-50 p-6 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="text-lg font-black flex items-center gap-3 text-danger"><ShieldAlert size={24} /> Notifier une Sanction</h3>
                            <button className="p-2 hover:bg-slate-200 rounded-full" onClick={() => setShowSanctionModal(false)}><X size={20}/></button>
                        </div>
                        <form onSubmit={handleAddSanction} className="p-8 space-y-6">
                             <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="text-xs font-black text-slate-500 uppercase mb-2 block">Type</label>
                                    <select className="w-full bg-slate-100 border-none rounded-xl p-3 text-sm font-bold" value={sanctionForm.type} onChange={e => setSanctionForm({ ...sanctionForm, type: Number(e.target.value) })}>
                                        <option value={1}>Avertissement</option>
                                        <option value={2}>Blâme</option>
                                        <option value={3}>Consigne</option>
                                        <option value={4}>Exclusion Temp.</option>
                                        <option value={5}>Exclusion Déf.</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="text-xs font-black text-slate-500 uppercase mb-2 block">Date</label>
                                    <input type="date" className="w-full bg-slate-100 border-none rounded-xl p-3 text-sm font-bold" value={sanctionForm.dateIncurred} onChange={e => setSanctionForm({ ...sanctionForm, dateIncurred: e.target.value })} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="text-xs font-black text-slate-500 uppercase mb-2 block">Motif</label>
                                <textarea className="w-full bg-slate-100 border-none rounded-xl p-4 text-sm font-medium min-h-[100px]" placeholder="Motif de la sanction..." value={sanctionForm.reason} onChange={e => setSanctionForm({ ...sanctionForm, reason: e.target.value })} required />
                            </div>
                            <button type="submit" className="btn-primary w-full py-4 font-black flex items-center justify-center gap-3">
                                <ShieldAlert size={20} /> Enregistrer la Sanction
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
