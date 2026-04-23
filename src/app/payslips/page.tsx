'use client';

import { useState, useEffect, useCallback } from 'react';
import { BadgeDollarSign, Plus, Loader2, X, Download, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';
import { calculateMaliPayroll, formatXOF, MALI_RATES } from '@/lib/maliPayroll';

const emptyForm = {
  employeeId: '',
  periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
  periodEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
  baseSalary: '',
  taxableBonuses: '0',
  nonTaxableBonuses: '0',
  numberOfChildren: '0',
  notes: ''
};

export default function PayslipsPage() {
  const router = useRouter();
  const toast = useToast();

  const [payslips, setPayslips] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ ...emptyForm });

  // Calcul en temps réel (prévisualisation)
  const preview = formData.baseSalary
    ? calculateMaliPayroll({
        baseSalary: parseFloat(formData.baseSalary) || 0,
        taxableBonuses: parseFloat(formData.taxableBonuses) || 0,
        nonTaxableBonuses: parseFloat(formData.nonTaxableBonuses) || 0,
        numberOfChildren: parseInt(formData.numberOfChildren) || 0,
      })
    : null;

  const fetchPayslips = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/payslips');
      if (res.status === 401) { router.push('/login'); return; }
      if (!res.ok) throw new Error();
      setPayslips(await res.json());
    } catch {
      toast.error('Erreur lors du chargement des bulletins.');
    } finally {
      setIsLoading(false);
    }
  }, [router, toast]);

  useEffect(() => {
    fetchPayslips();
    fetch('/api/employees?search=').then(r => r.json()).then(d => {
      if (Array.isArray(d)) setEmployees(d);
    }).catch(() => {});
  }, [fetchPayslips]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.baseSalary || parseFloat(formData.baseSalary) < 1) {
      toast.warning('Salaire de base invalide.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/payslips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.alerts?.length > 0) {
        data.alerts.forEach((a: string) => toast.warning(a));
      }
      toast.success('Bulletin de paie généré et enregistré.');
      setShowModal(false);
      setFormData({ ...emptyForm });
      fetchPayslips();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const update = (field: string, value: string) => setFormData(f => ({ ...f, [field]: value }));

  const downloadDipe = () => {
    if (payslips.length === 0) return;
    
    let content = "DOCUMENT D'INFORMATION SUR LE PERSONNEL - MALI\n";
    content += "================================================\n";
    content += `Date Génération : ${new Date().toLocaleString()}\n`;
    content += `Nombre de salariés : ${payslips.length}\n\n`;
    content += "MATRICULE | NOM & PRÉNOM | BRUT IMPOSABLE | INPS (3.06%) | AMO (1.5%) | ITS | NET À PAYER\n";
    content += "--------------------------------------------------------------------------------------------\n";
    
    payslips.forEach(p => {
      content += `${p.employee?.employeeNumber || 'N/A'} | `;
      content += `${(p.employee?.firstName + ' ' + p.employee?.lastName).padEnd(20)} | `;
      content += `${(p.grossSalary || 0).toLocaleString()} | `;
      content += `${(p.inpsEmployee || 0).toLocaleString()} | `;
      content += `${(p.amoEmployee || 0).toLocaleString()} | `;
      content += `${(p.its || 0).toLocaleString()} | `;
      content += `${(p.netSalary || 0).toLocaleString()}\n`;
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DIPE_MALI_${new Date().getFullYear()}_${new Date().getMonth() + 1}.txt`;
    a.click();
    toast.success('Fichier DIPE généré pour déclaration.');
  };

  return (
    <AppLayout
      title="Gestion de la Paie"
      subtitle="Bulletins de salaire conformes au Code du Travail Malien (ITS · INPS · AMO/CANAM)"
      breadcrumbs={[{ label: 'Accueil', href: '/dashboard' }, { label: 'Paie' }]}
      actions={
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-outline" onClick={downloadDipe} disabled={payslips.length === 0}>
            <Download size={15} /> Télécharger DIPE
          </button>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Générer un Bulletin
          </button>
        </div>
      }
    >
      {/* ── Légende des taux légaux ── */}
      <div style={{
        display: 'flex', gap: '12px', flexWrap: 'wrap',
        padding: '14px 20px', background: 'var(--info-dim)', borderRadius: '12px',
        border: '1px solid var(--info)', fontSize: '12px', color: 'var(--info)', fontWeight: 600
      }}>
        <span>⚖️ Taux légaux en vigueur Mali 2024-2025 :</span>
        <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>INPS salarié : <strong style={{ color: 'var(--info)' }}>{(MALI_RATES.INPS_EMPLOYEE * 100).toFixed(2)}%</strong></span>
        <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>AMO/CANAM salarié : <strong style={{ color: 'var(--info)' }}>{(MALI_RATES.AMO_EMPLOYEE * 100).toFixed(1)}%</strong></span>
        <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>SMIG : <strong style={{ color: 'var(--info)' }}>{MALI_RATES.SMIG.toLocaleString()} XOF</strong></span>
        <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>ITS : barème progressif 0% → 30%</span>
      </div>

      {/* ── Liste des bulletins ── */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          {isLoading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Loader2 size={32} className="spin" style={{ margin: '0 auto 12px', display: 'block' }} />
              <p>Chargement des bulletins...</p>
            </div>
          ) : payslips.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employé</th>
                  <th>Période</th>
                  <th>Salaire Brut</th>
                  <th>INPS+AMO+ITS</th>
                  <th>Net à payer</th>
                  <th>Statut</th>
                  <th>Détails</th>
                </tr>
              </thead>
              <tbody>
                {payslips.map(p => (
                  <>
                    <tr key={p.id}>
                      <td>
                        <strong>{p.employee?.firstName} {p.employee?.lastName}</strong><br />
                        <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{p.employee?.employeeNumber}</span>
                      </td>
                      <td style={{ fontSize: '13px' }}>
                        {new Date(p.periodStart).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                      </td>
                      <td>{p.grossSalary?.toLocaleString() ?? p.baseSalary?.toLocaleString()} XOF</td>
                      <td style={{ color: 'var(--danger)', fontWeight: 600 }}>
                        −{((p.totalDeductions || 0) + (p.its || 0)).toLocaleString()} XOF
                      </td>
                      <td><strong style={{ color: 'var(--success)', fontSize: '15px' }}>{p.netSalary?.toLocaleString()} XOF</strong></td>
                      <td>
                        <span className={`badge ${p.status === 'FINALIZED' ? 'badge-primary' : 'badge-warning'}`}>
                          {p.status === 'FINALIZED' ? 'Validé' : p.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-icon"
                          title="Voir détail cotisations"
                          onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                        >
                          {expandedId === p.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                        </button>
                      </td>
                    </tr>

                    {/* Détail expandable du bulletin malien */}
                    {expandedId === p.id && (
                      <tr key={`${p.id}-detail`}>
                        <td colSpan={7} style={{ background: 'var(--bg-3)', padding: '0' }}>
                          <div style={{ padding: '20px 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                            {/* Gains */}
                            <div>
                              <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px', letterSpacing: '0.06em' }}>Éléments de Rémunération</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <BulletinRow label="Salaire de Base" amount={p.baseSalary} color="var(--text)" />
                                {p.taxableBonuses > 0 && <BulletinRow label="Primes imposables" amount={p.taxableBonuses} color="var(--success)" />}
                                {p.nonTaxableBonuses > 0 && <BulletinRow label="Indemnités (non imp.)" amount={p.nonTaxableBonuses} color="var(--info)" />}
                                <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
                                <BulletinRow label="Salaire Brut Imposable" amount={p.grossSalary} color="var(--primary)" bold />
                              </div>
                            </div>

                            {/* Retenues */}
                            <div>
                              <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px', letterSpacing: '0.06em' }}>Cotisations & Impôts</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <BulletinRow label={`INPS Salarié (3,06% sur ${Math.min(p.grossSalary, MALI_RATES.INPS_CEILING).toLocaleString()})`} amount={-p.inpsEmployee} color="var(--danger)" />
                                <BulletinRow label="AMO / CANAM (1,50%)" amount={-p.amoEmployee} color="var(--danger)" />
                                <BulletinRow label={`ITS — Assiette : ${p.fiscalBase?.toLocaleString()} XOF`} amount={-p.its} color="var(--danger)" />
                                <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
                                <BulletinRow label="Total Retenues Salariales" amount={-(p.totalDeductions + p.its)} color="var(--danger)" bold />
                                <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
                                <BulletinRow label="NET À PAYER" amount={p.netSalary} color="var(--success)" bold large />
                              </div>
                            </div>
                          </div>

                          {/* Charges patronales */}
                          <div style={{ padding: '12px 32px 20px', borderTop: '1px solid var(--border)', fontSize: '12px', color: 'var(--text-dim)', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                            <span>Coût employeur total : <strong style={{ color: 'var(--text)' }}>
                              {((p.grossSalary || 0) + (p.nonTaxableBonuses || 0) + (p.totalEmployerCharges || 0)).toLocaleString()} XOF
                            </strong></span>
                            <span>INPS patronal (7%) : <strong>{p.inpsEmployer?.toLocaleString()} XOF</strong></span>
                            <span>AMO patronale (4,5%) : <strong>{p.amoEmployer?.toLocaleString()} XOF</strong></span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <BadgeDollarSign size={48} style={{ opacity: 0.2, margin: '0 auto 16px', display: 'block' }} />
              <h3>Aucun bulletin généré</h3>
              <p style={{ fontSize: '13px' }}>Cliquez sur "Générer un Bulletin" pour démarrer le cycle de paie.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal de création ── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}>
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border-md)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '780px', boxShadow: 'var(--shadow-lg)', animation: 'fadeUp 0.3s var(--ease) both' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 28px', borderBottom: '1px solid var(--border)' }}>
              <div>
                <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '18px' }}>Bulletin de Paie — Calcul Malien</h2>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>ITS · INPS (3,06%) · AMO/CANAM (1,5%) · Code du Travail du Mali</p>
              </div>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0' }}>
              {/* Formulaire de saisie */}
              <form onSubmit={handleSubmit} style={{ padding: '28px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div className="form-group">
                  <label>Employé *</label>
                  <select required value={formData.employeeId} onChange={e => update('employeeId', e.target.value)}>
                    <option value="">-- Sélectionnez un employé --</option>
                    {employees.map((emp: any) => (
                      <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.employeeNumber})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group"><label>Période Du *</label><input type="date" required value={formData.periodStart} onChange={e => update('periodStart', e.target.value)} /></div>
                  <div className="form-group"><label>Au *</label><input type="date" required value={formData.periodEnd} onChange={e => update('periodEnd', e.target.value)} /></div>
                </div>

                <div className="form-group">
                  <label>Salaire de Base (XOF) *</label>
                  <input type="number" min={MALI_RATES.SMIG} required value={formData.baseSalary} onChange={e => update('baseSalary', e.target.value)} placeholder={`Min SMIG : ${MALI_RATES.SMIG.toLocaleString()} XOF`} />
                  {formData.baseSalary && parseFloat(formData.baseSalary) < MALI_RATES.SMIG && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '11px', color: 'var(--danger)' }}>
                      <AlertCircle size={12} /> Inférieur au SMIG — Non conforme Code du Travail Mali
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Primes Imposables (XOF)</label>
                    <input type="number" min="0" value={formData.taxableBonuses} onChange={e => update('taxableBonuses', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Indemnités Non Imposables</label>
                    <input type="number" min="0" value={formData.nonTaxableBonuses} onChange={e => update('nonTaxableBonuses', e.target.value)} placeholder="Transport, logement..." />
                  </div>
                </div>

                <div className="form-group">
                  <label>Nombre d'enfants à charge</label>
                  <input type="number" min="0" max="20" value={formData.numberOfChildren} onChange={e => update('numberOfChildren', e.target.value)} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px', paddingTop: '18px', borderTop: '1px solid var(--border)' }}>
                  <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Annuler</button>
                  <button type="submit" className="btn-primary" disabled={isSubmitting || !preview}>
                    {isSubmitting ? <><Loader2 size={15} className="spin" /> Génération...</> : 'Valider & Enregistrer'}
                  </button>
                </div>
              </form>

              {/* Prévisualisation en temps réel */}
              <div style={{ padding: '28px', background: 'var(--bg-1)', display: 'flex', flexDirection: 'column', gap: '0' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: '16px' }}>
                  Prévisualisation Bulletin
                </div>
                {preview ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px' }}>
                    <PreviewRow label="Salaire Brut Imposable" value={preview.grossSalary} />
                    <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }}/>
                    <PreviewRow label="INPS Salarié (3,06%)" value={-preview.inpsEmployee} isDeduction />
                    <PreviewRow label="AMO/CANAM (1,50%)" value={-preview.amoEmployee} isDeduction />
                    <PreviewRow label={`ITS (assiette: ${preview.fiscalBase.toLocaleString()} XOF)`} value={-preview.its} isDeduction />
                    <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }}/>
                    {preview.nonTaxableBonuses > 0 && <PreviewRow label="+ Ind. non imposables" value={preview.nonTaxableBonuses} />}

                    <div style={{ marginTop: '12px', padding: '16px', background: 'var(--success-dim)', borderRadius: '12px', border: '1px solid var(--success)', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: 'var(--success)', marginBottom: '4px', fontWeight: 700, textTransform: 'uppercase' }}>Net à Payer</div>
                      <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--success)' }}>{preview.netSalary.toLocaleString()} XOF</div>
                    </div>

                    <div style={{ marginTop: '12px', padding: '12px', background: 'var(--bg-3)', borderRadius: '10px', fontSize: '11px', color: 'var(--text-dim)' }}>
                      <div style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--text-muted)' }}>Charges Patronales (info)</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>INPS patronal (7%)</span><strong>{preview.inpsEmployer.toLocaleString()} XOF</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>AMO patronale (4,5%)</span><strong>{preview.amoEmployer.toLocaleString()} XOF</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid var(--border)', fontWeight: 700, color: 'var(--text)' }}>
                        <span>Coût total employeur</span><span>{preview.totalEmployerCost.toLocaleString()} XOF</span>
                      </div>
                    </div>

                    {/* Alertes conformité */}
                    {preview.alerts.map((a, i) => (
                      <div key={i} style={{ marginTop: '8px', padding: '10px 14px', background: 'var(--danger-dim)', borderRadius: '8px', color: 'var(--danger)', fontSize: '11px', border: '1px solid var(--danger)' }}>
                        {a}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', textAlign: 'center' }}>
                    <div>
                      <BadgeDollarSign size={40} style={{ opacity: 0.15, marginBottom: '10px' }} />
                      <p style={{ fontSize: '12px' }}>Saisissez le salaire de base<br />pour voir le calcul en temps réel</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

// ── Composants helpers ─────────────────────────────────────────────

function BulletinRow({ label, amount, color, bold, large }: { label: string; amount: number; color: string; bold?: boolean; large?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: large ? '13px' : '12px', fontWeight: bold ? 700 : 400, color: bold ? 'var(--text)' : 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: large ? '15px' : '13px', fontWeight: bold ? 800 : 600, color }}>{amount < 0 ? '-' : ''}{Math.abs(amount).toLocaleString()} XOF</span>
    </div>
  );
}

function PreviewRow({ label, value, isDeduction }: { label: string; value: number; isDeduction?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <strong style={{ color: isDeduction ? 'var(--danger)' : 'var(--text)' }}>
        {isDeduction ? '−' : '+'}{Math.abs(value).toLocaleString()} XOF
      </strong>
    </div>
  );
}
