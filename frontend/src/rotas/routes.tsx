import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '@/paginas/Login';

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* ROTA PÚBLICA: Sem menu lateral */}
        <Route path="/login" element={<Login />} />

        {/* REDIRECIONAMENTO: Se o usuário acessar a raiz ou rota inexistente */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
};