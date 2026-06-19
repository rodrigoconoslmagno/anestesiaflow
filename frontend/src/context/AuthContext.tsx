import { createContext, useContext, useState, useEffect, type FC, type ReactNode } from 'react';
import { type UsuarioLogin, server } from '@/api/server';
import { Manutencao } from '@/paginas/Manutencao';
import { useAuthStore } from '@/permissoes/authStore';

interface AuthContextData {
    usuario: UsuarioLogin | null;
    loading: boolean;
    isOffline: boolean;
    loginSucesso: (dados: UsuarioLogin) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [usuario, setUsuario] = useState<UsuarioLogin | null>(null);
    const [loading, setLoading] = useState(true);
    const [isOffline, setIsOffline] = useState(false);
    const setLoginStore = useAuthStore((state) => state.setLogin);
    const logoutStore = useAuthStore((state) => state.logout);

    useEffect(() => {
        const handleOffline = () => setIsOffline(true);
        const handleOnline = () => setIsOffline(false);

        window.addEventListener('server-offline', handleOffline);
        window.addEventListener('online', handleOnline);

        async function sincronizarSessao(dados: UsuarioLogin) {
            setUsuario(dados);
            setLoginStore(dados);
        }

        async function validate() {
            const isPublicRoute = window.location.pathname.startsWith('/view/');

            if (isPublicRoute) {
                setLoading(false);
                return;
            }

            try {
                const data = await server.auth.me();
                await sincronizarSessao(data);
            } catch (err) {
                console.error("Sessão inválida ou expirada");
                handleLocalLogout();
            } finally {
                setLoading(false);
            }
        }
        validate();

        return () => {
          window.removeEventListener('server-offline', handleOffline);
          window.removeEventListener('online', handleOnline);
        };
    }, []);

    const loginSucesso = async (dados: UsuarioLogin) => {
        setUsuario(dados);
        setLoginStore(dados);
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
