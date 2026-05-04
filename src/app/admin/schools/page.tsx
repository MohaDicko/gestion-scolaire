'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, Plus, Search, MapPin, Phone, Globe,
  Trash2, Edit3, ExternalLink, GraduationCap, Users,
  DollarSign, BookOpen, X, Save, CheckCircle, AlertCircle,
  Activity, BarChart3, ChevronRight, RefreshCw, Landmark,
  ShieldCheck, TrendingUp, UserCheck, School
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';

const SCHOOL_TYPES = ['PRIMAIRE','FONDAMENTAL','LYCEE','TECHNIQUE','SANTE','UNIVERSITE'];
const PLANS = ['STARTER', 'BUSINESS', 'ELITE'];
const PLAN_COLORS: Record<string, string> = {
  STARTER: '#94a3b8',
  BUSINESS: '#4f8ef7',
  ELITE: '#a855f7'
};
const TYPE_COLORS: Record<string, string> = {
  LYCEE: '#6366f1', SANTE: '#10b981', TECHNIQUE: '#f59e0b',
  FONDAMENTAL: '#3b82f6', PRIMAIRE: '#ec4899', UNIVERSITE: '#8b5cf6'
};

function formatXOF(n: number) {
  return n.toLocaleString('fr-FR') + ' FCFA';
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 42, height: 42, borderRadius: 11, background: color + '20', color, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>{value}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      </div>
    </div>
  );
}

export default function SchoolsManagementPage() {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<any>(null);
  const [detailData, setDetailData] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editSchool, setEditSchool] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const toast = useToast();

  const fetchSchools = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/schools');
      if (res.ok) setSchools(await res.json());
      else toast.error('Erreur chargement des établissements');
    } catch { toast.error('Connexion impossible'); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { fetchSchools(); }, [fetchSchools]);

  const fetchDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    setDetailData(null);
    try {
      const res = await fetch(`/api/admin/schools/${id}/stats`);
      if (res.ok) setDetailData(await res.json());
    } catch {}
    finally { setDetailLoading(false); }
  }, []);

  const handleSelectSchool = (school: any) => {
    setSelectedSchool(school);
    fetchDetail(school.id);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const form = e.currentTarget as HTMLFormElement;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const method = editSchool ? 'PATCH' : 'POST';
      const url = editSchool ? `/api/admin/schools/${editSchool.id}` : '/api/admin/schools';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        toast.success(editSchool ? 'Établissement mis à jour ✓' : 'Établissement créé ✓');
        setShowForm(false);
        setEditSchool(null);
        fetchSchools();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Erreur lors de la sauvegarde');
      }
    } catch { toast.error('Erreur serveur'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer définitivement "${name}" et toutes ses données ?`)) return;
    try {
      const res = await fetch(`/api/admin/schools/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Établissement supprimé');
        if (selectedSchool?.id === id) setSelectedSchool(null);
        fetchSchools();
      } else toast.error('Impossible de supprimer');
    } catch { toast.error('Erreur serveur'); }
  };

  const handleToggleActive = async (school: any) => {
    try {
      const res = await fetch(`/api/admin/schools/${school.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !school.isActive })
      });
      if (res.ok) { toast.success('Statut mis à jour'); fetchSchools(); }
    } catch {}
  };

  const filtered = schools.filter(s => {
    const q = search.toLowerCase();
    const matchQ = s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || (s.city || '').toLowerCase().includes(q);
    const matchT = typeFilter ? s.type === typeFilter : true;
    return matchQ && matchT;
  });

  return (
    <AppLayout
      title="Gestion du Réseau Scolaire"
      subtitle={`Super Administrateur — ${schools.length} établissement(s) enregistré(s)`}
      breadcrumbs={[{ label: 'Admin', href: '/admin/system-health' }, { label: 'Écoles' }]}
      actions={
        <button className="btn-primary" onClick={() => { setEditSchool(null); setShowForm(true); }}>
          <Plus size={15} /> Nouvel Établissement
        </button>
      }
    >
      {/* Network KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard icon={<Landmark size={20}/>} label="Établissements" value={schools.length} color="#6366f1" />
        <StatCard icon={<Users size={20}/>} label="Élèves Total" value={schools.reduce((s, sc) => s + (sc.stats?.studentCount || 0), 0).toLocaleString()} color="#10b981" />
        <StatCard icon={<UserCheck size={20}/>} label="Personnel Total" value={schools.reduce((s, sc) => s + (sc.stats?.employeeCount || 0), 0)} color="#f59e0b" />
        <StatCard icon={<BookOpen size={20}/>} label="Classes Total" value={schools.reduce((s, sc) => s + (sc.stats?.classroomCount || 0), 0)} color="#3b82f6" />
        <StatCard icon={<TrendingUp size={20}/>} label="Recouvrement Moy." value={schools.length ? Math.round(schools.reduce((s, sc) => s + (sc.stats?.collectionRate || 0), 0) / schools.length) + '%' : '—'} color="#ec4899" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedSchool ? '1fr 420px' : '1fr', gap: 24 }}>
        
        {/* LEFT: School List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 220px' }}>
              <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} size={16} />
              <input
                className="form-input"
                style={{ paddingLeft: 38 }}
                placeholder="Rechercher par nom, code, ville..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select className="form-input" style={{ flex: '0 1 160px' }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="">Tous les types</option>
              {SCHOOL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button className="btn-secondary" onClick={fetchSchools}>
              <RefreshCw size={14} />
            </button>
          </div>

          {/* List */}
          {loading ? (
            <div style={{ display: 'grid', gap: 12 }}>
              {[1,2,3,4].map(i => <div key={i} style={{ height: 90, borderRadius: 14, background: 'var(--bg-3)', animation: 'pulse 1.5s infinite' }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
              <Building2 size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p>Aucun établissement trouvé</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map(school => {
                const isSelected = selectedSchool?.id === school.id;
                const color = TYPE_COLORS[school.type] || '#6366f1';
                return (
                  <div
                    key={school.id}
                    onClick={() => handleSelectSchool(school)}
                    style={{
                      background: isSelected ? 'var(--bg-accent)' : 'var(--bg-3)',
                      border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                      borderRadius: 14,
                      padding: '16px 20px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      transition: 'all 0.15s'
                    }}
                  >
                    {/* Icon */}
                    <div style={{ width: 46, height: 46, borderRadius: 12, background: color + '22', color, display: 'grid', placeItems: 'center', flexShrink: 0, border: `1.5px solid ${color}40` }}>
                      <School size={22} />
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{school.name}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, background: color + '20', color, padding: '2px 7px', borderRadius: 6, flexShrink: 0 }}>{school.type}</span>
                        <span style={{ fontSize: 10, fontWeight: 800, background: (PLAN_COLORS[school.plan] || '#4f8ef7') + '20', color: PLAN_COLORS[school.plan] || '#4f8ef7', padding: '2px 7px', borderRadius: 6, flexShrink: 0, border: `1px solid ${PLAN_COLORS[school.plan] || '#4f8ef7'}40` }}>{school.plan}</span>
                        {!school.isActive && <span style={{ fontSize: 10, fontWeight: 700, background: 'var(--danger-dim)', color: 'var(--danger)', padding: '2px 7px', borderRadius: 6 }}>INACTIF</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={11} />{school.city || 'N/A'}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={11} />{school.stats?.studentCount ?? 0} élèves</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><UserCheck size={11} />{school.stats?.employeeCount ?? 0} staff</span>
                      </div>
                    </div>

                    {/* Rate badge */}
                    <div style={{ textAlign: 'center', flexShrink: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: (school.stats?.collectionRate ?? 0) >= 70 ? 'var(--success)' : 'var(--warning)' }}>
                        {school.stats?.collectionRate ?? 0}%
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>Recouvrement</div>
                    </div>

                    <ChevronRight size={16} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT: Detail Panel */}
        {selectedSchool && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Header */}
            <div className="card" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 13, background: (TYPE_COLORS[selectedSchool.type] || '#6366f1') + '22', color: TYPE_COLORS[selectedSchool.type] || '#6366f1', display: 'grid', placeItems: 'center' }}>
                    <School size={24} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 2 }}>{selectedSchool.name}</h2>
                    <code style={{ fontSize: 11, color: 'var(--text-muted)' }}>{selectedSchool.code}</code>
                  </div>
                </div>
                <button className="btn-icon" onClick={() => { setSelectedSchool(null); setDetailData(null); }}><X size={16} /></button>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn-secondary" style={{ fontSize: 12 }} onClick={() => { setEditSchool(selectedSchool); setShowForm(true); }}>
                  <Edit3 size={13} /> Modifier
                </button>
                <button
                  className="btn-secondary"
                  style={{ fontSize: 12, color: selectedSchool.isActive ? 'var(--warning)' : 'var(--success)' }}
                  onClick={() => handleToggleActive(selectedSchool)}
                >
                  {selectedSchool.isActive ? <AlertCircle size={13} /> : <CheckCircle size={13} />}
                  {selectedSchool.isActive ? 'Désactiver' : 'Activer'}
                </button>
                <button
                  className="btn-secondary"
                  style={{ fontSize: 12, color: 'var(--danger)' }}
                  onClick={() => handleDelete(selectedSchool.id, selectedSchool.name)}
                >
                  <Trash2 size={13} /> Supprimer
                </button>
                <button
                  className="btn-primary"
                  style={{ fontSize: 12, marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}
                  onClick={async () => {
                    toast.success('Connexion à l\'établissement en cours...');
                    try {
                      const res = await fetch('/api/admin/switch-tenant', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ schoolId: selectedSchool.id })
                      });
                      if (res.ok) {
                        const data = await res.json();
                        localStorage.setItem('auth_token', data.accessToken);
                        localStorage.setItem('auth_user', JSON.stringify(data.user));
                        window.location.href = '/students';
                      } else {
                        toast.error('Erreur lors du changement d\'espace');
                      }
                    } catch {
                      toast.error('Erreur réseau');
                    }
                  }}
                >
                  <ExternalLink size={13} /> Accéder
                </button>
              </div>
            </div>

            {/* Live Stats */}
            {detailLoading ? (
              <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
                <RefreshCw size={24} className="spin" style={{ margin: '0 auto' }} />
                <p style={{ marginTop: 12, fontSize: 13 }}>Chargement des statistiques...</p>
              </div>
            ) : detailData ? (
              <>
                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { icon: <Users size={16}/>, label: 'Élèves', value: detailData.stats.studentCount, color: '#6366f1' },
                    { icon: <UserCheck size={16}/>, label: 'Personnel', value: detailData.stats.employeeCount, color: '#10b981' },
                    { icon: <BookOpen size={16}/>, label: 'Classes', value: detailData.stats.classroomCount, color: '#3b82f6' },
                    { icon: <Building2 size={16}/>, label: 'Campus', value: detailData.stats.campusCount, color: '#f59e0b' },
                  ].map(s => (
                    <div key={s.label} className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ color: s.color }}>{s.icon}</div>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 800 }}>{s.value}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Financial */}
                <div className="card" style={{ padding: '18px 20px' }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
                    <DollarSign size={15} color="var(--success)" /> Situation Financière
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { label: 'Total Facturé', value: formatXOF(detailData.stats.financial.totalInvoiced), color: 'var(--text)' },
                      { label: 'Total Encaissé', value: formatXOF(detailData.stats.financial.totalPaid), color: 'var(--success)' },
                      { label: 'Factures Impayées', value: detailData.stats.financial.unpaidCount + ' facture(s)', color: 'var(--warning)' },
                    ].map(row => (
                      <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                        <span style={{ fontWeight: 700, color: row.color }}>{row.value}</span>
                      </div>
                    ))}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                        <span style={{ color: 'var(--text-muted)' }}>Taux de Recouvrement</span>
                        <span style={{ fontWeight: 800, color: detailData.stats.financial.collectionRate >= 70 ? 'var(--success)' : 'var(--warning)' }}>
                          {detailData.stats.financial.collectionRate}%
                        </span>
                      </div>
                      <div style={{ height: 6, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${detailData.stats.financial.collectionRate}%`, background: detailData.stats.financial.collectionRate >= 70 ? 'var(--success)' : 'var(--warning)', transition: 'width 0.5s' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subscription Plan Card */}
                <div className="card" style={{ padding: '18px 20px', background: (PLAN_COLORS[selectedSchool.plan] || '#4f8ef7') + '08', border: `1px solid ${PLAN_COLORS[selectedSchool.plan] || '#4f8ef7'}30` }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ fontSize: 13, fontWeight: 700 }}>Abonnement Actif</h4>
                      <span style={{ fontSize: 11, fontWeight: 800, color: PLAN_COLORS[selectedSchool.plan] || '#4f8ef7' }}>{selectedSchool.plan}</span>
                   </div>
                   <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
                      {selectedSchool.plan === 'STARTER' && 'Max 250 élèves, Fonctions de base.'}
                      {selectedSchool.plan === 'BUSINESS' && 'Max 750 élèves, Emails, Reçus PDF, Cartes ID.'}
                      {selectedSchool.plan === 'ELITE' && 'Illimité, Module Paie, Multi-Campus.'}
                   </p>
                </div>

                {/* Contact Info */}
                <div className="card" style={{ padding: '18px 20px' }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Informations</h4>
                  {[
                    { icon: <MapPin size={13}/>, label: selectedSchool.address ? `${selectedSchool.address}, ${selectedSchool.city}` : selectedSchool.city || 'N/A' },
                    { icon: <Phone size={13}/>, label: selectedSchool.phoneNumber || 'Non renseigné' },
                    { icon: <Globe size={13}/>, label: selectedSchool.email || 'Non renseigné' },
                    { icon: <Activity size={13}/>, label: `Année active: ${detailData.stats.activeYear}` },
                    { icon: <ShieldCheck size={13}/>, label: `RNE: ${selectedSchool.nationalRNE || 'N/A'}` },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', fontSize: 13, color: 'var(--text-muted)', borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
                      <span style={{ color: 'var(--primary)', flexShrink: 0 }}>{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>

                {/* Recent Students */}
                {detailData.recentStudents?.length > 0 && (
                  <div className="card" style={{ padding: '18px 20px' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, marginBottom: 14 }}>
                      <GraduationCap size={15} color="var(--primary)" /> Derniers Élèves Inscrits
                    </h4>
                    {detailData.recentStudents.map((s: any) => (
                      <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text)' }}>{s.firstName} {s.lastName}</div>
                          <div style={{ color: 'var(--text-dim)', fontSize: 11 }}>{s.campus?.name}</div>
                        </div>
                        <code style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.studentNumber}</code>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--bg-2)', borderRadius: 20, padding: 32, width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800 }}>{editSchool ? 'Modifier l\'Établissement' : 'Nouvel Établissement'}</h2>
              <button className="btn-icon" onClick={() => { setShowForm(false); setEditSchool(null); }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label" style={{ color: 'var(--primary)', fontWeight: 800 }}>DÉTAILS DE L'ÉTABLISSEMENT</label>
                  <div style={{ height: 1, background: 'var(--border)', marginBottom: 8 }} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Nom complet de l'établissement *</label>
                  <input name="name" required className="form-input" defaultValue={editSchool?.name} placeholder="Ex: Lycée Excellence de Bamako" />
                </div>
                <div className="form-group">
                  <label className="form-label">Code Unique *</label>
                  <input name="code" required className="form-input" defaultValue={editSchool?.code} placeholder="Ex: LYC-EXC-BKO" />
                </div>
                <div className="form-group">
                  <label className="form-label">Type *</label>
                  <select name="type" required className="form-input" defaultValue={editSchool?.type || 'LYCEE'}>
                    {SCHOOL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Ville</label>
                  <input name="city" className="form-input" defaultValue={editSchool?.city || 'Bamako'} />
                </div>
                <div className="form-group">
                  <label className="form-label">Plan d'abonnement *</label>
                  <select name="plan" required className="form-input" defaultValue={editSchool?.plan || 'STARTER'}>
                    <option value="STARTER">Pack STARTER</option>
                    <option value="BUSINESS">Pack BUSINESS</option>
                    <option value="ELITE">Pack ELITE</option>
                  </select>
                </div>

                {!editSchool && (
                  <>
                    <div className="form-group" style={{ gridColumn: '1 / -1', marginTop: 12 }}>
                      <label className="form-label" style={{ color: 'var(--success)', fontWeight: 800 }}>COMPTE ADMINISTRATEUR PRINCIPAL</label>
                      <div style={{ height: 1, background: 'var(--border)', marginBottom: 8 }} />
                      <p style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>
                        Ces identifiants permettront au responsable de l'école de se connecter pour la première fois.
                      </p>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Prénom Admin *</label>
                      <input name="adminFirstName" required className="form-input" placeholder="Prénom" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Nom Admin *</label>
                      <input name="adminLastName" required className="form-input" placeholder="Nom" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email Admin *</label>
                      <input name="adminEmail" type="email" required className="form-input" placeholder="admin@ecole.com" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Mot de passe provisoire *</label>
                      <input name="adminPassword" type="password" required className="form-input" placeholder="••••••••" />
                    </div>
                  </>
                )}

                <div className="form-group" style={{ gridColumn: '1 / -1', marginTop: 12 }}>
                  <label className="form-label" style={{ color: 'var(--text-muted)', fontWeight: 800 }}>INFORMATIONS DE CONTACT (OPTIONNEL)</label>
                  <div style={{ height: 1, background: 'var(--border)', marginBottom: 8 }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email de l'école</label>
                  <input name="email" type="email" className="form-input" defaultValue={editSchool?.email} />
                </div>
                <div className="form-group">
                  <label className="form-label">Téléphone</label>
                  <input name="phoneNumber" className="form-input" defaultValue={editSchool?.phoneNumber} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Adresse physique</label>
                  <input name="address" className="form-input" defaultValue={editSchool?.address} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setEditSchool(null); }}>Annuler</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? <><RefreshCw size={14} className="spin" /> Sauvegarde...</> : <><Save size={14} /> Enregistrer</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
