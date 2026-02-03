import httpClient from '@/api/client';

export interface Usuario {
    nome: string;
  }

export const server = {
  /**
   * Chama um método de um Service específico no Spring Boot
   * @param service Nome da classe Service (ex: "EscalaService")
   * @param method Nome do método (ex: "listarPlantões")
   * @param params Objeto com os parâmetros necessários
   */
  async call<T>(service: string, method: string, params: any = {}): Promise<T> {
    const payload = {
      serviceName: service,
      methodName: method,
      parameters: params
    };

    // Note que não passamos Token aqui, o navegador enviará o Cookie automaticamente
    const response = await httpClient.post('/execute', payload);
    return response.data;
  },

  // Método específico para Login (já que geralmente tem um endpoint próprio)
  async login(credentials: any): Promise<Usuario> {
    const response = await httpClient.post('/auth/login', credentials);
    return response.data; 
  },

  async me(): Promise<Usuario> {
    // O axios enviará o cookie automaticamente graças ao withCredentials: true
    const response = await httpClient.get('/auth/me');
    return response.data;
  },

  async logout() {
    await httpClient.post('/auth/logout');
  }
};