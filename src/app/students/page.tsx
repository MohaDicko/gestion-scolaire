'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, FileDown, Users, Eye, Loader2, X, Upload, Briefcase } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';
import { exportToExcel } from '@/lib/excelExport';
import * as XLSX from 'xlsx';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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

const inputCls = 'flex h-9 w-full rounded-md border border-input bg-bg-3 px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';
const selectCls = 'flex h-9 w-full rounded-md border border-input bg-bg-3 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';
const labelCls = 'text-xs font-bold text-text-muted';

export default function StudentsPage() {
  const router = useRouter();
  const toast  = useToast();

  const [result, setResult]     = useState<{ items: any[]; totalCount: number; totalPages: number }>({ items: [], totalCount: 0, totalPages: 1 });
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage]         = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [campuses, setCampuses] = useState<any[]>([]);
  const [formData, setFormData] = useState({ ...emptyForm });
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
      'Nom': 'TRAORE', 'Prénom': 'Moussa', 'Matricule': '2024-001',
      'DateNaissance': '2012-05-15', 'Genre': 'M', 'Parent': 'Ibrahim Traoré',
      'Telephone': '+223 70 00 00 00', 'EmailParent': 'parent@example.com',
      'Relation': 'PÈRE', 'CNI': 'ML12345'
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
        body: JSON.stringify({ students: importData, campusId: importConfig.campusId, createAccounts: importConfig.createAccounts })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setImportReport(data.report);
      toast.success(data.message);
      if (data.report?.success > 0) fetchStudents();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeImport = () => { setShowImport(false); setImportData([]); setImportReport(null); };

  return (
    <AppLayout
      title="Gestion des Élèves"
      subtitle={`${result.totalCount} élève${result.totalCount > 1 ? 's' : ''} dans votre établissement`}
      breadcrumbs={[{ label: 'Accueil', href: '/dashboard' }, { label: 'Élèves' }]}
      actions={
        <div className="flex gap-2 items-center">
          <Button variant="outline" size="sm" onClick={() => setShowImport(true)}>
            <Upload size={14} /> Importer
          </Button>
          <Button variant="ghost" size="sm" onClick={handleExport} disabled={result.items.length === 0}>
            <FileDown size={14} /> Exporter
          </Button>
          <Button size="sm" onClick={() => setShowModal(true)} className="bg-primary text-white">
            <Plus size={14} /> Nouvel Élève
          </Button>
        </div>
      }
    >
      {/* ── Import Dialog ── */}
      <Dialog open={showImport} onOpenChange={closeImport}>
        <DialogContent className="max-w-2xl bg-bg-2 border-border-light shadow-2xl rounded-2xl p-0 overflow-hidden">
          <DialogHeader className="p-6 border-b border-border bg-bg-2/50">
            <DialogTitle className="text-lg font-bold">Importation en Masse</DialogTitle>
            <DialogDescription className="text-text-dim">
              Inscrivez des dizaines d&apos;élèves depuis un fichier Excel.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-6">
            {/* Step 1 */}
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold">1. Télécharger le modèle</span>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <FileDown size={14} /> Modele_Import.xlsx
              </Button>
            </div>

            {/* Step 2 */}
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center bg-bg-3 hover:border-primary/40 transition-colors">
              <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="hidden" id="excel-upload" />
              <label htmlFor="excel-upload" className="cursor-pointer flex flex-col items-center gap-3">
                <Upload size={32} className="text-primary/60" />
                <p className="font-semibold text-sm">
                  {importData.length > 0 ? `✅ ${importData.length} élèves détectés — prêts à importer` : '2. Choisir le fichier Excel rempli'}
                </p>
                <p className="text-xs text-text-dim">Formats acceptés : .xlsx, .xls</p>
              </label>
            </div>

            {/* Step 3: Config */}
            {importData.length > 0 && !importReport && (
              <div className="space-y-3 p-4 bg-bg-3 rounded-xl border border-border">
                <p className="text-xs font-black uppercase tracking-widest text-text-muted">3. Paramètres</p>
                <div className="space-y-1">
                  <label className={labelCls}>Campus de destination</label>
                  <select className={selectCls} value={importConfig.campusId} onChange={e => setImportConfig({...importConfig, campusId: e.target.value})}>
                    {campuses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="createAcc" checked={importConfig.createAccounts} onChange={e => setImportConfig({...importConfig, createAccounts: e.target.checked})} className="h-4 w-4 accent-primary" />
                  <label htmlFor="createAcc" className="text-xs cursor-pointer">Créer automatiquement des comptes élèves (mdp défaut : pass123)</label>
                </div>
              </div>
            )}

            {/* Step 4: Report */}
            {importReport && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-success-dim border border-success rounded-xl text-center">
                    <div className="text-2xl font-black text-success">{importReport.success}</div>
                    <div className="text-xs text-success">Succès</div>
                  </div>
                  <div className={`p-4 rounded-xl text-center ${importReport.errors.length > 0 ? 'bg-danger-dim border border-danger' : 'bg-bg-3 border border-border'}`}>
                    <div className={`text-2xl font-black ${importReport.errors.length > 0 ? 'text-danger' : 'text-text-muted'}`}>{importReport.errors.length}</div>
                    <div className={`text-xs ${importReport.errors.length > 0 ? 'text-danger' : 'text-text-muted'}`}>Échecs</div>
                  </div>
                </div>
                {importReport.errors.length > 0 && (
                  <div className="max-h-32 overflow-y-auto bg-bg-3 p-3 rounded-lg text-xs text-danger border border-border space-y-1">
                    <p className="font-bold">Journal des erreurs :</p>
                    {importReport.errors.map((err, i) => <div key={i}>• {err}</div>)}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2 border-t border-border/40">
              <Button variant="ghost" onClick={closeImport}>Fermer</Button>
              {!importReport && (
                <Button disabled={importData.length === 0 || isSubmitting} onClick={executeImport} className="bg-primary text-white">
                  {isSubmitting ? <><Loader2 size={14} className="spin mr-2" />Importation...</> : "Lancer l'Importation"}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Add Student Dialog ── */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-3xl bg-bg-2 border-border-light shadow-2xl rounded-2xl p-0 overflow-hidden">
          <DialogHeader className="p-6 border-b border-border bg-bg-2/50">
            <DialogTitle className="text-xl font-bold">Inscrire un Nouvel Élève</DialogTitle>
            <DialogDescription className="text-text-dim">
              Remplissez les informations pour enregistrer un nouvel étudiant dans le système.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Section Perso */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary bg-primary/5 p-2 rounded-lg w-fit">
                <Users size={12} /> Informations Personnelles
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Prénom *', field: 'firstName', placeholder: 'Ex: Moussa' },
                  { label: 'Nom *', field: 'lastName', placeholder: 'Ex: Traoré' },
                ].map(({ label, field, placeholder }) => (
                  <div key={field} className="space-y-1">
                    <label className={labelCls}>{label}</label>
                    <input className={inputCls} required value={(formData as any)[field]} onChange={e => setFormData({...formData, [field]: e.target.value})} placeholder={placeholder} />
                  </div>
                ))}
                <div className="space-y-1">
                  <label className={labelCls}>Date de Naissance *</label>
                  <input type="date" className={inputCls} required value={formData.dateOfBirth} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Genre *</label>
                  <select className={selectCls} value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                    {Object.entries(GENDER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Campus / École *</label>
                  <select className={selectCls} required value={formData.campusId} onChange={e => setFormData({...formData, campusId: e.target.value})}>
                    <option value="">-- Sélectionner --</option>
                    {campuses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>N° CNI / Matricule</label>
                  <input className={inputCls} value={formData.nationalId} onChange={e => setFormData({...formData, nationalId: e.target.value})} placeholder="Optionnel" />
                </div>
              </div>
            </div>

            {/* Section Parent */}
            <div className="space-y-4 pt-4 border-t border-border/40">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 bg-emerald-400/5 p-2 rounded-lg w-fit">
                <Briefcase size={12} /> Parent / Tuteur
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={labelCls}>Nom du Parent *</label>
                  <input className={inputCls} required value={formData.parentName} onChange={e => setFormData({...formData, parentName: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Téléphone *</label>
                  <input className={inputCls} type="tel" required value={formData.parentPhone} onChange={e => setFormData({...formData, parentPhone: e.target.value})} placeholder="+223 00 00 00 00" />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Email du Parent</label>
                  <input className={inputCls} type="email" value={formData.parentEmail} onChange={e => setFormData({...formData, parentEmail: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Relation *</label>
                  <select className={selectCls} value={formData.parentRelationship} onChange={e => setFormData({...formData, parentRelationship: e.target.value})}>
                    {RELATION_OPTIONS.map(r => <option key={r} value={r}>{RELATION_LABELS[r]}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
              <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Annuler</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-primary text-white shadow-glow">
                {isSubmitting ? <><Loader2 size={14} className="spin mr-2" />Enregistrement...</> : "Confirmer l'Inscription"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Search + Table ── */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-toolbar" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div className="search-box">
            <Search size={15} />
            <input
              type="text"
              placeholder="Rechercher par nom, matricule..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
            />
          </div>
          <span className="text-xs text-text-muted ml-auto">
            {result.totalCount} résultat{result.totalCount > 1 ? 's' : ''}
          </span>
        </div>

        <div className="p-1">
          {isLoading ? (
            <div className="py-20 text-center text-text-muted">
              <Loader2 size={32} className="spin mx-auto mb-4 text-primary/40" />
              <p>Chargement des données scolaires...</p>
            </div>
          ) : result.items.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/40">
                  <TableHead className="w-[130px]">Matricule</TableHead>
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
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-mono text-[11px]">
                        {s.studentNumber}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-text">{s.firstName} {s.lastName}</span>
                        <span className="text-[11px] text-text-dim">{s.nationalId || 'Sans CNI'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-text-soft text-sm">
                      {new Date(s.dateOfBirth).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={s.gender === 'FEMALE'
                          ? 'bg-purple-500/10 text-purple-400 border-none'
                          : 'bg-blue-500/10 text-blue-400 border-none'}
                      >
                        {GENDER_LABELS[s.gender] || s.gender}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-text-soft text-sm">{s.parentName}</span>
                        <span className="text-[11px] text-text-muted">{s.parentPhone}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Voir le profil complet"
                        onClick={() => router.push(`/students/${s.id}`)}
                      >
                        <Eye size={15} className="text-text-muted" />
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
              <p className="text-sm">Aucun résultat pour cette recherche ou la liste est vide.</p>
            </div>
          )}
        </div>

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
