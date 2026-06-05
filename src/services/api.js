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
  getAll:             (p)      => api.get('/salles', { params: p }),
  getMesSalles:       ()       => api.get('/salles/mes-salles'),
  getById:            (id)     => api.get(`/salles/${id}`),
  create:             (d)      => api.post('/salles', d),
  rejoindre:          (id)     => api.post(`/salles/${id}/rejoindre`),
  demanderInvitation: (id)     => api.post(`/salles/${id}/demander`),
  quitter:            (id)     => api.delete(`/salles/${id}/quitter`),
  getParticipants:    (id)     => api.get(`/salles/${id}/participants`),
  retirerMembre:      (salleId, userId) => api.delete(`/salles/${salleId}/membres/${userId}`),
  getMessages:        (id, p)  => api.get(`/salles/${id}/messages`, { params: p }),
  getFichiers:        (id)     => api.get(`/salles/${id}/fichiers`),
  uploadFichier:      (id, fd) => api.post(`/salles/${id}/fichiers`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
}

export const invitationsAPI = {
  getMes:   ()    => api.get('/invitations'),
  send:     (d)   => api.post('/invitations', d),
  accepter: (id)  => api.put(`/invitations/${id}/accepter`),
  refuser:  (id)  => api.put(`/invitations/${id}/refuser`),
}

export const seancesAPI = {
  getAll:              (p)   => api.get('/seances', { params: p }),
  getEmploiDuTemps:    (p)   => api.get('/seances/emploi-du-temps', { params: p }),
  create:              (d)   => api.post('/seances', d),
  lancer:              (id)  => api.post(`/seances/${id}/lancer`),
  terminer:            (id)  => api.post(`/seances/${id}/terminer`),
  annuler:             (id)  => api.put(`/seances/${id}/annuler`),
  getDisponibilites:   (tid) => api.get('/seances/disponibilites', { params: { tuteurId: tid } }),
  setDisponibilite:    (d)   => api.post('/seances/disponibilites', d),
  deleteDisponibilite: (id)  => api.delete(`/seances/disponibilites/${id}`),
}

export const tuteursAPI = {
  getAll:  (p)  => api.get('/tuteurs', { params: p }),
  getById: (id) => api.get(`/tuteurs/${id}`),
}

export const evaluationsAPI = {
  create:      (d)  => api.post('/evaluations', d),
  getByTuteur: (id) => api.get(`/evaluations/tuteur/${id}`),
}

export const tarifsAPI = {
  getMesTarifs: ()         => api.get('/tarifs/mes-tarifs'),
  getByTuteur:  (tuteurId) => api.get(`/tarifs/${tuteurId}`),
  upsert:       (d)        => api.post('/tarifs', d),
  delete:       (id)       => api.delete(`/tarifs/${id}`),
}

export const paiementsAPI = {
  getInfoSeance:   (seanceId) => api.get(`/paiements/seance/${seanceId}`),
  payer:           (d)        => api.post('/paiements', d),
  rembourser:      (id)       => api.post(`/paiements/${id}/rembourser`),
  getMesPaiements: ()         => api.get('/paiements/mes-paiements'),
  getMesRevenus:   ()         => api.get('/paiements/mes-revenus'),
}

export const adminAPI = {
  getStats:          ()       => api.get('/admin/stats'),
  getUtilisateurs:   (p)      => api.get('/admin/utilisateurs', { params: p }),
  bloquer:           (id, v)  => api.put(`/admin/utilisateurs/${id}/bloquer`, { bloquer: v }),
  supprimer:         (id)     => api.delete(`/admin/utilisateurs/${id}`),
  getTuteursPending: ()       => api.get('/admin/tuteurs/pending'),
  validerTuteur:     (id, v)  => api.put(`/admin/tuteurs/${id}/valider`, { accepte: v }),
  getSalles:         ()       => api.get('/admin/salles'),
  fermerSalle:       (id)     => api.put(`/admin/salles/${id}/fermer`),
  getSeances:        (p)      => api.get('/admin/seances', { params: p }),
  getRevenus:        ()       => api.get('/admin/revenus'),
  getPaiements:      (p)      => api.get('/admin/paiements', { params: p }),
}

export const examensAPI = {
  // Tuteur
  getMesExamens:         ()               => api.get('/examens/mes-examens'),
  create:                (d)              => api.post('/examens', d),
  update:                (id, d)          => api.put(`/examens/${id}`, d),
  publier:               (id)             => api.put(`/examens/${id}/publier`),
  archiver:              (id)             => api.put(`/examens/${id}/archiver`),
  addQuestion:           (id, d)          => api.post(`/examens/${id}/questions`, d),
  updateQuestion:        (examId, qId, d) => api.put(`/examens/${examId}/questions/${qId}`, d),
  deleteQuestion:        (examId, qId)    => api.delete(`/examens/${examId}/questions/${qId}`),
  getTentatives:         (id)             => api.get(`/examens/${id}/tentatives`),
  // Partagé
  getBySalle:            (salleId)        => api.get(`/examens/salle/${salleId}`),
  getById:               (id)             => api.get(`/examens/${id}`),
  // Étudiant
  getMesExamensEtudiant: ()               => api.get('/examens/mes-examens-etudiant'),
  getMesTentatives:      (id)             => api.get(`/examens/${id}/mes-tentatives`),
  demarrer:              (id)             => api.post(`/examens/${id}/tentatives`),
  soumettre:             (tentativeId, reponses) => api.put(
    `/tentatives/${tentativeId}/soumettre`,
    { reponses }
  ),
  getResultats:          (tentativeId)    => api.get(`/tentatives/${tentativeId}/resultats`),
  // Certificats
  mesCertificats:        ()               => api.get('/certificats/mes-certificats'),
  verifierCertificat:    (numero)         => api.get(`/certificats/verifier/${numero}`),
}

export default api