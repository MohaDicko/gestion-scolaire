'use client';

import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Save, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function StaffAttendancePage() {
    const router = useRouter();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [records, setRecords] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        fetch(`/api/hr/attendance?date=${date}`)
            .then(res => res.json())
            .then(data => {
                if(Array.isArray(data)) setRecords(data);
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    }, [date]);

    const handleStatusChange = (id: string, status: string) => {
        setRecords(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await fetch('/api/hr/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date, records })
            });
            alert('Présences enregistrées !');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="layout-root">
          <div className="sidebar">
            <div className="sidebar-logo">
              <div className="logo-title">SchoolERP Vercel</div>
            </div>
            <div className="sidebar-nav">
              <div className="nav-item" onClick={() => router.push('/dashboard')}>Tableau de Bord</div>
              <div className="nav-item" onClick={() => router.push('/employees')}>Employés</div>
              <div className="nav-item active">Présence Staff</div>
              <div className="nav-item" onClick={() => router.push('/hr/leaves')}>Congés</div>
            </div>
          </div>
          
          <div className="main-content">
            <div className="page">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Présence du Personnel</h1>
                        <p className="page-subtitle">Pointage journalier des employés et professeurs</p>
                    </div>
                </div>

                <div className="card shadow-sm" style={{ marginBottom: '20px', maxWidth: '300px' }}>
                    <div className="form-group">
                        <label>Date du jour</label>
                        <input type="date" className="form-input" value={date} onChange={e => setDate(e.target.value)} />
                    </div>
                </div>

                <div className="card" style={{ padding: 0 }}>
                    <div className="card-header" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between' }}>
                        <h3 className="card-title"><ClipboardCheck size={18} style={{ display: 'inline', marginRight: 10 }} /> Liste du personnel</h3>
                        <button className="btn-primary" onClick={handleSave} disabled={isSaving}>
                            {isSaving ? 'Enregistrement...' : <><Save size={16} /> Enregistrer le pointage</>}
                        </button>
                    </div>
                    
                    <div className="table-container">
                        {isLoading ? (
                            <div style={{ padding: 40, textAlign: 'center' }}>Chargement...</div>
                        ) : (
                            <table className="data-table" style={{ width: '100%', textAlign: 'left' }}>
                                <thead>
                                    <tr>
                                        <th style={{ padding: '15px 20px' }}>Employé</th>
                                        <th>Département</th>
                                        <th>Statut</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.map(r => (
                                        <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '15px 20px' }}><strong>{r.name}</strong></td>
                                            <td>{r.department}</td>
                                            <td>
                                                <select className="form-input" style={{ width: '140px' }} value={r.status} onChange={e => handleStatusChange(r.id, e.target.value)}>
                                                    <option value="PRESENT">Présent</option>
                                                    <option value="ABSENT">Absent</option>
                                                    <option value="ON_LEAVE">En Congé</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
          </div>
        </div>
    );
}
