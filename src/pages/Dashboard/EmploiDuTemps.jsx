import React, { useEffect, useState } from 'react'
import { seancesAPI, sallesAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import Header from '../../components/Header/Header'
import { Btn, Modal, FormGroup, Badge, Spinner, ToastContainer } from '../../components/UI'
import { useToast } from '../../hooks/useToast'
import { format, startOfWeek, addDays, isSameDay } from 'date-fns'
import { fr } from 'date-fns/locale'

const JOURS = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']

const statutConfig = {
  PLANIFIEE:  { color: 'text-amber-400',   bg: 'bg-amber-400/10',   border: 'border-amber-400/25',   label: 'Planifiée' },
  EN_COURS:   { color: 'text-violet-400',  bg: 'bg-violet-400/10',  border: 'border-violet-400/25',  label: 'En cours' },
  REALISEE:   { color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/25', label: 'Réalisée ✓' },
  ANNULEE:    { color: 'text-rose-400',    bg: 'bg-rose-400/10',    border: 'border-rose-400/25',    label: 'Annulée' },
}

export default function EmploiDuTemps() {
  const { user } = useAuth()
  const isTuteur = user?.role === 'tuteur'
  const [seances, setSeances]     = useState([])
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [showCreate, setCreate]   = useState(false)
  const [mesSalles, setMesSalles] = useState([])
  const [form, setForm]           = useState({ salleId:'', titre:'', matiere:'', dateDebut:'', duree:60 })
  const [loading, setLoading]     = useState(true)
  const { toasts, success, error } = useToast()

  const loadSeances = () => {
    const debut = format(weekStart, "yyyy-MM-dd'T'00:00:00")
    const fin   = format(addDays(weekStart, 6), "yyyy-MM-dd'T'23:59:59")
    setLoading(true)
    seancesAPI.getEmploiDuTemps({ debut, fin })
      .then(({ data }) => setSeances(data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadSeances() }, [weekStart])

  useEffect(() => {
    if (isTuteur) {
      // ✅ FIX: utiliser mon_role (pas role)
      sallesAPI.getMesSalles().then(({ data }) => setMesSalles(data.filter(s => s.mon_role === 'CO_ADMIN')))
    }
  }, [isTuteur])

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await seancesAPI.create(form)
      success('Séance planifiée !')
      setCreate(false)
      loadSeances()
    } catch (err) { error(err.response?.data?.error || 'Erreur') }
  }

  // Lancer/Terminer séance = automatique via l'appel (pas de boutons manuels)

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const getDay = (day) => seances.filter(s => isSameDay(new Date(s.date_debut), day))

  return (
    <>
      <Header title="Emploi du temps" />
      <ToastContainer toasts={toasts} />
      <div className="flex-1 overflow-hidden flex flex-col p-6 gap-4">
        {/* Controls */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <Btn variant="secondary" size="sm" onClick={() => setWeekStart(d => addDays(d, -7))}>← Préc.</Btn>
            <span className="font-display font-bold text-sm text-white min-w-[200px] text-center">
              {format(weekStart, 'dd MMM', { locale: fr })} – {format(addDays(weekStart, 6), 'dd MMM yyyy', { locale: fr })}
            </span>
            <Btn variant="secondary" size="sm" onClick={() => setWeekStart(d => addDays(d, 7))}>Suiv. →</Btn>
            <Btn variant="ghost" size="sm" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
              Aujourd'hui
            </Btn>
          </div>
          {isTuteur && <Btn size="sm" onClick={() => setCreate(true)}>➕ Planifier</Btn>}
        </div>

        {/* Legend */}
        <div className="flex gap-3 flex-shrink-0 flex-wrap">
          {Object.entries(statutConfig).map(([k, v]) => (
            <span key={k} className={`text-xs px-2 py-1 rounded-lg border ${v.bg} ${v.border} ${v.color} font-medium`}>
              {v.label}
            </span>
          ))}
        </div>

        {/* Calendar */}
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : (
          <div className="flex-1 grid grid-cols-7 gap-2 overflow-y-auto min-h-0">
            {days.map((day, i) => {
              const daySeances = getDay(day)
              const isToday = isSameDay(day, new Date())
              return (
                <div key={i} className={`flex flex-col rounded-xl border overflow-hidden min-h-[200px]
                  ${isToday ? 'border-violet-500/50 bg-violet-600/5' : 'border-ink-700 bg-ink-800'}`}>
                  <div className={`px-2 py-2.5 text-center border-b flex-shrink-0
                    ${isToday ? 'border-violet-500/30 bg-violet-600/10' : 'border-ink-700 bg-ink-900'}`}>
                    <p className="text-xs font-semibold text-slate-500 uppercase">{JOURS[i]}</p>
                    <p className={`font-display font-bold text-lg mt-0.5 ${isToday ? 'text-violet-400' : 'text-slate-200'}`}>
                      {format(day, 'd')}
                    </p>
                  </div>
                  <div className="flex-1 p-1.5 flex flex-col gap-1.5 overflow-y-auto">
                    {daySeances.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center text-slate-700 text-lg">·</div>
                    ) : daySeances.map(s => {
                      const cfg = statutConfig[s.statut] || statutConfig.PLANIFIEE
                      return (
                        <div key={s.id} className={`rounded-lg p-2 border ${cfg.bg} ${cfg.border} flex flex-col gap-1`}>
                          <p className="text-xs font-bold text-slate-200 leading-tight line-clamp-2">{s.titre}</p>
                          <p className="text-xs text-slate-500">{format(new Date(s.date_debut), 'HH:mm')} · {s.duree}min</p>
                          {s.salle_nom && <p className="text-xs text-slate-600 truncate">🏠 {s.salle_nom}</p>}
                          <p className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</p>
                          {isTuteur && s.statut === 'PLANIFIEE' && (
                            <p className="text-xs text-violet-400 mt-1">📞 Appel = séance lancée</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setCreate(false)} title="📅 Planifier une séance">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <FormGroup label="Salle *">
            <select required value={form.salleId} onChange={set('salleId')}>
              <option value="">Sélectionner une salle...</option>
              {mesSalles.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
            </select>
          </FormGroup>
          <FormGroup label="Titre *">
            <input required value={form.titre} onChange={set('titre')} placeholder="ex: Cours d'Algèbre" />
          </FormGroup>
          <FormGroup label="Matière">
            <input value={form.matiere} onChange={set('matiere')} placeholder="ex: Mathématiques" />
          </FormGroup>
          <div className="grid grid-cols-2 gap-3">
            <FormGroup label="Date et heure *">
              <input type="datetime-local" required value={form.dateDebut} onChange={set('dateDebut')} />
            </FormGroup>
            <FormGroup label="Durée (min)">
              <input type="number" min={15} max={480} value={form.duree} onChange={set('duree')} />
            </FormGroup>
          </div>
          <div className="flex gap-3 justify-end pt-1">
            <Btn variant="secondary" onClick={() => setCreate(false)}>Annuler</Btn>
            <Btn type="submit">Planifier</Btn>
          </div>
        </form>
      </Modal>
    </>
  )
}