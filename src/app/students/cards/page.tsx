'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, Download, Search, Users, AlertCircle, Loader2, ShieldCheck, Printer, Eye } from 'lucide-react';
import jsPDF from 'jspdf';
import JsBarcode from 'jsbarcode';
import AppLayout from '@/components/AppLayout';

export default function StudentCardsPage() {
    const [students, setStudents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);

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

                // --- Background de la carte (Premium White/Light Gray Gradient look) ---
                doc.setDrawColor(220, 225, 235);
                doc.setLineWidth(0.1);
                doc.setFillColor(255, 255, 255);
                doc.roundedRect(x, y, cardWidth, cardHeight, 4, 4, 'FD');

                // --- Motif de Sécurité (Subtle Lines) ---
                doc.setDrawColor(240, 245, 255);
                for(let i = 0; i < cardWidth; i += 4) {
                    doc.line(x + i, y, x + cardWidth - i, y + cardHeight);
                }

                // --- Header de la carte ---
                doc.setFillColor(30, 41, 59); // Dark slate for premium feel
                doc.roundedRect(x, y, cardWidth, 14, 4, 4, 'F');
                doc.rect(x, y + 7, cardWidth, 7, 'F');
                
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(7);
                doc.setFont('helvetica', 'normal');
                doc.text('RÉPUBLIQUE DU MALI', x + cardWidth / 2, y + 4.5, { align: 'center' });
                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.text('CARTE D\'IDENTITÉ SCOLAIRE', x + cardWidth / 2, y + 10, { align: 'center' });

                // --- Filigrane de sécurité central ---
                doc.setTextColor(245, 248, 255);
                doc.setFontSize(24);
                doc.text('OFFICIEL', x + cardWidth / 2, y + 35, { align: 'center', angle: 45 });

                // --- Informations Élève ---
                doc.setTextColor(15, 23, 42);
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.text(`${student.firstName} ${student.lastName}`.toUpperCase(), x + 6, y + 22);
                
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(100, 116, 139);
                doc.text('MATRICULE', x + 6, y + 28);
                doc.setTextColor(15, 23, 42);
                doc.text(`${student.studentNumber || 'N/A'}`, x + 30, y + 28);

                doc.setTextColor(100, 116, 139);
                doc.text('CLASSE', x + 6, y + 33);
                doc.setTextColor(15, 23, 42);
                doc.text(`${student.classroom?.name || '---'}`, x + 30, y + 33);

                doc.setTextColor(100, 116, 139);
                doc.text('NAISSANCE', x + 6, y + 38);
                doc.setTextColor(15, 23, 42);
                doc.text(`${new Date(student.birthDate).toLocaleDateString('fr-FR')}`, x + 30, y + 38);

                // --- Zone Photo ---
                doc.setFillColor(248, 250, 252);
                doc.setDrawColor(203, 213, 225);
                doc.setLineWidth(0.3);
                doc.roundedRect(x + cardWidth - 26, y + 18, 20, 24, 1, 1, 'FD');
                
                // Overlay text inside photo zone
                doc.setFontSize(5);
                doc.setTextColor(148, 163, 184);
                doc.text('SCANNÉ', x + cardWidth - 16, y + 30, { align: 'center' });

                // --- Code-barres ---
                const canvas = document.createElement('canvas');
                const barcodeValue = student.studentNumber || student.id.substring(0, 8);
                
                JsBarcode(canvas, barcodeValue, {
                    format: "CODE128",
                    displayValue: false,
                    margin: 0,
                    width: 2,
                    height: 40,
                    lineColor: "#0f172a",
                    background: "#ffffff"
                });

                const barcodeDataUrl = canvas.toDataURL('image/png');
                const barcodeWidth = 35;
                const barcodeHeight = 7;
                doc.addImage(barcodeDataUrl, 'PNG', x + 6, y + 43, barcodeWidth, barcodeHeight);
                
                doc.setFontSize(6);
                doc.setTextColor(71, 85, 105);
                doc.text(barcodeValue, x + 6 + (barcodeWidth / 2), y + 51, { align: 'center' });

                // --- Footer / Validity ---
                doc.setFontSize(6);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(30, 41, 59);
                doc.text('VALIDE : 2024-2025', x + cardWidth - 6, y + 47, { align: 'right' });
                
                doc.setDrawColor(30, 41, 59);
                doc.setLineWidth(0.5);
                doc.line(x + cardWidth - 25, y + 49, x + cardWidth - 6, y + 49);
                doc.setFontSize(4);
                doc.text('SIGNATURE DIRECTION', x + cardWidth - 15.5, y + 51, { align: 'center' });


                // Positionnement de la prochaine carte (2 par ligne, 5 lignes par page)
                if ((index + 1) % 2 === 0) {
                    x = marginX;
                    y += cardHeight + gap; 
                } else {
                    x += cardWidth + gap;
                }
            });

            doc.save(`Cartes_Scolaires_${new Date().getFullYear()}.pdf`);
        } catch (error) {
            console.error('Erreur lors de la génération PDF:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <AppLayout
            title="Cartes Scolaires"
            subtitle="Identification sécurisée avec Codes-barres (Format ISO/IEC 7810)"
            breadcrumbs={[{ label: 'Élèves', href: '/students' }, { label: 'Cartes Scolaires' }]}
        >
            {/* Toolbar */}
            <div className="card shadow-premium" style={{ 
                padding: '24px', 
                marginBottom: '24px', 
                background: 'rgba(255,255,255,0.8)', 
                backdropFilter: 'blur(10)px',
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '20px', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.5)'
            }}>
                <div style={{ display: 'flex', gap: '16px', flex: 1, maxWidth: '600px' }}>
                    <div className="search-box-premium" style={{ flex: 1 }}>
                        <Search size={18} className="text-muted" />
                        <input
                            type="text"
                            placeholder="Rechercher par nom ou matricule..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ background: 'transparent', border: 'none', padding: '12px', width: '100%', outline: 'none' }}
                        />
                    </div>
                </div>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Eye size={18} /> Aperçu
                    </button>
                    <button 
                        className="btn-primary" 
                        onClick={generatePDF} 
                        disabled={students.length === 0 || isGenerating}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', fontWeight: 600 }}
                    >
                        {isGenerating ? (
                            <><Loader2 size={18} className="spin" /> Génération...</>
                        ) : (
                            <><Printer size={18} /> Imprimer en PDF</>
                        )}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="card-premium">
                <div style={{ padding: '24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px', fontSize: '18px', fontWeight: 700 }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(79, 142, 247, 0.1)', display: 'grid', placeItems: 'center' }}>
                            <ShieldCheck size={20} className="text-primary" />
                        </div>
                        Registre des Cartes d'Identité
                    </h3>
                    <span className="badge-premium">{students.length} Profils chargés</span>
                </div>

                <div style={{ padding: '32px', background: '#f8fafc' }}>
                    {isLoading ? (
                        <div style={{ padding: '80px', textAlign: 'center' }}>
                            <Loader2 size={48} className="spin text-primary" style={{ marginBottom: '16px' }} />
                            <p className="text-muted">Synchronisation des données scolaires...</p>
                        </div>
                    ) : students.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '32px' }}>
                            {students.map(student => (
                                <div key={student.id} className="id-card-visual">
                                    <div className="id-card-inner">
                                        <div className="id-card-header">
                                            <div className="school-logo-mini"></div>
                                            <div className="id-card-header-text">
                                                <div className="id-card-country">RÉPUBLIQUE DU MALI</div>
                                                <div className="id-card-title">CARTE SCOLAIRE</div>
                                            </div>
                                            <div className="security-hologram"></div>
                                        </div>
                                        
                                        <div className="id-card-body">
                                            <div className="id-card-photo-container">
                                                <div className="id-card-photo-placeholder">
                                                    <Users size={32} opacity={0.2} />
                                                </div>
                                            </div>
                                            
                                            <div className="id-card-info">
                                                <div className="id-card-name">{student.firstName} {student.lastName}</div>
                                                <div className="id-card-field">
                                                    <span>MATRICULE</span>
                                                    <strong>{student.studentNumber || '---'}</strong>
                                                </div>
                                                <div className="id-card-field">
                                                    <span>CLASSE</span>
                                                    <strong>{student.classroom?.name || 'Non assigné'}</strong>
                                                </div>
                                                <div className="id-card-field">
                                                    <span>EXPIRATION</span>
                                                    <strong>JUIN 2025</strong>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="id-card-footer">
                                            <div className="id-card-barcode-mock"></div>
                                            <div className="id-card-barcode-text">{student.studentNumber || student.id.slice(0,8)}</div>
                                        </div>
                                    </div>
                                    
                                    <div className="id-card-actions">
                                        <button className="id-card-btn"><Eye size={14} /> Voir</button>
                                        <button className="id-card-btn"><Download size={14} /> PNG</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ padding: '80px', textAlign: 'center', opacity: 0.5 }}>
                            <AlertCircle size={64} style={{ marginBottom: '24px' }} />
                            <h3>Aucun résultat</h3>
                            <p>Modifiez vos critères de recherche.</p>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .card-premium {
                    background: white;
                    border-radius: 20px;
                    border: 1px solid rgba(0,0,0,0.05);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.04);
                    overflow: hidden;
                }

                .badge-premium {
                    background: #f1f5f9;
                    color: #475569;
                    padding: 6px 14px;
                    border-radius: 99px;
                    font-size: 13px;
                    font-weight: 600;
                }

                .search-box-premium {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 0 16px;
                    transition: all 0.3s;
                }
                .search-box-premium:focus-within {
                    border-color: var(--primary);
                    background: white;
                    box-shadow: 0 0 0 4px rgba(79, 142, 247, 0.1);
                }

                /* Visual ID Card Styling */
                .id-card-visual {
                    perspective: 1000px;
                }

                .id-card-inner {
                    width: 100%;
                    background: white;
                    border-radius: 16px;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 15px 35px rgba(0,0,0,0.08);
                    overflow: hidden;
                    position: relative;
                    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }

                .id-card-visual:hover .id-card-inner {
                    transform: translateY(-8px) rotateX(4deg);
                }

                /* Pattern mask simulation */
                .id-card-inner::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background-image: radial-gradient(#4f8ef7 0.5px, transparent 0.5px);
                    background-size: 10px 10px;
                    opacity: 0.03;
                    pointer-events: none;
                }

                .id-card-header {
                    background: #1e293b;
                    padding: 12px 16px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    color: white;
                }

                .school-logo-mini {
                    width: 32px;
                    height: 32px;
                    background: #4f8ef7;
                    border-radius: 6px;
                }

                .id-card-header-text {
                    flex: 1;
                }

                .id-card-country { font-size: 8px; opacity: 0.7; letter-spacing: 1px; font-weight: 700; }
                .id-card-title { font-size: 11px; font-weight: 800; }

                .security-hologram {
                  width: 28px; height: 28px;
                  background: linear-gradient(45deg, #f0f9ff, #e0f2fe, #bae6fd);
                  border-radius: 50%;
                  opacity: 0.5;
                  box-shadow: inset 0 0 10px rgba(0,0,0,0.1);
                }

                .id-card-body {
                    padding: 16px;
                    display: flex;
                    gap: 16px;
                }

                .id-card-photo-container {
                    width: 80px;
                }

                .id-card-photo-placeholder {
                    width: 80px;
                    height: 100px;
                    background: #f8fafc;
                    border: 1px solid #f1f5f9;
                    border-radius: 8px;
                    display: grid;
                    place-items: center;
                    color: #cbd5e1;
                }

                .id-card-info {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                }

                .id-card-name {
                    font-size: 16px;
                    font-weight: 800;
                    color: #1e293b;
                    margin-bottom: 12px;
                }

                .id-card-field {
                    display: flex;
                    justify-content: space-between;
                    font-size: 10px;
                    margin-bottom: 4px;
                    border-bottom: 1px solid #f1f5f9;
                    padding-bottom: 2px;
                }

                .id-card-field span { color: #94a3b8; font-weight: 600; }
                .id-card-field strong { color: #475569; }

                .id-card-footer {
                    padding: 8px 16px 12px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    background: #fdfdfd;
                    border-top: 1px solid #f1f5f9;
                }

                .id-card-barcode-mock {
                    width: 70%;
                    height: 20px;
                    background-image: repeating-linear-gradient(90deg, #1e293b 0, #1e293b 1px, transparent 1px, transparent 3px, #1e293b 3px, #1e293b 4px, transparent 4px, transparent 6px);
                    opacity: 0.8;
                }

                .id-card-barcode-text {
                    font-size: 8px;
                    margin-top: 4px;
                    color: #94a3b8;
                    letter-spacing: 2px;
                }

                .id-card-actions {
                    display: flex;
                    gap: 8px;
                    margin-top: 12px;
                    justify-content: center;
                }

                .id-card-btn {
                    padding: 6px 12px;
                    border-radius: 8px;
                    background: white;
                    border: 1px solid #e2e8f0;
                    font-size: 12px;
                    font-weight: 600;
                    color: #64748b;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .id-card-btn:hover {
                    background: #f8fafc;
                    border-color: #cbd5e1;
                    color: #1e293b;
                }

                .btn-outline {
                    background: white;
                    border: 1px solid #e2e8f0;
                    padding: 10px 20px;
                    border-radius: 12px;
                    font-weight: 600;
                    color: #475569;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-outline:hover { background: #f8fafc; border-color: #cbd5e1; }

                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                
                .shadow-premium { box-shadow: 0 20px 40px rgba(0,0,0,0.05); }
            `}</style>
        </AppLayout>
    );
}
