'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';
import { ShieldAlert, Search, Filter, Clock, User, Activity, FileText, ChevronRight, Hash } from 'lucide-react';

const ACTION_COLORS: Record<string, string> = {
  CREATE: '#10b981', // green
  UPDATE: '#f59e0b', // orange
  DELETE: '#ef4444', // red
  LOGIN: '#3b82f6',  // blue
  LOGOUT: '#64748b', // slate
  EXPORT: '#8b5cf6', // purple
  APPROVE: '#10b981',
  REJECT: '#ef4444',
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const toast = useToast();

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/audit?limit=100');
      if (res.ok) {
        setLogs(await res.json());
      } else {
        toast.error('Erreur lors du chargement des pistes d\'audit');
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => 
    JSON.stringify(log).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout
      title="Piste d'Audit & Conformité"
      subtitle="Traçabilité Enterprise — Historique inaltérable de toutes les actions système"
      breadcrumbs={[{ label: 'Paramètres', href: '/settings' }, { label: 'Audit' }]}
    >
      {/* KPI / Intro */}
      <div className="card" style={{ padding: '24px', marginBottom: '24px', display: 'flex', gap: '20px', alignItems: 'center', background: 'var(--bg-3)', border: '1px solid var(--border)' }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: '#8b5cf620', color: '#8b5cf6', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <ShieldAlert size={32} />
        </div>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Sécurité & Gouvernance</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>
            Cette interface de classe entreprise vous permet de surveiller absolument toutes les modifications critiques apportées à la base de données. Ces journaux sont inaltérables et garantissent la transparence totale de votre ERP face aux audits externes.
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} size={16} />
            <input 
              className="form-input" 
              style={{ paddingLeft: 40 }} 
              placeholder="Rechercher par adresse IP, utilisateur, entité, action..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="btn-secondary">
            <Filter size={16} /> Filtrer
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>Chargement sécurisé des logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>Aucun journal d'audit trouvé.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th><Clock size={14} /> Date & Heure</th>
                  <th><Activity size={14} /> Action</th>
                  <th><FileText size={14} /> Entité</th>
                  <th><User size={14} /> Utilisateur</th>
                  <th><Hash size={14} /> Adresse IP</th>
                  <th>Détails</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => (
                  <tr key={log.id} style={{ fontSize: 13 }}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 600 }}>{new Date(log.createdAt).toLocaleDateString('fr-FR')}</div>
                      <div style={{ color: 'var(--text-dim)', fontSize: 11 }}>{new Date(log.createdAt).toLocaleTimeString('fr-FR')}</div>
                    </td>
                    <td>
                      <span style={{ 
                        background: (ACTION_COLORS[log.action] || '#64748b') + '20', 
                        color: ACTION_COLORS[log.action] || '#64748b', 
                        padding: '4px 8px', 
                        borderRadius: 6, 
                        fontWeight: 800,
                        fontSize: 11,
                        border: `1px solid ${(ACTION_COLORS[log.action] || '#64748b')}40`
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{log.entityType}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>ID: {log.entityId.substring(0,8)}...</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{log.userEmail}</div>
                      <div style={{ color: 'var(--text-dim)', fontSize: 11 }}>{log.userRole}</div>
                    </td>
                    <td>
                      <code style={{ fontSize: 11, color: 'var(--text-muted)' }}>{log.ipAddress}</code>
                    </td>
                    <td>
                      {log.description && (
                        <div style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                          {log.description}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
