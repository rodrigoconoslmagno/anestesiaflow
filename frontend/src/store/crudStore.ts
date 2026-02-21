import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface CrudStoreState {
  // Armazena os dados brutos indexados por uma chave (string)
  forms: Record<string, any>;
  
  // Salva os dados
  setFormData: (key: string, data: any) => void;
  
  // Recupera os dados permitindo passar o Tipo esperado <T>
  getFormData: <T>(key: string) => T | null;
  
  clearFormData: (key?: string) => void;
}

export const useCrudStore = create<CrudStoreState>()(
  persist(
    (set, get) => ({
      forms: {},

      setFormData: (key, data) => 
        set((state) => ({
          forms: { ...state.forms, [key]: data }
        })),

      getFormData: <T>(key: string): T | null => {
        return (get().forms[key] as T) || null;
      },

      clearFormData: (key) => 
        set((state) => {
          if (key) {
            const newForms = { ...state.forms };
            delete newForms[key];
            return { forms: newForms };
          }
          return { forms: {} };
        }),
    }),
    {
      name: 'crud-app-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);