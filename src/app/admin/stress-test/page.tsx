'use client';

import React, { useState } from 'react';
import { Zap, Play, Loader2, CheckCircle2, XCircle, BarChart, AlertTriangle } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function StressTestPage() {
  const [targetCount, setTargetCount] = useState(10); // Start small for safety
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [avgLatency, setAvgLatency] = useState(0);

  const startStressTest = async () => {
    setIsRunning(true);
    setProgress(0);
    setSuccessCount(0);
    setErrorCount(0);
    setLogs(['🚀 Initialisation du test de charge (Simulation 1000 Inscriptions)...']);
    
    // Get a valid campusId first
    let campusId = "";
    try {
      const cRes = await fetch('/api/campuses');
      const campuses = await cRes.json();
      if (campuses.length > 0) campusId = campuses[0].id;
    } catch {
       setLogs(prev => [...prev.slice(-10), "❌ Erreur: Impossible de trouver un campus de test"]);
       setIsRunning(false);
       return;
    }

    const startTime = Date.now();
    let totalLatency = 0;

    for (let i = 0; i < targetCount; i++) {
      const pStart = Date.now();
      try {
        const res = await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: `TestBot`,
            lastName: `${i+1}`,
            dateOfBirth: '2010-01-01',
            gender: 'MALE',
            nationalId: `STRESS-${Date.now()}-${i}`,
            parentName: 'Stress Test Tool',
            parentPhone: '+223 00000000',
            parentRelationship: 'OTHER',
            campusId: campusId
          })
        });

        const latency = Date.now() - pStart;
        totalLatency += latency;

        if (res.ok) {
          setSuccessCount(prev => prev + 1);
        } else {
          setErrorCount(prev => prev + 1);
          setLogs(prev => [...prev.slice(-10), `⚠️ Erreur sur requête #${i+1}: ${res.status}`]);
        }
      } catch {
        setErrorCount(prev => prev + 1);
      }
      
      setProgress(Math.round(((i + 1) / targetCount) * 100));
      setAvgLatency(Math.round(totalLatency / (i + 1)));
    }

    const duration = (Date.now() - startTime) / 1000;
    setLogs(prev => [...prev.slice(-10), `✅ Test terminé en ${duration.toFixed(2)}s | Moyenne: ${Math.round(totalLatency / targetCount)}ms`]);
    setIsRunning(false);
  };

  return (
    <AppLayout
      title="Laboratoire de Test de Charge"
      subtitle="Simulateur de trafic intensif pour validation de production"
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Stress Test' }]}
    >
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        <div className="xl:col-span-1 space-y-6">
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Settings size={16} /> PARAMÈTRES
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Volume de requêtes (POST)</label>
                <div className="flex gap-2">
                  {[10, 50, 200, 1000].map(val => (
                    <button
                      key={val}
                      onClick={() => setTargetCount(val)}
                      className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
                        targetCount === val ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3 text-amber-600">
                <AlertTriangle size={32} className="shrink-0" />
                <p className="text-[10px] leading-relaxed font-bold">
                  ATTENTION: Ce test va insérer des données réelles en base de données.
                  Réservé à l'environnement de staging ou aux phases de rodage initial.
                </p>
              </div>
              <Button 
                variant={isRunning ? 'secondary' : 'default'} 
                className="w-full bg-primary text-white" 
                onClick={startStressTest}
                disabled={isRunning}
              >
                {isRunning ? <Loader2 className="animate-spin mr-2" /> : <Play className="mr-2" />}
                {isRunning ? 'Exécution en cours...' : 'Lancer le Stress Test'}
              </Button>
            </CardContent>
          </Card>
          
          <Card variant="glass">
            <CardHeader><CardTitle className="text-sm">CONSOLE LOGS</CardTitle></CardHeader>
            <CardContent>
              <div className="bg-black/80 rounded-xl p-4 font-mono text-[10px] text-emerald-400 h-48 overflow-y-auto space-y-1">
                {logs.map((log, i) => (
                  <div key={i}>{log}</div>
                ))}
                {isRunning && <div className="animate-pulse">_</div>}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card variant="glass" className="border-t-4 border-blue-500">
              <div className="text-[10px] font-black text-slate-500 uppercase">Progression</div>
              <div className="text-3xl font-black mt-2">{progress}%</div>
              <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </Card>
            <Card variant="glass" className="border-t-4 border-emerald-500">
              <div className="text-[10px] font-black text-slate-500 uppercase">Succès / Erreurs</div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-emerald-500">{successCount}</span>
                <span className="text-sm font-bold text-slate-400">/ {errorCount}</span>
              </div>
            </Card>
            <Card variant="glass" className="border-t-4 border-amber-500">
              <div className="text-[10px] font-black text-slate-500 uppercase">Latence Moyenne</div>
              <div className="text-3xl font-black mt-2">{avgLatency}ms</div>
              <div className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-tight">API Response Time</div>
            </Card>
          </div>

          <Card variant="glass" className="h-[340px]">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-sm">SANTÉ DE L'INFRASTRUCTURE</CardTitle>
              <div className="px-2 py-1 bg-blue-500/10 text-blue-500 text-[10px] font-black rounded-lg uppercase">Temps Réel</div>
            </CardHeader>
            <CardContent className="h-full flex flex-col items-center justify-center opacity-30">
               <BarChart size={64} className="mb-4" />
               <p className="text-xs font-black uppercase tracking-widest">Analyseur de charge actif</p>
            </CardContent>
          </Card>
        </div>

      </div>
    </AppLayout>
  );
}

// Sub-components used
const Settings = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2a2 2 0 0 1-2 2a2 2 0 0 1-2-2a2 2 0 0 0-2-2h-.44a2 2 0 0 0-2 2a2 2 0 0 0 2 2a2 2 0 0 1 2 2a2 2 0 0 1-2 2a2 2 0 0 0-2 2a2 2 0 0 0 2 2a2 2 0 0 1 2 2a2 2 0 0 1-2 2a2 2 0 0 0 2 2a2 2 0 0 0 2-2a2 2 0 0 1 2-2h.44a2 2 0 0 1 2 2a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2a2 2 0 0 1-2-2a2 2 0 0 1 2-2a2 2 0 0 0 2-2a2 2 0 0 0-2-2a2 2 0 0 1-2-2a2 2 0 0 1 2-2a2 2 0 0 0 2-2a2 2 0 0 0-2-2h-.44z"/><circle cx="12" cy="12" r="3"/></svg>;
