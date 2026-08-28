'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { IDCardTemplate, StudentCardData } from '@/components/students/IDCardTemplate';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Printer, Users, Loader2, Download, FileArchive } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { generateSVGCard } from '@/lib/cardGenerator';
import QRCode from 'qrcode';
import JSZip from 'jszip';

interface Classroom {
  id: string;
  name: string;
  level: string;
}

export default function IDCardsPage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>('');
  const [students, setStudents] = useState<StudentCardData[]>([]);
  
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const toast = useToast();

  useEffect(() => {
    // Fetch available classrooms on mount
    const fetchClassrooms = async () => {
      try {
        const res = await fetch('/api/admin/id-cards');
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
      return;
    }
    
    setIsLoadingStudents(true);
    try {
      const res = await fetch(`/api/admin/id-cards?classroomId=${classroomId}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
        if (data.students?.length === 0) {
          toast.error('Aucun élève trouvé dans cette classe');
        }
      } else {
        toast.error('Erreur lors du chargement des élèves');
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
    if (students.length === 0) {
      toast.error('Aucune carte à imprimer');
      return;
    }
    window.print();
  };

  const generateStudentSVG = async (student: StudentCardData) => {
    const qrPayload = JSON.stringify({
      id: student.studentNumber,
      name: `${student.firstName} ${student.lastName}`,
      valid: student.academicYear
    });
    const qrDataUrl = await QRCode.toDataURL(qrPayload, { width: 150, margin: 1 });
    
    const cardData = {
      id: student.id,
      studentNumber: student.studentNumber,
      firstName: student.firstName,
      lastName: student.lastName,
      dateOfBirth: student.dateOfBirth,
      gender: '',
      classroom: student.classroom ? { name: student.classroom } : undefined,
    };
    
    return generateSVGCard(cardData, qrDataUrl);
  };

  const handleDownloadSingleSVG = async (student: StudentCardData) => {
    try {
      const svgContent = await generateStudentSVG(student);
      const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `carte_${student.studentNumber}_${student.lastName}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Carte SVG de ${student.firstName} ${student.lastName} téléchargée !`);
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors du téléchargement SVG');
    }
  };

  const handleDownloadAllSVG = async () => {
    if (students.length === 0) {
      toast.error('Aucun élève sélectionné');
      return;
    }
    
    setIsExportingZip(true);
    try {
      const zip = new JSZip();
      const currentClass = classrooms.find(c => c.id === selectedClassroomId);
      const className = currentClass ? currentClass.name.replace(/[^a-zA-Z0-9_-]/g, '_') : 'classe';
      
      for (const student of students) {
        const svgContent = await generateStudentSVG(student);
        const fileName = `carte_${student.studentNumber}_${student.lastName.toUpperCase()}_${student.firstName}.svg`;
        zip.file(fileName, svgContent);
      }
      
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cartes_scolaires_${className}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`Archive ZIP avec ${students.length} cartes SVG téléchargée !`);
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la création du fichier ZIP');
    } finally {
      setIsExportingZip(false);
    }
  };

  return (
    <>
      {/* 
        This layout is hidden during printing via 'print:hidden' classes 
      */}
      <div className="print:hidden">
        <AppLayout
          title="Cartes Scolaires"
          subtitle="Génération et impression des badges d'étudiants"
          breadcrumbs={[{ label: 'Administration' }, { label: 'Cartes Scolaires' }]}
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-bold text-slate-500 mb-1">Sélectionner une classe</label>
                <select
                  value={selectedClassroomId}
                  onChange={handleClassroomChange}
                  disabled={isLoadingClasses}
                  className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-800 dark:text-slate-100 min-w-[250px] shadow-sm outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                >
                  <option value="">-- Choisir une classe --</option>
                  {classrooms.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.level})</option>
                  ))}
                </select>
              </div>
              
              {isLoadingStudents && (
                <div className="flex items-center text-blue-500 mt-5">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  <span className="text-sm font-medium">Chargement des élèves...</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3 mt-5">
              <div className="text-right mr-2 hidden md:block">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight">Lot d'impression</h2>
                <p className="text-sm text-slate-500">{students.length} élève(s) chargé(s)</p>
              </div>
              
              <Button 
                onClick={handleDownloadAllSVG} 
                disabled={students.length === 0 || isLoadingStudents || isExportingZip}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-lg"
              >
                {isExportingZip ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Création ZIP...
                  </>
                ) : (
                  <>
                    <FileArchive size={18} />
                    Télécharger Lot SVG (ZIP)
                  </>
                )}
              </Button>

              <Button 
                onClick={handlePrint} 
                disabled={students.length === 0 || isLoadingStudents || isExportingZip}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-lg"
              >
                <Printer size={18} />
                Imprimer les Cartes
              </Button>
            </div>
          </div>

          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="text-blue-500" />
                Aperçu des cartes (Recto / Verso)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {students.length === 0 && !isLoadingStudents ? (
                <div className="text-center py-20 text-slate-500">
                  <p>Sélectionnez une classe pour afficher les cartes des élèves.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 bg-slate-100 dark:bg-slate-900/50 p-8 rounded-xl overflow-auto border border-slate-200 dark:border-slate-800">
                  {students.map(student => (
                    <div key={student.id} className="flex flex-col items-center gap-3 bg-white dark:bg-slate-800/80 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 hover:shadow-md transition-shadow">
                      <IDCardTemplate student={student} />
                      <div className="w-full pt-2 border-t border-slate-100 dark:border-slate-700/50 flex justify-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadSingleSVG(student)}
                          className="w-full text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700/50 gap-1.5 shadow-sm"
                        >
                          <Download size={14} />
                          Télécharger cette carte (SVG)
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </AppLayout>
      </div>

      {/* 
        Print-only section 
        Only visible during printing
      */}
      <div className="hidden print:block print:w-full print:h-full print:bg-white">
        <div className="print:flex print:flex-wrap print:gap-4 print:justify-center">
          {students.map(student => (
            <div key={`print-${student.id}`} className="print:mb-4">
              <IDCardTemplate student={student} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
