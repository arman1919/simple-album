import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000', // Базовый URL для всех запросов
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
