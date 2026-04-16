import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  HeartPulse, 
  Baby, 
  GraduationCap, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';

type SchoolType = 'Health' | 'Kindergarten' | 'General' | 'Professional';

export function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [type, setType] = useState<SchoolType | null>(null);
  const [level, setLevel] = useState<string>('');
  const [periodType, setPeriodType] = useState<'Semester' | 'Trimester'>('Semester');
  
  const { user, setUser, token } = useAuthStore();
  const navigate = useNavigate();

  const handleFinish = () => {
    if (!user || !token) return;
    
    // Simulate API update
    const updatedUser = { ...user, isSetupComplete: true };
    setUser(updatedUser, token);
    navigate('/');
  };

  const types = [
    { id: 'Health', label: 'École de Santé', icon: HeartPulse, desc: 'SMI, SP, IDE, TLP...', color: 'var(--primary)' },
    { id: 'Kindergarten', label: 'Jardin d\'Enfant', icon: Baby, desc: 'Petite, Moyenne et Grande section', color: 'var(--pink)' },
    { id: 'General', label: 'Enseignement Général', icon: GraduationCap, desc: 'Lycée, Collège, École Fondamentale', color: 'var(--cyan)' },
    { id: 'Professional', label: 'Centre Professionnel', icon: BookOpen, desc: 'Formations techniques & métiers', color: 'var(--success)' },
  ];

  return (
    <div className="login-root">
      <div className="login-bg-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
      </div>

      <div className="card glass animate-up" style={{ width: 'min(700px, 95vw)', padding: '40px' }}>
        <div className="page-header" style={{ textAlign: 'center', display: 'block' }}>
          <div className="login-logo" style={{ margin: '0 auto 20px' }}>
            <Sparkles size={32} />
          </div>
          <h1 className="page-title">Configuration de votre établissement</h1>
          <p className="page-subtitle">Étape {step} sur 3 — Personnalisons votre environnement</p>
        </div>

        {/* STEP 1: TYPE */}
        {step === 1 && (
          <div className="animate-fade">
            <h3 style={{ marginBottom: '20px', fontSize: '18px' }}>Quel est le type de votre école ?</h3>
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
              {types.map((t) => (
                <div 
                  key={t.id}
                  className={`stat-card ${type === t.id ? 'active' : ''}`}
                  onClick={() => setType(t.id as SchoolType)}
                  style={{ 
                    cursor: 'pointer',
                    borderColor: type === t.id ? t.color : 'var(--border)',
                    background: type === t.id ? `${t.color}10` : 'var(--bg-2)'
                  }}
                >
                  <div className="stat-icon" style={{ background: `${t.color}20`, color: t.color }}>
                    <t.icon size={24} />
                  </div>
                  <div className="stat-body">
                    <div className="stat-value" style={{ fontSize: '16px' }}>{t.label}</div>
                    <div className="stat-label">{t.desc}</div>
                  </div>
                  {type === t.id && <CheckCircle2 size={20} style={{ color: t.color }} />}
                </div>
              ))}
            </div>
            <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                className="btn-primary" 
                disabled={!type}
                onClick={() => setStep(2)}
              >
                Continuer <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: DETAILS */}
        {step === 2 && (
          <div className="animate-fade">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Cycles & Niveaux</label>
                <select value={level} onChange={(e) => setLevel(e.target.value)}>
                  <option value="">Sélectionnez le niveau principal...</option>
                  <option value="primaire">Premier Cycle (Fondamental)</option>
                  <option value="secondaire">Second Cycle / Lycée</option>
                  <option value="superieur">Enseignement Supérieur / Professionnel</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Découpage de l'année</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    className={`stat-card ${periodType === 'Semester' ? 'active' : ''}`}
                    onClick={() => setPeriodType('Semester')}
                    style={{ flex: 1, justifyContent: 'center', padding: '15px' }}
                  >
                    Semestres
                  </button>
                  <button 
                    className={`stat-card ${periodType === 'Trimester' ? 'active' : ''}`}
                    onClick={() => setPeriodType('Trimester')}
                    style={{ flex: 1, justifyContent: 'center', padding: '15px' }}
                  >
                    Trimestres
                  </button>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between' }}>
              <button className="btn-ghost" onClick={() => setStep(1)}>Retour</button>
              <button className="btn-primary" onClick={() => setStep(3)}>Suivant</button>
            </div>
          </div>
        )}

        {/* STEP 3: FINAL */}
        {step === 3 && (
          <div className="animate-fade" style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ color: 'var(--success)', marginBottom: '20px' }}>
              <CheckCircle2 size={64} style={{ margin: '0 auto' }} />
            </div>
            <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>Tout est prêt !</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              L'application a été configurée pour une <strong>{types.find(t => t.id === type)?.label}</strong>.
              {type === 'Health' && " Les filières SMI, SP, IDE et TLP ont été pré-configurées."}
            </p>

            <div style={{ marginTop: '40px' }}>
              <button className="btn-primary btn-full" onClick={handleFinish}>
                Accéder au Dashboard <Sparkles size={18} style={{ marginLeft: '8px' }} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
