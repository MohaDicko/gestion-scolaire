'use client';

import React from 'react';
import { Clock, MapPin, Phone, Mail } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface StudentSidebarProps {
  student: any;
  currentEnrollment: any;
}

export function StudentSidebar({ student, currentEnrollment }: StudentSidebarProps) {
  return (
    <div className="flex flex-col gap-6 w-full lg:w-80 shrink-0">
      <Card variant="glass" className="text-center py-10 px-6">
        <div className="w-24 h-24 rounded-full bg-blue-500/10 text-blue-600 border-4 border-white dark:border-slate-800 shadow-xl flex items-center justify-center text-3xl font-black mx-auto mb-6">
          {student.firstName[0]}{student.lastName[0]}
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
          {student.firstName} {student.lastName}
        </h2>
        <div className="mt-3 px-3 py-1 bg-blue-500/10 text-blue-600 text-[10px] font-black rounded-lg uppercase tracking-widest inline-block">
          {currentEnrollment?.classroom?.name || 'Candidat Libre'}
        </div>
        
        <div className="mt-8 pt-8 border-t border-slate-100 dark:border-white/5 space-y-4 text-left">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400">
              <Clock size={14} />
            </div>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              Né le {new Date(student.dateOfBirth).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400">
              <MapPin size={14} />
            </div>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              {student.campus?.name}
            </span>
          </div>
        </div>
      </Card>

      <Card variant="glass" className="space-y-6">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Contact Parent</h3>
        <div className="space-y-5">
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mb-1">
              Tuteur ({student.parentRelationship})
            </div>
            <div className="text-sm font-black text-slate-900 dark:text-white">{student.parentName}</div>
          </div>
          
          <a 
            href={`tel:${student.parentPhone}`}
            className="flex items-center gap-3 group"
          >
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
              <Phone size={14} />
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-emerald-500 transition-colors">
              {student.parentPhone}
            </span>
          </a>

          {student.parentEmail && (
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                <Mail size={14} />
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                {student.parentEmail}
              </span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
