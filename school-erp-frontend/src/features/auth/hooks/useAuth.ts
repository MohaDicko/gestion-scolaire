import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../../lib/apiClient';
import { useAuthStore, AuthUser } from '../../../store/authStore';

interface LoginRequest {
    email: string;
    password: string;
}

interface LoginResponse {
    accessToken: string;
    user: AuthUser;
}

export function useLogin() {
    const { setUser } = useAuthStore();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: async (credentials: LoginRequest): Promise<LoginResponse> => {
            const { data } = await apiClient.post<LoginResponse>('/auth/login', credentials);
            return data;
        },
        onSuccess: (data) => {
            setUser(data.user, data.accessToken);
            navigate('/dashboard');
        },
    });
}

export function useLogout() {
    const { logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await apiClient.post('/auth/logout');
        } finally {
            logout();
            navigate('/login');
        }
    };

    return { logout: handleLogout };
}
