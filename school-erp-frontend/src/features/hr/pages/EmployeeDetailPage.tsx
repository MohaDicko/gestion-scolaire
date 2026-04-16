import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Briefcase, 
  Calendar, 
  FileText, 
  Wallet, 
  History,
  Plus,
  Download,
  CheckCircle2
} from 'lucide-react';
import { useEmployeeDetail } from '../hooks/useEmployees';

export function EmployeeDetailPage() {
  const { id } = useParams();
  const { data: emp, isLoading } = useEmployeeDetail(id!);
  const [activeTab, setActiveTab] = useState<'info' | 'contracts' | 'payroll'>('info');

  if (isLoading) return <div className="page-loading">Chargement du dossier employé...</div>;
  if (!emp) return <div className="page">Employé non trouvé.</div>;

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(amount);

  return (
    <div className="page animate-fade">
      {/* HEADER SECTION */}
      <div className="page-header" style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <div className="profile-photo-large">
            {emp.photoUrl ? <img src={emp.photoUrl} alt="emp" /> : <User size={48} />}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1 className="page-title">{emp.lastName} {emp.firstName}</h1>
              <span className={`badge ${emp.isActive ? 'badge-success' : 'badge-danger'}`}>
                {emp.isActive ? 'Actif' : 'Inactif'}
              </span>
            </div>
            <p className="page-subtitle">
              {emp.employeeNumber} • {emp.employeeType} • {emp.departmentName || 'Sans département'}
            </p>
          </div>
        </div>
        
        <div className="header-actions">
           <button className="btn-primary flex items-center gap-2">
             <Plus size={18} /> Nouveau Contrat
           </button>
        </div>
      </div>

      {/* QUICK STATS */}
      <div className="stats-grid" style={{ marginBottom: '30px' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-dim)', color: 'var(--primary)' }}>
            <Wallet size={20} />
          </div>
          <div className="stat-body">
            <div className="stat-label">Salaire de Base</div>
            <div className="stat-value">{emp.contracts?.[0] ? formatCurrency(emp.contracts[0].baseSalary) : '—'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <Calendar size={20} />
          </div>
          <div className="stat-body">
            <div className="stat-label">Ancienneté</div>
            <div className="stat-value">{new Date().getFullYear() - new Date(emp.hireDate).getFullYear()} ans</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            <FileText size={20} />
          </div>
          <div className="stat-body">
            <div className="stat-label">Contrats</div>
            <div className="stat-value">{emp.contracts?.length || 0}</div>
          </div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="tabs-nav" style={{ marginBottom: '24px', borderBottom: '1px solid var(--border)' }}>
        <button 
          className={`tab-item ${activeTab === 'info' ? 'active' : ''}`} 
          onClick={() => setActiveTab('info')}
        >
          <User size={18} /> Informations
        </button>
        <button 
          className={`tab-item ${activeTab === 'contracts' ? 'active' : ''}`} 
          onClick={() => setActiveTab('contracts')}
        >
          <Briefcase size={18} /> Contrats
        </button>
        <button 
          className={`tab-item ${activeTab === 'payroll' ? 'active' : ''}`} 
          onClick={() => setActiveTab('payroll')}
        >
          <History size={18} /> Bulletins de Paie
        </button>
      </div>

      {/* TAB CONTENT */}
      <div className="tab-content">
        {activeTab === 'info' && (
          <div className="grid-2 animate-fade">
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: '20px' }}>Coordonnées</h3>
              <div className="info-list">
                <div className="info-item">
                  <Mail size={16} /> <div><span>Email</span><strong>{emp.email}</strong></div>
                </div>
                <div className="info-item">
                  <Phone size={16} /> <div><span>Téléphone</span><strong>{emp.phoneNumber}</strong></div>
                </div>
                <div className="info-item">
                  <MapPin size={16} /> <div><span>Adresse</span><strong>{emp.address}</strong></div>
                </div>
              </div>
            </div>
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: '20px' }}>Emploi</h3>
              <div className="info-list">
                <div className="info-item">
                  <Calendar size={16} /> <div><span>Date d'embauche</span><strong>{new Date(emp.hireDate).toLocaleDateString()}</strong></div>
                </div>
                <div className="info-item">
                  <Briefcase size={16} /> <div><span>Type</span><strong>{emp.employeeType}</strong></div>
                </div>
                <div className="info-item">
                  <CheckCircle2 size={16} /> <div><span>Status</span><strong>Professionnel</strong></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contracts' && (
          <div className="card animate-fade" style={{ padding: '0' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Titre</th>
                  <th>Début</th>
                  <th>Fin</th>
                  <th>Salaire de base</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {emp.contracts?.map((c: any) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.title}</td>
                    <td>{new Date(c.startDate).toLocaleDateString()}</td>
                    <td>{c.endDate ? new Date(c.endDate).toLocaleDateString() : 'CDI'}</td>
                    <td style={{ fontWeight: 700 }}>{formatCurrency(c.baseSalary)}</td>
                    <td><span className="badge-ghost">{c.type}</span></td>
                    <td>
                      <span className={`badge ${c.status === 'Active' ? 'badge-success' : 'badge-ghost'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td><button className="btn-icon"><Download size={16} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {emp.contracts?.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Aucun contrat enregistré pour cet employé.
              </div>
            )}
          </div>
        )}

        {activeTab === 'payroll' && (
          <div className="card animate-fade" style={{ padding: '0' }}>
             <table className="table">
              <thead>
                <tr>
                  <th>Période</th>
                  <th>Net à Payer</th>
                  <th>Généré le</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {emp.recentPayslips?.map((p: any) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 700 }}>{p.period}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 800 }}>{formatCurrency(p.netSalary)}</td>
                    <td>{new Date(p.generatedAt).toLocaleDateString()}</td>
                    <td><span className="badge-success">{p.status}</span></td>
                    <td>
                      <button className="btn btn-outline flex items-center gap-2" style={{ padding: '4px 12px', fontSize: '12px' }}>
                        <Download size={14} /> PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {emp.recentPayslips?.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Aucun bulletin de paie disponible.
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .profile-photo-large {
          width: 80px;
          height: 80px;
          border-radius: 20px;
          background: var(--bg-3);
          display: grid;
          place-items: center;
          color: var(--text-muted);
          overflow: hidden;
          border: 1px solid var(--border);
        }
        .profile-photo-large img { width: 100%; height: 100%; object-fit: cover; }
        
        .tab-item {
          padding: 12px 20px;
          background: transparent;
          border: none;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: var(--text-muted);
          cursor: pointer;
          position: relative;
          transition: all 0.2s;
        }
        .tab-item.active { color: var(--primary); }
        .tab-item.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--primary);
        }
        
        .info-list { display: flex; flex-direction: column; gap: 16px; }
        .info-item { display: flex; align-items: flex-start; gap: 12px; }
        .info-item svg { margin-top: 4px; color: var(--primary); }
        .info-item div { display: flex; flex-direction: column; }
        .info-item span { font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 700; }
        .info-item strong { font-size: 14px; }
      `}</style>
    </div>
  );
}
