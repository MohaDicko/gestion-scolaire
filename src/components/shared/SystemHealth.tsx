'use client';

import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, Database, HardDrive, Zap, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function SystemHealth() {
  const [status, setStatus] = useState<any>({
    api: 'pending',
    db: 'pending',
    auth: 'pending',
    latency: 0
  });
  const [isChecking, setIsChecking] = useState(false);

  const runDiagnostics = async () => {
    setIsChecking(true);
    const start = Date.now();
    
    try {
      // 1. Test API & DB via stats endpoint
      const res = await fetch('/api/dashboard/stats');
      const latency = Date.now() - start;
      
      if (res.ok) {
        setStatus({
          api: 'online',
          db: 'online',
          auth: 'online',
          latency
        });
      } else if (res.status === 401) {
        setStatus({ api: 'online', db: 'unknown', auth: 'expired', latency });
      } else {
        setStatus({ api: 'error', db: 'error', auth: 'unknown', latency });
      }
    } catch {
      setStatus({ api: 'offline', db: 'offline', auth: 'offline', latency: 0 });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => { runDiagnostics(); }, []);

  const StatusItem = ({ icon: Icon, label, state, detail }: any) => {
    const isOk = state === 'online' || state === 'active';
    const isPending = state === 'pending';
    
    return (
      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isOk ? 'bg-emerald-500/10 text-emerald-500' : isPending ? 'bg-slate-200 text-slate-400' : 'bg-red-500/10 text-red-500'}`}>
            <Icon size={18} />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{label}</div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{detail || (isOk ? 'Opérationnel' : 'Erreur')}</div>
          </div>
        </div>
        {isPending ? <Loader2 size={14} className="animate-spin text-slate-300" /> : 
         isOk ? <CheckCircle size={14} className="text-emerald-500" /> : <XCircle size={14} className="text-red-500" />}
      </div>
    );
  };

  return (
    <Card variant="glass">
      <CardHeader className="p-0 pb-4 flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <Zap size={18} className="text-amber-500" />
          <CardTitle className="text-sm uppercase tracking-tight">Diagnostic Système</CardTitle>
        </div>
        <Button variant="ghost" size="sm" onClick={runDiagnostics} className="h-7 text-[10px]">
          {isChecking ? 'Analyse...' : 'Relancer'}
        </Button>
      </CardHeader>
      
      <div className="grid gap-3">
        <StatusItem icon={Activity} label="Connectivité API" state={status.api} />
        <StatusItem icon={Database} label="Base de Données" state={status.db} detail={status.latency > 0 ? `${status.latency}ms` : null} />
        <StatusItem icon={ShieldCheck} label="Session Auth" state={status.auth} detail={status.auth === 'online' ? 'Active (JWT)' : 'Expirée'} />
        
        <div className="mt-2 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Production Environment</span>
          </div>
          <span className="text-[9px] font-black text-slate-500">V2.4.0-PRO</span>
        </div>
      </div>
    </Card>
  );
}
