import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ProgressSpinner } from 'primereact/progressspinner';

export const ProtectedRoute = () => {
  const { usuario, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f9fafb]">
        <ProgressSpinner strokeWidth="4" />
      </div>
    );
  }

  return usuario ? <Outlet /> : <Navigate to="/login" replace />;
};