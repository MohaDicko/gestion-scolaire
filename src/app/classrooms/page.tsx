'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Loader2, X, Layers } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';
import { useRouter } from 'next/navigation';

const emptyForm = { name: '', level: 'LYCEE', stream: '', series: '', maxCapacity: '35', campusId: '', academicYearId: '' };

export default function ClassroomsPage() {
  const toast   = useToast();
  const router  = useRouter();
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [campuses, setCampuses]     = useState<any[]>([]);
  const [acadYears, setAcadYears]   = useState<any[]>([]);
  const [formData, setFormData]     = useState({ ...emptyForm });
  const [search, setSearch]         = useState('');
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    setIsLoading(true);
    setErrorStatus(null);
    try {
      const res = await fetch('/api/classrooms');
      if (res.status === 401) { router.push('/login'); return; }
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      setClassrooms(await res.json());
    } catch (err: any) { 
      toast.error('Impossible de charger les dossiers des classes.'); 
      setErrorStatus(err.message || 'Erreur de chargement');
    }
    finally { setIsLoading(false); }
  }, [router, toast]);

  useEffect(() => { fetch_(); }, [fetch_]);
  useEffect(() => {
    fetch('/api/campuses').then(r => r.json()).then(d => { if (Array.isArray(d)) setCampuses(d); }).catch(() => {});
    fetch('/api/academic-years').then(r => r.json()).then(d => { if (Array.isArray(d)) setAcadYears(d); }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.campusId || !formData.academicYearId) { toast.warning('Campus et Année académique sont obligatoires.'); return; }
    setIsSubmitting(true);
    try {
      // On s'assure que stream contient la valeur de series si stream est vide
      const payload = {
        ...formData,
        stream: formData.stream || formData.series,
        maxCapacity: parseInt(formData.maxCapacity)
      };

      const res = await fetch('/api/classrooms', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la création');
      toast.success(`Classe "${formData.name}" créée avec succès.`);
      setShowModal(false); setFormData({ ...emptyForm }); fetch_();
    } catch (err: any) { toast.error(err.message); }
    finally { setIsSubmitting(false); }
  };

  const filtered = (classrooms || []).filter(c => {
    const n = (c.name || '').toLowerCase();
    const l = (c.level || '').toLowerCase();
    const s = search.toLowerCase();
    return n.includes(s) || l.includes(s);
  });

  return (
    <AppLayout
      title="Gestion des Classes"
      subtitle="Organisation structurelle des cohortes et niveaux"
      breadcrumbs={[{ label: 'Accueil', href: '/dashboard' }, { label: 'Classes' }]}
      actions={<button className="btn-primary" onClick={() => setShowModal(true)}><Plus size={15} /> Nouvelle Classe</button>}
    >
      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border-md)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '580px', boxShadow: 'var(--shadow-lg)', animation: 'fadeUp 0.3s var(--ease) both' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 26px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '17px' }}>Créer une Nouvelle Classe</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '26px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-grid">
                <div className="form-group"><label>Nom de la Classe *</label><input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Terminale A, 9ème Année" /></div>
                <div className="form-group">
                  <label>Niveau Scolaire *</label>
                  <select required value={formData.level} onChange={e => setFormData({...formData, level: e.target.value})}>
                    <option value="PRESCOLAIRE">Maternelle / Préscolaire</option>
                    <option value="PRIMAIRE">Primaire</option>
                    <option value="FONDAMENTAL">Fondamental</option>
                    <option value="LYCEE">Lycée (Général)</option>
                    <option value="TECHNIQUE">Lycée Technique / Pro</option>
                    <option value="SANTE">École de Santé</option>
                    <option value="AGRO">Agro-Pastorale</option>
                    <option value="UNIVERSITE">Enseignement Supérieur</option>
                  </select>
                </div>
                <div className="form-group"><label>Série / Spécialité</label><input value={formData.series} onChange={e => setFormData({...formData, series: e.target.value})} placeholder="Ex: TSE, TSECO, Infirmier..." /></div>
                <div className="form-group"><label>Capacité Max *</label><input type="number" min="1" max="200" required value={formData.maxCapacity} onChange={e => setFormData({...formData, maxCapacity: e.target.value})} /></div>
                <div className="form-group">
                  <label>Campus *</label>
                  <select required value={formData.campusId} onChange={e => setFormData({...formData, campusId: e.target.value})}>
                    <option value="">-- Sélectionner un campus --</option>
                    {campuses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Année Académique *</label>
                  <select required value={formData.academicYearId} onChange={e => setFormData({...formData, academicYearId: e.target.value})}>
                    <option value="">-- Sélectionner --</option>
                    {acadYears.map((y: any) => <option key={y.id} value={y.id}>{y.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 size={15} className="spin" /> Création...</> : 'Créer la Classe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }} className="table-toolbar">
          <div className="search-box">
            <Search size={15} />
            <input type="text" placeholder="Rechercher une classe..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <span style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--text-muted)' }}>{filtered.length} classe{filtered.length > 1 ? 's' : ''}</span>
        </div>
        <div className="table-container">
          {isLoading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}><Loader2 size={32} className="spin" style={{ margin: '0 auto 12px', display: 'block' }} /><p>Chargement des classes en cours...</p></div>
          ) : errorStatus ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--danger)' }}>
              <X size={48} style={{ opacity: 0.2, margin: '0 auto 16px', display: 'block' }} />
              <h3 style={{ fontWeight: 600, marginBottom: '8px' }}>{errorStatus}</h3>
              <button className="btn-ghost" onClick={fetch_} style={{ marginTop: '12px' }}>Réessayer</button>
            </div>
          ) : filtered.length > 0 ? (
            <table className="data-table">
              <thead><tr><th>Classe</th><th>Niveau</th><th>Filière</th><th>Inscrits / Max</th><th>Taux Remplissage</th></tr></thead>
              <tbody>
                {filtered.map(c => {
                  const enrolled = c._count?.enrollments || 0;
                  const rate = Math.round((enrolled / c.maxCapacity) * 100);
                  return (
                    <tr key={c.id}>
                      <td><strong style={{ color: 'var(--text)' }}>{c.name}</strong></td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <span className="badge badge-info" style={{ fontSize: '10px' }}>{c.level}</span>
                          {c.series && <span className="badge badge-warning" style={{ fontSize: '10px' }}>{c.series}</span>}
                        </div>
                      </td>
                      <td>{c.stream || c.series || <span style={{ color: 'var(--text-dim)' }}>—</span>}</td>
                      <td><strong>{enrolled}</strong> / {c.maxCapacity}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, height: '6px', background: 'var(--bg-4)', borderRadius: '99px', overflow: 'hidden' }}>
                            <div style={{ width: `${rate}%`, height: '100%', background: rate > 90 ? 'var(--danger)' : rate > 70 ? 'var(--warning)' : 'var(--success)', borderRadius: '99px', transition: 'width 0.5s var(--ease)' }} />
                          </div>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', width: '35px', textAlign: 'right' }}>{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Layers size={48} style={{ opacity: 0.2, margin: '0 auto 16px', display: 'block' }} />
              <h3 style={{ fontWeight: 600, marginBottom: '8px' }}>Aucune classe créée</h3>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
