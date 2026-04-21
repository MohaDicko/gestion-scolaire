'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ClipboardCheck, Save, Calendar, Search, 
  Loader2, UserCheck, UserX, Clock, 
  Coffee, AlertCircle 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';

export default function StaffAttendancePage() {
    const router = useRouter();
    const toast = useToast();
    
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [records, setRecords] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchAttendance = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/hr/attendance?date=${date}`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            setRecords(Array.isArray(data) ? data : []);
        } catch {
            toast.error('Erreur lors du chargement des présences');
        } finally {
            setIsLoading(false);
        }
    }, [date, toast]);

    useEffect(() => {
        fetchAttendance();
    }, [fetchAttendance]);

    const handleStatusChange = (id: string, status: string) => {
        setRecords(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    };

    const handleTimeChange = (id: string, field: 'checkIn' | 'checkOut', value: string) => {
        setRecords(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/hr/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date, records })
            });
            if (!res.ok) throw new Error();
            toast.success('Pointage enregistré avec succès');
        } catch {
            toast.error('Erreur lors de l\'enregistrement');
        } finally {
            setIsSaving(false);
        }
    };

    const filteredRecords = records.filter(r => 
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = {
        present: records.filter(r => r.status === 'PRESENT').length,
        absent: records.filter(r => r.status === 'ABSENT').length,
        onLeave: records.filter(r => r.status === 'ON_LEAVE').length,
    };

    return (
        <AppLayout
            title="Registre Staff"
            subtitle="Pointage journalier et suivi des retards du personnel"
            breadcrumbs={[{ label: 'RH', href: '/employees' }, { label: 'Présences' }]}
        >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                <div className="card shadow-sm" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid var(--success)' }}>
                    <UserCheck size={24} className="text-success" />
                    <div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Présents</div>
                        <div style={{ fontSize: '20px', fontWeight: 700 }}>{stats.present}</div>
                    </div>
                </div>
                <div className="card shadow-sm" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid var(--danger)' }}>
                    <UserX size={24} className="text-danger" />
                    <div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Absents</div>
                        <div style={{ fontSize: '20px', fontWeight: 700 }}>{stats.absent}</div>
                    </div>
                </div>
                <div className="card shadow-sm" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid var(--warning)' }}>
                    <Coffee size={24} className="text-warning" />
                    <div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>En Congé</div>
                        <div style={{ fontSize: '20px', fontWeight: 700 }}>{stats.onLeave}</div>
                    </div>
                </div>
            </div>

            <div className="card shadow-sm" style={{ padding: '24px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '20px', flex: 1, minWidth: '300px' }}>
                        <div className="form-group" style={{ width: '200px' }}>
                            <label>Date du Pointage</label>
                            <div style={{ position: 'relative' }}>
                                <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input type="date" className="form-input" style={{ paddingLeft: '38px' }} value={date} onChange={e => setDate(e.target.value)} />
                            </div>
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Rechercher un employé</label>
                            <div style={{ position: 'relative' }}>
                                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input type="text" className="form-input" style={{ paddingLeft: '38px' }} placeholder="Nom, matricule..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                            </div>
                        </div>
                    </div>
                    <button className="btn-primary" onClick={handleSave} disabled={isSaving || records.length === 0} style={{ height: '42px' }}>
                        {isSaving ? <><Loader2 size={16} className="spin" /> Enregistrement...</> : <><Save size={16} /> Enregistrer le pointage</>}
                    </button>
                </div>
            </div>

            <div className="card shadow-sm" style={{ padding: 0 }}>
                <div className="table-container">
                    {isLoading ? (
                        <div style={{ padding: '60px', textAlign: 'center' }}>
                            <Loader2 size={32} className="spin" style={{ margin: '0 auto 12px' }} />
                            <p>Chargement du personnel...</p>
                        </div>
                    ) : filteredRecords.length > 0 ? (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Employé</th>
                                    <th>Département</th>
                                    <th>Statut de présence</th>
                                    <th>Arrivée (H)</th>
                                    <th>Départ (H)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRecords.map(r => (
                                    <tr key={r.id}>
                                        <td>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{r.name}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{r.employeeNumber}</div>
                                            </div>
                                        </td>
                                        <td><span className="badge badge-info">{r.department || 'N/A'}</span></td>
                                        <td>
                                            <select 
                                                className="form-input" 
                                                style={{ 
                                                    width: '140px', 
                                                    fontWeight: 600,
                                                    color: r.status === 'PRESENT' ? 'var(--success)' : r.status === 'ABSENT' ? 'var(--danger)' : 'var(--warning)'
                                                }} 
                                                value={r.status} 
                                                onChange={e => handleStatusChange(r.id, e.target.value)}
                                            >
                                                <option value="PRESENT">Présent</option>
                                                <option value="ABSENT">Absent</option>
                                                <option value="ON_LEAVE">En Congé</option>
                                            </select>
                                        </td>
                                        <td>
                                            <input 
                                                type="time" 
                                                className="form-input" 
                                                style={{ width: '110px' }} 
                                                value={r.checkIn || ''} 
                                                onChange={e => handleTimeChange(r.id, 'checkIn', e.target.value)}
                                                disabled={r.status !== 'PRESENT'}
                                            />
                                        </td>
                                        <td>
                                            <input 
                                                type="time" 
                                                className="form-input" 
                                                style={{ width: '110px' }} 
                                                value={r.checkOut || ''} 
                                                onChange={e => handleTimeChange(r.id, 'checkOut', e.target.value)}
                                                disabled={r.status !== 'PRESENT'}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <ClipboardCheck size={48} style={{ opacity: 0.1, margin: '0 auto 20px' }} />
                            <h3>Aucun employé trouvé</h3>
                            <p>Vérifiez que vous avez des employés actifs enregistrés.</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
