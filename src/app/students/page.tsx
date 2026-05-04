'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, FileDown, Users, Eye, Loader2, X, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';
import { exportToExcel } from '@/lib/excelExport';
import * as XLSX from 'xlsx';

const GENDER_LABELS: Record<string, string> = { MALE: 'Masculin', FEMALE: 'Féminin', OTHER: 'Autre' };
const RELATION_OPTIONS = ['FATHER', 'MOTHER', 'GUARDIAN', 'OTHER'];
const RELATION_LABELS: Record<string, string> = { FATHER: 'Père', MOTHER: 'Mère', GUARDIAN: 'Tuteur', OTHER: 'Autre' };

const emptyForm = {
  firstName: '', lastName: '', dateOfBirth: '', gender: 'MALE',
  nationalId: '', parentName: '', parentPhone: '', parentEmail: '',
  parentRelationship: 'FATHER', campusId: '',
  createStudentAccount: true, studentEmail: '', studentPassword: '',
  createParentAccount: false, parentAccountPassword: ''
};

export default function StudentsPage() {
  const router = useRouter();
  const toast  = useToast();

  const [result, setResult] = useState<{ items: any[]; totalCount: number; totalPages: number }>({ items: [], totalCount: 0, totalPages: 1 });
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage]             = useState(1);
  const [isLoading, setIsLoading]   = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [campuses, setCampuses]     = useState<any[]>([]);
  const [formData, setFormData]     = useState({ ...emptyForm });
  const [importData, setImportData] = useState<any[]>([]);

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/students?search=${encodeURIComponent(searchTerm)}&pageNumber=${page}&pageSize=15`);
      if (res.status === 401) { router.push('/login'); return; }
      if (!res.ok) throw new Error();
      setResult(await res.json());
    } catch {
      toast.error('Impossible de charger les élèves.');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, page, router, toast]);

  useEffect(() => {
    const t = setTimeout(fetchStudents, 300);
    return () => clearTimeout(t);
  }, [fetchStudents]);

  useEffect(() => {
    fetch('/api/campuses').then(r => r.json()).then(d => { if (Array.isArray(d)) setCampuses(d); }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.campusId) { toast.warning('Veuillez sélectionner un campus.'); return; }
    if (formData.createParentAccount && !formData.parentEmail) {
      toast.warning("L'email du parent est requis pour créer un compte parent.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la création');
      toast.success(`Élève ${formData.firstName} ${formData.lastName} enregistré avec succès.`);
      setShowModal(false);
      setFormData({ ...emptyForm });
      fetchStudents();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = () => {
    const data = result.items.map(s => ({
      'Matricule': s.studentNumber, 'Nom': s.lastName, 'Prénom': s.firstName,
      'Naissance': new Date(s.dateOfBirth).toLocaleDateString('fr-FR'),
      'Genre': GENDER_LABELS[s.gender] || s.gender,
      'Parent': s.parentName, 'Tél. Parent': s.parentPhone
    }));
    exportToExcel(data, `Eleves_${new Date().toISOString().split('T')[0]}`);
    toast.success('Export Excel généré avec succès.');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);
      setImportData(json);
    };
    reader.readAsArrayBuffer(file);
  };

  const executeImport = async () => {
    if (importData.length === 0) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/students/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: importData })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message);
      setShowImport(false);
      setImportData([]);
      fetchStudents();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout
      title="Gestion des Élèves"
      subtitle={`${result.totalCount} élève${result.totalCount > 1 ? 's' : ''} dans votre établissement`}
      breadcrumbs={[{ label: 'Accueil', href: '/dashboard' }, { label: 'Élèves' }]}
      actions={
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button className="btn-outline" onClick={() => setShowImport(true)}>
            <Upload size={15} /> Importer (Excel)
          </button>
          <button className="btn-ghost" onClick={handleExport} disabled={result.items.length === 0}>
            <FileDown size={15} /> Exporter
          </button>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Nouvel Élève
          </button>
        </div>
      }
    >
      {/* Modal d'importation */}
      {showImport && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 101, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border-md)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '600px', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 28px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontWeight: 700 }}>Importation en Masse</h2>
              <button className="btn-icon" onClick={() => { setShowImport(false); setImportData([]); }}><X size={18} /></button>
            </div>
            <div style={{ padding: '28px' }}>
              <div style={{ border: '2px dashed var(--border)', borderRadius: '12px', padding: '40px', textAlign: 'center', marginBottom: '24px', background: 'var(--bg-3)' }}>
                <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileChange} style={{ display: 'none' }} id="excel-upload" />
                <label htmlFor="excel-upload" style={{ cursor: 'pointer' }}>
                  <Upload size={40} style={{ color: 'var(--primary)', marginBottom: '16px' }} />
                  <p style={{ fontWeight: 600 }}>{importData.length > 0 ? `${importData.length} lignes détectées` : 'Cliquez pour choisir un fichier Excel'}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Format accepté : .xlsx, .xls</p>
                </label>
              </div>

              {importData.length > 0 && (
                <div style={{ maxHeight: '200px', overflowY: 'auto', background: 'var(--bg-1)', padding: '12px', borderRadius: '8px', fontSize: '11px', marginBottom: '24px' }}>
                  <pre>{JSON.stringify(importData.slice(0, 3), null, 2)}</pre>
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '8px' }}>... et {importData.length - 3} autres élèves</p>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button className="btn-ghost" onClick={() => { setShowImport(false); setImportData([]); }}>Annuler</button>
                <button className="btn-primary" disabled={importData.length === 0 || isSubmitting} onClick={executeImport}>
                  {isSubmitting ? 'Importation...' : 'Lancer l\'Importation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'ajout */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-2)', border: '1px solid var(--border-md)',
            borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '750px',
            maxHeight: '90vh', overflow: 'auto', boxShadow: 'var(--shadow-lg)',
            animation: 'fadeUp 0.3s var(--ease) both'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 28px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '18px' }}>Inscrire un Nouvel Élève</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              <div>
                <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Informations Personnelles</p>
                <div className="form-grid">
                  <div className="form-group"><label>Prénom *</label><input required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} placeholder="Ex: Moussa" /></div>
                  <div className="form-group"><label>Nom *</label><input required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} placeholder="Ex: Traoré" /></div>
                  <div className="form-group"><label>Date de Naissance *</label><input type="date" required value={formData.dateOfBirth} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} /></div>
                  <div className="form-group">
                    <label>Genre *</label>
                    <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                      {Object.entries(GENDER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label>N° CNI / Matricule</label><input value={formData.nationalId} onChange={e => setFormData({...formData, nationalId: e.target.value})} placeholder="Optionnel" /></div>
                  <div className="form-group">
                    <label>Campus / École *</label>
                    <select required value={formData.campusId} onChange={e => setFormData({...formData, campusId: e.target.value})}>
                      <option value="">-- Sélectionner --</option>
                      {campuses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Compte d'Accès Élève (Optionnel)</p>
                <div style={{ background: 'var(--bg-3)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: formData.createStudentAccount ? '16px' : '0' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>Activer l'accès au portail élève</span>
                    <input type="checkbox" checked={formData.createStudentAccount} onChange={e => setFormData({...formData, createStudentAccount: e.target.checked})} />
                  </div>
                  {formData.createStudentAccount && (
                    <div className="form-grid">
                      <div className="form-group"><label>Email Élève (Provisoire)</label><input type="email" value={formData.studentEmail} onChange={e => setFormData({...formData, studentEmail: e.target.value})} placeholder="laisser vide pour auto-générer" /></div>
                      <div className="form-group"><label>Mot de passe</label><input type="password" value={formData.studentPassword} onChange={e => setFormData({...formData, studentPassword: e.target.value})} placeholder="défaut: matricule" /></div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Informations du Parent / Tuteur & Accès</p>
                <div className="form-grid">
                  <div className="form-group"><label>Nom du Parent *</label><input required value={formData.parentName} onChange={e => setFormData({...formData, parentName: e.target.value})} /></div>
                  <div className="form-group"><label>Téléphone *</label><input type="tel" required value={formData.parentPhone} onChange={e => setFormData({...formData, parentPhone: e.target.value})} placeholder="+223 00 00 00 00" /></div>
                  <div className="form-group"><label>Email du Parent</label><input type="email" value={formData.parentEmail} onChange={e => setFormData({...formData, parentEmail: e.target.value})} /></div>
                  <div className="form-group">
                    <label>Relation *</label>
                    <select value={formData.parentRelationship} onChange={e => setFormData({...formData, parentRelationship: e.target.value})}>
                      {RELATION_OPTIONS.map(r => <option key={r} value={r}>{RELATION_LABELS[r]}</option>)}
                    </select>
                  </div>
                </div>
                
                <div style={{ background: 'var(--bg-3)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', marginTop: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: formData.createParentAccount ? '16px' : '0' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>Créer un compte pour le Parent</span>
                    <input type="checkbox" checked={formData.createParentAccount} onChange={e => setFormData({...formData, createParentAccount: e.target.checked})} />
                  </div>
                  {formData.createParentAccount && (
                    <div className="form-group">
                      <label>Mot de passe Parent *</label>
                      <input type="password" required={formData.createParentAccount} value={formData.parentAccountPassword} onChange={e => setFormData({...formData, parentAccountPassword: e.target.value})} placeholder="Mot de passe portail parent" />
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 size={15} className="spin" /> Enregistrement...</> : 'Confirmer l\'Inscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search + Table */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)' }} className="table-toolbar">
          <div className="search-box">
            <Search size={15} />
            <input type="text" placeholder="Rechercher par nom, matricule..." value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPage(1); }} />
          </div>
          <span style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--text-muted)' }}>
            {result.totalCount} résultat{result.totalCount > 1 ? 's' : ''}
          </span>
        </div>

        <div className="table-container">
          {isLoading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Loader2 size={32} className="spin" style={{ margin: '0 auto 12px', display: 'block' }} />
              <p>Chargement des données...</p>
            </div>
          ) : result.items.length > 0 ? (
            <table className="data-table">
              <thead><tr>
                <th>Matricule</th><th>Nom Complet</th><th>Date de Naissance</th>
                <th>Genre</th><th>Parent / Tuteur</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {result.items.map(s => (
                  <tr key={s.id}>
                    <td><span className="badge badge-primary">{s.studentNumber}</span></td>
                    <td><strong style={{ color: 'var(--text)' }}>{s.firstName} {s.lastName}</strong><br /><small style={{ color: 'var(--text-dim)' }}>{s.nationalId || '—'}</small></td>
                    <td>{new Date(s.dateOfBirth).toLocaleDateString('fr-FR')}</td>
                    <td><span className={`badge ${s.gender === 'FEMALE' ? 'badge-purple' : 'badge-info'}`}>{GENDER_LABELS[s.gender] || s.gender}</span></td>
                    <td>{s.parentName}<br /><small style={{ color: 'var(--text-dim)' }}>{s.parentPhone}</small></td>
                    <td>
                      <button className="btn-icon" title="Voir le profil" onClick={() => router.push(`/students/${s.id}`)}>
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Users size={48} style={{ opacity: 0.2, margin: '0 auto 16px', display: 'block' }} />
              <h3 style={{ fontWeight: 600, marginBottom: '8px' }}>Aucun élève trouvé</h3>
              <p style={{ fontSize: '13px' }}>Utilisez le bouton "Nouvel Élève" pour commencer.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {result.totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Page {page} sur {result.totalPages}</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Précédent</button>
              <button className="btn-ghost" disabled={page >= result.totalPages} onClick={() => setPage(p => p + 1)}>Suivant →</button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
