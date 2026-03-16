import { useParams } from 'react-router-dom';
import { Briefcase } from 'lucide-react';
export function EmployeeDetailPage() {
    const { id } = useParams();
    return (
        <div className="page">
            <h1 className="page-title">Détail Employé</h1>
            <div className="card coming-soon"><Briefcase size={48} /><p>ID: {id}</p></div>
        </div>
    );
}
