import axios from 'axios';

const API_URL = '/api-token-auth/';

// Guarda el token en localStorage y configura axios
export function setToken(token) {
  localStorage.setItem('token', token);
  axios.defaults.headers.common['Authorization'] = `Token ${token}`;
}

// Elimina el token y la cabecera
export function clearToken() {
  localStorage.removeItem('token');
  delete axios.defaults.headers.common['Authorization'];
}

// Recupera el token guardado (o null)
export function getToken() {
  return localStorage.getItem('token');
}

// Intento de login: envía credenciales y devuelve la promesa 
export function login(username, password) {
  return axios
    .post(API_URL, { username, password })
    .then(response => {
      const token = response.data.token;
      setToken(token);
      return token;
    });
}

// Comprueba si estamos logueados
export function isAuthenticated() {
  return !!getToken();
}
