'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, Plus, Search, Filter, 
  MapPin, Phone, Globe, ShieldCheck, 
  Trash2, Edit3, MoreVertical, 
  ExternalLink, GraduationCap, Users
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/Toast';
import { Modal } from '@/components/ui/Modal';

export default function SchoolsManagementPage() {
  const [schools, setSchools] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSchool, setCurrentSchool] = useState<any>(null);
  const toast = useToast();

  const fetchSchools = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/schools');
      if (res.ok) {
        const data = await res.json();
        setSchools(data);
      }
    } catch {
      toast.error('Erreur lors du chargement des établissements');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchSchools(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());

    try {
      const method = currentSchool ? 'PATCH' : 'POST';
      const url = currentSchool ? `/api/admin/schools/${currentSchool.id}` : '/api/admin/schools';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success(currentSchool ? 'Établissement mis à jour' : 'Établissement créé');
        setIsModalOpen(false);
        fetchSchools();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Une erreur est survenue');
      }
    } catch {
      toast.error('Erreur de connexion au serveur');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet établissement ? Toutes les données associées seront perdues.')) return;
    
    try {
      const res = await fetch(`/api/admin/schools/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Établissement supprimé');
        fetchSchools();
      }
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const filteredSchools = schools.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout
      title="Gestion des Établissements"
      subtitle="Portail Super Administrateur — Pilotage du réseau scolaire"
      breadcrumbs={[{ label: 'Administration', href: '/admin/system-health' }, { label: 'Écoles' }]}
      actions={
        <Button 
          variant="primary" 
          size="sm" 
          leftIcon={<Plus size={16} />}
          onClick={() => { setCurrentSchool(null); setIsModalOpen(true); }}
        >
          Nouvel Établissement
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher par nom ou code..." 
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:border-blue-500 transition-colors"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" leftIcon={<Filter size={16} />}>Filtres</Button>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-700/50">
              {filteredSchools.length} Établissement(s)
            </div>
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="h-64 rounded-2xl bg-white/5 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSchools.map((school) => (
              <Card key={school.id} variant="glass" className="group flex flex-col h-full relative overflow-hidden">
                {/* School Type Badge */}
                <div className="absolute top-4 right-4 bg-blue-500/10 text-blue-500 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-tighter border border-blue-500/20">
                  {school.type}
                </div>

                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 flex-shrink-0">
                    <Building2 size={24} />
                  </div>
                  <div className="min-width-0">
                    <h3 className="font-bold text-slate-100 truncate pr-8">{school.name}</h3>
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{school.code}</p>
                  </div>
                </div>

                <div className="space-y-3 mb-6 flex-1">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <MapPin size={14} className="text-slate-600" />
                    <span>{school.city}, {school.country}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Globe size={14} className="text-slate-600" />
                    <span>{school.email || 'Pas d\'email'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Phone size={14} className="text-slate-600" />
                    <span>{school.phoneNumber || 'Pas de tel'}</span>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-2 mb-6 p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="text-center">
                    <div className="text-lg font-black text-slate-200">{school._count?.campuses || 0}</div>
                    <div className="text-[9px] uppercase font-bold text-slate-500">Campus</div>
                  </div>
                  <div className="text-center border-l border-white/5">
                    <div className="text-lg font-black text-slate-200">{school._count?.academicYears || 0}</div>
                    <div className="text-[9px] uppercase font-bold text-slate-500">Années</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => { setCurrentSchool(school); setIsModalOpen(true); }}
                      className="text-slate-400 hover:text-blue-400"
                    >
                      <Edit3 size={14} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDelete(school.id)}
                      className="text-slate-400 hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-blue-400 font-bold text-[10px] uppercase tracking-wider"
                    rightIcon={<ExternalLink size={12} />}
                  >
                    Accéder
                  </Button>
                </div>
              </Card>
            ))}

            {/* Empty State */}
            {filteredSchools.length === 0 && !isLoading && (
              <div className="col-span-full py-20 text-center">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600">
                  <Building2 size={32} />
                </div>
                <h3 className="text-slate-300 font-bold">Aucun établissement trouvé</h3>
                <p className="text-slate-500 text-sm">Ajustez votre recherche ou créez un nouvel établissement.</p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Create/Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={currentSchool ? 'Modifier l\'Établissement' : 'Nouvel Établissement'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Nom de l'école</label>
              <input name="name" defaultValue={currentSchool?.name} required className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Code Unique</label>
              <input name="code" defaultValue={currentSchool?.code} required className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm outline-none focus:border-blue-500" placeholder="Ex: LYC-EXC" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Type</label>
              <select name="type" defaultValue={currentSchool?.type || 'LYCEE'} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm outline-none focus:border-blue-500">
                <option value="PRIMAIRE">Primaire</option>
                <option value="FONDAMENTAL">Fondamental</option>
                <option value="LYCEE">Lycée</option>
                <option value="TECHNIQUE">Technique</option>
                <option value="SANTE">Santé</option>
                <option value="UNIVERSITE">Université</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Email</label>
              <input name="email" type="email" defaultValue={currentSchool?.email} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Téléphone</label>
              <input name="phoneNumber" defaultValue={currentSchool?.phoneNumber} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm outline-none focus:border-blue-500" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Adresse</label>
              <input name="address" defaultValue={currentSchool?.address} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Ville</label>
              <input name="city" defaultValue={currentSchool?.city || 'Bamako'} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Slogan</label>
              <input name="motto" defaultValue={currentSchool?.motto} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm outline-none focus:border-blue-500" />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Annuler</Button>
            <Button type="submit" variant="primary">Enregistrer</Button>
          </div>
        </form>
      </Modal>

      <style jsx>{`
        .truncate {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `}</style>
    </AppLayout>
  );
}
