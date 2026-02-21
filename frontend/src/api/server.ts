import httpClient from '@/api/client';

export interface Usuario {
    nome: string;
  }

export const server = {
  // --- CLIENTE REST PARA CRUD ---
  api: {
    // Agora o listar usa POST para maior segurança e envio de filtros complexos
    listar: <T>(url: string, filtros: any = {}) => 
      httpClient.post<T[]>(`${url}/listar`, filtros).then(res => res.data),
    
    buscarId: <T>(url: string, id: any) => {
      return httpClient.post<T>(`${url}/buscarid`, {id}).then(res => res.data)
    },

    // Salvar (POST para novo ou PUT para edição)
    criar: <T>(url: string, data: T) => 
      httpClient.post<T>(url, data).then(res => res.data),
    
    atualizar: <T>(url: string, id: any, data: T) => 
      httpClient.put<T>(`${url}/${id}`, data).then(res => res.data),
    
    excluir: (url: string, id: any) => 
      httpClient.delete(`${url}/${id}`).then(res => res.data),  

    upload: async (url: string, file: File, key: string = 'file') => {
      const formData = new FormData();
      formData.append(key, file);

      const response = await httpClient.post(url, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },  
  },

  // --- AUTENTICAÇÃO (Refatorada) ---
  auth: {
    async login(credentials: any) {
      const response = await httpClient.post('/auth/login', credentials);
      return response.data;
    },
    async me() {
      const response = await httpClient.get('/auth/me');
      return response.data;
    },
    async logout() {
      await httpClient.post('/auth/logout');
    }
  },
};