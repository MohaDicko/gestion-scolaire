import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore, UserRole } from '../store/authStore';

interface ProtectedRouteProps {
    roles?: UserRole[]; // If empty, any authenticated user can access
}

/**
 * Route guard component.
 * - Redirects unauthenticated users to /login
 * - Redirects unauthorized users (wrong role) to /unauthorized
 * - Renders child routes if access is granted
 */
export function ProtectedRoute({ roles }: ProtectedRouteProps) {
    const { isAuthenticated, hasRole } = useAuthStore();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (roles && roles.length > 0 && !hasRole(roles)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <Outlet />;
}
