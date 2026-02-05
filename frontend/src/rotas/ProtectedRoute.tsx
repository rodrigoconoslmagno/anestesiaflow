import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ProgressSpinner } from 'primereact/progressspinner';

/**
 * ProtectedRoute aprimorada com persistência de localização.
 * Esta versão garante que, após o login, o usuário seja devolvido 
 * para a página que ele estava tentando acessar originalmente.
 */
export const ProtectedRoute = () => {
  const { usuario, loading } = useAuth();
  const location = useLocation();

  // 1. Estado de Carregamento (Essencial para o Refresh com Cookies)
  // Enquanto o AuthContext verifica o Cookie no backend, mostramos o Spinner.
  if (loading) {
    return (
      <div 
        className="flex h-screen w-full items-center justify-center bg-gray-50"
        role="alert" 
        aria-busy="true"
      >
        <div className="flex flex-col items-center gap-4">
          <ProgressSpinner 
            style={{ width: '50px', height: '50px' }} 
            strokeWidth="4" 
            animationDuration=".5s" 
          />
          <p className="text-gray-600 font-medium animate-pulse">
            Verificando autenticação...
          </p>
        </div>
      </div>
    );
  }

  // 2. Verificação de Autenticação
  // Se o usuário existir, renderizamos as rotas internas (Outlet).
  // Caso contrário, redirecionamos para o Login salvando a rota atual no state.
  return usuario ? (
    <Outlet />
  ) : (
    <Navigate 
      to="/login" 
      state={{ from: location }} 
      replace 
    />
  );
};