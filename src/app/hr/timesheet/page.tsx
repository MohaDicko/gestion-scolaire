'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, Download, RefreshCw, Loader2, AlertCircle, CheckCircle2, XCircle, ArrowRight, Printer, Users } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';
import { exportToExcel } from '@/lib/exportUtils';

export default function TimesheetPage() {
  const router = useRouter();
  const toast = useToast();

  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(10); // Octobre par défaut (données réelles)
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTimesheet = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/hr/timesheet?year=${year}&month=${month}`);
      if (!res.ok) throw new Error();
      const resData = await res.json();
      setData(resData);
    } catch {
      toast.error('Erreur lors du chargement du tableau utilitaire');
    } finally {
      setIsLoading(false);
    }
  }, [year, month, toast]);

  useEffect(() => {
    fetchTimesheet();
  }, [fetchTimesheet]);

  const handleExportExcel = () => {
    if (!data?.rows || data.rows.length === 0) {
      toast.warning('Aucune donnée à exporter');
      return;
    }

    const exportRows = data.rows.map((r: any) => {
      const rowObj: Record<string, any> = {
        'N°': r.number,
        'Professeur': r.teacherName,
        'Matières': r.subject,
        'Classe': r.classroom,
      };

      data.daysList.forEach((d: any) => {
        const val = r.dayHours[d.day];
        const status = r.dayStatuses[d.day];
        rowObj[`${d.day} (${d.letter})`] = status === 'ABSENT' ? 'P (0)' : (val > 0 ? val : '');
      });

      rowObj['Total Heures'] = r.totalHours;
      rowObj['Heures Prévues'] = r.heuresPrevues;
      rowObj['Heures Perdues'] = r.heuresPerdues;
      rowObj['T.H (FCFA)'] = r.rate;
      rowObj['Montant Brut (FCFA)'] = r.montant;

      return rowObj;
    });

    exportToExcel(exportRows, `Tableau_Utilitaire_Heures_${year}_${month}`, 'Emargements');
    toast.success('Tableau utilitaire exporté en Excel');
  };

  const MONTH_NAMES = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  return (
    <AppLayout
      title="Tableau Utilitaire des Heures d'Enseignement"
      subtitle="Grille matricielle d'émargement mensuelle des formateurs (Heures Exécutées · Prévues · Perdues)"
      breadcrumbs={[{ label: 'Accueil', href: '/dashboard' }, { label: 'Ressources Humaines', href: '/hr' }, { label: 'Tableau Utilitaire' }]}
      actions={
        <div style={{ display: 'flex', gap: '10px' }}>
          <select
            value={month}
            onChange={e => setMonth(Number(e.target.value))}
            style={{ padding: '8px 12px', borderRadius: '10px', background: 'var(--bg-3)', border: '1px solid var(--border)', fontSize: '13px', fontWeight: 600 }}
          >
            {MONTH_NAMES.map((name, i) => (
              <option key={i + 1} value={i + 1}>{name}</option>
            ))}
          </select>

          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            style={{ padding: '8px 12px', borderRadius: '10px', background: 'var(--bg-3)', border: '1px solid var(--border)', fontSize: '13px', fontWeight: 600 }}
          >
            {[2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <button className="btn-outline" onClick={handleExportExcel} disabled={isLoading || !data?.rows?.length}>
            <Download size={15} /> Exporter Excel
          </button>

          <button
            className="btn-primary"
            onClick={() => router.push('/payslips')}
            style={{ background: '#16a34a', borderColor: '#16a34a', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span>🌾</span> Liquider en Paie →
          </button>

          <button className="btn-outline" onClick={fetchTimesheet} disabled={isLoading}>
            <RefreshCw size={15} className={isLoading ? 'spin' : ''} />
          </button>
        </div>
      }
    >
      {/* ── Bandeau Jaune Supérieur Conforme à l'Excel (Ligne 74) ── */}
      <div style={{
        background: '#fef08a',
        border: '1px solid #facc15',
        borderRadius: '12px 12px 0 0',
        padding: '12px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: '#854d0e',
        fontWeight: 800,
        fontSize: '13px',
        textTransform: 'uppercase',
        letterSpacing: '0.04em'
      }}>
        <span>📌 DÉCOMPTE JOURNALIER DES HEURES D'ENSEIGNEMENT — CFP-PAS DE GAO ({MONTH_NAMES[month - 1].toUpperCase()} {year})</span>
        <span style={{ fontSize: '11px', background: '#ca8a04', color: '#fff', padding: '2px 8px', borderRadius: '6px' }}>
          Format Utilitiaire
        </span>
      </div>

      {/* ── Cartes de Synthèse Mensuelle ── */}
      <div className="card" style={{ borderRadius: '0 0 12px 12px', borderTop: 'none', padding: '18px 24px', marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          <div style={{ padding: '12px', background: 'var(--bg-3)', borderRadius: '10px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Heures Dispensées</span>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#16a34a', marginTop: '3px' }}>
              {data?.totals?.totalHours || 0} h
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Somme des séances émargées</span>
          </div>

          <div style={{ padding: '12px', background: 'var(--bg-3)', borderRadius: '10px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Heures Prévues (Quota)</span>
            <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text)', marginTop: '3px' }}>
              {data?.totals?.totalPrevues || 0} h
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Volume contractuel attendu</span>
          </div>

          <div style={{ padding: '12px', background: 'var(--bg-3)', borderRadius: '10px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Heures Perdues / Non Exécutées</span>
            <div style={{ fontSize: '24px', fontWeight: 900, color: (data?.totals?.totalPerdues || 0) > 0 ? '#ef4444' : '#16a34a', marginTop: '3px' }}>
              {data?.totals?.totalPerdues || 0} h
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Absences notées (P) Absent</span>
          </div>

          <div style={{ padding: '12px', background: 'var(--bg-3)', borderRadius: '10px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Masse Brut Honoraires (1 750 F/h)</span>
            <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--primary)', marginTop: '3px' }}>
              {(data?.totals?.totalMontant || 0).toLocaleString('fr-FR')} <span style={{ fontSize: '13px' }}>FCFA</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>À verser sur l'état de paie</span>
          </div>
        </div>
      </div>

      {/* ── Grille Matricielle du Tableau Utilitaire ── */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container" style={{ overflowX: 'auto', maxHeight: '70vh' }}>
          {isLoading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Loader2 size={32} className="spin" style={{ margin: '0 auto 12px', display: 'block' }} />
              <p>Construction de la matrice journalière...</p>
            </div>
          ) : data?.rows?.length > 0 ? (
            <table className="data-table" style={{ borderCollapse: 'collapse', fontSize: '12px', minWidth: '1200px' }}>
              <thead>
                {/* Ligne 1 : En-tête des jours de la semaine (L, M, M, J, V, S...) */}
                <tr style={{ background: 'var(--bg-3)', borderBottom: '1px solid var(--border)' }}>
                  <th rowSpan={2} style={{ width: '35px', textAlign: 'center', verticalAlign: 'middle', borderRight: '1px solid var(--border)' }}>N°</th>
                  <th rowSpan={2} style={{ minWidth: '180px', textAlign: 'left', verticalAlign: 'middle', borderRight: '1px solid var(--border)' }}>
                    PROFESSEURS CHARGÉS DE COURS
                  </th>
                  <th rowSpan={2} style={{ minWidth: '160px', textAlign: 'left', verticalAlign: 'middle', borderRight: '1px solid var(--border)' }}>Matières</th>
                  <th rowSpan={2} style={{ minWidth: '130px', textAlign: 'center', verticalAlign: 'middle', borderRight: '2px solid var(--border)' }}>Classe</th>

                  {/* Jours : Lettre L, M, M, J, V, S */}
                  {data.daysList.map((d: any) => (
                    <th
                      key={`head-letter-${d.day}`}
                      style={{
                        padding: '4px 6px',
                        textAlign: 'center',
                        fontSize: '11px',
                        fontWeight: 800,
                        width: '28px',
                        borderRight: '1px solid var(--border)',
                        color: d.letter === 'S' ? '#3b82f6' : 'var(--text)'
                      }}
                    >
                      {d.letter}
                    </th>
                  ))}

                  <th rowSpan={2} style={{ textAlign: 'center', verticalAlign: 'middle', background: 'rgba(22, 163, 74, 0.1)', color: '#16a34a', fontWeight: 800, borderLeft: '2px solid var(--border)' }}>
                    Total des heures
                  </th>
                  <th colSpan={2} style={{ textAlign: 'center', borderLeft: '1px solid var(--border)', background: 'var(--bg-3)' }}>
                    HEURES TOTALES
                  </th>
                  <th rowSpan={2} style={{ textAlign: 'right', verticalAlign: 'middle', background: 'var(--bg-3)', fontWeight: 800, borderLeft: '1px solid var(--border)' }}>
                    Montant Brut
                  </th>
                </tr>

                {/* Ligne 2 : Numéros des jours (1, 2, 3... 31) */}
                <tr style={{ background: 'var(--bg-3)', borderBottom: '2px solid var(--border)' }}>
                  {data.daysList.map((d: any) => (
                    <th
                      key={`head-num-${d.day}`}
                      style={{
                        padding: '4px 6px',
                        textAlign: 'center',
                        fontSize: '10px',
                        fontWeight: 600,
                        borderRight: '1px solid var(--border)',
                        color: 'var(--text-muted)'
                      }}
                    >
                      {d.day}
                    </th>
                  ))}

                  {/* Sous-colonnes Heures Totales */}
                  <th style={{ textAlign: 'center', fontSize: '11px', padding: '4px 8px', borderLeft: '1px solid var(--border)' }}>Prévues</th>
                  <th style={{ textAlign: 'center', fontSize: '11px', padding: '4px 8px', color: '#ef4444', borderLeft: '1px solid var(--border)' }}>Perdues</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--text-muted)', borderRight: '1px solid var(--border)' }}>
                      {row.number}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--text)', borderRight: '1px solid var(--border)' }}>
                      {row.teacherName}
                    </td>
                    <td style={{ borderRight: '1px solid var(--border)', color: 'var(--text)' }}>
                      {row.subject}
                    </td>
                    <td style={{ textAlign: 'center', borderRight: '2px solid var(--border)' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, background: 'var(--bg-3)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                        {row.classroom}
                      </span>
                    </td>

                    {/* Cellules Journalières (1 à 31) */}
                    {data.daysList.map((d: any) => {
                      const hours = row.dayHours[d.day];
                      const status = row.dayStatuses[d.day];
                      return (
                        <td
                          key={`cell-${idx}-${d.day}`}
                          style={{
                            textAlign: 'center',
                            padding: '6px 2px',
                            borderRight: '1px solid var(--border)',
                            background: status === 'ABSENT' 
                              ? 'rgba(239, 68, 68, 0.15)' 
                              : hours > 0 
                                ? 'rgba(22, 163, 74, 0.15)' 
                                : undefined
                          }}
                        >
                          {status === 'ABSENT' ? (
                            <span style={{ color: '#ef4444', fontWeight: 900, fontSize: '10px' }} title="Absent (P)">
                              P
                            </span>
                          ) : hours > 0 ? (
                            <span style={{ color: '#16a34a', fontWeight: 800, fontSize: '11px' }}>
                              {hours}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--border)', fontSize: '10px' }}>·</span>
                          )}
                        </td>
                      );
                    })}

                    {/* Total Heures Dispensées */}
                    <td style={{ textAlign: 'center', fontWeight: 900, fontSize: '13px', color: '#16a34a', background: 'rgba(22, 163, 74, 0.05)', borderLeft: '2px solid var(--border)' }}>
                      {row.totalHours}
                    </td>

                    {/* Heures Prévues */}
                    <td style={{ textAlign: 'center', fontWeight: 700, borderLeft: '1px solid var(--border)' }}>
                      {row.heuresPrevues}
                    </td>

                    {/* Heures Perdues */}
                    <td style={{ textAlign: 'center', fontWeight: 800, color: row.heuresPerdues > 0 ? '#ef4444' : 'var(--text-muted)', borderLeft: '1px solid var(--border)' }}>
                      {row.heuresPerdues > 0 ? row.heuresPerdues : '0'}
                    </td>

                    {/* Montant Brut */}
                    <td style={{ textAlign: 'right', fontWeight: 700, borderLeft: '1px solid var(--border)' }}>
                      {row.montant.toLocaleString('fr-FR')} F
                    </td>
                  </tr>
                ))}

                {/* Ligne TOTAL GÉNÉRAL */}
                <tr style={{ background: '#fef08a', fontWeight: 900, color: '#854d0e', borderTop: '2px solid #ca8a04' }}>
                  <td colSpan={4} style={{ textAlign: 'right', paddingRight: '14px', textTransform: 'uppercase' }}>
                    TOTAL GÉNÉRAL DU MOIS :
                  </td>

                  {/* Sommes journalières */}
                  {data.daysList.map((d: any) => {
                    const daySum = data.rows.reduce((sum: number, r: any) => sum + (r.dayHours[d.day] || 0), 0);
                    return (
                      <td key={`total-day-${d.day}`} style={{ textAlign: 'center', padding: '6px 2px', borderRight: '1px solid #facc15', fontSize: '11px' }}>
                        {daySum > 0 ? daySum : ''}
                      </td>
                    );
                  })}

                  <td style={{ textAlign: 'center', fontSize: '14px', borderLeft: '2px solid #ca8a04' }}>
                    {data.totals?.totalHours || 0}
                  </td>
                  <td style={{ textAlign: 'center', borderLeft: '1px solid #ca8a04' }}>
                    {data.totals?.totalPrevues || 0}
                  </td>
                  <td style={{ textAlign: 'center', color: '#b91c1c', borderLeft: '1px solid #ca8a04' }}>
                    {data.totals?.totalPerdues || 0}
                  </td>
                  <td style={{ textAlign: 'right', fontSize: '13px', borderLeft: '1px solid #ca8a04' }}>
                    {(data.totals?.totalMontant || 0).toLocaleString('fr-FR')} FCFA
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Users size={36} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
              <p>Aucune séance enregistrée pour {MONTH_NAMES[month - 1]} {year}.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
