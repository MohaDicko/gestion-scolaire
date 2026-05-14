'use client';

import { useState, useEffect, useCallback } from 'react';
import { Briefcase, Plus, Search, Loader2, X, Users, Mail, Phone, FileDown, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';
import { exportToExcel } from '@/lib/excelExport';
import * as XLSX from 'xlsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const EMPLOYEE_TYPES = ['TEACHER', 'ADMIN', 'ACCOUNTANT', 'HR', 'MAINTENANCE', 'SUPPORT'];

const emptyForm = {
  firstName: '', lastName: '', email: '', phoneNumber: '',
  dateOfBirth: '', gender: 'MALE', hireDate: new Date().toISOString().split('T')[0],
  employeeType: 'TEACHER', campusId: ''
};

export default function EmployeesPage() {
  const router = useRouter();
  const toast  = useToast();

  const [employees, setEmployees] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [campuses, setCampuses] = useState<any[]>([]);
  const [formData, setFormData] = useState({ ...emptyForm, createAccount: false, password: '' });
  const [importData, setImportData] = useState<any[]>([]);
  const [importConfig, setImportConfig] = useState({ campusId: '', createAccounts: false });

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/employees?search=${encodeURIComponent(searchTerm)}`);
      if (res.status === 401) { router.push('/login'); return; }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEmployees(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Erreur lors du chargement des employés.');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, router, toast]);

  useEffect(() => {
    const t = setTimeout(fetchEmployees, 300);
    return () => clearTimeout(t);
  }, [fetchEmployees]);

  useEffect(() => {
    fetch('/api/campuses')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setCampuses(d); })
      .catch(() => {});
  }, []);

  const handleExport = () => {
    const data = employees.map(e => ({
      'Matricule': e.employeeNumber,
      'Prénom': e.firstName,
      'Nom': e.lastName,
      'Email': e.email,
      'Téléphone': e.phoneNumber,
      'Poste': e.employeeType,
      'Embauche': new Date(e.hireDate).toLocaleDateString()
    }));
    exportToExcel(data, `Personnel_${new Date().toISOString().split('T')[0]}`);
    toast.success('Export RH généré.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (!formData.campusId) throw new Error("Veuillez sélectionner un campus.");
      if (formData.createAccount && !formData.password) throw new Error("Veuillez saisir un mot de passe pour le compte portail.");
      
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur création');
      toast.success(`Le dossier RH de ${formData.firstName} a été créé${formData.createAccount ? ' avec un compte accès' : ''}.`);
      setShowModal(false);
      setFormData({ ...emptyForm, createAccount: false, password: '' });
      fetchEmployees();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        setImportData(json);
      } catch (err) { toast.error('Erreur de lecture'); }
    };
    reader.readAsArrayBuffer(file);
  };

  const executeImport = async () => {
    if (importData.length === 0) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/employees/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employees: importData, campusId: importConfig.campusId, createAccounts: importConfig.createAccounts })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message);
      setShowImport(false);
      setImportData([]);
      fetchEmployees();
    } catch (err: any) { toast.error(err.message); }
    finally { setIsSubmitting(false); }
  };

  return (
    <AppLayout
      title="Ressources Humaines"
      subtitle="Gestion du personnel, des enseignants et de l'administration"
      breadcrumbs={[{ label: 'Accueil', href: '/dashboard' }, { label: 'Employés' }]}
      actions={
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-ghost" onClick={() => setShowImport(true)}>
            <Upload size={15} /> Importer
          </button>
          <button className="btn-ghost" onClick={handleExport} disabled={employees.length === 0}>
            <FileDown size={15} /> Exporter
          </button>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Nouvel Employé
          </button>
        </div>
      }
    >
      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border-md)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '650px', maxHeight: '90vh', overflow: 'auto', boxShadow: 'var(--shadow-lg)', animation: 'fadeUp 0.3s var(--ease) both' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 28px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '18px' }}>Ajouter un Employé</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Identité & Poste</h3>
              </div>

              <div className="form-grid">
                <div className="form-group"><label>Prénom *</label><input required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} placeholder="Ex: Awa" /></div>
                <div className="form-group"><label>Nom *</label><input required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} placeholder="Ex: Diallo" /></div>
                <div className="form-group"><label>Email Professionnel *</label><input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="awa.diallo@ecole.ml" /></div>
                <div className="form-group"><label>Téléphone *</label><input type="tel" required value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} placeholder="+223 ..." /></div>
                <div className="form-group"><label>Date de Naissance *</label><input type="date" required value={formData.dateOfBirth} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} /></div>
                <div className="form-group">
                  <label>Genre *</label>
                  <select required value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                    <option value="MALE">Masculin</option><option value="FEMALE">Féminin</option>
                  </select>
                </div>
                <div className="form-group"><label>Date d'embauche *</label><input type="date" required value={formData.hireDate} onChange={e => setFormData({...formData, hireDate: e.target.value})} /></div>
                <div className="form-group">
                  <label>Rôle / Fonction *</label>
                  <select required value={formData.employeeType} onChange={e => setFormData({...formData, employeeType: e.target.value})}>
                    {EMPLOYEE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Campus d'affectation *</label>
                  <select required value={formData.campusId} onChange={e => setFormData({...formData, campusId: e.target.value})}>
                    <option value="">-- Assigner à un campus --</option>
                    {campuses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '12px', padding: '20px', background: 'var(--bg-3)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: formData.createAccount ? '16px' : '0' }}>
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>Compte d'Accès Portail</h3>
                    <p style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Permettre à cet employé de se connecter au logiciel.</p>
                  </div>
                  <div 
                    onClick={() => setFormData({...formData, createAccount: !formData.createAccount})}
                    style={{ 
                      width: '44px', height: '24px', borderRadius: '12px', 
                      background: formData.createAccount ? 'var(--primary)' : 'var(--border-md)', 
                      position: 'relative', cursor: 'pointer', transition: 'all 0.2s' 
                    }}
                  >
                    <div style={{ 
                      width: '18px', height: '18px', borderRadius: '50%', background: 'white', 
                      position: 'absolute', top: '3px', left: formData.createAccount ? '23px' : '3px',
                      transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }} />
                  </div>
                </div>

                {formData.createAccount && (
                  <div style={{ animation: 'fadeIn 0.2s ease', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label>Identifiant (Email)</label>
                      <input disabled value={formData.email} className="form-input" style={{ opacity: 0.6 }} />
                    </div>
                    <div className="form-group">
                      <label>Mot de passe provisoire *</label>
                      <input 
                        type="password" 
                        required 
                        value={formData.password} 
                        onChange={e => setFormData({...formData, password: e.target.value})} 
                        placeholder="••••••••" 
                      />
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 size={15} className="spin" /> Traitement...</> : 'Créer le Dossier RH'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Import Modal */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent className="max-w-md bg-bg-2 border-border-light shadow-2xl rounded-2xl p-0 overflow-hidden">
          <DialogHeader className="p-6 border-b border-border bg-bg-2/50">
            <DialogTitle>Importation RH</DialogTitle>
            <DialogDescription>Importez votre liste d&apos;enseignants et staff.</DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-6">
            <div className="form-group">
              <label className="text-xs font-bold text-text-muted">Campus d'affectation *</label>
              <select className="form-input" style={{ width: '100%' }} value={importConfig.campusId} onChange={e => setImportConfig({...importConfig, campusId: e.target.value})}>
                <option value="">-- Sélectionner le campus de destination --</option>
                {campuses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center bg-bg-3 hover:border-primary/40 transition-colors">
              <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="hidden" id="staff-upload" />
              <label htmlFor="staff-upload" className="cursor-pointer flex flex-col items-center gap-3">
                <Upload size={32} className="text-primary/60" />
                <p className="font-semibold text-sm">
                  {importData.length > 0 ? `✅ ${importData.length} lignes détectées` : 'Choisir le fichier Excel (Personnel)'}
                </p>
              </label>
            </div>

            {importData.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="cAcc" checked={importConfig.createAccounts} onChange={e => setImportConfig({...importConfig, createAccounts: e.target.checked})} />
                  <label htmlFor="cAcc" className="text-xs">Créer des comptes accès portail (mdp par défaut: staff123)</label>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button variant="ghost" onClick={() => setShowImport(false)}>Annuler</Button>
              <Button disabled={importData.length === 0 || isSubmitting} onClick={executeImport} className="bg-primary text-white">
                {isSubmitting ? 'En cours...' : 'Lancer l\'Import'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }} className="table-toolbar">
          <div className="search-box" style={{ maxWidth: '400px' }}>
            <Search size={15} />
            <input type="text" placeholder="Rechercher un employé, matricule..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div className="table-container">
          {isLoading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Loader2 size={32} className="spin" style={{ margin: '0 auto 12px', display: 'block' }} />
              <p>Chargement des dossiers...</p>
            </div>
          ) : employees.length > 0 ? (
            <table className="data-table">
              <thead><tr><th>Matricule</th><th>Identité</th><th>Contact</th><th>Poste</th><th>Ancienneté</th></tr></thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.id}>
                    <td><span className="badge badge-purple">{emp.employeeNumber}</span></td>
                    <td>
                      <strong style={{ color: 'var(--text)' }}>{emp.firstName} {emp.lastName}</strong>
                      <br />
                      <span className={`badge ${emp.gender === 'FEMALE' ? 'badge-purple' : 'badge-info'}`} style={{ marginTop: '4px', fontSize: '10px' }}>{emp.gender === 'FEMALE' ? 'FEME' : 'MASC'}</span>
                    </td>
                    <td style={{ fontSize: '13px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}><Mail size={13} className="text-muted" /> {emp.email}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={13} className="text-muted" /> {emp.phoneNumber}</div>
                    </td>
                    <td><span className="badge badge-primary">{emp.employeeType}</span></td>
                    <td>{new Date(emp.hireDate).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Briefcase size={48} style={{ opacity: 0.2, margin: '0 auto 16px', display: 'block' }} />
              <h3 style={{ fontWeight: 600, marginBottom: '8px' }}>Aucun employé trouvé</h3>
              <p style={{ fontSize: '13px' }}>Ajoutez vos enseignants et votre staff administratif.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
