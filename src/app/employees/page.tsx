'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Briefcase, Plus, Search, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function EmployeesPage() {
    const router = useRouter();
    const [employees, setEmployees] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const fetchEmployees = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/employees?search=${searchTerm}`);
            const data = await res.json();
            setEmployees(data);
        } catch (err: any) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [searchTerm]);

    useEffect(() => {
        const debounce = setTimeout(fetchEmployees, 300);
        return () => clearTimeout(debounce);
    }, [fetchEmployees]);

    return (
        <div className="layout-root">
          <div className="sidebar">
            <div className="sidebar-logo">
              <div className="logo-title">SchoolERP Pro</div>
            </div>
            <div className="sidebar-nav">
              <div className="nav-item" onClick={() => router.push('/dashboard')}>Tableau de Bord</div>
              <div className="nav-item" onClick={() => router.push('/students')}>Élèves</div>
              <div className="nav-item" onClick={() => router.push('/classrooms')}>Classes</div>
              <div className="nav-item active">Employés (RH)</div>
            </div>
            <div className="sidebar-footer" style={{ marginTop: 'auto' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Version Stable 1.1.0</div>
            </div>
          </div>
          
          <div className="main-content">
            <div className="page">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Ressources Humaines</h1>
                        <p className="page-subtitle">Gestion du personnel et des professeurs (Next.js)</p>
                    </div>
                </div>

                <div className="card shadow-sm" style={{ padding: '0' }}>
                    <div className="table-toolbar" style={{ padding: '20px' }}>
                        <div className="search-box" style={{ maxWidth: '400px' }}>
                            <Search size={16} />
                            <input
                                type="text"
                                placeholder="Rechercher un employé..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="table-container" style={{ padding: '20px' }}>
                        {isLoading ? (
                            <div style={{ textAlign: 'center', padding: '40px' }}>Recherche...</div>
                        ) : employees.length > 0 ? (
                            <table className="data-table" style={{ width: '100%', textAlign: 'left' }}>
                                <thead>
                                    <tr>
                                        <th>Matricule</th>
                                        <th>Employé</th>
                                        <th>Rôle</th>
                                        <th>Date d'embauche</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {employees.map(emp => (
                                        <tr key={emp.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td className="text-primary">{emp.employeeNumber}</td>
                                            <td><strong>{emp.firstName} {emp.lastName}</strong><br/>{emp.email}</td>
                                            <td>{emp.employeeType}</td>
                                            <td>{new Date(emp.hireDate).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div style={{ padding: '40px', textAlign: 'center' }}>
                                <Briefcase size={48} style={{ opacity: 0.2, margin: '0 auto 20px' }} />
                                <h3>Aucun employé trouvé</h3>
                                <p>Migrez la création RH ou ajoutez les éléments via API.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
          </div>
        </div>
    );
}
