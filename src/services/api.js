import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/auth'
    }
    return Promise.reject(err)
  }
)

export const authAPI = {
  register:      (d)  => api.post('/auth/register', d),
  login:         (d)  => api.post('/auth/login', d),
  getMe:         ()   => api.get('/auth/me'),
  updateProfile: (d)  => api.put('/auth/profile', d),
}

export const sallesAPI = {
  getAll:            (p)       => api.get('/salles', { params: p }),
  // ✅ FIX: getMesSalles retourne toutes mes salles (ADMIN + CO_ADMIN + MEMBRE)
  getMesSalles:      ()        => api.get('/salles/mes-salles'),
  getById:           (id)      => api.get(`/salles/${id}`),
  create:            (d)       => api.post('/salles', d),
  rejoindre:         (id)      => api.post(`/salles/${id}/rejoindre`),
  // ✅ NEW: demander invitation pour salle privée
  demanderInvitation:(id)      => api.post(`/salles/${id}/demander`),
  quitter:           (id)      => api.delete(`/salles/${id}/quitter`),
  getParticipants:   (id)      => api.get(`/salles/${id}/participants`),
  getMessages:       (id, p)   => api.get(`/salles/${id}/messages`, { params: p }),
  getFichiers:       (id)      => api.get(`/salles/${id}/fichiers`),
  uploadFichier:     (id, fd)  => api.post(`/salles/${id}/fichiers`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
}

export const invitationsAPI = {
  getMes:    ()    => api.get('/invitations'),
  send:      (d)   => api.post('/invitations', d),
  accepter:  (id)  => api.put(`/invitations/${id}/accepter`),
  refuser:   (id)  => api.put(`/invitations/${id}/refuser`),
}

export const seancesAPI = {
  getAll:            (p)   => api.get('/seances', { params: p }),
  getEmploiDuTemps:  (p)   => api.get('/seances/emploi-du-temps', { params: p }),
  create:            (d)   => api.post('/seances', d),
  lancer:            (id)  => api.post(`/seances/${id}/lancer`),
  terminer:          (id)  => api.post(`/seances/${id}/terminer`),
  annuler:           (id)  => api.put(`/seances/${id}/annuler`),
  getDisponibilites: (tid) => api.get('/seances/disponibilites', { params: { tuteurId: tid } }),
  setDisponibilite:  (d)   => api.post('/seances/disponibilites', d),
}

export const tuteursAPI = {
  getAll:  (p)   => api.get('/tuteurs', { params: p }),
  getById: (id)  => api.get(`/tuteurs/${id}`),
}

export const evaluationsAPI = {
  create:      (d)   => api.post('/evaluations', d),
  getByTuteur: (id)  => api.get(`/evaluations/tuteur/${id}`),
}

export const adminAPI = {
  getStats:        ()          => api.get('/admin/stats'),
  getUtilisateurs: (p)         => api.get('/admin/utilisateurs', { params: p }),
  bloquer:         (id, v)     => api.put(`/admin/utilisateurs/${id}/bloquer`, { bloquer: v }),
  supprimer:       (id)        => api.delete(`/admin/utilisateurs/${id}`),
  getTuteursPending:()         => api.get('/admin/tuteurs/pending'),
  validerTuteur:   (id, v)     => api.put(`/admin/tuteurs/${id}/valider`, { accepte: v }),
  getSalles:       ()          => api.get('/admin/salles'),
  fermerSalle:     (id)        => api.put(`/admin/salles/${id}/fermer`),
  getSeances:      (p)         => api.get('/admin/seances', { params: p }),
}

export default api