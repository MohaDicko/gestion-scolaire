'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, Download, Search, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';

export default function StudentCardsPage() {
    const router = useRouter();
    const [students, setStudents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

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

    const generatePDF = () => {
        const doc = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4'
        });

        const cardWidth = 85;
        const cardHeight = 55;
        const margin = 10;
        let x = margin;
        let y = margin;

        students.forEach((student, index) => {
            if (index > 0 && index % 10 === 0) {
                doc.addPage();
                x = margin;
                y = margin;
            }

            // Draw Card Background
            doc.setDrawColor(129, 140, 248); // Primary color
            doc.setLineWidth(0.5);
            doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'D');

            // Header
            doc.setFillColor(129, 140, 248);
            doc.rect(x, y, cardWidth, 10, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.text('SCHOOL ERP - CARTE SCOLAIRE', x + cardWidth / 2, y + 6, { align: 'center' });

            // Student Info
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(9);
            doc.text(`Nom: ${student.lastName}`, x + 5, y + 20);
            doc.text(`Prénom: ${student.firstName}`, x + 5, y + 25);
            doc.text(`Matricule: ${student.studentNumber}`, x + 5, y + 30);
            doc.text(`Genre: ${student.gender}`, x + 5, y + 35);
            
            doc.setFontSize(7);
            doc.text('Valable pour l\'année 2024-2025', x + 5, y + 50);

            // Update positions
            if ((index + 1) % 2 === 0) {
                x = margin;
                y += cardHeight + 5;
            } else {
                x += cardWidth + 5;
            }
        });

        doc.save('Cartes_Scolaires.pdf');
    };

    return (
        <div className="layout-root">
          <div className="sidebar">
            <div className="sidebar-logo">
              <div className="logo-title">SchoolERP Vercel</div>
            </div>
            <div className="sidebar-nav">
              <div className="nav-item" onClick={() => router.push('/dashboard')}>Tableau de Bord</div>
              <div className="nav-item" onClick={() => router.push('/students')}>Élèves</div>
              <div className="nav-item active">Cartes Scolaires</div>
            </div>
          </div>
          
          <div className="main-content">
            <div className="page">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Cartes Scolaires</h1>
                        <p className="page-subtitle">Génération en masse des cartes d'identité élèves</p>
                    </div>
                    <button className="btn-primary" onClick={generatePDF} disabled={students.length === 0}>
                        <Download size={16} /> Télécharger PDF
                    </button>
                </div>

                <div className="card shadow-sm" style={{ padding: '0' }}>
                    <div className="table-toolbar" style={{ padding: '20px' }}>
                        <div className="search-box" style={{ maxWidth: '400px' }}>
                            <Search size={16} />
                            <input
                                type="text"
                                placeholder="Rechercher des élèves..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="table-container" style={{ padding: '20px' }}>
                        {isLoading ? (
                            <div style={{ textAlign: 'center', padding: '40px' }}>Chargement...</div>
                        ) : students.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                                {students.map(s => (
                                    <div key={s.id} className="card" style={{ borderLeft: '4px solid var(--primary)', padding: '15px' }}>
                                        <div style={{ display: 'flex', gap: '15px' }}>
                                            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--primary-dim)', display: 'grid', placeItems: 'center' }}>
                                                <Users size={24} color="var(--primary)" />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 'bold' }}>{s.firstName} {s.lastName}</div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.studentNumber}</div>
                                                <div style={{ fontSize: '12px', marginTop: '5px' }} className="badge-role">{s.gender}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ padding: '40px', textAlign: 'center' }}>
                                <CreditCard size={48} style={{ opacity: 0.2, margin: '0 auto 20px' }} />
                                <h3>Aucun élève sélectionné</h3>
                                <p>Recherchez des élèves pour générer leurs cartes.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
          </div>
        </div>
    );
}
