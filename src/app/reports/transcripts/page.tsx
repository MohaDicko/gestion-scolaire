'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { FileText, Download, Search, Loader2, Award, ChevronsRight } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useToast } from '@/components/Toast';

export default function TranscriptsPage() {
    const [students, setStudents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const toast = useToast();

    // Récupérer la liste des élèves
    useEffect(() => {
        setIsLoading(true);
        fetch(`/api/students?search=${searchTerm}`)
            .then(res => res.json())
            .then(data => {
                if (data.items) setStudents(data.items);
                setIsLoading(false);
            })
            .catch(() => {
                toast.error("Erreur de chargement des élèves");
                setIsLoading(false);
            });
    }, [searchTerm, toast]);

    const handleGenerateTranscript = async (studentId: string) => {
        setIsGenerating(true);
        setSelectedStudentId(studentId);
        
        try {
            // MOCK DATA FETCH (A remplacer par un vrai endpoint API /api/reports/transcripts?studentId=...)
            // Normalement, ça devrait inclure toutes les notes classées par matière pour l'année
            const res = await fetch(`/api/students`); // Dummy call
            const student = students.find(s => s.id === studentId);
            
            if (!student) throw new Error("Élève introuvable");

            // --- GÉNÉRATION DU PDF (RELEVÉ DE NOTES OFFICIEL) ---
            const doc = new jsPDF();
            
            // Formatage de la date en français
            const today = new Date().toLocaleDateString('fr-FR', {
                year: 'numeric', month: 'long', day: 'numeric'
            });

            // 1. En-tête Institutionnel
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.setTextColor(30, 45, 74);
            doc.text('RÉPUBLIQUE DU MALI', 105, 20, { align: 'center' });
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('Un Peuple - Un But - Une Foi', 105, 26, { align: 'center' });
            
            doc.setDrawColor(30, 45, 74);
            doc.setLineWidth(0.5);
            doc.line(80, 29, 130, 29);

            // 2. Info de l'Établissement (Haut Gauche)
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('SCHOOL ERP PRO', 14, 40);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text('Ministère de l\'Éducation Nationale', 14, 45);
            doc.text('Année Académique: 2024 - 2025', 14, 50);

            // 3. Titre du Document
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(79, 142, 247); // Primary color
            const title = 'RELEVÉ DE NOTES OFFICIEL';
            doc.text(title, 105, 70, { align: 'center' });
            
            doc.setDrawColor(79, 142, 247);
            doc.line(60, 72, 150, 72);

            // 4. Identité de l'apprenant
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(11);
            
            doc.setFillColor(245, 248, 255);
            doc.rect(14, 80, 182, 35, 'F');
            
            doc.text('Identification de l\'étudiant(e)', 18, 87);
            doc.setLineWidth(0.2);
            doc.line(18, 89, 65, 89);
            
            doc.setFont('helvetica', 'bold');
            doc.text(`Nom : ${student.lastName}`, 20, 97);
            doc.text(`Prénom(s) : ${student.firstName}`, 20, 104);
            
            // Colonne 2 du bloc Info
            doc.setFont('helvetica', 'normal');
            doc.text(`Matricule :`, 120, 97);
            doc.setFont('helvetica', 'bold');
            doc.text(`${student.studentNumber || 'Non attribué'}`, 150, 97);

            doc.setFont('helvetica', 'normal');
            doc.text(`Série/Filière :`, 120, 104);
            doc.setFont('helvetica', 'bold');
            doc.text(`Sciences Exactes (Ex)`, 150, 104); 
            
            doc.setFont('helvetica', 'normal');
            doc.text(`Statut :`, 120, 111);
            doc.setFont('helvetica', 'bold');
            doc.text(`Régulier`, 150, 111);

            // 5. Tableau des Notes (Transcripts Data)
            // Dans un vrai système, ces données viendront des Grade / Subject de la DB
            const tableData = [
                ['Mathématiques', '14.50', '15.00', '13.50', '4', '14.33'],
                ['Physique-Chimie', '12.00', '11.50', '13.00', '4', '12.16'],
                ['Biologie (SVT)', '16.00', '14.50', '15.50', '3', '15.33'],
                ['Français', '10.50', '12.00', '11.00', '2', '11.16'],
                ['Philosophie', '09.50', '10.00', '11.50', '2', '10.33'],
                ['Histoire-Géo', '13.00', '14.00', '12.50', '2', '13.16'],
                ['Anglais', '15.00', '16.50', '14.00', '2', '15.16'],
                ['Éducation Physique', '18.00', '17.50', '18.00', '1', '17.83'],
            ];

            autoTable(doc, {
                startY: 125,
                head: [['Matières', 'Note T1 (/20)', 'Note T2 (/20)', 'Note T3 (/20)', 'Coef.', 'Moy. Annuelle']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [79, 142, 247], textColor: 255, fontStyle: 'bold', halign: 'center' },
                columnStyles: {
                    0: { fontStyle: 'bold', halign: 'left' },
                    1: { halign: 'center' },
                    2: { halign: 'center' },
                    3: { halign: 'center' },
                    4: { halign: 'center', fontStyle: 'bold' },
                    5: { halign: 'center', fontStyle: 'bold', textColor: [0, 100, 0] }
                },
                alternateRowStyles: { fillColor: [248, 250, 255] }
            });

            const finalY = (doc as any).lastAutoTable.finalY + 10;

            // 6. Tableau Récapitulatif
            autoTable(doc, {
                startY: finalY,
                body: [
                    ['Total des Coefficients', '20'],
                    ['Moyenne Générale Annuelle', '13.68 / 20'],
                    ['Mention', 'Assez Bien']
                ],
                theme: 'plain',
                styles: { fontSize: 11, fontStyle: 'bold' },
                columnStyles: {
                    0: { halign: 'right', cellWidth: 100 },
                    1: { halign: 'left', textColor: [79, 142, 247] }
                }
            });

            // 7. Pied de page & Signatures
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
            
            doc.text('Décision du conseil des professeurs :', 14, finalY + 40);
            doc.setFont('helvetica', 'bold');
            doc.text('Admis(e) en classe supérieure.', 75, finalY + 40);

            doc.setFont('helvetica', 'normal');
            doc.text(`Fait à Bamako, le ${today}`, 130, finalY + 60);
            
            doc.setFontStyle('bold');
            doc.text('Le Directeur des Études', 140, finalY + 68);

            // Watermark (Official feel)
            doc.setTextColor(200, 200, 200);
            doc.setFontSize(50);
            doc.text('COPIE ORIGINALE', 105, 180, { angle: 45, align: 'center', opacity: 0.1 });

            // Sauvegarde
            doc.save(`Releve_Notes_${student.studentNumber || student.lastName}.pdf`);
            toast.success("Relevé de notes généré avec succès !");

        } catch (error) {
            toast.error("Erreur durant la génération du relevé.");
            console.error(error);
        } finally {
            setIsGenerating(false);
            setSelectedStudentId(null);
        }
    };

    return (
        <AppLayout
            title="Relevés de Notes (Transcripts)"
            subtitle="Génération des fiches officielles de parcours complet pour dossiers académiques"
            breadcrumbs={[{ label: 'Évaluation', href: '/grades' }, { label: 'Relevés de Notes' }]}
        >
            {/* Search & Stats Bar */}
            <div className="card shadow-md" style={{ padding: '20px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
                <div className="search-box" style={{ maxWidth: '350px', flex: 1 }}>
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Rechercher un élève / un étudiant..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div style={{ display: 'flex', gap: '20px', marginLeft: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--bg-fluid)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <Award size={18} className="text-purple" />
                        <div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Format Saisonal</div>
                            <div style={{ fontSize: '13px', fontWeight: 700 }}>Norme DREN/DEF</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Students List for Transcript Generation */}
            <div className="card" style={{ padding: 0 }}>
                <div className="card-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', marginBottom: 0 }}>
                    <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FileText size={18} className="text-primary" /> Impression des Relevés
                    </h3>
                </div>

                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Matricule</th>
                                <th>Nom de Famille</th>
                                <th>Prénom(s)</th>
                                <th>Genre</th>
                                <th>Statut</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                                        <Loader2 size={24} className="spin text-primary" style={{ margin: '0 auto 10px' }} />
                                        Chargement des dossiers académiques...
                                    </td>
                                </tr>
                            ) : students.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                        Aucun dossier trouvé pour cette recherche.
                                    </td>
                                </tr>
                            ) : (
                                students.map(student => (
                                    <tr key={student.id}>
                                        <td style={{ fontWeight: 600 }}>{student.studentNumber || '---'}</td>
                                        <td style={{ fontWeight: 700, color: 'var(--text)' }}>{student.lastName.toUpperCase()}</td>
                                        <td>{student.firstName}</td>
                                        <td>
                                            <span className={`badge ${student.gender === 'MALE' ? 'badge-info' : 'badge-purple'}`}>
                                                {student.gender === 'MALE' ? 'M' : 'F'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="badge badge-success">Actif</span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button 
                                                className="btn-primary" 
                                                style={{ padding: '6px 12px', fontSize: '12px' }}
                                                onClick={() => handleGenerateTranscript(student.id)}
                                                disabled={isGenerating && selectedStudentId !== student.id}
                                            >
                                                {isGenerating && selectedStudentId === student.id ? (
                                                    <><Loader2 size={14} className="spin" /> Extraction...</>
                                                ) : (
                                                    <><Download size={14} /> Relevé PDF</>
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
