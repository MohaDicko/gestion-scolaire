import React from 'react';
import { useParams } from 'react-router-dom';
import { 
  GraduationCap, 
  Calendar, 
  CreditCard, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  BookOpen,
  Phone,
  MessageSquare
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/apiClient';

export function ParentPortalView() {
  const { id } = useParams();
  
  const { data, isLoading } = useQuery({
    queryKey: ['portal-data', id],
    queryFn: async () => {
      const response = await apiClient.get(`/academic/students/${id}/portal`);
      return response.data;
    }
  });

  if (isLoading) return <div className="mobile-loading">Chargement du portail...</div>;
  if (!data) return <div className="page">Accès non autorisé ou étudiant introuvable.</div>;

  return (
    <div className="parent-portal-root">
      {/* Mobile Top Header */}
      <div className="portal-mobile-header">
        <div className="student-badge-mini">
          <div className="avatar-placeholder">{data.fullName.charAt(0)}</div>
          <div>
            <div className="student-name">{data.fullName}</div>
            <div className="student-sub">{data.className} • {data.academicYear}</div>
          </div>
        </div>
      </div>

      <div className="portal-content">
        {/* Quick Stats Grid */}
        <div className="portal-stats-row">
          <div className="portal-stat-card">
            <div className="stat-circle" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
              {data.averageGrade || '—'}
            </div>
            <div className="stat-label">Moyenne</div>
          </div>
          <div className="portal-stat-card">
            <div className="stat-circle" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
              {data.totalAbsences}
            </div>
            <div className="stat-label">Absences</div>
          </div>
          <div className="portal-stat-card">
            <div className="stat-circle" style={{ borderColor: 'var(--success)', color: 'var(--success)' }}>
              {data.grades.length}
            </div>
            <div className="stat-label">Matières</div>
          </div>
        </div>

        {/* Sections */}
        <div className="portal-section">
          <h3 className="section-title"><CreditCard size={18} /> État Financier</h3>
          <div className="card glass">
            <div className="finance-row">
              <span>Reste à payer :</span>
              <span className="finance-value">{data.totalOutstanding.toLocaleString()} F CFA</span>
            </div>
            <div className="finance-progress-bg">
              <div className="finance-progress-bar" style={{ width: '60%' }}></div>
            </div>
            <p className="finance-note">Veuillez régulariser avant le prochain trimestre.</p>
          </div>
        </div>

        <div className="portal-section">
          <h3 className="section-title"><BookOpen size={18} /> Dernières Notes</h3>
          <div className="grades-list">
            {data.grades.slice(0, 5).map((g: any) => (
              <div key={g.subjectName} className="grade-item glass">
                <span className="grade-subject">{g.subjectName}</span>
                <span className={`grade-value ${g.average >= 10 ? 'pass' : 'fail'}`}>
                  {g.average.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="portal-section">
          <h3 className="section-title"><Calendar size={18} /> Programme du Jour</h3>
          <div className="schedule-list">
            {data.todaySchedule.length > 0 ? (
              data.todaySchedule.map((s: any, i: number) => (
                <div key={i} className="schedule-item">
                  <div className="schedule-time">{s.startTime}</div>
                  <div className="schedule-info">
                    <div className="schedule-subject">{s.subjectName}</div>
                    <div className="schedule-teacher">M. {s.teacherName}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">Aucun cours aujourd'hui</div>
            )}
          </div>
        </div>

        {/* Contact Admin */}
        <div style={{ marginTop: '40px' }}>
          <button className="btn-primary btn-full" onClick={() => window.location.href = `tel:+22370000000`}>
            <Phone size={18} /> Contacter l'Établissement
          </button>
        </div>
      </div>

      <style>{`
        .parent-portal-root {
          background: var(--bg);
          min-height: 100vh;
          padding-bottom: 40px;
          font-family: 'Inter', sans-serif;
        }

        .portal-mobile-header {
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
          padding: 30px 20px 60px;
          color: white;
          border-radius: 0 0 30px 30px;
        }

        .student-badge-mini {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .avatar-placeholder {
          width: 50px;
          height: 50px;
          border-radius: 15px;
          background: rgba(255,255,255,0.2);
          display: grid;
          place-items: center;
          font-size: 20px;
          font-weight: 800;
        }

        .student-name { font-size: 18px; font-weight: 700; }
        .student-sub { font-size: 13px; opacity: 0.8; }

        .portal-content {
          margin-top: -30px;
          padding: 0 20px;
        }

        .portal-stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 25px;
        }

        .portal-stat-card {
          background: var(--bg-2);
          padding: 15px;
          border-radius: 20px;
          text-align: center;
          box-shadow: var(--shadow);
          border: 1px solid var(--border);
        }

        .stat-circle {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          border: 3px solid;
          margin: 0 auto 8px;
          display: grid;
          place-items: center;
          font-size: 16px;
          font-weight: 800;
        }

        .stat-label { font-size: 11px; color: var(--text-muted); font-weight: 600; }

        .portal-section { margin-top: 25px; }
        .section-title { 
          font-size: 14px; 
          font-weight: 700; 
          color: var(--text-muted); 
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .finance-row { display: flex; justify-content: space-between; font-weight: 700; margin-bottom: 15px; }
        .finance-value { color: var(--danger); }
        .finance-progress-bg { height: 8px; background: var(--bg-3); border-radius: 4px; overflow: hidden; margin-bottom: 10px; }
        .finance-progress-bar { height: 100%; background: var(--danger); border-radius: 4px; }
        .finance-note { font-size: 12px; color: var(--text-muted); }

        .grades-list { display: flex; flex-direction: column; gap: 8px; }
        .grade-item {
          display: flex;
          justify-content: space-between;
          padding: 12px 16px;
          border-radius: 12px;
          border: 1px solid var(--border);
        }
        .grade-subject { font-weight: 600; font-size: 14px; }
        .grade-value { font-weight: 800; }
        .grade-value.pass { color: var(--success); }
        .grade-value.fail { color: var(--danger); }

        .schedule-item {
          display: flex;
          gap: 15px;
          padding: 12px 0;
          border-bottom: 1px solid var(--border);
        }
        .schedule-time { font-size: 13px; font-weight: 700; color: var(--primary); min-width: 50px; }
        .schedule-subject { font-weight: 600; font-size: 14px; }
        .schedule-teacher { font-size: 12px; color: var(--text-muted); }
      `}</style>
    </div>
  );
}
