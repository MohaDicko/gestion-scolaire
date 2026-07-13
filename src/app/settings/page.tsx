'use client';

import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Loader2, Landmark, Building2, Bell, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [school, setSchool] = useState<any>(null);
  const [campuses, setCampuses] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<'IDENTITY' | 'BRANDING' | 'SECURITY' | 'NOTIFS'>('IDENTITY');

  useEffect(() => {
    async function fetchData() {
      try {
        const [schoolRes, campusesRes] = await Promise.all([
          fetch('/api/school/config'),
          fetch('/api/campuses')
        ]);
        if (schoolRes.ok) setSchool(await schoolRes.json());
        if (campusesRes.ok) setCampuses(await campusesRes.json());
      } catch (err) {
        toast.error('Erreur lors du chargement des configurations.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [toast]);

  const handleSaveSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/school/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(school)
      });
      if (!res.ok) throw new Error();
      toast.success('Paramètres mis à jour avec succès.');
      // Reload to apply colors if changed
      if (activeTab === 'BRANDING') window.location.reload();
    } catch {
      toast.error('Erreur lors de la sauvegarde.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return (
    <AppLayout title="Paramètres" subtitle="Configuration du système">
      <div className="flex items-center justify-center h-80">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    </AppLayout>
  );

  return (
    <AppLayout 
      title="Paramètres Système" 
      subtitle="Configuration conforme aux normes nationales du Mali (MEN/DREN)"
      breadcrumbs={[{ label: 'Accueil', href: '/dashboard' }, { label: 'Paramètres' }]}
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8">
        
        {/* Navigation latérale des réglages */}
        <div className="flex flex-col gap-2">
          <SettingsTab icon={<Building2 size={18}/>} label="Établissement" active={activeTab === 'IDENTITY'} onClick={() => setActiveTab('IDENTITY')} />
          <SettingsTab icon={<Landmark size={18}/>} label="Personnalisation / Branding" active={activeTab === 'BRANDING'} onClick={() => setActiveTab('BRANDING')} />
          <SettingsTab icon={<ShieldCheck size={18}/>} label="Sécurité & Rôles" active={activeTab === 'SECURITY'} onClick={() => setActiveTab('SECURITY')} />
          <SettingsTab icon={<Bell size={18}/>} label="Notifications" active={activeTab === 'NOTIFS'} onClick={() => setActiveTab('NOTIFS')} />
        </div>

        {/* Formulaire Dynamique par Tab */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-800">
          <form onSubmit={handleSaveSchool} className="flex flex-col h-full">
            
            {activeTab === 'IDENTITY' && (
              <div className="flex-1 space-y-8 animate-in fade-in duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center shrink-0">
                    <Building2 size={28} />
                  </div>
                  <div>
                    <h3 className="font-black text-xl text-slate-800 dark:text-slate-100">Identité de l'Établissement</h3>
                    <p className="text-sm text-slate-500 font-medium">Ces informations figureront sur les bulletins et rapports officiels DREN.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nom Officiel de l'École *</label>
                    <Input required value={school?.name || ''} onChange={e => setSchool({...school, name: e.target.value})} placeholder="Ex: Groupe Scolaire Les Castors" className="h-12 rounded-xl focus-visible:ring-blue-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Type d'Établissement *</label>
                    <select value={school?.type || 'LYCEE'} onChange={e => setSchool({...school, type: e.target.value})} className="w-full h-12 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="PRIMAIRE">Primaire</option>
                      <option value="FONDAMENTAL">Fondamental</option>
                      <option value="LYCEE">Lycée</option>
                      <option value="TECHNIQUE">Technique / Professionnel</option>
                      <option value="SANTE">Santé</option>
                      <option value="AGRO">Agro-Pastorale</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Code DREN / CAP (Mali) *</label>
                    <Input required value={school?.drenCode || ''} onChange={e => setSchool({...school, drenCode: e.target.value})} placeholder="Ex: DREN-RIV-GCHE" className="h-12 rounded-xl focus-visible:ring-blue-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">N° National RNE</label>
                    <Input value={school?.nationalRNE || ''} onChange={e => setSchool({...school, nationalRNE: e.target.value})} placeholder="Ex: RNE-ML-00234" className="h-12 rounded-xl focus-visible:ring-blue-500" />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Adresse Complète</label>
                    <Input value={school?.address || ''} onChange={e => setSchool({...school, address: e.target.value})} placeholder="Ex: Rue 214, Porte 12, Hamdallaye ACI 2000" className="h-12 rounded-xl focus-visible:ring-blue-500" />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ville / Commune</label>
                    <Input value={school?.city || ''} onChange={e => setSchool({...school, city: e.target.value})} placeholder="Ex: Bamako, Commune IV" className="h-12 rounded-xl focus-visible:ring-blue-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Téléphone Officiel</label>
                    <Input value={school?.phoneNumber || ''} onChange={e => setSchool({...school, phoneNumber: e.target.value})} placeholder="Ex: +223 20 22 22 22" className="h-12 rounded-xl focus-visible:ring-blue-500 font-mono text-sm" />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Slogan / Devise</label>
                    <Input value={school?.motto || ''} onChange={e => setSchool({...school, motto: e.target.value})} placeholder="Ex: Travail - Discipline - Succès" className="h-12 rounded-xl focus-visible:ring-blue-500 font-medium italic" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'BRANDING' && (
              <div className="flex-1 space-y-8 animate-in fade-in duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center shrink-0">
                    <Landmark size={28} />
                  </div>
                  <div>
                    <h3 className="font-black text-xl text-slate-800 dark:text-slate-100">Branding & Personnalisation</h3>
                    <p className="text-sm text-slate-500 font-medium">Configurez l'apparence visuelle de votre portail scolaire.</p>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">URL du Logo de l'École</label>
                    <div className="flex gap-4 items-center">
                      <Input 
                        value={school?.logoUrl || ''} 
                        onChange={e => setSchool({...school, logoUrl: e.target.value})} 
                        placeholder="Ex: https://mon-ecole.com/logo.png" 
                        className="h-12 rounded-xl focus-visible:ring-blue-500 flex-1"
                      />
                      {school?.logoUrl && (
                        <div className="w-12 h-12 rounded-xl border border-slate-200 bg-white relative overflow-hidden shrink-0 shadow-sm p-1">
                          <Image src={school.logoUrl} alt="Logo Preview" fill className="object-contain p-1" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Couleur Primaire (Thème)</label>
                      <div className="flex gap-3 items-center">
                        <input 
                          type="color" 
                          value={school?.primaryColor || '#4f8ef7'} 
                          onChange={e => setSchool({...school, primaryColor: e.target.value})} 
                          className="w-12 h-12 p-1 rounded-xl border border-slate-200 cursor-pointer bg-white"
                        />
                        <Input 
                          type="text" 
                          value={school?.primaryColor || '#4f8ef7'} 
                          onChange={e => setSchool({...school, primaryColor: e.target.value})} 
                          className="h-12 rounded-xl font-mono text-sm uppercase focus-visible:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Couleur Secondaire (Accent)</label>
                      <div className="flex gap-3 items-center">
                        <input 
                          type="color" 
                          value={school?.secondaryColor || '#0f172a'} 
                          onChange={e => setSchool({...school, secondaryColor: e.target.value})} 
                          className="w-12 h-12 p-1 rounded-xl border border-slate-200 cursor-pointer bg-white"
                        />
                        <Input 
                          type="text" 
                          value={school?.secondaryColor || '#0f172a'} 
                          onChange={e => setSchool({...school, secondaryColor: e.target.value})} 
                          className="h-12 rounded-xl font-mono text-sm uppercase focus-visible:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Empty states for other tabs to keep the layout */}
            {activeTab === 'SECURITY' && (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-20 animate-in fade-in duration-300">
                <ShieldCheck size={64} className="opacity-20 mb-4" />
                <h3 className="text-lg font-bold text-slate-600 mb-1">Sécurité & Rôles</h3>
                <p className="text-sm">Bientôt disponible dans la prochaine mise à jour.</p>
              </div>
            )}

            {activeTab === 'NOTIFS' && (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-20 animate-in fade-in duration-300">
                <Bell size={64} className="opacity-20 mb-4" />
                <h3 className="text-lg font-bold text-slate-600 mb-1">Notifications</h3>
                <p className="text-sm">Configuration des SMS et Emails (Resend) à venir.</p>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 h-12 shadow-lg shadow-blue-500/20" disabled={isSaving || activeTab === 'SECURITY' || activeTab === 'NOTIFS'}>
                {isSaving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save size={18} className="mr-2" />}
                {activeTab === 'BRANDING' ? 'Appliquer le Branding' : 'Enregistrer les Modifications'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}

function SettingsTab({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl cursor-pointer transition-all duration-200 ${
        active 
          ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-bold shadow-sm' 
          : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-300 font-semibold'
      }`}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </div>
  );
}
