'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, Search, Filter, Clock, User, 
  Activity, Eye, ChevronLeft, ChevronRight, 
  Download, Loader2, Database, AlertCircle,
  FileJson, History
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';

interface AuditLog {
  id: string;
  userId: string;
  userRole: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  oldValues: any;
  newValues: any;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

export default function AuditDashboardPage() {
  const toast = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  
  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  
  // Detail Modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        pageSize: '15',
        ...(actionFilter && { action: actionFilter }),
        ...(entityFilter && { entityType: entityFilter }),
      });
      
      const res = await fetch(`/api/admin/audit?${query}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      
      setLogs(data.logs);
      setTotalPages(data.totalPages);
      setTotalLogs(data.total);
    } catch (err) {
      toast.error('Erreur lors du chargement des journaux d\'audit');
    } finally {
      setIsLoading(false);
    }
  }, [page, actionFilter, entityFilter, toast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return '#10b981'; // Green
      case 'UPDATE': return '#3b82f6'; // Blue
      case 'DELETE': return '#ef4444'; // Red
      case 'LOGIN': return '#8b5cf6';  // Purple
      default: return '#64748b';
    }
  };

  const renderDiff = (log: AuditLog) => {
    if (!log.oldValues && !log.newValues) return <span className="text-muted">Pas de données de diff.</span>;
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {log.oldValues && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--danger)', marginBottom: '4px', textTransform: 'uppercase' }}>Avant</div>
            <pre style={{ background: 'var(--bg-3)', padding: '10px', borderRadius: '8px', fontSize: '11px', overflow: 'auto', border: '1px solid var(--border)' }}>
              {JSON.stringify(log.oldValues, null, 2)}
            </pre>
          </div>
        )}
        {log.newValues && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--success)', marginBottom: '4px', textTransform: 'uppercase' }}>Après</div>
            <pre style={{ background: 'var(--bg-3)', padding: '10px', borderRadius: '8px', fontSize: '11px', overflow: 'auto', border: '1px solid var(--border)' }}>
              {JSON.stringify(log.newValues, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  };

  return (
    <AppLayout
      title="Gouvernance & Audit"
      subtitle="Traçabilité complète des actions effectuées sur la plateforme"
      breadcrumbs={[{ label: 'Administration', href: '/admin' }, { label: 'Journal d\'Audit' }]}
      actions={
        <button className="btn-outline" onClick={() => fetchLogs()}>
          <RefreshCw size={15} className={isLoading ? 'spin' : ''} /> Actualiser
        </button>
      }
    >
      {/* ── Summary Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <StatCard 
          icon={<History color="#4f8ef7"/>} 
          label="Total Actions" 
          value={totalLogs.toString()} 
          sub="Historique complet" 
        />
        <StatCard 
          icon={<ShieldCheck color="#10b981"/>} 
          label="Status" 
          value="Sécurisé" 
          sub="Isolation Multi-Tenant" 
        />
        <StatCard 
          icon={<Database color="#8b5cf6"/>} 
          label="Retention" 
          value="Illimitée" 
          sub="Stockage Immuable" 
        />
      </div>

      {/* ── Filters ── */}
      <div className="card shadow-sm" style={{ padding: '20px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0 12px' }}>
            <Search size={16} color="var(--text-dim)" />
            <input 
              type="text" 
              placeholder="Rechercher une entité..." 
              style={{ border: 'none', background: 'transparent', padding: '10px 0', width: '100%', outline: 'none', fontSize: '14px' }}
            />
          </div>
        </div>

        <select 
          className="form-input" 
          style={{ width: 'auto', minWidth: '150px' }}
          value={actionFilter}
          onChange={e => { setActionFilter(e.target.value); setPage(1); }}
        >
          <option value="">Toutes les actions</option>
          <option value="CREATE">Création</option>
          <option value="UPDATE">Modification</option>
          <option value="DELETE">Suppression</option>
          <option value="LOGIN">Connexion</option>
          <option value="EXPORT">Exportation</option>
        </select>

        <select 
          className="form-input" 
          style={{ width: 'auto', minWidth: '150px' }}
          value={entityFilter}
          onChange={e => { setEntityFilter(e.target.value); setPage(1); }}
        >
          <option value="">Toutes les entités</option>
          <option value="Payment">Paiements</option>
          <option value="Grade">Notes</option>
          <option value="Student">Élèves</option>
          <option value="Employee">Personnel</option>
          <option value="Invoice">Factures</option>
        </select>
      </div>

      {/* ── Table ── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '180px' }}>Date & Heure</th>
                <th>Utilisateur</th>
                <th style={{ width: '120px' }}>Action</th>
                <th>Entité</th>
                <th>Description</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Détails</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '60px', textAlign: 'center' }}>
                    <Loader2 size={32} className="spin" style={{ margin: '0 auto 12px', color: 'var(--primary)' }} />
                    <p style={{ color: 'var(--text-muted)' }}>Chargement du journal d'audit...</p>
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map(log => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '13px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={14} color="var(--text-dim)" />
                        {new Date(log.createdAt).toLocaleString('fr-FR')}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 700, fontSize: '14px' }}>{log.userEmail}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>{log.userRole}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{ 
                        background: `${getActionColor(log.action)}15`, 
                        color: getActionColor(log.action),
                        border: `1px solid ${getActionColor(log.action)}30`,
                        fontWeight: 700
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, fontSize: '13px' }}>{log.entityType}</span>
                      <div style={{ fontSize: '10px', color: 'var(--text-dim)', fontFamily: 'monospace' }}>{log.entityId.slice(0, 8)}...</div>
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {log.description || '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="btn-icon" onClick={() => setSelectedLog(log)}>
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-dim)' }}>
                    <AlertCircle size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                    <p>Aucun log d'audit trouvé.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        <div style={{ padding: '20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Page <strong>{page}</strong> sur <strong>{totalPages}</strong>
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="btn-icon" 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              className="btn-icon" 
              disabled={page === totalPages} 
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Detail Modal ── */}
      {selectedLog && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ 
            background: 'var(--bg-2)', 
            border: '1px solid var(--border-md)', 
            borderRadius: '20px', 
            width: '100%', 
            maxWidth: '800px', 
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ padding: '24px 30px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(79,142,247,0.1)', display: 'grid', placeItems: 'center', color: 'var(--primary)' }}>
                   <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Détails de l'Audit</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-dim)' }}>ID: {selectedLog.id}</p>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setSelectedLog(null)}><X size={20}/></button>
            </div>
            
            <div style={{ padding: '30px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <InfoItem label="Action" value={selectedLog.action} color={getActionColor(selectedLog.action)} />
                <InfoItem label="Entité" value={selectedLog.entityType} />
                <InfoItem label="Utilisateur" value={selectedLog.userEmail} />
                <InfoItem label="Rôle" value={selectedLog.userRole} />
                <InfoItem label="IP Address" value={selectedLog.ipAddress} />
                <InfoItem label="Date" value={new Date(selectedLog.createdAt).toLocaleString('fr-FR')} />
              </div>

              <div className="card" style={{ background: 'var(--bg-3)', padding: '15px', border: '1px dashed var(--border)' }}>
                 <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase' }}>Description</div>
                 <div style={{ fontSize: '14px', color: 'var(--text)', lineHeight: 1.5 }}>{selectedLog.description || 'Aucune description fournie.'}</div>
              </div>

              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileJson size={16} /> Comparaison des données
                </h4>
                {renderDiff(selectedLog)}
              </div>

              <div style={{ fontSize: '11px', color: 'var(--text-dim)', background: 'var(--bg-1)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                 <strong>User Agent:</strong> {selectedLog.userAgent}
              </div>
            </div>

            <div style={{ padding: '20px 30px', background: 'var(--bg-3)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
               <button className="btn-primary" onClick={() => setSelectedLog(null)}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </AppLayout>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode, label: string, value: string, sub: string }) {
  return (
    <div className="card shadow-sm" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
      <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: 'var(--bg-3)', display: 'grid', placeItems: 'center', fontSize: '24px' }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '13px', color: 'var(--text-dim)', fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: '24px', fontWeight: 900, margin: '2px 0' }}>{value}</div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sub}</div>
      </div>
    </div>
  );
}

function InfoItem({ label, value, color }: { label: string, value: string, color?: string }) {
  return (
    <div>
      <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '14px', fontWeight: 600, color: color || 'var(--text)' }}>{value}</div>
    </div>
  );
}

function X({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function RefreshCw({ size, className }: { size: number, className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 2v6h-6" />
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M3 22v-6h6" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    </svg>
  );
}
