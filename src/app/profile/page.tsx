'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';
import { User, Mail, Shield, Key, Save, Loader2, Building } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ProfilePage() {
  const toast = useToast();
  const [user, setUser] = useState<any>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('auth_user');
    if (stored) {
      const u = JSON.parse(stored);
      setUser(u);
      setFirstName(u.firstName || '');
      setLastName(u.lastName || '');
      setEmail(u.email || '');
    }
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email })
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Erreur lors de la mise à jour');
      }
      const updated = { ...user, firstName, lastName, email };
      setUser(updated);
      localStorage.setItem('auth_user', JSON.stringify(updated));
      toast.success('Profil mis à jour avec succès.');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la mise à jour du profil.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error('Veuillez remplir tous les champs du mot de passe.');
      return;
    }
    setIsChangingPassword(true);
    try {
      const res = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Erreur lors du changement de mot de passe');
      }
      toast.success('Mot de passe modifié avec succès.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la modification.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <AppLayout
      title="Mon Profil"
      subtitle="Gestion de vos informations personnelles et de votre sécurité"
      breadcrumbs={[{ label: 'Tableau de Bord', href: '/dashboard' }, { label: 'Profil' }]}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* En-tête profil */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-xl flex flex-col sm:flex-row items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-3xl font-black text-white shrink-0">
            {firstName?.[0]?.toUpperCase()}{lastName?.[0]?.toUpperCase()}
          </div>
          <div className="text-center sm:text-left flex-1 min-w-0">
            <h1 className="text-2xl font-bold truncate">{firstName} {lastName}</h1>
            <p className="text-indigo-100 text-sm flex items-center justify-center sm:justify-start gap-2 mt-1">
              <Mail size={14} /> {email}
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold uppercase tracking-wider">
                <Shield size={12} className="inline mr-1" /> {user?.role || 'Utilisateur'}
              </span>
              {user?.schoolName && (
                <span className="px-3 py-1 bg-black/20 backdrop-blur-sm rounded-full text-xs font-medium">
                  <Building size={12} className="inline mr-1" /> {user.schoolName}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Grille Formulaires */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Informations personnelles */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-6">
            <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <User className="text-indigo-600" size={22} />
              <h2 className="font-bold text-lg">Informations Personnelles</h2>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase">Prénom</label>
                <Input required value={firstName} onChange={e => setFirstName(e.target.value)} className="rounded-xl h-11" />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase">Nom</label>
                <Input required value={lastName} onChange={e => setLastName(e.target.value)} className="rounded-xl h-11" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase">Adresse Email</label>
                <Input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="rounded-xl h-11" />
              </div>

              <Button type="submit" disabled={isSaving} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-11 font-bold mt-2">
                {isSaving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18} />}
                Enregistrer les modifications
              </Button>
            </form>
          </div>

          {/* Sécurité / Mot de passe */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-6">
            <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <Key className="text-purple-600" size={22} />
              <h2 className="font-bold text-lg">Sécurité & Mot de passe</h2>
            </div>
            
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase">Mot de passe actuel</label>
                <Input type="password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="••••••••" className="rounded-xl h-11" />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase">Nouveau mot de passe</label>
                <Input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" className="rounded-xl h-11" />
              </div>

              <Button type="submit" disabled={isChangingPassword} variant="outline" className="w-full rounded-xl h-11 font-bold mt-2 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/30">
                {isChangingPassword ? <Loader2 className="animate-spin mr-2" size={18} /> : <Key className="mr-2" size={18} />}
                Modifier le mot de passe
              </Button>
            </form>
          </div>

        </div>

      </div>
    </AppLayout>
  );
}
