import axios from 'axios'

// Instance axios totalement indépendante de celle des utilisateurs (api/axios.js).
// Utilise ses propres clés de stockage pour le token, afin qu'une session admin
// et une session utilisateur classique puissent coexister sans interférer.
const adminApi = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default adminApi