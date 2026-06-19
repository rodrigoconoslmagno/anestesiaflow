import { create } from 'zustand';
import { type UsuarioLogin } from '@/api/server';
import type { Recurso } from './recurso';

interface AuthState {
  user: UsuarioLogin | null;

  setLogin: (user: UsuarioLogin) => void;
  logout: () => void;
  
  isAuthenticated: () => boolean;
  hasPermission: (resourcePath: Recurso, acao: string)=> boolean;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,

  setLogin: (user: UsuarioLogin) => {
    set({ user });
  },

  logout: () => {
    set({ user: null });
  },

  isAuthenticated: () => {
    return !!get().user;
  },

  hasPermission: (recurso: Recurso, acao: string) => {
    const user = get().user;
    if (!user || !user.permissoes || !Array.isArray(user.permissoes)) {
      return false;
    }

    const permissaoEsperada = `${recurso}_${acao}`;

    return user.permissoes.some((p: any) => {
      return p.id === permissaoEsperada;
    });
  },
}));
