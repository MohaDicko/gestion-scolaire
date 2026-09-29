'use client';

import { useState, useEffect, useCallback } from 'react';
import { CalendarDays, Plus, Clock, Trash2, Edit2, Loader2, X, AlertCircle, Printer, Download, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const DAYS = [
  { id: 1, label: 'Lundi' },
  { id: 2, label: 'Mardi' },
  { id: 3, label: 'Mercredi' },
  { id: 4, label: 'Jeudi' },
  { id: 5, label: 'Vendredi' },
  { id: 6, label: 'Samedi' },
];

export default function TimetablePage() {
    const router = useRouter();
    const toast = useToast();
    
    const [classrooms, setClassrooms] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    
    const [selectedClassroom, setSelectedClassroom] = useState('');
    const [schedule, setSchedule] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [schoolType, setSchoolType] = useState<string | null>(null);
    const isAgroOrTech = schoolType === 'AGRO' || schoolType === 'TECHNIQUE';
    const [formData, setFormData] = useState({
        dayOfWeek: '1',
        startTime: '08:00',
        endTime: '10:00',
        subjectId: '',
        employeeId: ''
    });

    const fetchDropdownData = useCallback(async () => {
        try {
            const [classRes, subRes, empRes, configRes] = await Promise.all([
                fetch('/api/classrooms'),
                fetch('/api/subjects'),
                fetch('/api/employees'),
                fetch('/api/school/config')
            ]);
            
            const classes = await classRes.json();
            const subs = await subRes.json();
            const emps = await empRes.json();
            const config = await configRes.json();
            
            if (config?.type) {
                setSchoolType(config.type);
            }
            
            if (Array.isArray(classes)) {
                setClassrooms(classes);
                if (classes.length > 0) {
                    setSelectedClassroom(prev => prev || classes[0].id);
                }
            }
            if (Array.isArray(subs)) setSubjects(subs);
            if (Array.isArray(emps)) setEmployees(emps);
        } catch (error) {
            toast.error('Erreur lors du chargement des paramètres');
        }
    }, [toast]);

    const fetchSchedule = useCallback(async () => {
        if (!selectedClassroom) {
            setSchedule([]);
            return;
        }
        setIsLoading(true);
        try {
            const res = await fetch(`/api/timetable?classroomId=${selectedClassroom}`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            setSchedule(Array.isArray(data) ? data : []);
        } catch (e) {
            toast.error('Erreur lors du chargement du planning');
        } finally {
            setIsLoading(false);
        }
    }, [selectedClassroom, toast]);

    useEffect(() => {
        fetchDropdownData();
    }, [fetchDropdownData]);

    useEffect(() => {
        fetchSchedule();
    }, [fetchSchedule]);

    const exportExcel = async () => {
        setIsExporting(true);
        try {
            const res = await fetch('/api/timetable/export');
            if (!res.ok) throw new Error();
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'emplois_du_temps.xlsx';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success('Fichier Excel exporté avec succès');
        } catch (e) {
            toast.error('Erreur lors de l\'export');
        } finally {
            setIsExporting(false);
        }
    };

    const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/timetable/import', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            
            if (!res.ok) {
                if (data.details && data.details.length > 0) {
                    toast.error(`❌ ${data.error}`);
                    data.details.forEach((detail: string) => {
                        console.warn('[IMPORT]', detail);
                        toast.error(detail);
                    });
                } else {
                    toast.error(data.error || 'Erreur lors de l\'import');
                }
                return;
            }
            
            toast.success(data.message || 'Importation réussie');
            fetchDropdownData();
            fetchSchedule();
        } catch (err) {
            toast.error('Erreur de connexion lors de l\'import');
        } finally {
            setIsImporting(false);
            e.target.value = '';
        }
    };

    const generatePDF = () => {
        if (!selectedClassroom || schedule.length === 0) return;
        setIsGenerating(true);
        try {
            const doc = new jsPDF({ orientation: 'l', unit: 'mm', format: 'a4' });
            const classroom = classrooms.find(c => c.id === selectedClassroom);
            const classroomName = classroom?.name || 'Classe';
            
            doc.setFillColor(15, 23, 42);
            doc.rect(0, 0, 297, 25, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(16); doc.setFont('helvetica', 'bold');
            doc.text(`EMPLOI DU TEMPS : ${classroomName.toUpperCase()}`, 148.5, 12, { align: 'center' });
            doc.setFontSize(9); doc.setFont('helvetica', 'normal');
            doc.text(`CFP-PAS de Gao — Année Académique 2025-2026`, 148.5, 19, { align: 'center' });

            const timeSlots = Array.from(new Set(schedule.map(s => `${s.startTime} - ${s.endTime}`))).sort();
            const tableData: string[][] = [];

            timeSlots.forEach(time => {
                const row = [time];
                DAYS.forEach(day => {
                    const slot = schedule.find(s => s.dayOfWeek === day.id && `${s.startTime} - ${s.endTime}` === time);
                    row.push(slot ? `${slot.subject?.name}\n(${slot.teacher?.lastName || ''})` : '-');
                });
                tableData.push(row);
            });

            (doc as any).autoTable({
                startY: 35,
                head: [['HEURE', ...DAYS.map(d => d.label.toUpperCase())]],
                body: tableData,
                theme: 'grid',
                styles: { fontSize: 8, halign: 'center', valign: 'middle', cellPadding: 4 },
                headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
                columnStyles: { 0: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 35 } },
                alternateRowStyles: { fillColor: [252, 253, 255] }
            });

            doc.setFontSize(7); doc.setTextColor(150);
            doc.text(`Document généré le ${new Date().toLocaleDateString('fr-FR')} — CFP-PAS de Gao`, 148.5, 200, { align: 'center' });

            doc.save(`Emploi_du_Temps_${classroomName.replace(/\s+/g, '_')}.pdf`);
            toast.success('Emploi du temps exporté en PDF');
        } catch (e) {
            toast.error('Erreur lors de la génération PDF');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleOpenNewModal = () => {
        setEditingSlotId(null);
        setFormData({
            dayOfWeek: '1',
            startTime: '08:00',
            endTime: '10:00',
            subjectId: subjects[0]?.id || '',
            employeeId: employees[0]?.id || ''
        });
        setShowModal(true);
    };

    const handleEditSlot = (slot: any) => {
        setEditingSlotId(slot.id);
        setFormData({
            dayOfWeek: slot.dayOfWeek.toString(),
            startTime: slot.startTime,
            endTime: slot.endTime,
            subjectId: slot.subjectId || slot.subject?.id || '',
            employeeId: slot.employeeId || slot.teacher?.id || ''
        });
        setShowModal(true);
    };

    const handleSaveSlot = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClassroom) return;
        setIsSubmitting(true);
        try {
            const url = '/api/timetable';
            const method = editingSlotId ? 'PUT' : 'POST';
            const payload = editingSlotId 
                ? { ...formData, id: editingSlotId, classroomId: selectedClassroom }
                : { ...formData, classroomId: selectedClassroom };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Erreur lors de l’enregistrement');
            }
            toast.success(editingSlotId ? 'Créneau modifié avec succès' : 'Créneau ajouté avec succès');
            setShowModal(false);
            setEditingSlotId(null);
            fetchSchedule();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Souhaitez-vous vraiment supprimer ce créneau ?')) return;
        try {
            const res = await fetch(`/api/timetable?id=${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
            toast.success('Créneau supprimé');
            fetchSchedule();
        } catch (e) {
            toast.error('Erreur lors de la suppression');
        }
    }

    return (
        <AppLayout
            title="Emploi du Temps"
            subtitle="Planification hebdomadaire des cours par classe"
            breadcrumbs={[{ label: 'Accueil', href: '/dashboard' }, { label: 'Emploi du Temps' }]}
            actions={
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                        className="btn-outline" 
                        onClick={generatePDF}
                        disabled={!selectedClassroom || schedule.length === 0 || isGenerating}
                    >
                        {isGenerating ? <Loader2 size={15} className="spin" /> : <Printer size={15} />}
                        {isGenerating ? 'Génération...' : 'Imprimer PDF'}
                    </button>
                    <button 
                        className="btn-primary" 
                        onClick={handleOpenNewModal}
                        disabled={!selectedClassroom}
                    >
                        <Plus size={15} /> Nouveau Créneau
                    </button>
                </div>
            }
        >
            <div className="card shadow-sm" style={{ padding: '20px 24px', marginBottom: '16px' }}>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    
                    {/* Class Selector Tabs */}
                    <div className="space-y-1.5 flex-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Sélectionner une Classe</label>
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                            {classrooms.map(c => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => setSelectedClassroom(c.id)}
                                    className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                                        selectedClassroom === c.id 
                                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 scale-[1.02]' 
                                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                    }`}
                                >
                                    {c.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', paddingTop: '16px' }}>
                        <button
                            className="btn-outline"
                            onClick={exportExcel}
                            disabled={isExporting}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                        >
                            {isExporting ? <Loader2 size={15} className="spin" /> : <Download size={15} />}
                            Exporter Excel
                        </button>
                        <label
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: '8px',
                                padding: '8px 16px', borderRadius: '8px', cursor: isImporting ? 'not-allowed' : 'pointer',
                                border: '1px solid var(--border)', background: 'transparent',
                                color: 'var(--text)', fontSize: '14px', fontWeight: 500,
                                opacity: isImporting ? 0.6 : 1, transition: 'all 0.2s'
                            }}
                        >
                            {isImporting ? <Loader2 size={15} className="spin" /> : <Upload size={15} />}
                            Importer Excel
                            <input type="file" accept=".xlsx, .xls" style={{ display: 'none' }} onChange={handleImportExcel} disabled={isImporting} />
                        </label>
                    </div>
                </div>
            </div>

            {selectedClassroom ? (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    {isLoading ? (
                        <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <Loader2 size={32} className="spin" style={{ margin: '0 auto 12px' }} />
                            <p>Chargement du planning...</p>
                        </div>
                    ) : (() => {
                        // ── Calcul des créneaux horaires uniques et triés ──
                        const allTimes = Array.from(
                            new Set(schedule.map(s => `${s.startTime}|${s.endTime}`))
                        ).sort().map(t => {
                            const [start, end] = t.split('|');
                            return { start, end };
                        });

                        // Si aucun créneau, afficher une grille vide avec horaires par défaut
                        const timeSlots = allTimes.length > 0 ? allTimes : [
                            { start: '07:30', end: '09:30' },
                            { start: '09:30', end: '11:30' },
                            { start: '11:30', end: '13:30' },
                            { start: '13:30', end: '15:30' },
                            { start: '15:30', end: '17:30' },
                        ];

                        return (
                            <div className="timetable-grid" style={{ overflowX: 'auto', border: '2px solid #1e293b', borderRadius: '8px', overflow: 'hidden' }}>
                                <table style={{
                                    width: '100%',
                                    minWidth: '700px',
                                    borderCollapse: 'collapse',
                                    tableLayout: 'fixed',
                                    border: '2px solid #475569',
                                }}>
                                    {/* ── En-tête : jours ── */}
                                    <thead>
                                        <tr>
                                            {/* Colonne heure */}
                                            <th style={{
                                                width: '110px',
                                                padding: '14px 10px',
                                                background: '#1e293b',
                                                borderRight: '2px solid #475569',
                                                borderBottom: '3px solid #475569',
                                                fontSize: '11px',
                                                fontWeight: 800,
                                                color: '#94a3b8',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.08em',
                                                textAlign: 'center',
                                            }}>
                                                Horaire
                                            </th>
                                            {DAYS.map((day, idx) => (
                                                <th key={day.id} style={{
                                                    padding: '14px 10px',
                                                    background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
                                                    borderRight: idx < DAYS.length - 1 ? '2px solid rgba(255,255,255,0.25)' : 'none',
                                                    borderBottom: '3px solid #475569',
                                                    fontSize: '13px',
                                                    fontWeight: 800,
                                                    color: '#fff',
                                                    textAlign: 'center',
                                                    letterSpacing: '0.04em',
                                                }}>
                                                    {day.label}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>

                                    {/* ── Corps : créneaux horaires ── */}
                                    <tbody>
                                        {timeSlots.map((slot, rowIdx) => (
                                            <tr key={`${slot.start}-${slot.end}`}>
                                                {/* Colonne heure */}
                                                <td className="col-time" style={{
                                                    padding: '12px 8px',
                                                    background: '#f1f5f9',
                                                    borderRight: '3px solid #475569',
                                                    borderBottom: rowIdx < timeSlots.length - 1
                                                        ? '2px solid #cbd5e1'
                                                        : 'none',
                                                    textAlign: 'center',
                                                    verticalAlign: 'middle',
                                                    minHeight: '90px',
                                                }}>
                                                    <div style={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        gap: '3px',
                                                    }}>
                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            color: 'var(--primary)',
                                                        }}>
                                                            <Clock size={11} />
                                                            <span style={{ fontSize: '12px', fontWeight: 800 }}>{slot.start}</span>
                                                        </div>
                                                        <div style={{
                                                            width: '1px',
                                                            height: '10px',
                                                            background: 'var(--border)',
                                                        }} />
                                                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>{slot.end}</span>
                                                    </div>
                                                </td>

                                                {/* Colonnes par jour */}
                                                {DAYS.map((day, colIdx) => {
                                                    const entry = schedule.find(s =>
                                                        s.dayOfWeek === day.id &&
                                                        s.startTime === slot.start &&
                                                        s.endTime === slot.end
                                                    );
                                                    return (
                                                        <td key={day.id} style={{
                                                            padding: '8px',
                                                            verticalAlign: 'middle',
                                                            textAlign: 'center',
                                                            borderRight: colIdx < DAYS.length - 1
                                                                ? '2px solid #cbd5e1'
                                                                : 'none',
                                                            borderBottom: rowIdx < timeSlots.length - 1
                                                                ? '2px solid #cbd5e1'
                                                                : 'none',
                                                            background: rowIdx % 2 === 0 ? '#ffffff' : '#f8fafc',
                                                            minHeight: '90px',
                                                            position: 'relative',
                                                        }}>
                                                            {entry ? (
                                                                <div style={{
                                                                    background: 'var(--bg-3)',
                                                                    border: '1px solid var(--border-md)',
                                                                    borderLeft: '4px solid var(--primary)',
                                                                    borderRadius: '10px',
                                                                    padding: '10px 12px',
                                                                    textAlign: 'left',
                                                                    position: 'relative',
                                                                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                                                                    transition: 'box-shadow 0.2s',
                                                                }}>
                                                                    <div style={{
                                                                        fontWeight: 800,
                                                                        fontSize: '13px',
                                                                        color: 'var(--text)',
                                                                        marginBottom: '3px',
                                                                        lineHeight: 1.3,
                                                                    }}>
                                                                        {entry.subject?.name}
                                                                    </div>
                                                                    <div style={{
                                                                        fontSize: '11px',
                                                                        color: 'var(--text-muted)',
                                                                        fontWeight: 600,
                                                                    }}>
                                                                        {entry.teacher?.firstName} {entry.teacher?.lastName}
                                                                    </div>
                                                                    {/* Boutons action */}
                                                                    <div style={{
                                                                        position: 'absolute',
                                                                        top: '6px',
                                                                        right: '6px',
                                                                        display: 'flex',
                                                                        gap: '2px',
                                                                    }}>
                                                                        <button
                                                                            onClick={() => handleEditSlot(entry)}
                                                                            title="Modifier"
                                                                            style={{
                                                                                background: 'none',
                                                                                border: 'none',
                                                                                cursor: 'pointer',
                                                                                color: 'var(--primary)',
                                                                                opacity: 0.5,
                                                                                padding: '3px',
                                                                                borderRadius: '4px',
                                                                                transition: 'opacity 0.15s',
                                                                            }}
                                                                            className="hover-opacity-1"
                                                                        >
                                                                            <Edit2 size={11} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDelete(entry.id)}
                                                                            title="Supprimer"
                                                                            style={{
                                                                                background: 'none',
                                                                                border: 'none',
                                                                                cursor: 'pointer',
                                                                                color: 'var(--danger)',
                                                                                opacity: 0.5,
                                                                                padding: '3px',
                                                                                borderRadius: '4px',
                                                                                transition: 'opacity 0.15s',
                                                                            }}
                                                                            className="hover-opacity-1"
                                                                        >
                                                                            <Trash2 size={11} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div style={{
                                                                    height: '70px',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    color: 'var(--border)',
                                                                    fontSize: '18px',
                                                                    userSelect: 'none',
                                                                }}>
                                                                    —
                                                                </div>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        );
                    })()}
                </div>

            ) : (
                <div className="card text-center" style={{ padding: '80px', color: 'var(--text-muted)', border: '1px dashed var(--border-md)' }}>
                    <CalendarDays size={56} style={{ margin: '0 auto 20px', opacity: 0.15 }} />
                    <h3 style={{ fontWeight: 700, marginBottom: '10px', color: 'var(--text)' }}>Planifiez votre semaine</h3>
                    <p>Veuillez sélectionner une classe pour visualiser ou modifier son emploi du temps.</p>
                </div>
            )}

            {showModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ 
                        background: 'var(--bg-2)', 
                        border: '1px solid var(--border-md)', 
                        borderRadius: 'var(--radius-xl)', 
                        width: '100%', 
                        maxWidth: '550px', 
                        boxShadow: 'var(--shadow-lg)', 
                        animation: 'fadeUp 0.3s var(--ease) both' 
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 28px', borderBottom: '1px solid var(--border)' }}>
                            <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '18px' }}>
                                {editingSlotId ? 'Modifier le Créneau' : 'Nouveau Créneau'}
                            </h2>
                            <button className="btn-icon" onClick={() => { setShowModal(false); setEditingSlotId(null); }}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSaveSlot} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="form-group">
                                <label>Jour de la semaine *</label>
                                <select className="form-input" value={formData.dayOfWeek} onChange={e => setFormData({...formData, dayOfWeek: e.target.value})} required>
                                    {DAYS.map(day => <option key={day.id} value={day.id}>{day.label}</option>)}
                                </select>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="form-group">
                                    <label>Heure de Début *</label>
                                    <input type="time" className="form-input" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} required/>
                                </div>
                                <div className="form-group">
                                    <label>Heure de Fin *</label>
                                    <input type="time" className="form-input" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} required/>
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label>{isAgroOrTech ? 'Module *' : 'Matière *'}</label>
                                <select 
                                    className="form-input" 
                                    value={formData.subjectId} 
                                    onChange={e => setFormData({...formData, subjectId: e.target.value})}
                                    required
                                >
                                    <option value="">{isAgroOrTech ? '-- Sélectionnez un module --' : '-- Sélectionnez une matière --'}</option>
                                    {subjects.map(s => (<option key={s.id} value={s.id}>{s.name} ({s.code})</option>))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Enseignant *</label>
                                <select className="form-input" value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})} required>
                                    <option value="">-- Sélectionnez un enseignant --</option>
                                    {employees.filter(e => e.employeeType === 'TEACHER').map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                                <button type="button" className="btn-ghost" onClick={() => { setShowModal(false); setEditingSlotId(null); }}>Annuler</button>
                                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? <><Loader2 size={16} className="spin" /> Enregistrement...</> : (editingSlotId ? 'Mettre à Jour' : 'Ajouter au Planning')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </AppLayout>
    );
}
