import axios from 'axios';

const hostname = window.location.hostname;
const baseURL = `http://${hostname}:8080`;

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
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('@AnestesiaFlow:user'); 
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default httpClient;