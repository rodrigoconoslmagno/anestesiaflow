// AuthContext.tsx
import { createContext, useContext, useState, useEffect, type FC, type ReactNode } from 'react';
import { type Usuario, server } from '@/api/server';
import { Manutencao } from '@/paginas/Manutencao';

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

    useEffect(() => {
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('server-offline', handleOffline);

        async function validate() {
            try {
                // DESCOMENTADO: Necessário para recuperar a sessão via Cookie
                const data = await server.me();
                setUsuario(data);
            } catch (err) {
                console.error("Sessão inválida ou expirada");
                localStorage.removeItem('@AnestesiaFlow:user');
                sessionStorage.clear();
            } finally {
                setLoading(false);
            }
        }
        validate();
    }, []);

    const loginSucesso = (dados: Usuario) => {
        setUsuario(dados);
        setLoading(false); // Garante que o loading para após o login
    };

    const logout = async () => {
        try {
            await server.logout();
        } finally {
            setUsuario(null);
            localStorage.removeItem('@AnestesiaFlow:user');
            sessionStorage.clear();
            window.location.href = '/login';
        }
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