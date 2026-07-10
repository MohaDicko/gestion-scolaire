'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle, Loader2, ArrowRight, XCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function ImportStudentsPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: string[]; total: number } | null>(null);

  const expectedHeaders = ['Matricule', 'Prénom', 'Nom', 'Genre', 'DateNaissance', 'CNI', 'Parent', 'Telephone', 'Relation'];

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{
      Matricule: 'STU-2025-001',
      Prénom: 'Mamadou',
      Nom: 'Diaby',
      Genre: 'M',
      DateNaissance: '2010-05-15',
      CNI: 'N/A',
      Parent: 'Ousmane Diaby',
      Telephone: '70000000',
      Relation: 'PÈRE'
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Élèves");
    XLSX.writeFile(wb, "Modele_Importation_Eleves.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) processFile(selectedFile);
  };

  const processFile = (selectedFile: File) => {
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        setPreviewData(jsonData);
      } catch (err) {
        console.error("Erreur de lecture Excel", err);
        alert("Impossible de lire le fichier. Veuillez utiliser un fichier Excel valide (.xlsx ou .xls)");
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const startImport = async () => {
    if (previewData.length === 0) return;
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/students/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          students: previewData,
          createAccounts: false // Optionnel : à true si on veut créer les accès
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(data.report);
      } else {
        alert(data.error || "Une erreur s'est produite lors de l'importation");
      }
    } catch (err) {
      alert("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout
      title="Importation en Masse"
      subtitle="Ajoutez des centaines d'élèves en un seul clic via un fichier Excel ou CSV."
      breadcrumbs={[
        { label: 'Scolarité', href: '/students' },
        { label: 'Liste des élèves', href: '/students' },
        { label: 'Importation', href: '' }
      ]}
      actions={
        <Button variant="outline" onClick={downloadTemplate}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Télécharger le Modèle Excel
        </Button>
      }
    >
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        
        {/* Résultats d'importation */}
        {result && (
          <Card className="border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10 shadow-lg">
            <CardHeader>
              <CardTitle className="text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6" />
                Importation Terminée
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 text-sm px-3 py-1">
                  {result.success} Succès
                </Badge>
                {result.errors.length > 0 && (
                  <Badge variant="destructive" className="text-sm px-3 py-1">
                    {result.errors.length} Échecs
                  </Badge>
                )}
              </div>
              
              {result.errors.length > 0 && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800">
                  <h4 className="font-semibold text-red-800 dark:text-red-400 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Détails des erreurs ({result.errors.length})
                  </h4>
                  <ul className="text-sm text-red-600 dark:text-red-300 space-y-1 max-h-40 overflow-y-auto list-disc pl-4">
                    {result.errors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={() => router.push('/students')} className="w-full">
                Voir la liste des élèves <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Zone d'Upload */}
        {!result && previewData.length === 0 && (
          <Card className="border-dashed border-2">
            <CardContent className="p-12">
              <div 
                className={`flex flex-col items-center justify-center text-center p-8 rounded-2xl transition-colors ${
                  isDragging ? 'bg-primary/5 border-primary/50 border-2' : 'hover:bg-slate-50 dark:hover:bg-slate-900/50'
                }`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
              >
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-4">
                  <UploadCloud className="w-12 h-12 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Glissez-déposez votre fichier ici</h3>
                <p className="text-slate-500 mb-6 max-w-md">
                  Formats supportés : .xlsx, .xls, .csv. Assurez-vous que les colonnes correspondent au modèle fourni.
                </p>
                <div className="relative">
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button size="lg" className="pointer-events-none">
                    Parcourir les fichiers
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Prévisualisation */}
        {!result && previewData.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Prévisualisation des données</CardTitle>
                <CardDescription>{previewData.length} élèves détectés dans le fichier.</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => { setFile(null); setPreviewData([]); }}>
                <XCircle className="w-5 h-5 text-red-500" />
              </Button>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <div className="rounded-xl border max-h-[400px] overflow-y-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-800 sticky top-0 shadow-sm z-10">
                    <tr>
                      <th className="px-4 py-3">N°</th>
                      {expectedHeaders.map(h => (
                        <th key={h} className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {previewData.slice(0, 50).map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 text-slate-400 font-mono">{i + 1}</td>
                        <td className="px-4 py-3 font-mono text-xs">{row.Matricule || row.studentNumber || '-'}</td>
                        <td className="px-4 py-3 font-medium">{row['Prénom'] || row.Prenom || row.firstName || '-'}</td>
                        <td className="px-4 py-3 font-medium">{row.Nom || row.lastName || '-'}</td>
                        <td className="px-4 py-3">{row.Genre || row.gender || '-'}</td>
                        <td className="px-4 py-3 text-slate-500">{row.DateNaissance || row.dateOfBirth || '-'}</td>
                        <td className="px-4 py-3 text-slate-500">{row.CNI || row.nationalId || '-'}</td>
                        <td className="px-4 py-3 text-slate-500">{row.Parent || row.parentName || '-'}</td>
                        <td className="px-4 py-3 font-mono text-xs">{row.Telephone || row.parentPhone || '-'}</td>
                        <td className="px-4 py-3 text-slate-500">{row.Relation || row.parentRelationship || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {previewData.length > 50 && (
                <div className="text-center p-3 text-xs text-slate-500 bg-slate-50 dark:bg-slate-900 rounded-b-xl">
                  Seuls les 50 premiers élèves sont affichés pour la prévisualisation.
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50 p-4 border-t">
              <Button variant="outline" onClick={() => { setFile(null); setPreviewData([]); }} disabled={loading}>
                Annuler
              </Button>
              <Button onClick={startImport} disabled={loading} className="bg-primary hover:bg-primary/90 text-white min-w-[150px]">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UploadCloud className="w-4 h-4 mr-2" />}
                Lancer l'importation ({previewData.length})
              </Button>
            </CardFooter>
          </Card>
        )}

      </div>
    </AppLayout>
  );
}
