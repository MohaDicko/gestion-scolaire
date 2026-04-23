'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { User, Book, Calendar, Award, ShieldCheck, GraduationCap, ChevronRight, Mail, Phone, MapPin } from 'lucide-react';

export default function PortalPage() {
    const { id } = useParams();
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = new URLSearchParams(window.location.search).get('token');
        fetch(`/api/portal/${id}?token=${token}`)
            .then(res => res.json())
            .then(d => {
                setData(d);
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    }, [id]);

    if (isLoading) return (
        <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#060b18', color: '#fff' }}>
            <div style={{ textAlign: 'center' }}>
                <GraduationCap size={48} className="animate-float" color="#4f8ef7" />
                <p style={{ marginTop: '20px', color: '#7a91b8' }}>Chargement de l'Espace Parent...</p>
            </div>
        </div>
    );

    if (!data || data.error) return (
        <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#060b18', color: '#fff' }}>
            <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', padding: '40px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <ShieldCheck size={48} color="#f45b69" />
                <h2 style={{ marginTop: '20px' }}>Accès Interdit</h2>
                <p style={{ color: '#7a91b8', maxWidth: '300px', margin: '10px auto' }}>{data?.error || 'Le lien de consultation est invalide ou a expiré.'}</p>
                <button onClick={() => window.location.reload()} style={{ marginTop: '20px', padding: '10px 24px', background: '#4f8ef7', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600 }}>Réessayer</button>
            </div>
        </div>
    );

    const { student, attendance } = data;
    const currentClass = student.enrollments?.[0]?.classroom;

    return (
        <div style={{ minHeight: '100vh', background: '#060b18', color: '#f0f4ff', paddingBottom: '60px' }}>
            {/* Header / Banner */}
            <div style={{ 
                height: '180px', 
                background: 'linear-gradient(135deg, #16213e 0%, #060b18 100%)',
                position: 'relative',
                borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '100px 24px 0', display: 'flex', alignItems: 'flex-end', gap: '24px' }}>
                    <div style={{ 
                        width: '120px', height: '120px', borderRadius: '30px', 
                        background: 'linear-gradient(135deg, #4f8ef7, #6366f1)', 
                        display: 'grid', placeItems: 'center',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                        border: '4px solid #060b18'
                    }}>
                        <User size={60} color="#fff" />
                    </div>
                    <div style={{ paddingBottom: '10px' }}>
                        <h1 style={{ fontSize: '28px', fontWeight: 800 }}>{student.firstName} {student.lastName}</h1>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '4px' }}>
                            <span style={{ fontSize: '14px', color: '#7a91b8' }}>Matricule: {student.studentNumber}</span>
                            <span style={{ height: '4px', width: '4px', borderRadius: '50%', background: '#4a5b7a' }}></span>
                            <span style={{ color: '#10d98e', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Sujet Actif</span>
                        </div>
                    </div>
                    <div style={{ marginLeft: 'auto', paddingBottom: '10px', textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#4f8ef7', marginBottom: '4px' }}>Dernière Synchronisation</div>
                        <div style={{ fontSize: '14px', color: '#7a91b8' }}>{new Date().toLocaleDateString('fr-FR')}</div>
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: '1000px', margin: '40px auto 0', padding: '0 24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }} className="portal-grid">
                    
                    {/* Main Feed */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        
                        {/* Grades Card */}
                        <div className="card-glass">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px' }}><Award color="#4f8ef7" /> Relevé de Notes</h3>
                                <div style={{ fontSize: '12px', color: '#7a91b8' }}>Année Scolaire 2024-2025</div>
                            </div>
                            
                            {student.grades?.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {student.grades.map((g: any) => (
                                        <div key={g.id} style={{ 
                                            background: 'rgba(255,255,255,0.02)', 
                                            padding: '16px 20px', 
                                            borderRadius: '16px',
                                            border: '1px solid rgba(255,255,255,0.05)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                        }}>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '15px' }}>{g.subject?.name}</div>
                                                <div style={{ fontSize: '12px', color: '#7a91b8', marginTop: '2px' }}>{g.comment || 'Aucun commentaire'}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '20px', fontWeight: 800, color: g.score >= 10 ? '#10d98e' : '#f45b69' }}>{g.score} <span style={{ fontSize: '12px', color: '#4a5b7a' }}>/ {g.maxScore}</span></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ padding: '40px', textAlign: 'center', color: '#4a5b7a' }}>Aucune évaluation n'a encore été publiée.</div>
                            )}
                        </div>

                        {/* Recent Activity */}
                        <div className="card-glass">
                             <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', marginBottom: '24px' }}><Calendar color="#10d98e" /> Historique de Présence</h3>
                             {attendance?.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', overflow: 'hidden' }}>
                                    {attendance.map((a: any) => (
                                        <div key={a.id} style={{ background: '#0f1830', padding: '14px 20px', display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: '14px' }}>{new Date(a.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                                            <span style={{ 
                                                fontSize: '12px', fontWeight: 800, 
                                                color: a.status === 'PRESENT' ? '#10d98e' : '#f45b69',
                                                textTransform: 'uppercase'
                                            }}>{a.status}</span>
                                        </div>
                                    ))}
                                </div>
                             ) : (
                                <div style={{ padding: '20px', textAlign: 'center', color: '#4a5b7a' }}>Aucune donnée de présence.</div>
                             )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div className="card-glass" style={{ textAlign: 'center' }}>
                            <div style={{ width: '40px', height: '40px', background: 'rgba(79, 142, 247, 0.1)', borderRadius: '10px', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
                                <GraduationCap size={20} color="#4f8ef7" />
                            </div>
                            <h4 style={{ color: '#7a91b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Classe Actuelle</h4>
                            <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px' }}>{currentClass?.name || 'En attente'}</div>
                            <div style={{ fontSize: '13px', color: '#4a5b7a', marginTop: '2px' }}>{currentClass?.level || '—'}</div>
                        </div>

                        <div className="card-glass">
                            <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '20px' }}>Contact Établissement</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <MapPin size={16} color="#7a91b8" />
                                    <div style={{ fontSize: '13px' }}>Bamako, Mali<br/><span style={{ color: '#4a5b7a' }}>Quartier du Fleuve</span></div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <Phone size={16} color="#7a91b8" />
                                    <div style={{ fontSize: '13px' }}>+223 00 00 00 00</div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <Mail size={16} color="#7a91b8" />
                                    <div style={{ fontSize: '13px' }}>contact@schoolerp.pro</div>
                                </div>
                            </div>
                            <button style={{ 
                                width: '100%', marginTop: '24px', padding: '12px', 
                                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px', color: '#fff', fontWeight: 600, fontSize: '13px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                            }}>
                                Message au Directeur <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .card-glass {
                    background: #0b1225;
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 24px;
                    padding: 24px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                }
                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                @media (max-width: 768px) {
                    .portal-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </div>
    );
}
