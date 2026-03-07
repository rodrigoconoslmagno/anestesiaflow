// AuthContext.tsx
import { createContext, useContext, useState, useEffect, type FC, type ReactNode } from 'react';
import { type Usuario, server } from '@/api/server';
import { Manutencao } from '@/paginas/Manutencao';
import { useAuthStore } from '@/permissoes/authStore';

interface AuthContextData {
    usuario: Usuario | null;
    loading: boolean;
    isOffline: boolean;
    loginSucesso: (dados: Usuario) => void;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [usuario, setUsuario] = useState<Usuario | null>(null);
    const [loading, setLoading] = useState(true);
    const [isOffline, setIsOffline] = useState(false);
    const setLoginStore = useAuthStore((state) => state.setLogin);
    const logoutStore = useAuthStore((state) => state.logout);

    useEffect(() => {
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('server-offline', handleOffline);

        async function validate() {
            const isPublicRoute = window.location.pathname.startsWith('/view/');

            if (isPublicRoute) {
                setLoading(false);
                return;
            }

            try {
                const data = await server.auth.me();
                setLoginStore(data);
                setUsuario(data);
            } catch (err) {
                console.error("Sessão inválida ou expirada");
                handleLocalLogout();
            } finally {
                setLoading(false);
            }
        }
        validate();
    }, []);

    const loginSucesso = (dados: Usuario) => {
        setLoginStore(dados as any);
        setUsuario(dados);
        setLoading(false);
    };

    const logout = async () => {
        try {
            await server.auth.logout();
        } finally {
            handleLocalLogout();
            window.location.href = '/login';
        }
    };

    const handleLocalLogout = () => {
        setUsuario(null);
        logoutStore(); 
        localStorage.removeItem('@AnestesiaFlow:user');
        localStorage.removeItem('af-auth-storage');
        sessionStorage.clear();
    };

    if (isOffline) {
        return <Manutencao />;
    }

    return (
        <AuthContext.Provider value={{ usuario, loading, isOffline, loginSucesso, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }
    return context;
};