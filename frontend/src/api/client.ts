import axios from 'axios';

const hostname = window.location.hostname;
//const baseURL = `http://${hostname}:8080`;
const baseURL = window.location.hostname === 'localhost' 
  ? `http://${hostname}:8080` 
  : '/';

const httpClient = axios.create({
  baseURL: baseURL,
  withCredentials: true, 
  headers: {
    'Content-Type': 'application/json',
  },
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Se não houver resposta (server down) ou status 502, 503, 504
    if (!error.response || [502, 503, 504].includes(error.response.status)) {
      // Opcional: Você pode disparar um evento customizado ou 
      // deixar que o componente que fez a chamada trate o erro.
      window.dispatchEvent(new CustomEvent('server-offline'));
      console.error("Servidor inacessível");
    }

    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('@AnestesiaFlow:user'); 
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default httpClient;