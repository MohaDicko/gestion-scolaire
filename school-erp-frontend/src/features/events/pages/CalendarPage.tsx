import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, MapPin, X, Calendar, Sparkles } from 'lucide-react';
import { useCalendarEvents, useCreateEvent, useDeleteEvent, SchoolEventDto, CreateEventPayload } from '../hooks/useCalendarEvents';
import { useAuthStore } from '../../../store/authStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/apiClient';
import { toast } from '../../../store/toastStore';
import { dialog } from '../../../store/confirmStore';

const CATEGORY_META: Record<number, { label: string; color: string; bg: string; emoji: string }> = {
    1: { label: 'Examen', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)', emoji: '📝' },
    2: { label: 'Réunion', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', emoji: '🤝' },
    3: { label: 'Congé/Férié', color: '#10b981', bg: 'rgba(16,185,129,0.15)', emoji: '🏖️' },
    4: { label: 'Sortie', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', emoji: '🚌' },
    5: { label: 'Cérémonie', color: '#ec4899', bg: 'rgba(236,72,153,0.15)', emoji: '🎓' },
    6: { label: 'Sport', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', emoji: '⚽' },
    99: { label: 'Autre', color: '#6b7280', bg: 'rgba(107,114,128,0.15)', emoji: '📌' },
};

const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
    // 0=Mon..6=Sun
    const d = new Date(year, month, 1).getDay();
    return d === 0 ? 6 : d - 1;
}

export function CalendarPage() {
    const { user } = useAuthStore();
    const canEdit = ['SuperAdmin', 'SchoolAdmin'].includes(user?.role ?? '');
    const queryClient = useQueryClient();

    const seedEvents = useMutation({
        mutationFn: async () => {
            const { data } = await apiClient.post('/seed/school-events');
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
            toast.success('Calendrier scolaire 2024-2025 généré avec succès !');
        },
        onError: (err: any) => {
            toast.error('Erreur : ' + (err.response?.data || err.message));
        }
    });

    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth()); // 0-indexed
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<CreateEventPayload>({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        categoryId: 5,
        isAllDay: true,
        location: ''
    });

    const { data: events = [], isLoading } = useCalendarEvents(year, month + 1);
    const createEvent = useCreateEvent();
    const deleteEvent = useDeleteEvent();

    const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); setSelectedDay(null); };
    const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); setSelectedDay(null); };

    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfWeek(year, month);

    // Map: day -> events
    const eventsByDay: Record<number, SchoolEventDto[]> = {};
    events.forEach(ev => {
        const start = new Date(ev.startDate);
        const end = new Date(ev.endDate);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            if (d.getFullYear() === year && d.getMonth() === month) {
                const day = d.getDate();
                if (!eventsByDay[day]) eventsByDay[day] = [];
                if (!eventsByDay[day].find(e => e.id === ev.id)) eventsByDay[day].push(ev);
            }
        }
    });

    const selectedEvents = selectedDay ? (eventsByDay[selectedDay] ?? []) : [];

    const handleDayClick = (day: number) => {
        setSelectedDay(day === selectedDay ? null : day);
        if (showForm) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            setForm(f => ({ ...f, startDate: dateStr, endDate: dateStr }));
        }
    };

    const openForm = (day?: number) => {
        const baseDate = day
            ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            : `${year}-${String(month + 1).padStart(2, '0')}-01`;
        setForm({ title: '', description: '', startDate: baseDate, endDate: baseDate, categoryId: 5, isAllDay: true, location: '' });
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createEvent.mutateAsync(form);
            setShowForm(false);
            toast.success('Événement créé avec succès !');
        } catch (err: any) {
            toast.error('Erreur : ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDelete = async (id: string) => {
        const ok = await dialog.confirm({
            title: 'Supprimer l\'événement',
            message: 'Êtes-vous sûr de vouloir supprimer cet événement ?',
            variant: 'danger',
            confirmLabel: 'Supprimer',
        });
        if (!ok) return;
        await deleteEvent.mutateAsync(id);
        setSelectedDay(null);
    };

    // Calendar grid cells
    const cells: (number | null)[] = [
        ...Array(firstDay).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
    ];

    return (
        <div className="page" style={{ maxWidth: '1100px' }}>
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Calendar size={28} className="text-primary" /> Calendrier Scolaire
                    </h1>
                    <p className="page-subtitle">Planifiez examens, réunions, sorties et événements</p>
                </div>
                {canEdit && (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button
                            className="btn-secondary"
                            onClick={async () => {
                                const ok = await dialog.confirm({
                                    title: 'Régénérer le calendrier',
                                    message: 'Régénérer tous les événements du calendrier 2024-2025 ? Cela remplacera les événements système existants.',
                                    variant: 'warning',
                                    confirmLabel: 'Régénérer',
                                });
                                if (ok) seedEvents.mutate();
                            }}
                            disabled={seedEvents.isPending}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <Sparkles size={16} /> {seedEvents.isPending ? 'Génération...' : 'Générer Calendrier 2024-2025'}
                        </button>
                        <button className="btn-primary" onClick={() => openForm(selectedDay ?? undefined)}>
                            <Plus size={18} /> Nouvel Événement
                        </button>
                    </div>
                )}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
                {Object.entries(CATEGORY_META).map(([id, meta]) => (
                    <span key={id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '4px 10px', borderRadius: '20px', background: meta.bg, color: meta.color, fontWeight: 600 }}>
                        {meta.emoji} {meta.label}
                    </span>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: selectedDay ? '1fr 320px' : '1fr', gap: '20px' }}>
                {/* Calendar grid */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    {/* Month nav */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                        <button className="btn-ghost" onClick={prevMonth}><ChevronLeft size={20} /></button>
                        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
                            {MONTHS_FR[month]} {year}
                        </h2>
                        <button className="btn-ghost" onClick={nextMonth}><ChevronRight size={20} /></button>
                    </div>

                    {/* Day-of-week headers */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: '1px solid var(--border)' }}>
                        {DAYS_FR.map(d => (
                            <div key={d} style={{ textAlign: 'center', padding: '10px 0', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{d}</div>
                        ))}
                    </div>

                    {/* Calendar cells */}
                    {isLoading ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Chargement...</div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
                            {cells.map((day, idx) => {
                                if (!day) return <div key={`empty-${idx}`} style={{ minHeight: '90px', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--bg-color)', opacity: 0.4 }} />;

                                const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                                const isSelected = day === selectedDay;
                                const dayEvents = eventsByDay[day] ?? [];

                                return (
                                    <div
                                        key={day}
                                        onClick={() => handleDayClick(day)}
                                        style={{
                                            minHeight: '90px',
                                            padding: '6px',
                                            borderRight: '1px solid var(--border)',
                                            borderBottom: '1px solid var(--border)',
                                            cursor: 'pointer',
                                            background: isSelected ? 'var(--primary-dim)' : 'transparent',
                                            transition: 'background 0.15s',
                                            position: 'relative'
                                        }}
                                    >
                                        {/* Day number */}
                                        <div style={{
                                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                            width: '28px', height: '28px', borderRadius: '50%',
                                            fontWeight: isToday ? 800 : 500,
                                            fontSize: '13px',
                                            background: isToday ? 'var(--primary)' : 'transparent',
                                            color: isToday ? 'white' : 'var(--text)',
                                            marginBottom: '4px'
                                        }}>{day}</div>

                                        {/* Events pills */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            {dayEvents.slice(0, 3).map(ev => {
                                                const meta = CATEGORY_META[ev.categoryId] ?? CATEGORY_META[99];
                                                return (
                                                    <div key={ev.id} style={{
                                                        fontSize: '10px', fontWeight: 600, padding: '1px 6px', borderRadius: '3px',
                                                        background: meta.bg, color: meta.color,
                                                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                                    }}>
                                                        {meta.emoji} {ev.title}
                                                    </div>
                                                );
                                            })}
                                            {dayEvents.length > 3 && (
                                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', paddingLeft: '4px' }}>+{dayEvents.length - 3} autres</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Day detail panel */}
                {selectedDay && (
                    <div className="card" style={{ padding: 0, overflow: 'hidden', alignSelf: 'flex-start' }}>
                        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>
                                {selectedDay} {MONTHS_FR[month]} {year}
                            </h3>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {canEdit && (
                                    <button className="btn-primary" style={{ padding: '5px 10px', fontSize: '12px' }} onClick={() => openForm(selectedDay)}>
                                        <Plus size={14} /> Ajouter
                                    </button>
                                )}
                                <button className="btn-ghost" onClick={() => setSelectedDay(null)}><X size={16} /></button>
                            </div>
                        </div>
                        <div style={{ padding: '12px', maxHeight: '480px', overflowY: 'auto' }}>
                            {selectedEvents.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
                                    <Calendar size={32} style={{ opacity: 0.2 }} />
                                    <p style={{ margin: '8px 0 0', fontSize: '13px' }}>Aucun événement ce jour</p>
                                    {canEdit && (
                                        <button className="btn-ghost" style={{ marginTop: '12px', fontSize: '12px' }} onClick={() => openForm(selectedDay)}>
                                            + Créer un événement
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {selectedEvents.map(ev => {
                                        const meta = CATEGORY_META[ev.categoryId] ?? CATEGORY_META[99];
                                        return (
                                            <div key={ev.id} style={{ padding: '12px', borderRadius: '8px', background: meta.bg, borderLeft: `3px solid ${meta.color}`, position: 'relative' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <div>
                                                        <p style={{ margin: 0, fontWeight: 700, fontSize: '13px', color: meta.color }}>
                                                            {meta.emoji} {ev.title}
                                                        </p>
                                                        <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
                                                            {meta.label}
                                                            {!ev.isAllDay && ` · ${new Date(ev.startDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}
                                                        </p>
                                                    </div>
                                                    {canEdit && (
                                                        <button
                                                            onClick={() => handleDelete(ev.id)}
                                                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                                {ev.description && <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'var(--text)' }}>{ev.description}</p>}
                                                {ev.location && (
                                                    <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <MapPin size={11} /> {ev.location}
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Create Event Modal */}
            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Créer un Événement</h2>
                            <button className="btn-ghost" onClick={() => setShowForm(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-body">
                            <div className="form-group">
                                <label>Titre *</label>
                                <input required placeholder="Ex: Réunion parents-professeurs..." value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Catégorie *</label>
                                <select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: Number(e.target.value) })}>
                                    {Object.entries(CATEGORY_META).map(([id, meta]) => (
                                        <option key={id} value={id}>{meta.emoji} {meta.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="form-group">
                                    <label>Date de début *</label>
                                    <input type="date" required value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value, endDate: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Date de fin *</label>
                                    <input type="date" required value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <input type="checkbox" id="isAllDay" checked={form.isAllDay} onChange={e => setForm({ ...form, isAllDay: e.target.checked })} style={{ width: 'auto', margin: 0 }} />
                                <label htmlFor="isAllDay" style={{ margin: 0 }}>Journée entière</label>
                            </div>
                            <div className="form-group">
                                <label>Lieu (optionnel)</label>
                                <input placeholder="Ex: Salle de conférence, Terrain de sport..." value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Description (optionnelle)</label>
                                <textarea
                                    rows={3}
                                    placeholder="Détails supplémentaires..."
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-color)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', resize: 'vertical', fontFamily: 'inherit' }}
                                />
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Annuler</button>
                                <button type="submit" className="btn-primary" disabled={createEvent.isPending}>
                                    {createEvent.isPending ? 'Création...' : '✓ Créer l\'événement'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
