'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, FileDown, Users, Eye, Loader2, X, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';
import { exportToExcel } from '@/lib/excelExport';
import * as XLSX from 'xlsx';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

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

  const [importReport, setImportReport] = useState<{ success: number; errors: string[] } | null>(null);
  const [importConfig, setImportConfig] = useState({ campusId: '', createAccounts: false });

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
    fetch('/api/campuses').then(r => r.json()).then(d => { 
      if (Array.isArray(d)) {
        setCampuses(d); 
        if (d.length > 0) setImportConfig(prev => ({ ...prev, campusId: d[0].id }));
      }
    }).catch(() => {});
  }, []);

  const downloadTemplate = () => {
    const template = [{
      'Nom': 'TRAORE',
      'Prénom': 'Moussa',
      'Matricule': '2024-001',
      'DateNaissance': '2012-05-15',
      'Genre': 'M',
      'Parent': 'Ibrahim Traoré',
      'Telephone': '+223 70 00 00 00',
      'EmailParent': 'parent@example.com',
      'Relation': 'PÈRE',
      'CNI': 'ML12345'
    }];
    exportToExcel(template, 'Modele_Import_Eleves', 'Modèle');
    toast.success('Modèle Excel téléchargé.');
  };

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
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        if (json.length === 0) throw new Error('Le fichier est vide');
        setImportData(json);
        setImportReport(null);
      } catch (err: any) {
        toast.error(`Erreur de lecture : ${err.message}`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const executeImport = async () => {
    if (importData.length === 0) return;
    if (!importConfig.campusId) { toast.warning('Veuillez sélectionner un campus.'); return; }
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/students/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          students: importData,
          campusId: importConfig.campusId,
          createAccounts: importConfig.createAccounts
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setImportReport(data.report);
      toast.success(data.message);
      
      if (data.report?.success > 0) {
        fetchStudents();
      }
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
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border-md)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflow: 'auto', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 28px', borderBottom: '1px solid var(--border)' }}>
              <div>
                <h2 style={{ fontWeight: 700 }}>Importation en Masse</h2>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Inscrivez des dizaines d'élèves en un clic</p>
              </div>
              <button className="btn-icon" onClick={() => { setShowImport(false); setImportData([]); setImportReport(null); }}><X size={18} /></button>
            </div>
            
            <div style={{ padding: '28px' }}>
              {/* Étape 1 : Template */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>1. Télécharger le modèle</span>
                <button className="btn-outline" onClick={downloadTemplate} style={{ padding: '6px 12px', fontSize: '12px' }}>
                  <FileDown size={14} /> Modele_Import.xlsx
                </button>
              </div>

              {/* Étape 2 : Upload */}
              <div style={{ border: '2px dashed var(--border)', borderRadius: '12px', padding: '30px', textAlign: 'center', marginBottom: '24px', background: 'var(--bg-3)' }}>
                <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} style={{ display: 'none' }} id="excel-upload" />
                <label htmlFor="excel-upload" style={{ cursor: 'pointer' }}>
                  <Upload size={32} style={{ color: 'var(--primary)', marginBottom: '12px' }} />
                  <p style={{ fontWeight: 600, fontSize: '14px' }}>{importData.length > 0 ? `${importData.length} élèves détectés` : 'Choisir le fichier Excel rempli'}</p>
                </label>
              </div>

              {/* Étape 3 : Config */}
              {importData.length > 0 && !importReport && (
                <div style={{ background: 'var(--bg-1)', padding: '20px', borderRadius: '12px', marginBottom: '24px', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '15px', color: 'var(--text-muted)' }}>3. Paramètres d'importation</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div className="form-group">
                      <label>Campus de destination</label>
                      <select 
                        value={importConfig.campusId} 
                        onChange={e => setImportConfig({...importConfig, campusId: e.target.value})}
                      >
                        {campuses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input 
                        type="checkbox" 
                        id="createAcc" 
                        checked={importConfig.createAccounts} 
                        onChange={e => setImportConfig({...importConfig, createAccounts: e.target.checked})} 
                      />
                      <label htmlFor="createAcc" style={{ fontSize: '13px', cursor: 'pointer' }}>Créer automatiquement des comptes d'accès élèves (Mot de passe par défaut : pass123)</label>
                    </div>
                  </div>
                </div>
              )}

              {/* Étape 4 : Rapport */}
              {importReport && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                    <div style={{ flex: 1, padding: '15px', background: 'var(--success-dim)', borderRadius: '10px', border: '1px solid var(--success)', textAlign: 'center' }}>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--success)' }}>{importReport.success}</div>
                      <div style={{ fontSize: '11px', color: 'var(--success)' }}>Succès</div>
                    </div>
                    <div style={{ flex: 1, padding: '15px', background: importReport.errors.length > 0 ? 'var(--danger-dim)' : 'var(--bg-3)', borderRadius: '10px', border: importReport.errors.length > 0 ? '1px solid var(--danger)' : '1px solid var(--border)', textAlign: 'center' }}>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: importReport.errors.length > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>{importReport.errors.length}</div>
                      <div style={{ fontSize: '11px', color: importReport.errors.length > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>Échecs</div>
                    </div>
                  </div>
                  
                  {importReport.errors.length > 0 && (
                    <div style={{ maxHeight: '150px', overflowY: 'auto', background: 'var(--bg-3)', padding: '12px', borderRadius: '8px', fontSize: '11px', color: 'var(--danger)', border: '1px solid var(--border)' }}>
                      <p style={{ fontWeight: 700, marginBottom: '5px' }}>Journal des erreurs :</p>
                      {importReport.errors.map((err, i) => <div key={i} style={{ marginBottom: '4px' }}>• {err}</div>)}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                <button className="btn-ghost" onClick={() => { setShowImport(false); setImportData([]); setImportReport(null); }}>Fermer</button>
                {!importReport && (
                  <button className="btn-primary" disabled={importData.length === 0 || isSubmitting} onClick={executeImport}>
                    {isSubmitting ? <><Loader2 size={16} className="spin" /> Importation...</> : 'Lancer l\'Importation'}
                  </button>
                )}
              </div>
        <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-3xl bg-bg-2 border-border-light shadow-2xl rounded-2xl p-0 overflow-hidden">
          <DialogHeader className="p-6 border-b border-border bg-bg-2/50">
            <DialogTitle className="text-xl font-bold font-plus-jakarta">Inscrire un Nouvel Élève</DialogTitle>
            <DialogDescription className="text-text-dim">Remplissez les informations pour enregistrer un nouvel étudiant dans le système.</DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {/* Section 1: Perso */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary bg-primary/5 p-2 rounded-lg w-fit">
                <Users size={12} /> Informations Personnelles
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted">Prénom *</label>
                  <input className="flex h-9 w-full rounded-md border border-input bg-bg-3 px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} placeholder="Ex: Moussa" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted">Nom *</label>
                  <input className="flex h-9 w-full rounded-md border border-input bg-bg-3 px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} placeholder="Ex: Traoré" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted">Date de Naissance *</label>
                  <input type="date" className="flex h-9 w-full rounded-md border border-input bg-bg-3 px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" required value={formData.dateOfBirth} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted">Genre *</label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-bg-3 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                    {Object.entries(GENDER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted">Campus / École *</label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-bg-3 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" required value={formData.campusId} onChange={e => setFormData({...formData, campusId: e.target.value})}>
                    <option value="">-- Sélectionner --</option>
                    {campuses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted">N° CNI / Matricule</label>
                  <input className="flex h-9 w-full rounded-md border border-input bg-bg-3 px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" value={formData.nationalId} onChange={e => setFormData({...formData, nationalId: e.target.value})} placeholder="Optionnel" />
                </div>
              </div>
            </div>

            {/* Section 2: Parent */}
            <div className="space-y-4 pt-4 border-t border-border/40">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 bg-emerald-400/5 p-2 rounded-lg w-fit">
                <Briefcase size={12} /> Parent / Tuteur
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted">Nom du Parent *</label>
                  <input className="flex h-9 w-full rounded-md border border-input bg-bg-3 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" required value={formData.parentName} onChange={e => setFormData({...formData, parentName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted">Téléphone *</label>
                  <input className="flex h-9 w-full rounded-md border border-input bg-bg-3 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" type="tel" required value={formData.parentPhone} onChange={e => setFormData({...formData, parentPhone: e.target.value})} placeholder="+223 00 00 00 00" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted">Email du Parent</label>
                  <input className="flex h-9 w-full rounded-md border border-input bg-bg-3 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" type="email" value={formData.parentEmail} onChange={e => setFormData({...formData, parentEmail: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted">Relation *</label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-bg-3 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={formData.parentRelationship} onChange={e => setFormData({...formData, parentRelationship: e.target.value})}>
                    {RELATION_OPTIONS.map(r => <option key={r} value={r}>{RELATION_LABELS[r]}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border/40 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Annuler</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-primary text-white shadow-glow">
                {isSubmitting ? <><Loader2 size={15} className="spin mr-2" /> Enregistrement...</> : 'Confirmer l\'Inscription'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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

        <div className="p-1">
          {isLoading ? (
            <div className="py-20 text-center text-text-muted">
              <Loader2 size={32} className="spin mx-auto mb-4" />
              <p>Chargement des données scolaires...</p>
            </div>
          ) : result.items.length > 0 ? (
            <Table>
              <TableHeader className="bg-bg-2">
                <TableRow>
                  <TableHead className="w-[120px]">Matricule</TableHead>
                  <TableHead>Nom Complet</TableHead>
                  <TableHead>Date Naissance</TableHead>
                  <TableHead>Genre</TableHead>
                  <TableHead>Parent / Tuteur</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.items.map((s: any) => (
                  <TableRow key={s.id} className="hover:bg-primary-surface transition-colors border-border/40">
                    <TableCell>
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-mono">
                        {s.studentNumber}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-text">{s.firstName} {s.lastName}</span>
                        <span className="text-[11px] text-text-dim">{s.nationalId || 'Sans CNI'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-text-soft">
                      {new Date(s.dateOfBirth).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={s.gender === 'FEMALE' ? 'bg-purple-500/10 text-purple-400 border-none' : 'bg-blue-500/10 text-blue-400 border-none'}
                      >
                        {GENDER_LABELS[s.gender] || s.gender}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-text-soft">{s.parentName}</span>
                        <span className="text-[11px] text-text-muted">{s.parentPhone}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon-sm" 
                        title="Profil complet"
                        onClick={() => router.push(`/students/${s.id}`)}
                      >
                        <Eye size={15} className="text-text-muted hover:text-primary transition-colors" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-20 text-center text-text-muted">
              <Users size={48} className="opacity-10 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-text mb-2">Aucun élève trouvé</h3>
              <p className="text-sm">Votre base de données est vide ou aucun résultat pour cette recherche.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {result.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border/40">
            <span className="text-xs text-text-muted">Page {page} sur {result.totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                Précédent
              </Button>
              <Button variant="outline" size="sm" disabled={page >= result.totalPages} onClick={() => setPage(p => p + 1)}>
                Suivant
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
