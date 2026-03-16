import { useParams, Link } from 'react-router-dom';
import {
    GraduationCap, UserCheck, DollarSign, Clock,
    AlertCircle, CheckCircle, BookOpen,
    Calendar, ArrowLeft, Download
} from 'lucide-react';
import { useStudentPortal } from '../hooks/useStudentPortal';
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

const INVOICE_STATUS: Record<string, { color: string; label: string }> = {
    Paid: { color: '#10b981', label: 'Payé' },
    Unpaid: { color: '#ef4444', label: 'Non payé' },
    PartiallyPaid: { color: '#f59e0b', label: 'Partiel' },
    Overdue: { color: '#dc2626', label: 'En retard' },
};

export function StudentPortalPage() {
    const { id } = useParams<{ id: string }>();
    const { data, isLoading, error } = useStudentPortal(id!);

    const handlePrintPDF = () => {
        if (!data) return;
        const doc = new jsPDF();

        // Header
        doc.setFontSize(22); doc.setTextColor(41, 128, 185);
        doc.text('BULLETIN SCOLAIRE', 105, 20, { align: 'center' });
        doc.setFontSize(12); doc.setTextColor(60, 60, 60);
        doc.text(`Élève : ${data.fullName}  |  Classe : ${data.className}`, 14, 32);
        doc.text(`Matricule : ${data.studentNumber}  |  Année : ${data.academicYear}`, 14, 39);

        // Average
        doc.setFontSize(16); doc.setTextColor(39, 174, 96);
        doc.text(`Moyenne Générale : ${data.averageGrade ?? '—'} / 20`, 105, 52, { align: 'center' });

        // Grades table
        autoTable(doc, {
            startY: 60,
            head: [['Matière', 'Moyenne (/20)', 'Barème']],
            body: data.grades.map(g => [
                g.subjectName,
                ((g.average / g.maxScore) * 20).toFixed(2),
                `/${g.maxScore}`
            ]),
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185] },
            styles: { fontSize: 11 }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 15;
        doc.setFontSize(10); doc.setTextColor(100, 100, 100);
        doc.text("Signature de l'Administration :", 14, finalY);

        doc.save(`Bulletin_${data.fullName.replace(/\s+/g, '_')}.pdf`);
    };

    if (isLoading) return <div className="page"><div className="loading-state">Chargement du portail...</div></div>;
    if (error || !data) return <div className="page"><div className="empty-state"><AlertCircle size={48} /><h2>Erreur chargement</h2></div></div>;

    const avgNormalized = data.averageGrade !== null ? Math.round(data.averageGrade * 10) / 10 : null;
    const avgColor = avgNormalized === null ? 'var(--text-muted)' :
        avgNormalized >= 14 ? '#10b981' : avgNormalized >= 10 ? '#f59e0b' : '#ef4444';

    return (
        <div className="page">
            {/* Header */}
            <div className="page-header" style={{ flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Link to="/academic/students" style={{ color: 'var(--text-muted)', display: 'flex' }}>
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="page-title">{data.fullName}</h1>
                        <p className="page-subtitle">
                            Matricule: {data.studentNumber} &bull; Classe: {data.className} &bull; {data.academicYear}
                        </p>
                    </div>
                </div>
                <button className="btn-primary" onClick={handlePrintPDF}>
                    <Download size={16} /> Imprimer Bulletin PDF
                </button>
            </div>

            {/* KPI Row */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', marginBottom: '24px' }}>
                <div className="stat-card">
                    <div className="stat-info">
                        <span className="stat-label">Moyenne générale</span>
                        <span className="stat-value" style={{ color: avgColor }}>
                            {avgNormalized !== null ? `${avgNormalized} / 20` : '—'}
                        </span>
                    </div>
                    <div className="stat-icon" style={{ background: 'var(--primary-dim)', color: 'var(--primary)' }}>
                        <GraduationCap size={24} />
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-info">
                        <span className="stat-label">Absences (30j)</span>
                        <span className="stat-value" style={{ color: data.totalAbsences > 3 ? '#ef4444' : 'var(--text)' }}>{data.totalAbsences}</span>
                    </div>
                    <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                        <UserCheck size={24} />
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-info">
                        <span className="stat-label">Solde impayé</span>
                        <span className="stat-value" style={{ color: data.totalOutstanding > 0 ? '#f59e0b' : '#10b981' }}>
                            {formatCurrency(data.totalOutstanding)}
                        </span>
                    </div>
                    <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                        <DollarSign size={24} />
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-info">
                        <span className="stat-label">Cours aujourd'hui</span>
                        <span className="stat-value">{data.todaySchedule.length}</span>
                    </div>
                    <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
                        <Clock size={24} />
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Grades Card */}
                <div className="card">
                    <h3 className="card-title" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BookOpen size={18} className="text-primary" /> Notes par matière
                    </h3>
                    {data.grades.length === 0 ? (
                        <p className="text-muted text-center">Aucune note enregistrée.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {data.grades.map(g => {
                                const pct = g.maxScore > 0 ? g.average / g.maxScore : 0;
                                const normalized = Math.round(pct * 20 * 10) / 10;
                                const color = normalized >= 14 ? '#10b981' : normalized >= 10 ? '#f59e0b' : '#ef4444';
                                return (
                                    <div key={g.subjectName}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                                            <span style={{ fontWeight: 600 }}>{g.subjectName}</span>
                                            <span style={{ fontWeight: 700, color }}>{normalized} / 20</span>
                                        </div>
                                        <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${pct * 100}%`, background: color, borderRadius: '3px', transition: 'width 0.5s' }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Today's Schedule */}
                <div className="card">
                    <h3 className="card-title" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={18} className="text-primary" /> Programme du jour
                    </h3>
                    {data.todaySchedule.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0' }}>
                            <CheckCircle size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                            <p style={{ margin: 0, fontSize: '13px' }}>Pas de cours aujourd'hui 🎉</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {data.todaySchedule.map((s, i) => (
                                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '10px 12px', background: 'var(--bg-color)', borderRadius: '8px', borderLeft: '3px solid var(--primary)' }}>
                                    <div style={{ textAlign: 'center', minWidth: '70px' }}>
                                        <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--primary)' }}>{s.startTime}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.endTime}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '14px' }}>{s.subjectName}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Prof. {s.teacherName}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Attendance */}
                <div className="card">
                    <h3 className="card-title" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <UserCheck size={18} className="text-primary" /> Présences récentes (30j)
                    </h3>
                    {data.recentAttendance.length === 0 ? (
                        <p className="text-muted text-center">Aucun enregistrement.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '220px', overflowY: 'auto' }}>
                            {data.recentAttendance.map((a, i) => {
                                const style = STATUS_STYLE[a.status] || STATUS_STYLE['Present'];
                                return (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderRadius: '6px', background: 'var(--bg-color)' }}>
                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                            {new Date(a.date).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })}
                                        </span>
                                        <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: style.bg, color: style.color }}>
                                            {style.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Invoices */}
                <div className="card">
                    <h3 className="card-title" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <DollarSign size={18} className="text-primary" /> Frais scolaires
                    </h3>
                    {data.invoices.length === 0 ? (
                        <p className="text-muted text-center">Aucune facture.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                            {data.invoices.map(inv => {
                                const st = INVOICE_STATUS[inv.status] || { color: '#6b7280', label: inv.status };
                                const outstanding = inv.amount - inv.amountPaid;
                                return (
                                    <div key={inv.invoiceId} style={{ padding: '10px 12px', background: 'var(--bg-color)', borderRadius: '8px', borderLeft: `3px solid ${st.color}` }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <span style={{ fontWeight: 600, fontSize: '13px' }}>{inv.description}</span>
                                            <span style={{ fontSize: '11px', fontWeight: 700, color: st.color }}>{st.label}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                                            <span>Total: {formatCurrency(inv.amount)}</span>
                                            {outstanding > 0 && <span style={{ color: '#ef4444' }}>Reste: {formatCurrency(outstanding)}</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
