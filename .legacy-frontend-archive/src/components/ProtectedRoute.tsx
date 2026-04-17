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

    const { user } = useAuthStore();
    
    // Redirect to onboarding if setup not complete (except for SuperAdmin or if already on onboarding)
    if (user && !user.isSetupComplete && user.role === 'SchoolAdmin' && location.pathname !== '/onboarding') {
        return <Navigate to="/onboarding" replace />;
    }

    if (roles && roles.length > 0 && !hasRole(roles)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <Outlet />;
}
