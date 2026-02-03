import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '@/paginas/Login';
import { DashboardLayout } from '@/layouts/DashboardLayout'; 
import { DashboardHome } from '@/paginas/DashboardHome';
import { ProtectedRoute } from './ProtectedRoute';
import { Escala } from '@/paginas/Escala';

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* ROTA PÚBLICA: Sem menu lateral */}
        <Route path="/login" element={<Login />} />

        {/* Rotas protegidas com Layout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardHome />} />
            <Route path="/escala" element={<Escala />} />
            {/* Adicione outras aqui */}
          </Route>
        </Route>

        {/* REDIRECIONAMENTO: Se o usuário acessar a raiz ou rota inexistente */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
};