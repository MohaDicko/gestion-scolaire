import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useDashboardPerformance } from '../hooks/useDashboardPerformance';

export function FinancialChart() {
    const { data: performance, isLoading } = useDashboardPerformance();

    if (isLoading) {
        return (
            <div className="card" style={{ height: '350px', display: 'grid', placeItems: 'center' }}>
                <p className="text-muted">Chargement de l'analyse financière...</p>
            </div>
        );
    }

    return (
        <div className="card" style={{ height: '350px' }}>
            <div className="card-header">
                <h2 className="card-title">Performance Financière (6 derniers mois)</h2>
            </div>
            <div style={{ width: '100%', height: '260px', marginTop: '10px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performance}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2d3150" vertical={false} />
                        <XAxis 
                            dataKey="month" 
                            stroke="#8b90b8" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false} 
                        />
                        <YAxis 
                            stroke="#8b90b8" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false}
                            tickFormatter={(value) => `${(value / 1000).toLocaleString()}k`}
                        />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: '#1a1d27', 
                                border: '1px solid #2d3150',
                                borderRadius: '8px',
                                color: '#e8eaf6'
                            }}
                            itemStyle={{ fontSize: '12px' }}
                        />
                        <Legend iconType="circle" />
                        <Area 
                            type="monotone" 
                            dataKey="revenue" 
                            name="Recettes" 
                            stroke="#6366f1" 
                            fillOpacity={1} 
                            fill="url(#colorRevenue)" 
                            strokeWidth={3}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="expenses" 
                            name="Dépenses" 
                            stroke="#ef4444" 
                            fillOpacity={1} 
                            fill="url(#colorExpenses)" 
                            strokeWidth={3}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
