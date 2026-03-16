import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export function UnauthorizedPage() {
    const navigate = useNavigate();
    return (
        <div className="error-page">
            <ShieldAlert size={64} className="error-icon" />
            <h1>Accès refusé</h1>
            <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
            <button onClick={() => navigate(-1)} className="btn-primary">
                <ArrowLeft size={16} /> Retour
            </button>
        </div>
    );
}
