import { useState, useEffect, useRef } from 'react';
import { Search, GraduationCap, Briefcase, FileText, X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../lib/apiClient';

interface SearchItem {
    id: string;
    title: string;
    subtitle: string;
    category: string;
    path: string;
}

interface SearchResult {
    students: SearchItem[];
    employees: SearchItem[];
    invoices: SearchItem[];
}

const CATEGORY_ICON: Record<string, React.ReactNode> = {
    'Élève': <GraduationCap size={16} style={{ color: '#8b5cf6' }} />,
    'Employé': <Briefcase size={16} style={{ color: '#3b82f6' }} />,
    'Facture': <FileText size={16} style={{ color: '#f59e0b' }} />,
};

export function GlobalSearch() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult | null>(null);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    // Keyboard shortcut Ctrl+K
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setOpen(o => !o);
            }
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, []);

    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 50);
    }, [open]);

    useEffect(() => {
        if (query.length < 2) { setResults(null); return; }
        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const { data } = await apiClient.get(`/search?q=${encodeURIComponent(query)}`);
                setResults(data);
            } catch { /* silent */ }
            finally { setLoading(false); }
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    const allResults = results ? [
        ...results.students,
        ...results.employees,
        ...results.invoices,
    ] : [];

    const handleSelect = (item: SearchItem) => {
        navigate(item.path);
        setOpen(false);
        setQuery('');
        setResults(null);
    };

    return (
        <>
            {/* Search trigger button */}
            <button
                onClick={() => setOpen(true)}
                style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 14px', borderRadius: '10px',
                    background: 'var(--bg-color)', border: '1px solid var(--border)',
                    color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px',
                    width: '220px', justifyContent: 'space-between'
                }}
            >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Search size={14} /> Rechercher...
                </span>
                <span style={{ fontSize: '11px', background: 'var(--border)', padding: '2px 5px', borderRadius: '4px', fontFamily: 'monospace' }}>
                    Ctrl+K
                </span>
            </button>

            {/* Modal overlay */}
            {open && (
                <div
                    onClick={() => setOpen(false)}
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                        zIndex: 9999, display: 'flex', alignItems: 'flex-start',
                        justifyContent: 'center', paddingTop: '10vh', backdropFilter: 'blur(4px)'
                    }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            width: '560px', maxWidth: '95vw',
                            background: 'var(--surface)', borderRadius: '16px',
                            border: '1px solid var(--border)',
                            boxShadow: '0 25px 50px rgba(0,0,0,0.4)', overflow: 'hidden'
                        }}
                    >
                        {/* Search input */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                            {loading ? <Loader2 size={20} style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite', flexShrink: 0 }} /> : <Search size={20} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                            <input
                                ref={inputRef}
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Rechercher un élève, employé, facture..."
                                style={{
                                    flex: 1, border: 'none', outline: 'none',
                                    background: 'transparent', fontSize: '16px',
                                    color: 'var(--text)'
                                }}
                            />
                            {query && (
                                <button onClick={() => { setQuery(''); setResults(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        {/* Results */}
                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {query.length < 2 && (
                                <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <Search size={36} style={{ opacity: 0.2, marginBottom: '8px' }} />
                                    <p style={{ margin: 0, fontSize: '14px' }}>Tapez au moins 2 caractères pour rechercher</p>
                                    <p style={{ margin: '4px 0 0', fontSize: '12px' }}>Élèves, Employés, Factures...</p>
                                </div>
                            )}
                            {query.length >= 2 && !loading && allResults.length === 0 && (
                                <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <p style={{ margin: 0, fontSize: '14px' }}>Aucun résultat pour "<strong>{query}</strong>"</p>
                                </div>
                            )}
                            {allResults.length > 0 && (
                                <div style={{ padding: '8px 0' }}>
                                    {allResults.map((item, i) => (
                                        <button
                                            key={`${item.category}-${item.id}-${i}`}
                                            onClick={() => handleSelect(item)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '14px',
                                                width: '100%', padding: '12px 20px', border: 'none',
                                                background: 'transparent', cursor: 'pointer', textAlign: 'left',
                                                transition: 'background 0.1s'
                                            }}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-color)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                {CATEGORY_ICON[item.category] ?? <Search size={16} />}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ margin: 0, fontWeight: 600, fontSize: '14px', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</p>
                                                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>{item.subtitle}</p>
                                            </div>
                                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: 'var(--primary-dim)', color: 'var(--primary)', fontWeight: 600, flexShrink: 0 }}>
                                                {item.category}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer shortcut hints */}
                        <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--text-muted)' }}>
                            <span>↵ Sélectionner</span>
                            <span>↑↓ Naviguer</span>
                            <span>Esc Fermer</span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
