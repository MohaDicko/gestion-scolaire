import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole =
    | 'SuperAdmin'
    | 'SchoolAdmin'
    | 'HR_Manager'
    | 'Accountant'
    | 'Teacher'
    | 'Student';

export interface AuthUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    tenantId: string;
    schoolName: string;
    schoolLogo?: string;
    schoolMotto?: string;
    schoolAddress?: string;
    isSetupComplete: boolean;
}

interface AuthState {
    user: AuthUser | null;
    token: string | null;
    tenantId: string | null;
    isAuthenticated: boolean;

    // Actions
    setUser: (user: AuthUser, token: string) => void;
    setToken: (token: string) => void;
    logout: () => void;

    // Role helpers
    hasRole: (roles: UserRole[]) => boolean;
    isSuperAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            tenantId: null,
            isAuthenticated: false,

            setUser: (user, token) =>
                set({
                    user,
                    token,
                    tenantId: user.tenantId,
                    isAuthenticated: true,
                }),

            setToken: (token) => set({ token }),

            logout: () =>
                set({
                    user: null,
                    token: null,
                    tenantId: null,
                    isAuthenticated: false,
                }),

            hasRole: (roles) => {
                const { user } = get();
                return user !== null && roles.includes(user.role);
            },

            isSuperAdmin: () => get().user?.role === 'SuperAdmin',
        }),
        {
            name: 'school-erp-auth',
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                tenantId: state.tenantId,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
