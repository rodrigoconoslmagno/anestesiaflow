import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '@/paginas/Login';
import { DashboardLayout } from '@/layouts/DashboardLayout'; 
import { DashboardHome } from '@/paginas/DashboardHome';
import { ProtectedRoute } from './ProtectedRoute';
import { Sudoku } from '@/paginas/Sudoku';
import { UsuarioView } from '@/paginas/Usuario';
import { MedicoView } from '@/paginas/MedicoView';
import { EstabelecimentoView  } from '@/paginas/EstabelecimentoView';

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* ROTA PÚBLICA */}
        <Route path="/login" element={<Login />} />

        {/* Rotas protegidas com Layout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardHome />} />
            <Route path="/sudoku" element={<Sudoku />} />
            <Route path="/usuario" element={<UsuarioView />} />
            <Route path="/medico" element={<MedicoView />} />
            <Route path="/estabelecimento" element={<EstabelecimentoView />} />
            {/* Adicione outras rotas aqui */}
          </Route>
        </Route>

        {/* CORREÇÃO AQUI: 
            Se o usuário acessar a raiz "/", mandamos para o "/dashboard".
            O ProtectedRoute vai validar se ele pode entrar ou se vai pro login.
        */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};