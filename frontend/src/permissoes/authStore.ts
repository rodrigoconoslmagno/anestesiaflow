import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { type Usuario } from '@/types/usuario';
import type { Recurso } from './recurso';

interface AuthState {
  user: Usuario | null;
  
  setLogin: (user: Usuario) => void;
  logout: () => void;
  
  isAuthenticated: () => boolean;
  hasPermission: (resourcePath: Recurso, acao: string)=> boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,

      setLogin: (user: Usuario) => {
        set({ user });
      },

      logout: () => {
        set({ user: null });
        localStorage.removeItem('af-auth-storage');
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
    }),
    {
      name: 'af-auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);