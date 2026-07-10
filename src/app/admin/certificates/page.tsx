'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { CertificateTemplate, CertificateData } from '@/components/students/CertificateTemplate';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Printer, GraduationCap, Loader2, FileText } from 'lucide-react';
import { useToast } from '@/components/Toast';

interface Classroom {
  id: string;
  name: string;
  level: string;
}

export default function CertificatesPage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>('');
  const [students, setStudents] = useState<CertificateData[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<CertificateData | null>(null);
  
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        const res = await fetch('/api/admin/id-cards'); // On réutilise l'API des ID Cards
        if (res.ok) {
          const data = await res.json();
          setClassrooms(data.classrooms || []);
        } else {
          toast.error('Erreur lors du chargement des classes');
        }
      } catch (err) {
        toast.error('Erreur réseau');
      } finally {
        setIsLoadingClasses(false);
      }
    };
    fetchClassrooms();
  }, [toast]);

  const fetchStudentsForClassroom = async (classroomId: string) => {
    if (!classroomId) {
      setStudents([]);
      setSelectedStudent(null);
      return;
    }
    
    setIsLoadingStudents(true);
    setSelectedStudent(null);
    try {
      const res = await fetch(`/api/admin/id-cards?classroomId=${classroomId}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
        if (data.students?.length > 0) {
          setSelectedStudent(data.students[0]); // Auto-select first student
        } else {
          toast.error('Aucun élève trouvé dans cette classe');
        }
      }
    } catch (err) {
      toast.error('Erreur réseau');
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const handleClassroomChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cid = e.target.value;
    setSelectedClassroomId(cid);
    fetchStudentsForClassroom(cid);
  };

  const handlePrint = () => {
    if (!selectedStudent) {
      toast.error('Aucun étudiant sélectionné');
      return;
    }
    window.print();
  };

  return (
    <>
      <div className="print:hidden">
        <AppLayout
          title="Certificats de Scolarité"
          subtitle="Génération d'attestations d'inscription au format A4"
          breadcrumbs={[{ label: 'Administration' }, { label: 'Certificats' }]}
        >
          <div className="flex flex-col md:flex-row gap-6">
            
            {/* Sidebar : Sélection et Liste */}
            <div className="w-full md:w-1/3 flex flex-col gap-4">
              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="text-sm">1. Choisir une classe</CardTitle>
                </CardHeader>
                <CardContent>
                  <select
                    value={selectedClassroomId}
                    onChange={handleClassroomChange}
                    disabled={isLoadingClasses}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Sélectionner --</option>
                    {classrooms.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.level})</option>
                    ))}
                  </select>
                </CardContent>
              </Card>

              {isLoadingStudents ? (
                <div className="flex justify-center p-8 text-blue-500">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : students.length > 0 ? (
                <Card variant="glass" className="flex-1">
                  <CardHeader>
                    <CardTitle className="text-sm">2. Choisir un élève</CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-[500px] overflow-y-auto pr-2">
                    <div className="flex flex-col gap-2">
                      {students.map(s => (
                        <button
                          key={s.id}
                          onClick={() => setSelectedStudent(s)}
                          className={`flex flex-col text-left px-4 py-3 rounded-xl border transition-all ${
                            selectedStudent?.id === s.id 
                              ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/20 dark:border-blue-500' 
                              : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700 hover:border-blue-300'
                          }`}
                        >
                          <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                            {s.lastName.toUpperCase()} {s.firstName}
                          </span>
                          <span className="text-xs text-slate-500 font-mono mt-1">
                            {s.studentNumber}
                          </span>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </div>

            {/* Main Content : Aperçu et Impression */}
            <div className="w-full md:w-2/3 flex flex-col gap-4">
              <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <span className="font-semibold">Aperçu du document</span>
                </div>
                <Button 
                  onClick={handlePrint} 
                  disabled={!selectedStudent}
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-lg"
                >
                  <Printer size={16} />
                  Imprimer le Certificat
                </Button>
              </div>

              <div className="bg-slate-100 dark:bg-slate-900/50 p-8 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-center overflow-auto min-h-[600px]">
                {selectedStudent ? (
                  <div className="scale-[0.6] sm:scale-75 md:scale-90 lg:scale-100 transform origin-top transition-transform">
                    <CertificateTemplate student={selectedStudent} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 opacity-50">
                    <GraduationCap size={64} className="mb-4" />
                    <p className="font-medium">Sélectionnez un élève pour générer son certificat.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </AppLayout>
      </div>

      {/* 
        Print-only section 
      */}
      <div className="hidden print:block print:w-full print:h-full print:bg-white">
        {selectedStudent && <CertificateTemplate student={selectedStudent} />}
      </div>
    </>
  );
}
