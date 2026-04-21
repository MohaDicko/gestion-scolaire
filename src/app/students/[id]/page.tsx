'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Loader2, ArrowLeft, GraduationCap, Calendar, 
  FileText, Receipt, User, MapPin, Phone, Mail,
  Award, Clock, CheckCircle2, XCircle, AlertCircle
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';

type TabType = 'overview' | 'grades' | 'attendance' | 'finance';

export default function StudentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const toast = useToast();
  
  const [student, setStudent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const fetchDetail = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/students/${id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setStudent(data);
    } catch {
      toast.error('Élève introuvable ou erreur de chargement.');
      router.push('/students');
    } finally {
      setIsLoading(false);
    }
  }, [id, router, toast]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  if (isLoading) {
    return (
      <AppLayout title="Chargement..." breadcrumbs={[{ label: 'Élèves', href: '/students' }, { label: 'Profil' }]}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
          <Loader2 className="spin text-primary" size={40} />
        </div>
      </AppLayout>
    );
  }

  const currentEnrollment = student.enrollments?.[0];

  return (
    <AppLayout
      title={`${student.firstName} ${student.lastName}`}
      subtitle={`Matricule: ${student.studentNumber}`}
      breadcrumbs={[{ label: 'Élèves', href: '/students' }, { label: 'Profil Élève' }]}
      actions={
        <button className="btn-ghost" onClick={() => router.back()}>
          <ArrowLeft size={16} /> Retour
        </button>
      }
    >
      <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Left Column: Profile Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card shadow-md" style={{ padding: '32px 24px', textAlign: 'center' }}>
            <div style={{ 
              width: '100px', height: '100px', borderRadius: '50%', background: 'var(--primary-dim)', 
              color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', 
              fontSize: '36px', fontWeight: 800, margin: '0 auto 20px', border: '4px solid var(--bg-3)'
            }}>
              {student.firstName[0]}{student.lastName[0]}
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px' }}>{student.firstName} {student.lastName}</h2>
            <p className="badge badge-info" style={{ marginBottom: '20px' }}>{currentEnrollment?.classroom?.name || 'Non Inscrit'}</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                <Clock size={14} className="text-muted" />
                <span>Né le {new Date(student.dateOfBirth).toLocaleDateString()}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                <MapPin size={14} className="text-muted" />
                <span>{student.campus?.name}, {student.campus?.city}</span>
              </div>
            </div>
          </div>

          <div className="card shadow-sm" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact Parent</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Tuteur ({student.parentRelationship})</div>
                <div style={{ fontWeight: 600 }}>{student.parentName}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                <Phone size={14} className="text-primary" />
                <a href={`tel:${student.parentPhone}`} style={{ color: 'inherit', textDecoration: 'none' }}>{student.parentPhone}</a>
              </div>
              {student.parentEmail && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                  <Mail size={14} className="text-primary" />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{student.parentEmail}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Tabs and Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Tabs header */}
          <div style={{ 
            display: 'flex', gap: '8px', background: 'var(--bg-2)', padding: '6px', 
            borderRadius: '12px', border: '1px solid var(--border)', alignSelf: 'start'
          }}>
            {[
              { id: 'overview', label: 'Vue d’ensemble', icon: <User size={15}/> },
              { id: 'grades', label: 'Notes & Résultats', icon: <Award size={15}/> },
              { id: 'attendance', label: 'Présences', icon: <Calendar size={15}/> },
              { id: 'finance', label: 'Paiements', icon: <Receipt size={15}/> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
                  borderRadius: '8px', fontSize: '13px', fontWeight: 600, border: 'none',
                  cursor: 'pointer', transition: 'all 0.2s',
                  background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
                  color: activeTab === tab.id ? '#fff' : 'var(--text-muted)',
                  boxShadow: activeTab === tab.id ? '0 4px 12px var(--primary-dim)' : 'none'
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="animate-up">
            {activeTab === 'overview' && (
              <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                <div className="card" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ padding: '8px', borderRadius: '8px', background: 'var(--info-dim)', color: 'var(--info)' }}><GraduationCap size={20}/></div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Parcours Scolaire</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {student.enrollments?.map((en: any) => (
                      <div key={en.id} style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-3)', border: '1px solid var(--border)' }}>
                        <div style={{ fontWeight: 700, fontSize: '14px' }}>{en.classroom?.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{en.academicYear?.name} — {en.classroom?.level}</div>
                      </div>
                    ))}
                    {(!student.enrollments || student.enrollments.length === 0) && (
                      <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '13px' }}>Aucune inscription enregistrée</div>
                    )}
                  </div>
                </div>

                <div className="card" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ padding: '8px', borderRadius: '8px', background: 'var(--success-dim)', color: 'var(--success)' }}><CheckCircle2 size={20}/></div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Statistiques Rapides</h3>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ padding: '16px', background: 'var(--bg-3)', borderRadius: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)' }}>{student.grades?.length || 0}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Notes saisies</div>
                    </div>
                    <div style={{ padding: '16px', background: 'var(--bg-3)', borderRadius: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--warning)' }}>
                        {Math.round(((student.attendance?.filter((a:any) => a.status === 'PRESENT').length || 0) / (student.attendance?.length || 1)) * 100)}%
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Présence</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'grades' && (
              <div className="card shadow-sm" style={{ padding: 0 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Matière</th>
                      <th>Note</th>
                      <th>Année</th>
                      <th>Commentaire</th>
                    </tr>
                  </thead>
                  <tbody>
                    {student.grades?.map((g: any) => (
                      <tr key={g.id}>
                        <td><strong>{g.subject?.name}</strong> <span style={{ fontSize: '10px', opacity: 0.6 }}>({g.subject?.code})</span></td>
                        <td><strong style={{ color: g.score >= 10 ? 'var(--success)' : 'var(--danger)' }}>{g.score} / {g.maxScore}</strong></td>
                        <td>{g.academicYear?.name}</td>
                        <td style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{g.comment || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(!student.grades || student.grades.length === 0) && (
                  <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Award size={40} style={{ opacity: 0.1, margin: '0 auto 12px', display: 'block' }} />
                    <p>Aucun résultat d'évaluation trouvé</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'attendance' && (
              <div className="card shadow-sm" style={{ padding: 0 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Classe</th>
                      <th>Statut</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {student.attendance?.map((a: any) => (
                      <tr key={a.id}>
                        <td>{new Date(a.date).toLocaleDateString()}</td>
                        <td>{a.classroom?.name}</td>
                        <td>
                          <span className={`badge ${
                            a.status === 'PRESENT' ? 'badge-success' : 
                            a.status === 'ABSENT' ? 'badge-danger' : 'badge-warning'
                          }`}>
                            {a.status === 'PRESENT' ? 'Présent' : a.status === 'ABSENT' ? 'Absent' : 'Retard'}
                          </span>
                        </td>
                        <td style={{ fontSize: '12px' }}>{a.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(!student.attendance || student.attendance.length === 0) && (
                  <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Calendar size={40} style={{ opacity: 0.1, margin: '0 auto 12px', display: 'block' }} />
                    <p>Aucun historique de présence</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'finance' && (
              <div className="card shadow-sm" style={{ padding: 0 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>N° Facture</th>
                      <th>Libellé</th>
                      <th>Montant</th>
                      <th>Date</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {student.invoices?.map((inv: any) => (
                      <tr key={inv.id}>
                        <td><span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{inv.invoiceNumber}</span></td>
                        <td>{inv.title}</td>
                        <td><strong>{inv.amount.toLocaleString()} XOF</strong></td>
                        <td>{new Date(inv.dueDate).toLocaleDateString()}</td>
                        <td>
                          <span className={`badge ${inv.status === 'PAID' ? 'badge-primary' : 'badge-danger'}`}>
                            {inv.status === 'PAID' ? 'Payée' : 'Impayée'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(!student.invoices || student.invoices.length === 0) && (
                  <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Receipt size={40} style={{ opacity: 0.1, margin: '0 auto 12px', display: 'block' }} />
                    <p>Aucune facture enregistrée</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .badge-success { background: var(--success-dim); color: var(--success); border: 1px solid var(--success); }
        .badge-danger { background: var(--danger-dim); color: var(--danger); border: 1px solid var(--danger); }
        .grid-responsive {
          @media (max-width: 992px) {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </AppLayout>
  );
}
