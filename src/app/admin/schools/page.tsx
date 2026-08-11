'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, Plus, Search, MapPin, Phone, Globe,
  Trash2, Edit3, ExternalLink, GraduationCap, Users,
  DollarSign, BookOpen, X, Save, CheckCircle, AlertCircle,
  Activity, RefreshCw, Landmark, ShieldCheck, TrendingUp, UserCheck, School
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';
import { motion, AnimatePresence } from 'framer-motion';

const SCHOOL_TYPES = ['PRIMAIRE','FONDAMENTAL','LYCEE','TECHNIQUE','SANTE','UNIVERSITE'];
const PLANS = ['STARTER', 'BUSINESS', 'ELITE'];

const PLAN_COLORS: Record<string, { bg: string, text: string, border: string }> = {
  STARTER: { bg: 'bg-slate-100 dark:bg-slate-500/10', text: 'text-slate-700 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-500/20' },
  BUSINESS: { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-500/20' },
  ELITE: { bg: 'bg-purple-50 dark:bg-purple-500/10', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-500/20' }
};

const TYPE_COLORS: Record<string, { bg: string, text: string, border: string }> = {
  LYCEE: { bg: 'bg-indigo-50 dark:bg-indigo-500/10', text: 'text-indigo-700 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-500/20' },
  SANTE: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-500/20' },
  TECHNIQUE: { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-500/20' },
  FONDAMENTAL: { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-500/20' },
  PRIMAIRE: { bg: 'bg-pink-50 dark:bg-pink-500/10', text: 'text-pink-700 dark:text-pink-400', border: 'border-pink-200 dark:border-pink-500/20' },
  UNIVERSITE: { bg: 'bg-violet-50 dark:bg-violet-500/10', text: 'text-violet-700 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-500/20' }
};

function formatXOF(n: number) {
  return (n || 0).toLocaleString('fr-FR') + ' FCFA';
}

function StatCard({ icon, label, value, colorClass }: { icon: React.ReactNode; label: string; value: string | number; colorClass: string }) {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all duration-300"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-zinc-900 dark:text-white">{value}</div>
        <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mt-0.5">{label}</div>
      </div>
    </motion.div>
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
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-500/30 transition-all"
          onClick={() => { setEditSchool(null); setShowForm(true); }}
        >
          <Plus size={18} /> Nouvel Établissement
        </motion.button>
      }
    >
      {/* Network KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <StatCard icon={<Landmark size={24}/>} label="Établissements" value={schools.length} colorClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400" />
        <StatCard icon={<Users size={24}/>} label="Élèves Total" value={schools.reduce((s, sc) => s + (sc.stats?.studentCount || 0), 0).toLocaleString()} colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" />
        <StatCard icon={<UserCheck size={24}/>} label="Personnel Total" value={schools.reduce((s, sc) => s + (sc.stats?.employeeCount || 0), 0)} colorClass="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" />
        <StatCard icon={<BookOpen size={24}/>} label="Classes Total" value={schools.reduce((s, sc) => s + (sc.stats?.classroomCount || 0), 0)} colorClass="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" />
        <StatCard icon={<TrendingUp size={24}/>} label="Recouvrement Moy." value={schools.length ? Math.round(schools.reduce((s, sc) => s + (sc.stats?.collectionRate || 0), 0) / schools.length) + '%' : '—'} colorClass="bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400" />
      </div>

      <div className={`grid gap-6 ${selectedSchool ? 'lg:grid-cols-[1fr_450px]' : 'grid-cols-1'}`}>
        
        {/* LEFT: School List */}
        <div className="flex flex-col gap-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                placeholder="Rechercher par nom, code, ville..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select 
              className="py-2.5 px-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none cursor-pointer"
              value={typeFilter} 
              onChange={e => setTypeFilter(e.target.value)}
            >
              <option value="">Tous les types</option>
              {SCHOOL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button 
              className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
              onClick={fetchSchools}
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* List */}
          {loading ? (
            <div className="grid gap-3">
              {[1,2,3,4].map(i => <div key={i} className="h-24 rounded-2xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-16 text-center text-zinc-500">
              <Building2 size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Aucun établissement trouvé</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <AnimatePresence>
                {filtered.map((school, i) => {
                  const isSelected = selectedSchool?.id === school.id;
                  const typeTheme = TYPE_COLORS[school.type] || TYPE_COLORS['LYCEE'];
                  const planTheme = PLAN_COLORS[school.plan] || PLAN_COLORS['STARTER'];
                  
                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.05 }}
                      key={school.id}
                      onClick={() => handleSelectSchool(school)}
                      className={`
                        group relative flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-200
                        ${isSelected 
                          ? 'bg-indigo-50/50 dark:bg-indigo-500/10 border-indigo-300 dark:border-indigo-500/30 shadow-md ring-1 ring-indigo-500/20' 
                          : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:-translate-y-0.5'
                        } border
                      `}
                    >
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${typeTheme.bg} ${typeTheme.text} ${typeTheme.border}`}>
                        <School size={24} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate">{school.name}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${typeTheme.bg} ${typeTheme.text} ${typeTheme.border}`}>
                            {school.type}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${planTheme.bg} ${planTheme.text} ${planTheme.border}`}>
                            {school.plan}
                          </span>
                          {!school.isActive && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-50 text-red-600 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20">
                              INACTIF
                            </span>
                          )}
                        </div>
                        <div className="flex gap-4 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                          <span className="flex items-center gap-1.5"><MapPin size={12} />{school.city || 'N/A'}</span>
                          <span className="flex items-center gap-1.5"><Users size={12} />{school.stats?.studentCount ?? 0} élèves</span>
                          <span className="flex items-center gap-1.5"><UserCheck size={12} />{school.stats?.employeeCount ?? 0} staff</span>
                        </div>
                      </div>

                      {/* Rate badge */}
                      <div className="text-center shrink-0 px-2">
                        <div className={`text-lg font-black ${(school.stats?.collectionRate ?? 0) >= 70 ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {school.stats?.collectionRate ?? 0}%
                        </div>
                        <div className="text-[10px] font-bold uppercase text-zinc-400">Recouvrement</div>
                      </div>

                      <ChevronRight size={20} className="text-zinc-300 dark:text-zinc-600 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all shrink-0" />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* RIGHT: Detail Panel */}
        {selectedSchool && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-4 sticky top-6 self-start"
          >
            {/* Header Card */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm relative overflow-hidden">
              {/* Subtle background decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-bl-[100px] -z-0" />
              
              <div className="flex items-start justify-between mb-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${TYPE_COLORS[selectedSchool.type]?.bg || 'bg-zinc-100'} ${TYPE_COLORS[selectedSchool.type]?.text || 'text-zinc-500'} ${TYPE_COLORS[selectedSchool.type]?.border || 'border-zinc-200'}`}>
                    <School size={28} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-zinc-900 dark:text-white leading-tight">{selectedSchool.name}</h2>
                    <code className="text-xs font-bold text-zinc-400 mt-1 block">{selectedSchool.code}</code>
                  </div>
                </div>
                <button 
                  className="p-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-full text-zinc-500 transition-colors" 
                  onClick={() => { setSelectedSchool(null); setDetailData(null); }}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 relative z-10">
                <button 
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-lg transition-colors" 
                  onClick={() => { setEditSchool(selectedSchool); setShowForm(true); }}
                >
                  <Edit3 size={14} /> Modifier
                </button>
                <button
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border ${
                    selectedSchool.isActive 
                      ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' 
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                  }`}
                  onClick={() => handleToggleActive(selectedSchool)}
                >
                  {selectedSchool.isActive ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
                  {selectedSchool.isActive ? 'Désactiver' : 'Activer'}
                </button>
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20 text-xs font-bold rounded-lg transition-colors"
                  onClick={() => handleDelete(selectedSchool.id, selectedSchool.name)}
                >
                  <Trash2 size={14} /> Supprimer
                </button>
                <button
                  className="ml-auto flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 text-xs font-bold rounded-lg shadow-md shadow-indigo-500/20 transition-colors"
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
                        window.location.href = '/dashboard';
                      } else {
                        toast.error('Erreur lors du changement d\'espace');
                      }
                    } catch { toast.error('Erreur réseau'); }
                  }}
                >
                  <ExternalLink size={14} /> Accéder au Dashboard
                </button>
              </div>
            </div>

            {/* Live Stats */}
            {detailLoading ? (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 text-center text-zinc-400">
                <RefreshCw size={32} className="animate-spin mx-auto opacity-50" />
                <p className="mt-4 text-sm font-medium">Récupération des métriques en temps réel...</p>
              </div>
            ) : detailData ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-4"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: <Users size={18}/>, label: 'Élèves', value: detailData.stats.studentCount, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
                    { icon: <UserCheck size={18}/>, label: 'Personnel', value: detailData.stats.employeeCount, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
                    { icon: <BookOpen size={18}/>, label: 'Classes', value: detailData.stats.classroomCount, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
                    { icon: <Building2 size={18}/>, label: 'Campus', value: detailData.stats.campusCount, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
                  ].map(s => (
                    <div key={s.label} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg} ${s.color}`}>
                        {s.icon}
                      </div>
                      <div>
                        <div className="text-xl font-black text-zinc-900 dark:text-white">{s.value}</div>
                        <div className="text-xs font-bold text-zinc-500">{s.label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Financial */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm">
                  <h4 className="flex items-center gap-2 text-sm font-black text-zinc-900 dark:text-white mb-4">
                    <DollarSign size={18} className="text-emerald-500" /> Situation Financière
                  </h4>
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800">
                      <span className="text-sm font-medium text-zinc-500">Total Facturé</span>
                      <span className="text-sm font-bold text-zinc-900 dark:text-white">{formatXOF(detailData.stats.financial.totalInvoiced)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800">
                      <span className="text-sm font-medium text-zinc-500">Total Encaissé</span>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatXOF(detailData.stats.financial.totalPaid)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800">
                      <span className="text-sm font-medium text-zinc-500">Factures Impayées</span>
                      <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{detailData.stats.financial.unpaidCount} facture(s)</span>
                    </div>
                    
                    <div className="mt-2">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-zinc-500 uppercase">Taux de Recouvrement</span>
                        <span className={`text-sm font-black ${detailData.stats.financial.collectionRate >= 70 ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {detailData.stats.financial.collectionRate}%
                        </span>
                      </div>
                      <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${detailData.stats.financial.collectionRate}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={`h-full rounded-full ${detailData.stats.financial.collectionRate >= 70 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subscription Plan Card */}
                <div className={`rounded-3xl p-5 border ${PLAN_COLORS[selectedSchool.plan]?.bg} ${PLAN_COLORS[selectedSchool.plan]?.border}`}>
                   <div className="flex justify-between items-center mb-1">
                      <h4 className="text-sm font-black text-zinc-900 dark:text-white">Abonnement Actif</h4>
                      <span className={`text-xs font-black px-2.5 py-1 rounded-lg border bg-white/50 dark:bg-black/20 ${PLAN_COLORS[selectedSchool.plan]?.text} ${PLAN_COLORS[selectedSchool.plan]?.border}`}>
                        {selectedSchool.plan}
                      </span>
                   </div>
                   <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mt-2">
                      {selectedSchool.plan === 'STARTER' && 'Max 250 élèves, Fonctions de base.'}
                      {selectedSchool.plan === 'BUSINESS' && 'Max 750 élèves, Emails, Reçus PDF, Cartes ID.'}
                      {selectedSchool.plan === 'ELITE' && 'Illimité, Module Paie, Multi-Campus.'}
                   </p>
                </div>

                {/* Contact Info */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm">
                  <h4 className="text-sm font-black text-zinc-900 dark:text-white mb-3">Informations Complémentaires</h4>
                  <div className="flex flex-col gap-1">
                    {[
                      { icon: <MapPin size={16}/>, label: selectedSchool.address ? `${selectedSchool.address}, ${selectedSchool.city}` : selectedSchool.city || 'N/A' },
                      { icon: <Phone size={16}/>, label: selectedSchool.phoneNumber || 'Non renseigné' },
                      { icon: <Globe size={16}/>, label: selectedSchool.email || 'Non renseigné' },
                      { icon: <Activity size={16}/>, label: `Année active: ${detailData.stats.activeYear}` },
                      { icon: <ShieldCheck size={16}/>, label: `RNE: ${selectedSchool.nationalRNE || 'N/A'}` },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                        <span className="text-indigo-500 shrink-0">{item.icon}</span>
                        <span className="truncate">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : null}
          </motion.div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-zinc-200 dark:border-zinc-800"
            >
              <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                <h2 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    {editSchool ? <Edit3 size={20} /> : <Plus size={20} />}
                  </div>
                  {editSchool ? 'Modifier l\'Établissement' : 'Nouvel Établissement'}
                </h2>
                <button 
                  className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500" 
                  onClick={() => { setShowForm(false); setEditSchool(null); }}
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto">
                <form id="school-form" onSubmit={handleSave} className="flex flex-col gap-6">
                  
                  {/* Section 1 */}
                  <div>
                    <h3 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-2">Détails de l'établissement</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Nom complet *</label>
                        <input name="name" required className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" defaultValue={editSchool?.name} placeholder="Ex: Lycée Excellence de Bamako" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Code Unique *</label>
                        <input name="code" required className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all font-mono" defaultValue={editSchool?.code} placeholder="LYC-EXC-BKO" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Type *</label>
                        <select name="type" required className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" defaultValue={editSchool?.type || 'LYCEE'}>
                          {SCHOOL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Ville</label>
                        <input name="city" className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" defaultValue={editSchool?.city || 'Bamako'} />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Plan d'abonnement *</label>
                        <select name="plan" required className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all font-bold text-indigo-600 dark:text-indigo-400" defaultValue={editSchool?.plan || 'STARTER'}>
                          <option value="STARTER">Pack STARTER</option>
                          <option value="BUSINESS">Pack BUSINESS</option>
                          <option value="ELITE">Pack ELITE</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Section 2 (New School Only) */}
                  {!editSchool && (
                    <div className="bg-emerald-50 dark:bg-emerald-500/5 rounded-2xl p-5 border border-emerald-100 dark:border-emerald-500/10">
                      <h3 className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">Compte Administrateur</h3>
                      <p className="text-xs text-emerald-700/70 dark:text-emerald-400/70 mb-4 font-medium">Identifiants pour le premier accès du directeur ou responsable.</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-emerald-800 dark:text-emerald-200 mb-1.5">Prénom *</label>
                          <input name="adminFirstName" required className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="Prénom" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-emerald-800 dark:text-emerald-200 mb-1.5">Nom *</label>
                          <input name="adminLastName" required className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="Nom" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-emerald-800 dark:text-emerald-200 mb-1.5">Email *</label>
                          <input name="adminEmail" type="email" required className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="admin@ecole.com" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-emerald-800 dark:text-emerald-200 mb-1.5">Mot de passe provisoire *</label>
                          <input name="adminPassword" type="password" required className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="••••••••" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Section 3 */}
                  <div>
                    <h3 className="text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-2">Contact & Localisation</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Email public</label>
                        <input name="email" type="email" className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" defaultValue={editSchool?.email} />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Téléphone</label>
                        <input name="phoneNumber" className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" defaultValue={editSchool?.phoneNumber} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Adresse physique détaillée</label>
                        <input name="address" className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" defaultValue={editSchool?.address} />
                      </div>
                    </div>
                  </div>

                </form>
              </div>

              <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex justify-end gap-3 mt-auto">
                <button 
                  type="button" 
                  className="px-6 py-2.5 rounded-xl font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                  onClick={() => { setShowForm(false); setEditSchool(null); }}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  form="school-form"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 transition-all shadow-md shadow-indigo-500/20"
                >
                  {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                  {saving ? 'Sauvegarde...' : 'Enregistrer'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
