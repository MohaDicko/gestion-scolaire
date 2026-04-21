'use client';

import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Loader2, Landmark, Building2, Bell, ShieldCheck } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';

export default function SettingsPage() {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [school, setSchool] = useState<any>(null);
  const [campuses, setCampuses] = useState<any[]>([]);

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
      toast.success('Paramètres de l\'établissement mis à jour.');
    } catch {
      toast.error('Erreur lors de la sauvegarde.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return (
    <AppLayout title="Paramètres" subtitle="Configuration du système">
      <div style={{ display: 'flex', height: '300px', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="spin" size={32} color="var(--primary)" />
      </div>
    </AppLayout>
  );

  return (
    <AppLayout 
      title="Paramètres Système" 
      subtitle="Configuration conforme aux normes nationales du Mali (MEN/DREN)"
      breadcrumbs={[{ label: 'Accueil', href: '/dashboard' }, { label: 'Paramètres' }]}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '30px' }}>
        {/* Navigation latérale des réglages */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <SettingsTab icon={<Building2 size={16}/>} label="Établissement" active />
          <SettingsTab icon={<Landmark size={16}/>} label="Campus & Locaux" />
          <SettingsTab icon={<ShieldCheck size={16}/>} label="Sécurité & Rôles" />
          <SettingsTab icon={<Bell size={16}/>} label="Notifications" />
        </div>

        {/* Formulaire Établissement (Mali Compliance) */}
        <div className="card" style={{ padding: '30px' }}>
          <form onSubmit={handleSaveSchool}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
              <div style={{ width: '60px', height: '60px', background: 'var(--primary-dim)', color: 'var(--primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={24} />
              </div>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: '18px' }}>Identité de l'Établissement</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Ces informations figureront sur les bulletins et rapports DREN.</p>
              </div>
            </div>

            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="form-group">
                <label>Nom Officiel de l'École *</label>
                <input required value={school?.name || ''} onChange={e => setSchool({...school, name: e.target.value})} placeholder="Ex: Groupe Scolaire Les Castors" />
              </div>
              <div className="form-group">
                <label>Type d'Établissement *</label>
                <select value={school?.type || 'LYCEE'} onChange={e => setSchool({...school, type: e.target.value})}>
                  <option value="PRIMAIRE">Primaire</option>
                  <option value="FONDAMENTAL">Fondamental</option>
                  <option value="LYCEE">Lycée</option>
                  <option value="TECHNIQUE">Technique / Professionnel</option>
                  <option value="SANTE">Santé</option>
                  <option value="AGRO">Agro-Pastorale</option>
                </select>
              </div>

              {/* CHAMPS MALIEN SPECIFIQUE */}
              <div className="form-group">
                <label>Code DREN / CAP (Mali) *</label>
                <input required value={school?.drenCode || ''} onChange={e => setSchool({...school, drenCode: e.target.value})} placeholder="Ex: DREN-RIV-GCHE" />
              </div>
              <div className="form-group">
                <label>N° National RNE / Identification</label>
                <input value={school?.nationalRNE || ''} onChange={e => setSchool({...school, nationalRNE: e.target.value})} placeholder="Ex: RNE-ML-00234" />
              </div>

              <div className="form-group">
                <label>Adresse Complète</label>
                <input value={school?.address || ''} onChange={e => setSchool({...school, address: e.target.value})} placeholder="Ex: Rue 214, Porte 12, Hamdallaye ACI 2000" />
              </div>
              <div className="form-group">
                <label>Ville / Commune</label>
                <input value={school?.city || ''} onChange={e => setSchool({...school, city: e.target.value})} placeholder="Ex: Bamako, Commune IV" />
              </div>

              <div className="form-group">
                <label>Téléphone Officiel</label>
                <input value={school?.phoneNumber || ''} onChange={e => setSchool({...school, phoneNumber: e.target.value})} placeholder="Ex: +223 20 22 22 22" />
              </div>
              <div className="form-group">
                <label>Slogan / Devise</label>
                <input value={school?.motto || ''} onChange={e => setSchool({...school, motto: e.target.value})} placeholder="Ex: Travail - Discipline - Succès" />
              </div>
            </div>

            <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn-primary" disabled={isSaving}>
                {isSaving ? <Loader2 className="spin" size={16} /> : <Save size={16} />}
                Enregistrer les Modifications
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}

function SettingsTab({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
      borderRadius: '10px', cursor: 'pointer',
      background: active ? 'var(--primary-dim)' : 'transparent',
      color: active ? 'var(--primary)' : 'var(--text-muted)',
      fontWeight: active ? 700 : 500,
      transition: 'all 0.2s ease'
    }}>
      {icon}
      <span style={{ fontSize: '14px' }}>{label}</span>
    </div>
  );
}
