import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { authAPI } from '../../services/api'
import Header from '../../components/Header/Header'
import { Btn, FormGroup, Avatar, Spinner, ToastContainer } from '../../components/UI'
import { useToast } from '../../hooks/useToast'

const NIVEAUX = ['Licence 1','Licence 2','Licence 3','Master 1','Master 2','Doctorat','BTS','BUT','Prépa']

export default function Parametres() {
  const { user, updateUser } = useAuth()
  const { toasts, success, error } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    prenom:       user?.prenom       || '',
    nom:          user?.nom          || '',
    niveauEtude:  user?.niveau_etude || '',
    filiere:      user?.filiere      || '',
    etablissement:user?.etablissement|| '',
    specialites:  (user?.specialites || []).join(', '),
    biographie:   user?.biographie   || '',
  })

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      const payload = { ...form }
      if (user.role === 'tuteur') {
        payload.specialites = form.specialites.split(',').map(s => s.trim()).filter(Boolean)
      }
      await authAPI.updateProfile(payload)
      updateUser({ prenom: form.prenom, nom: form.nom })
      success('Profil mis à jour !')
    } catch (err) {
      error(err.response?.data?.error || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header title="Paramètres" />
      <ToastContainer toasts={toasts} />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-xl mx-auto flex flex-col gap-5">
          {/* Profile preview */}
          <div className="bg-ink-800 border border-ink-700 rounded-2xl p-5 flex items-center gap-4">
            <Avatar user={user} size="xl" />
            <div>
              <p className="font-display font-bold text-lg text-white">{user?.prenom} {user?.nom}</p>
              <p className="text-sm text-slate-400 capitalize mt-0.5">{user?.role}</p>
              <p className="text-xs text-slate-600 mt-0.5">{user?.email}</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-ink-800 border border-ink-700 rounded-2xl p-6 flex flex-col gap-4">
            <h3 className="font-display font-bold text-white mb-1">Informations personnelles</h3>

            <div className="grid grid-cols-2 gap-3">
              <FormGroup label="Prénom"><input value={form.prenom} onChange={set('prenom')} /></FormGroup>
              <FormGroup label="Nom"><input value={form.nom} onChange={set('nom')} /></FormGroup>
            </div>

            <FormGroup label="Email">
              <input value={user?.email} disabled />
            </FormGroup>

            {user?.role === 'etudiant' && (
              <>
                <FormGroup label="Niveau d'étude">
                  <select value={form.niveauEtude} onChange={set('niveauEtude')}>
                    <option value="">Sélectionner...</option>
                    {NIVEAUX.map(n => <option key={n}>{n}</option>)}
                  </select>
                </FormGroup>
                <FormGroup label="Filière">
                  <input value={form.filiere} onChange={set('filiere')} placeholder="ex: Informatique" />
                </FormGroup>
                <FormGroup label="Établissement">
                  <input value={form.etablissement} onChange={set('etablissement')} placeholder="ex: Université Ibn Tofail" />
                </FormGroup>
              </>
            )}

            {user?.role === 'tuteur' && (
              <>
                <FormGroup label="Spécialités" hint="Séparées par virgule">
                  <input value={form.specialites} onChange={set('specialites')} placeholder="ex: Maths, Physique" />
                </FormGroup>
                <FormGroup label="Biographie">
                  <textarea rows={4} value={form.biographie} onChange={set('biographie')} placeholder="Décrivez votre expertise..." />
                </FormGroup>
              </>
            )}

            <Btn type="submit" disabled={loading} className="mt-1 justify-center">
              {loading ? <Spinner size="sm" /> : '💾 Enregistrer les modifications'}
            </Btn>
          </form>
        </div>
      </div>
    </>
  )
}