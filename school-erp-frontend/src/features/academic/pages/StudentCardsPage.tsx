import { useState } from 'react';
import { Search, Printer, CreditCard, Filter, User } from 'lucide-react';
import { useGetStudents } from '../hooks/useStudents';
import { useAuthStore } from '../../../store/authStore';
import { useClassrooms } from '../hooks/useClassrooms';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

export function StudentCardsPage() {
    const { user } = useAuthStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [classroomId, setClassroomId] = useState('');
    const [page, setPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isGeneratingBulk, setIsGeneratingBulk] = useState(false);

    const { data: result, isLoading } = useGetStudents({
        search: searchTerm,
        classroomId: classroomId,
        pageNumber: page,
        pageSize: 12
    });

    const { classrooms } = useClassrooms();

    const loadImage = (url: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = reject;
            img.src = url;
        });
    };

    const drawCardOnDoc = async (doc: jsPDF, student: any, xOffset: number, yOffset: number) => {
        // Headers & Shapes (Relative to xOffset, yOffset)
        doc.setFillColor(30, 41, 59);
        doc.rect(xOffset, yOffset, 86, 18, 'F');
        
        // Logo
        if (user?.schoolLogo) {
            try {
                const logoBase64 = await loadImage(user.schoolLogo);
                doc.addImage(logoBase64, 'PNG', xOffset + 4, yOffset + 2, 8, 8);
            } catch {}
        }

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9); doc.setFont('helvetica', 'bold');
        doc.text(user?.schoolName?.toUpperCase() || 'ÉTABLISSEMENT SCOLAIRE', xOffset + (user?.schoolLogo ? 15 : 43), yOffset + 8, { align: user?.schoolLogo ? 'left' : 'center' });
        doc.setFontSize(6); doc.setFont('helvetica', 'normal');
        doc.text('CARTE SCOLAIRE OFFICIELLE', xOffset + (user?.schoolLogo ? 15 : 43), yOffset + 13, { align: user?.schoolLogo ? 'left' : 'center' });

        doc.setFillColor(255, 255, 255);
        doc.rect(xOffset, yOffset + 18, 86, 36, 'F');

        // Photo
        try {
            if (student.photoUrl) {
                const photoBase64 = await loadImage(student.photoUrl);
                doc.addImage(photoBase64, 'PNG', xOffset + 4, yOffset + 21, 24, 28);
            } else {
                doc.setFillColor(241, 245, 249);
                doc.rect(xOffset + 4, yOffset + 21, 24, 28, 'F');
            }
        } catch (e) {
            doc.setFillColor(241, 245, 249);
            doc.rect(xOffset + 4, yOffset + 21, 24, 28, 'F');
        }

        // Info
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(8); doc.setFont('helvetica', 'bold');
        doc.text(`${student.firstName} ${student.lastName}`.toUpperCase(), xOffset + 32, yOffset + 25);
        
        doc.setFontSize(6); doc.setFont('helvetica', 'normal');
        const fld = (l: string, v: string, y: number) => {
            doc.setTextColor(100, 116, 139);
            doc.text(l, xOffset + 32, yOffset + y);
            doc.setTextColor(15, 23, 42);
            doc.text(v || '—', xOffset + 50, yOffset + y);
        };
        fld('MATRICULE:', student.studentNumber, 31);
        fld('CLASSE:', student.classroomName, 35);
        fld('NÉ(E) LE:', new Date(student.dateOfBirth).toLocaleDateString('fr-FR'), 39);
        fld('PARENT:', (student.parentName || '').split(' ')[0], 43);
        fld('URGENCE:', student.parentPhone, 47);

        // QR
        try {
            const qrData = JSON.stringify({ id: student.id, n: student.studentNumber });
            const qrUrl = await QRCode.toDataURL(qrData, { margin: 1 });
            doc.addImage(qrUrl, 'PNG', xOffset + 72, yOffset + 40, 10, 10);
        } catch {}

        doc.setFillColor(30, 41, 59);
        doc.rect(xOffset + 84, yOffset + 18, 2, 36, 'F');
    };

    const generateBatchCards = async () => {
        if (selectedIds.length === 0) return;
        setIsGeneratingBulk(true);
        try {
            const studentsToPrint = result?.items.filter(s => selectedIds.includes(s.id)) || [];
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            
            // Cards per page (A4 is approx 210x297, CR80 is 86x54)
            // We can fit 2 columns and 4 or 5 rows
            let currentCard = 0;
            for (const student of studentsToPrint) {
                if (currentCard > 0 && currentCard % 8 === 0) {
                    doc.addPage();
                }
                const row = Math.floor((currentCard % 8) / 2);
                const col = currentCard % 2;
                const x = 10 + (col * 95); // 10 margin + col spacing
                const y = 15 + (row * 65); // 15 top margin + row spacing
                
                await drawCardOnDoc(doc, student, x, y);
                currentCard++;
            }
            doc.save(`Cartes_Groupees_${new Date().getTime()}.pdf`);
        } finally {
            setIsGeneratingBulk(false);
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const selectAllOnPage = () => {
        const idsOnPage = result?.items.map(s => s.id) || [];
        setSelectedIds(prev => {
            const otherIds = prev.filter(id => !idsOnPage.includes(id));
            return [...otherIds, ...idsOnPage];
        });
    };

    const generateIdCard = async (student: any) => {
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: [86, 54]
        });
        await drawCardOnDoc(doc, student, 0, 0);
        doc.save(`Carte_${student.studentNumber}_${student.lastName}.pdf`);
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <CreditCard size={28} className="text-primary" /> Cartes Scolaires
                    </h1>
                    <p className="page-subtitle">Génération et impression des cartes d'identité élèves</p>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '25px' }}>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                        <label>Rechercher un élève</label>
                        <div className="search-box">
                            <Search size={16} />
                            <input 
                                type="text" 
                                placeholder="Nom, prénom ou matricule..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="form-group" style={{ minWidth: '200px' }}>
                        <label>Filtrer par classe</label>
                        <select value={classroomId} onChange={e => setClassroomId(e.target.value)}>
                            <option value="">Toutes les classes</option>
                            {classrooms?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-ghost" onClick={() => { setSearchTerm(''); setClassroomId(''); setSelectedIds([]); }} style={{ height: '42px' }}>
                            <Filter size={16} /> Reset
                        </button>
                        <button className="btn-secondary" onClick={selectAllOnPage} style={{ height: '42px' }}>
                            Tout Sélectionner
                        </button>
                        <button 
                            className="btn-primary" 
                            disabled={selectedIds.length === 0 || isGeneratingBulk} 
                            onClick={generateBatchCards}
                            style={{ height: '42px', minWidth: '180px' }}
                        >
                            {isGeneratingBulk ? 'Génération...' : `Imprimer Sélection (${selectedIds.length})`}
                        </button>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="loading-state">Chargement des élèves...</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {result?.items.map(student => (
                        <div 
                            key={student.id} 
                            className={`card animate-up ${selectedIds.includes(student.id) ? 'selected-card' : ''}`}
                            onClick={() => toggleSelect(student.id)}
                            style={{ 
                                padding: '0', 
                                overflow: 'hidden', 
                                border: selectedIds.includes(student.id) ? '2px solid var(--primary)' : '1px solid var(--border)', 
                                display: 'flex', 
                                flexDirection: 'column',
                                cursor: 'pointer',
                                position: 'relative'
                            }}
                        >
                            {selectedIds.includes(student.id) && (
                                <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'var(--primary)', color: 'white', borderRadius: '50%', padding: '2px' }}>
                                    <CreditCard size={14} />
                                </div>
                            )}
                            <div style={{ padding: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                                <div style={{ 
                                    width: '70px', 
                                    height: '80px', 
                                    borderRadius: '8px', 
                                    background: 'var(--bg-2)', 
                                    border: '1px solid var(--border)', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    flexShrink: 0,
                                    overflow: 'hidden'
                                }}>
                                    {student.photoUrl ? (
                                        <img src={student.photoUrl} alt="Student" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <User size={30} style={{ opacity: 0.3 }} />
                                    )}
                                </div>
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {student.firstName} {student.lastName}
                                    </h3>
                                    <p style={{ margin: '4px 0', fontSize: '12px', color: 'var(--primary)', fontWeight: 600 }}>
                                        {student.studentNumber || 'Sans matricule'}
                                    </p>
                                    <p style={{ margin: '2px 0', fontSize: '11px', color: 'var(--text-muted)' }}>
                                        {student.classroomName || 'Non classé'}
                                    </p>
                                    <div style={{ marginTop: '5px', display: 'flex', gap: '5px' }}>
                                        <span style={{ fontSize: '10px', padding: '2px 6px', background: 'var(--bg-3)', borderRadius: '4px' }}>{student.gender === 'Male' ? 'Garçon' : 'Fille'}</span>
                                        <span style={{ fontSize: '10px', padding: '2px 6px', background: 'var(--bg-3)', borderRadius: '4px' }}>{student.nationalId ? 'ID OK' : 'Pas d\'ID'}</span>
                                    </div>
                                </div>
                            </div>
                            <div style={{ padding: '12px 20px', background: 'var(--bg-2)', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
                                <button 
                                    className="btn-primary" 
                                    onClick={(e) => { e.stopPropagation(); generateIdCard(student); }}
                                    style={{ padding: '8px 14px', fontSize: '12px', width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}
                                >
                                    <Printer size={14} /> Générer Carte Officielle
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {result && result.totalPages > 1 && (
                <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                    <button 
                        disabled={page === 1} 
                        onClick={() => setPage(page - 1)}
                        className="btn-ghost"
                    >Précédent</button>
                    <span style={{ alignSelf: 'center' }}>Page {page} sur {result.totalPages}</span>
                    <button 
                        disabled={page === result.totalPages} 
                        onClick={() => setPage(page + 1)}
                        className="btn-ghost"
                    >Suivant</button>
                </div>
            )}
        </div>
    );
}
