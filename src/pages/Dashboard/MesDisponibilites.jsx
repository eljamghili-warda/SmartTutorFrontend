import React, { useState, useEffect } from 'react'
import { seancesAPI } from '../../services/api'
import Header from '../../components/Header/Header'
import { Btn, Spinner, ToastContainer } from '../../components/UI'
import { useToast } from '../../hooks/useToast'

const JOURS = [
  { id:1, court:'Lun', long:'Lundi'    },
  { id:2, court:'Mar', long:'Mardi'    },
  { id:3, court:'Mer', long:'Mercredi' },
  { id:4, court:'Jeu', long:'Jeudi'    },
  { id:5, court:'Ven', long:'Vendredi' },
  { id:6, court:'Sam', long:'Samedi'   },
  { id:7, court:'Dim', long:'Dimanche' },
]
const HEURES = Array.from({ length: 18 }, (_, i) => `${String(i + 6).padStart(2, '0')}:00`)

export default function MesDisponibilites() {
  const [dispos,   setDispos]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form,     setForm]     = useState({ jourSemaine: 1, heureDebut: '09:00', heureFin: '12:00' })
  const [formErr,  setFormErr]  = useState('')
  const { toasts, success, error } = useToast()

  const load = () => {
    setLoading(true)
    seancesAPI.getDisponibilites()
      .then(({ data }) => setDispos(data))
      .catch(() => error('Impossible de charger vos disponibilités'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const validate = () => {
    if (form.heureDebut >= form.heureFin) return "L'heure de fin doit être après l'heure de début"
    const [dh, dm] = form.heureDebut.split(':').map(Number)
    const [fh, fm] = form.heureFin.split(':').map(Number)
    if ((fh * 60 + fm) - (dh * 60 + dm) < 30) return 'La plage doit durer au moins 30 minutes'
    const conflict = dispos.find(d => {
      if (d.jour_semaine !== form.jourSemaine) return false
      return form.heureDebut < d.heure_fin.slice(0, 5) && form.heureFin > d.heure_debut.slice(0, 5)
    })
    if (conflict) return `Chevauchement avec ${conflict.heure_debut.slice(0,5)}–${conflict.heure_fin.slice(0,5)}`
    return null
  }

  const handleAjouter = async () => {
    setFormErr('')
    const err = validate()
    if (err) { setFormErr(err); return }
    setSaving(true)
    try {
      await seancesAPI.setDisponibilite({ jourSemaine: form.jourSemaine, heureDebut: form.heureDebut, heureFin: form.heureFin })
      success('Disponibilité ajoutée !')
      setShowForm(false)
      setForm({ jourSemaine: 1, heureDebut: '09:00', heureFin: '12:00' })
      load()
    } catch (e) { error(e.response?.data?.error || 'Erreur') }
    finally { setSaving(false) }
  }

  const handleSupprimer = async (id) => {
    setDeleting(id)
    try {
      await seancesAPI.deleteDisponibilite(id)
      success('Disponibilité supprimée')
      setDispos(prev => prev.filter(d => d.id !== id))
    } catch { error('Erreur suppression') }
    finally { setDeleting(null) }
  }

  const disposByJour = JOURS.map(j => ({
    ...j,
    plages: dispos.filter(d => d.jour_semaine === j.id)
                  .sort((a, b) => a.heure_debut.localeCompare(b.heure_debut)),
  }))

  const duree = (debut, fin) => {
    const [dh, dm] = debut.split(':').map(Number)
    const [fh, fm] = fin.split(':').map(Number)
    const tot = (fh * 60 + fm) - (dh * 60 + dm)
    return tot >= 60 ? `${Math.floor(tot/60)}h${tot % 60 ? String(tot % 60).padStart(2,'0') : ''}` : `${tot}min`
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Mes disponibilités" />
      <ToastContainer toasts={toasts} />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto flex flex-col gap-4">

          {/* ── En-tête ── */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-bold text-xl text-ink-800">🗓️ Mes disponibilités</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Définissez vos créneaux disponibles. Les étudiants planifient des séances uniquement sur ces plages.
              </p>
            </div>
            <Btn onClick={() => { setShowForm(true); setFormErr('') }}>+ Ajouter une plage</Btn>
          </div>

          {/* ── Stats rapides ── */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: '📅', val: new Set(dispos.map(d => d.jour_semaine)).size, label: 'Jours actifs'    },
              { icon: '⏰', val: dispos.length,                                  label: 'Plages définies' },
              { icon: '✅', val: dispos.length > 0 ? 'Actif' : 'Inactif',       label: 'Statut planning',
                color: dispos.length > 0 ? 'text-emerald-600' : 'text-rose-500' },
            ].map(s => (
              <div key={s.label} className="rounded-xl border border-blue-200 bg-white shadow-sm px-4 py-3 flex items-center gap-3">
                <span className="text-2xl">{s.icon}</span>
                <div>
                  <p className={`font-black text-lg ${s.color || 'text-ink-800'}`}>{s.val}</p>
                  <p className="text-xs text-slate-500">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Alerte aucune dispo ── */}
          {!loading && dispos.length === 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 flex gap-3 items-start">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="font-bold text-amber-700 text-sm">Aucune disponibilité définie</p>
                <p className="text-amber-600 text-xs mt-0.5">Cliquez sur <strong>+ Ajouter une plage</strong> pour commencer.</p>
              </div>
            </div>
          )}

          {/* ── Formulaire ── */}
          {showForm && (
            <div className="rounded-2xl border border-blue-300 bg-white shadow-sm p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-ink-800">➕ Nouvelle plage</h3>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
              </div>

              {/* Jours */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Jour de la semaine</label>
                <div className="flex gap-2 flex-wrap">
                  {JOURS.map(j => (
                    <button key={j.id} type="button"
                      onClick={() => setForm(f => ({ ...f, jourSemaine: j.id }))}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border
                        ${form.jourSemaine === j.id
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-600 border-blue-200 hover:border-blue-400'}`}
                    >{j.long}</button>
                  ))}
                </div>
              </div>

              {/* Heures */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  ['heureDebut', 'Heure de début', HEURES],
                  ['heureFin',   'Heure de fin',   HEURES.filter(h => h > form.heureDebut)],
                ].map(([key, lbl, opts]) => (
                  <div key={key} className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{lbl}</label>
                    <select
                      value={form[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-ink-800 text-sm outline-none focus:border-blue-400 focus:bg-white transition-colors"
                    >
                      {opts.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                ))}
              </div>

              {/* Aperçu durée */}
              {form.heureDebut < form.heureFin && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                  📋 <strong>{JOURS.find(j => j.id === form.jourSemaine)?.long}</strong> de <strong>{form.heureDebut}</strong> à <strong>{form.heureFin}</strong> — durée : <strong>{duree(form.heureDebut, form.heureFin)}</strong>
                </div>
              )}

              {/* Erreur */}
              {formErr && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
                  ⚠️ {formErr}
                </div>
              )}

              <div className="flex gap-2">
                <Btn onClick={handleAjouter} disabled={saving}>{saving ? '…' : '✅ Enregistrer'}</Btn>
                <Btn variant="secondary" onClick={() => { setShowForm(false); setFormErr('') }}>Annuler</Btn>
              </div>
            </div>
          )}

          {/* ── Grille disponibilités ── */}
          {loading ? (
            <div className="flex justify-center py-16"><Spinner /></div>
          ) : (
            <div className="rounded-2xl border border-blue-200 bg-white shadow-sm overflow-hidden">

              {/* Header tableau */}
              <div className="grid grid-cols-[140px_1fr_48px] px-5 py-2.5 bg-blue-50 border-b border-blue-200">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Jour</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Plages horaires</span>
                <span></span>
              </div>

              {disposByJour.map((jour, idx) => (
                <div key={jour.id}
                  className={`grid grid-cols-[140px_1fr_48px] items-center px-5 py-3 min-h-[52px]
                    ${idx < 6 ? 'border-b border-blue-100' : ''}
                    ${jour.plages.length > 0 ? 'bg-blue-50/30' : 'bg-white'}`}
                >
                  {/* Jour */}
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0
                      ${jour.plages.length > 0 ? 'bg-blue-100 border border-blue-200 text-blue-700' : 'bg-slate-100 border border-slate-200 text-slate-400'}`}>
                      {jour.court}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${jour.plages.length > 0 ? 'text-ink-800' : 'text-slate-400'}`}>{jour.long}</p>
                      {jour.plages.length > 0 && (
                        <p className="text-xs text-slate-400">{jour.plages.length} plage{jour.plages.length > 1 ? 's' : ''}</p>
                      )}
                    </div>
                  </div>

                  {/* Plages */}
                  <div className="flex flex-wrap gap-2">
                    {jour.plages.length === 0 ? (
                      <span className="text-xs text-slate-300 italic">Aucune</span>
                    ) : jour.plages.map(p => (
                      <div key={p.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 border border-blue-200">
                        <span className="text-xs font-bold text-blue-700">
                          {p.heure_debut.slice(0,5)} – {p.heure_fin.slice(0,5)}
                        </span>
                        <span className="text-xs text-slate-400 bg-white/60 px-1.5 rounded-full">
                          {duree(p.heure_debut.slice(0,5), p.heure_fin.slice(0,5))}
                        </span>
                        <button
                          onClick={() => handleSupprimer(p.id)}
                          disabled={deleting === p.id}
                          className="text-rose-400 hover:text-rose-600 text-xs ml-0.5 disabled:opacity-40"
                        >
                          {deleting === p.id ? '…' : '✕'}
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Bouton + rapide */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => { setForm(f => ({ ...f, jourSemaine: jour.id })); setShowForm(true); setFormErr('') }}
                      className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 transition-colors flex items-center justify-center text-lg font-bold"
                    >+</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Conseils ── */}
          {!loading && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              <p className="font-bold mb-1">💡 Conseils</p>
              <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                <li>Les étudiants planifient <strong>uniquement dans vos créneaux disponibles</strong>.</li>
                <li>Vous pouvez avoir <strong>plusieurs plages</strong> le même jour (ex: 9h–12h et 14h–18h).</li>
                <li>Une séance planifiée <strong>bloque automatiquement</strong> le créneau.</li>
              </ul>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}