import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/apiClient';
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  MessageSquare, 
  Download,
  DollarSign,
  ArrowRight
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip 
} from 'recharts';

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n);

interface DashboardData {
  totalTuitionExpected: number;
  totalCollected: number;
  totalOutStanding: number;
  collectionRate: number;
  topDefaulters: Array<{
    studentName: string;
    className: string;
    amountDue: number;
    parentPhone: string;
  }>;
}

export default function AccountantDashboardPage() {
  // We'll use the new endpoint I created in the backend (hypothetically)
  // For now, using a mock query to demonstrate the UI
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['financial-dashboard'],
    queryFn: async () => {
      // In a real scenario, we'd pick the current academic year ID
      const { data } = await apiClient.get('/finance/dashboard'); 
      return data;
    },
    // Fallback data if backend is not yet fully updated for the specific dashboard endpoint
    placeholderData: {
      totalTuitionExpected: 25000000,
      totalCollected: 18500000,
      totalOutStanding: 6500000,
      collectionRate: 74,
      topDefaulters: [
        { studentName: 'Mamadou Traoré', className: 'Terminale SE', amountDue: 150000, parentPhone: '77123456' },
        { studentName: 'Fatoumata Coulibaly', className: '11ème LL', amountDue: 200000, parentPhone: '66554433' },
        { studentName: 'Ousmane Diarra', className: '10ème S', amountDue: 125000, parentPhone: '99887766' },
        { studentName: 'Awa Keita', className: '12ème TSS', amountDue: 175000, parentPhone: '77665544' },
      ]
    }
  });

  if (isLoading || !data) return <div className="page-loading">Chargement du tableau de bord financier...</div>;

  const chartData = [
    { name: 'Encaissé', value: data.totalCollected, color: '#10b981' },
    { name: 'Reste à percevoir', value: data.totalOutStanding, color: '#f59e0b' },
  ];

  const stats = [
    { label: 'Recettes Attendues', value: formatCurrency(data.totalTuitionExpected), icon: DollarSign, color: 'var(--primary)' },
    { label: 'Total Encaissé', value: formatCurrency(data.totalCollected), icon: CheckCircle2, color: '#10b981' },
    { label: 'Arriérés (Impayés)', value: formatCurrency(data.totalOutStanding), icon: AlertTriangle, color: '#f59e0b' },
    { label: 'Taux de Recouvrement', value: `${data.collectionRate}%`, icon: TrendingUp, color: '#3b82f6' },
  ];

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="page-title">Tableau de Bord du Comptable</h1>
          <p className="page-subtitle">Suivi en temps réel de la santé financière du groupe Talibi</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-outline">
            <Download size={18} /> Export Excel
          </button>
          <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={18} /> Faire une Relance Groupée
          </button>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {stats.map((stat, idx) => (
          <div key={idx} className="stat-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <stat.icon size={24} style={{ color: stat.color }} />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                +4.2%
              </span>
            </div>
            <h4 style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>{stat.label}</h4>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)' }}>{stat.value}</div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, height: '4px', width: '100%', background: stat.color, opacity: 0.2 }} />
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px' }}>
        {/* Large Chart Area */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            📊 Évolution Mensuelle des Encaissements
          </h3>
          <div style={{ height: '350px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { month: 'Oct', amount: 4500000 },
                  { month: 'Nov', amount: 3200000 },
                  { month: 'Déc', amount: 5100000 },
                  { month: 'Jan', amount: 2800000 },
                  { month: 'Fév', amount: 4100000 },
                  { month: 'Mar', amount: 3900000 },
                ]}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${v/1000}k`} />
                <Tooltip 
                  formatter={((value: any) => formatCurrency(Number(value))) as any}
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                />
                <Bar dataKey="amount" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Small Pie Chart Area */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>État Global</h3>
          <div style={{ height: '220px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ marginTop: '20px' }}>
            {chartData.map((d, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: d.color }} />
                  <span>{d.name}</span>
                </div>
                <span style={{ fontWeight: 600 }}>{formatCurrency(d.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Defaulters Table */}
      <div className="card" style={{ marginTop: '24px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600 }}>🏷️ Top 5 - Retardataires (Impatiés)</h3>
          <button className="btn-link" style={{ color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            Voir tous les retardataires <ArrowRight size={16} />
          </button>
        </div>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Élève / Étudiant</th>
                <th>Classe / Filière</th>
                <th>Montant Dû</th>
                <th>Contact Parent</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.topDefaulters.map((def, idx) => (
                <tr key={idx}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{def.studentName}</div>
                  </td>
                  <td>{def.className}</td>
                  <td>
                    <span style={{ color: 'var(--danger)', fontWeight: 600 }}>{formatCurrency(def.amountDue)}</span>
                  </td>
                  <td>{def.parentPhone}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-sm btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <MessageSquare size={14} /> SMS Relance
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
