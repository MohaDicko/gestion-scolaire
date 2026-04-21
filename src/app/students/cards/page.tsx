'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, Download, Search, Users, AlertCircle, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import JsBarcode from 'jsbarcode';
import AppLayout from '@/components/AppLayout';

export default function StudentCardsPage() {
    const [students, setStudents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        fetch(`/api/students?search=${searchTerm}&pageSize=50`)
            .then(res => res.json())
            .then(data => {
                if (data.items) setStudents(data.items);
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    }, [searchTerm]);

    const generatePDF = async () => {
        setIsGenerating(true);
        try {
            // Création du document au format carte de crédit/ID standard (CR80) sur feuille A4
            const doc = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: 'a4'
            });

            const cardWidth = 85.6;
            const cardHeight = 54;
            const marginX = 15;
            const marginY = 15;
            const gap = 10;
            
            let x = marginX;
            let y = marginY;

            students.forEach((student, index) => {
                if (index > 0 && index % 10 === 0) {
                    doc.addPage();
                    x = marginX;
                    y = marginY;
                }

                // --- Background de la carte ---
                doc.setDrawColor(200, 200, 200);
                doc.setLineWidth(0.2);
                doc.setFillColor(255, 255, 255);
                doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'FD'); // Remplit avec contour

                // --- Header de la carte ---
                doc.setFillColor(79, 142, 247); // Couleur Primaire (#4f8ef7)
                doc.roundedRect(x, y, cardWidth, 12, 3, 3, 'F');
                // Cover up lower rounded corners inside the card so it attaches flat to the rest
                doc.rect(x, y + 6, cardWidth, 6, 'F');
                
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.text('CARTE D\'IDENTITÉ SCOLAIRE', x + cardWidth / 2, y + 7.5, { align: 'center' });

                // --- Informations Élève ---
                doc.setTextColor(30, 45, 74);
                doc.setFontSize(11);
                doc.text(`${student.firstName} ${student.lastName}`.toUpperCase(), x + 5, y + 20);
                
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.text(`Matricule   : ${student.studentNumber || 'N/A'}`, x + 5, y + 26);
                doc.text(`Classe        : ${student.classroom?.name || 'Non assigné'}`, x + 5, y + 31);
                doc.text(`Né(e) le      : ${new Date(student.birthDate).toLocaleDateString('fr-FR')}`, x + 5, y + 36);

                // --- Zone Photo (Placeholder) ---
                doc.setFillColor(240, 244, 255);
                doc.setDrawColor(200, 214, 245);
                doc.roundedRect(x + cardWidth - 25, y + 16, 20, 25, 1, 1, 'FD');
                doc.setTextColor(150, 150, 150);
                doc.text('PHOTO', x + cardWidth - 15, y + 30, { align: 'center' });

                // --- Code-barres ---
                // Génération du code-barres dans un canevas invisible
                const canvas = document.createElement('canvas');
                // Si pas de matricule, utiliser l'ID en fallback
                const barcodeValue = student.studentNumber || student.id.substring(0, 8);
                
                JsBarcode(canvas, barcodeValue, {
                    format: "CODE128",
                    displayValue: false, // On masque le text sous le code bar, on le dessinera nous-même
                    margin: 0,
                    width: 1.5,
                    height: 30,
                    lineColor: "#000000",
                    background: "#ffffff"
                });

                const barcodeDataUrl = canvas.toDataURL('image/png');
                
                // Positionnement du code barre (en bas, centré)
                const barcodeWidth = 40;
                const barcodeHeight = 8;
                doc.addImage(barcodeDataUrl, 'PNG', x + 5, y + 42, barcodeWidth, barcodeHeight);
                
                // Texte sous le code barre
                doc.setFontSize(6);
                doc.setTextColor(100, 100, 100);
                doc.text(barcodeValue, x + 5 + (barcodeWidth / 2), y + 52, { align: 'center' });

                // Update de l'année scolaire (bottom right)
                doc.setFontSize(7);
                doc.setTextColor(150, 150, 150);
                doc.text('Année 2024-2025', x + cardWidth - 5, y + 51, { align: 'right' });


                // Positionnement de la prochaine carte
                if ((index + 1) % 2 === 0) {
                    x = marginX; // retour à la ligne
                    y += cardHeight + gap; 
                } else {
                    x += cardWidth + gap; // carte suivante sur la même ligne
                }
            });

            doc.save('Cartes_Scolaires_Barcodes.pdf');
        } catch (error) {
            console.error('Erreur lors de la génération PDF:', error);
            alert("Erreur lors de la génération des cartes.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <AppLayout
            title="Cartes Scolaires"
            subtitle="Génération des cartes d'identité avec Code-barres (Format CR80)"
            breadcrumbs={[{ label: 'Élèves', href: '/students' }, { label: 'Cartes Scolaires' }]}
        >
            {/* Barre d'outil supérieure */}
            <div className="card shadow-sm" style={{ padding: '20px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="search-box" style={{ maxWidth: '400px' }}>
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Rechercher par nom ou matricule..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <button 
                    className="btn-primary" 
                    onClick={generatePDF} 
                    disabled={students.length === 0 || isGenerating}
                >
                    {isGenerating ? (
                        <><Loader2 size={16} className="spin" /> Génération...</>
                    ) : (
                        <><Download size={16} /> Imprimer les Cartes PDF</>
                    )}
                </button>
            </div>

            {/* Zone Principale : Preview */}
            <div className="card">
                <div className="card-header" style={{ padding: '20px', borderBottom: '1px solid var(--border)', marginBottom: 0 }}>
                    <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <CreditCard size={18} className="text-primary" /> Visualisation des Cartes 
                        <span className="badge badge-info">{students.length} Élèves</span>
                    </h3>
                </div>

                <div style={{ padding: '24px', background: 'var(--bg-2)' }}>
                    {isLoading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '60px' }}>
                            <Loader2 size={40} className="spin text-primary" />
                            <span className="text-muted">Chargement des profils...</span>
                        </div>
                    ) : students.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                            {students.map(student => (
                                <div key={student.id} style={{ 
                                    background: 'var(--bg-3)', 
                                    border: '1px solid var(--border-md)', 
                                    borderRadius: '12px', 
                                    overflow: 'hidden',
                                    boxShadow: 'var(--shadow-sm)',
                                    position: 'relative'
                                }}>
                                    {/* Header Carte (Simulation visuelle Web) */}
                                    <div style={{ background: 'var(--primary)', padding: '10px', textAlign: 'center', color: 'white', fontSize: '11px', fontWeight: 'bold' }}>
                                        CARTE SCOLAIRE ERP
                                    </div>
                                    <div style={{ padding: '16px', display: 'flex', gap: '16px' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text)', marginBottom: '8px' }}>
                                                {student.firstName} {student.lastName}
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                                <strong style={{ color: 'var(--text-soft)' }}>Matricule:</strong> {student.studentNumber || 'N/A'}
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                <strong style={{ color: 'var(--text-soft)' }}>Classe:</strong> {student.classroom?.name || 'Aucune'}
                                            </div>
                                        </div>
                                        <div style={{ width: '60px', height: '60px', borderRadius: '8px', background: 'var(--bg-4)', border: '1px dashed var(--border-md)', display: 'grid', placeItems: 'center', color: 'var(--text-dim)', fontSize: '10px' }}>
                                            PHOTO
                                        </div>
                                    </div>
                                    <div style={{ background: 'var(--bg-4)', padding: '12px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'center' }}>
                                        {/* Fake Barcode CSS representation for web */}
                                        <div style={{ 
                                            width: '80%', height: '24px', 
                                            backgroundImage: 'repeating-linear-gradient(90deg, var(--text) 0, var(--text) 2px, transparent 2px, transparent 4px, var(--text) 4px, var(--text) 5px, transparent 5px, transparent 8px, var(--text) 8px, var(--text) 12px, transparent 12px, transparent 15px)',
                                            opacity: 0.6
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-dim)' }}>
                            <AlertCircle size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
                            <h3 style={{ fontSize: '16px', color: 'var(--text-muted)', marginBottom: '8px' }}>Aucun élève trouvé</h3>
                            <p style={{ fontSize: '14px' }}>Recherchez des élèves pour générer leurs cartes scolaires avec code-barres.</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
