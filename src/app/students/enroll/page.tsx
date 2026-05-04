'use client';

import { useState, useEffect } from 'react';
import { 
  Users, School, BadgeDollarSign, CheckCircle, ChevronRight, 
  ChevronLeft, Plus, Search, Loader2, CreditCard, Calendar, AlertCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';

export default function EnrollmentWizardPage() {
  const router = useRouter();
  const toast = useToast();

  const [step, setStep] = useState(1);
  const [students, setStudents] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [enrollmentData, setEnrollmentData] = useState({
    classroomId: '',
    academicYearId: '',
    tuitionAmount: '0',
  });

  useEffect(() => {
    // Load prerequisites
    fetch('/api/academic-years').then(r => r.json()).then(d => {
      setAcademicYears(Array.isArray(d) ? d : []);
      const active = d.find((y: any) => y.isActive);
      if (active) setEnrollmentData(prev => ({ ...prev, academicYearId: active.id }));
    });
    fetch('/api/classrooms').then(r => r.json()).then(d => setClassrooms(Array.isArray(d) ? d : []));
  }, []);

  const searchStudents = async () => {
    if (!studentSearch.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/students?search=${encodeURIComponent(studentSearch)}&pageSize=5`);
      const data = await res.json();
      setStudents(data.items || []);
    } catch {
      toast.error('Erreur de recherche');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!selectedStudent || !enrollmentData.classroomId || !enrollmentData.academicYearId) {
      toast.error('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          ...enrollmentData,
          tuitionAmount: parseFloat(enrollmentData.tuitionAmount)
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de l\'inscription');

      toast.success('Inscription réalisée avec succès !');
      setStep(4); // Success step
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedClass = classrooms.find(c => c.id === enrollmentData.classroomId);
  const selectedYear = academicYears.find(y => y.id === enrollmentData.academicYearId);

  return (
    <AppLayout
      title="Workflow d'Inscription"
      subtitle="Inscrire un élève dans une classe et générer sa scolarité"
      breadcrumbs={[{ label: 'Scolarité', href: '/students' }, { label: 'Nouvelle Inscription' }]}
    >
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Step Progress Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '15px', left: '0', right: '0', height: '2px', background: 'var(--border)', zIndex: 0 }} />
          <div style={{ position: 'absolute', top: '15px', left: '0', width: `${((step - 1) / 3) * 100}%`, height: '2px', background: 'var(--primary)', zIndex: 0, transition: 'width 0.3s ease' }} />
          
          {[1, 2, 3, 4].map(s => (
            <div key={s} style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                width: '32px', height: '32px', borderRadius: '50%', 
                background: step >= s ? 'var(--primary)' : 'var(--bg-2)',
                border: `2px solid ${step >= s ? 'var(--primary)' : 'var(--border)'}`,
                color: step >= s ? 'white' : 'var(--text-dim)',
                display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: '14px'
              }}>
                {step > s ? <CheckCircle size={16} /> : s}
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: step >= s ? 'var(--text)' : 'var(--text-dim)', textTransform: 'uppercase' }}>
                {s === 1 ? 'Élève' : s === 2 ? 'Classe' : s === 3 ? 'Scolarité' : 'Terminé'}
              </span>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="card shadow-md" style={{ padding: '32px', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
          
          {step === 1 && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Users className="text-primary" size={24} /> Sélection de l'élève
              </h2>
              <p style={{ color: 'var(--text-dim)', fontSize: '14px', marginBottom: '24px' }}>
                Recherchez l'élève déjà enregistré ou créez son dossier s'il s'agit d'une nouvelle admission.
              </p>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <div className="search-box" style={{ flex: 1 }}>
                  <Search size={18} />
                  <input 
                    type="text" 
                    placeholder="Entrez le nom, prénom ou matricule..." 
                    value={studentSearch} 
                    onChange={e => setStudentSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && searchStudents()}
                  />
                </div>
                <button className="btn-primary" onClick={searchStudents} disabled={isLoading}>
                  {isLoading ? <Loader2 size={16} className="spin" /> : 'Rechercher'}
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {students.map(s => (
                  <div 
                    key={s.id} 
                    onClick={() => setSelectedStudent(s)}
                    style={{ 
                      padding: '16px', borderRadius: '12px', border: `2px solid ${selectedStudent?.id === s.id ? 'var(--primary)' : 'var(--border)'}`,
                      background: selectedStudent?.id === s.id ? 'var(--bg-fluid)' : 'transparent',
                      cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '16px'
                    }}
                  >
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-dim)', color: 'var(--primary)', display: 'grid', placeItems: 'center', fontWeight: 700 }}>
                      {s.firstName[0]}{s.lastName[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700 }}>{s.lastName} {s.firstName}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Matricule: {s.studentNumber} • Né(e) le {new Date(s.dateOfBirth).toLocaleDateString()}</div>
                    </div>
                    {selectedStudent?.id === s.id && <CheckCircle className="text-primary" size={20} />}
                  </div>
                ))}

                {students.length === 0 && !isLoading && studentSearch && (
                  <div style={{ textAlign: 'center', padding: '40px', background: 'var(--bg-1)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
                    <AlertCircle size={32} className="text-dim" style={{ margin: '0 auto 12px' }} />
                    <p>Aucun élève ne correspond à votre recherche.</p>
                    <button className="btn-ghost" style={{ marginTop: '12px' }} onClick={() => router.push('/students')}>
                      <Plus size={14} /> Créer un nouveau dossier élève
                    </button>
                  </div>
                )}
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn-primary" disabled={!selectedStudent} onClick={() => setStep(2)}>
                  Suivant <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <School className="text-primary" size={24} /> Classe et Année Académique
              </h2>
              <p style={{ color: 'var(--text-dim)', fontSize: '14px', marginBottom: '24px' }}>
                Assignez l'élève <strong>{selectedStudent?.firstName} {selectedStudent?.lastName}</strong> à une classe pour l'année scolaire.
              </p>

              <div className="form-grid">
                <div className="form-group">
                  <label>Année Académique *</label>
                  <select 
                    value={enrollmentData.academicYearId} 
                    onChange={e => setEnrollmentData({...enrollmentData, academicYearId: e.target.value})}
                  >
                    <option value="">-- Sélectionner l'année --</option>
                    {academicYears.map(y => (
                      <option key={y.id} value={y.id}>{y.name} {y.isActive ? '(Active)' : ''}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Classe de destination *</label>
                  <select 
                    value={enrollmentData.classroomId} 
                    onChange={e => setEnrollmentData({...enrollmentData, classroomId: e.target.value})}
                  >
                    <option value="">-- Sélectionner la classe --</option>
                    {classrooms.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.level})</option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedClass && (
                <div style={{ marginTop: '24px', padding: '16px', background: 'var(--bg-fluid)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '4px' }}>Détails de la classe :</div>
                  <div style={{ fontWeight: 700, display: 'flex', gap: '16px' }}>
                    <span>Capacité : {selectedClass._count?.enrollments || 0} / {selectedClass.maxCapacity}</span>
                    <span>Niveau : {selectedClass.level}</span>
                    <span>Campus : {selectedClass.campus?.name}</span>
                  </div>
                </div>
              )}

              <div style={{ marginTop: 'auto', paddingTop: '32px', display: 'flex', justifyContent: 'space-between' }}>
                <button className="btn-ghost" onClick={() => setStep(1)}>
                  <ChevronLeft size={16} /> Retour
                </button>
                <button className="btn-primary" disabled={!enrollmentData.classroomId || !enrollmentData.academicYearId} onClick={() => setStep(3)}>
                  Suivant <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <BadgeDollarSign className="text-primary" size={24} /> Configuration Financière
              </h2>
              <p style={{ color: 'var(--text-dim)', fontSize: '14px', marginBottom: '24px' }}>
                Définissez le montant total de la scolarité annuelle. Une facture sera générée automatiquement.
              </p>

              <div className="form-group" style={{ maxWidth: '400px' }}>
                <label>Montant de la Scolarité Annuelle (XOF) *</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="number" 
                    value={enrollmentData.tuitionAmount} 
                    onChange={e => setEnrollmentData({...enrollmentData, tuitionAmount: e.target.value})}
                    style={{ paddingRight: '60px', fontSize: '24px', fontWeight: 900, height: '60px' }}
                  />
                  <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: 'var(--text-dim)' }}>XOF</span>
                </div>
              </div>

              <div style={{ marginTop: '32px', padding: '24px', border: '1px solid var(--border-md)', borderRadius: '16px', background: 'var(--bg-2)' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Récapitulatif de l'Inscription</h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Élève</span>
                    <strong style={{ color: 'var(--text)' }}>{selectedStudent?.firstName} {selectedStudent?.lastName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Classe & Année</span>
                    <strong>{selectedClass?.name} • {selectedYear?.name}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-dim)', fontWeight: 700 }}>Total Facturé</span>
                    <strong style={{ color: 'var(--primary)', fontSize: '18px' }}>{parseFloat(enrollmentData.tuitionAmount).toLocaleString()} XOF</strong>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '32px', display: 'flex', justifyContent: 'space-between' }}>
                <button className="btn-ghost" onClick={() => setStep(2)}>
                  <ChevronLeft size={16} /> Retour
                </button>
                <button className="btn-primary" disabled={isSubmitting} onClick={handleEnroll} style={{ padding: '12px 32px' }}>
                  {isSubmitting ? <><Loader2 size={16} className="spin" /> Traitement...</> : 'Confirmer l\'Inscription'}
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div style={{ animation: 'bounceIn 0.5s var(--ease) both', textAlign: 'center', paddingTop: '40px' }}>
              <div style={{ 
                width: '80px', height: '80px', borderRadius: '50%', background: 'var(--success-dim)', color: 'var(--success)', 
                display: 'grid', placeItems: 'center', margin: '0 auto 24px' 
              }}>
                <CheckCircle size={48} />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '8px' }}>Opération Réussie !</h2>
              <p style={{ color: 'var(--text-dim)', maxWidth: '400px', margin: '0 auto 32px' }}>
                L'élève a été inscrit avec succès. La facture de scolarité a été émise et est prête pour l'encaissement.
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                <button className="btn-primary" onClick={() => router.push('/invoices')}>
                  <CreditCard size={16} /> Voir la Facture
                </button>
                <button className="btn-ghost" onClick={() => {
                  setStep(1);
                  setSelectedStudent(null);
                  setStudentSearch('');
                  setEnrollmentData(prev => ({ ...prev, tuitionAmount: '0' }));
                }}>
                  Nouvelle Inscription
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bounceIn { 
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); opacity: 1; }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
      `}</style>
    </AppLayout>
  );
}
