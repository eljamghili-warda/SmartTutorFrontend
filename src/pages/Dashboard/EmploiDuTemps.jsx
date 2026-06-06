import React, { useEffect, useState } from 'react'
import { seancesAPI, sallesAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import Header from '../../components/Header/Header'
import { Btn, Modal, FormGroup, Spinner, ToastContainer } from '../../components/UI'
import { useToast } from '../../hooks/useToast'
import { useNavigate } from 'react-router-dom'
import { format, startOfWeek, addDays, isSameDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import PaiementModal from '../Paiement/PaiementModal'

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

// ── Statuts séances ───────────────────────────────────────────────────────────
const STATUT_SEANCE = {
  EN_ATTENTE_PAIEMENT: {
    label: '⏳ En attente de paiement',
    dot: '#F59E0B',
    bg: 'rgba(245,158,11,0.10)',
    border: 'rgba(245,158,11,0.30)',
    text: '#F59E0B',
  },
  PLANIFIEE: {
    label: '✅ Planifiée (payée)',
    dot: '#409be5',
    bg: 'rgba(59,130,246,0.10)',
    border: 'rgba(59,130,246,0.30)',
    text: '#3B82F6',
  },
  EN_COURS: {
    label: '🎙️ En cours',
    dot: '#f6e75c',
    bg: 'rgba(167, 165, 61, 0.12)',
    border: 'rgba(237, 220, 95, 0.35)',
    text: '#eeee6b',
  },
  REALISEE: {
    label: '✓ Réalisée',
    dot: '#10B981',
    bg: 'rgba(16,185,129,0.10)',
    border: 'rgba(16,185,129,0.30)',
    text: '#10B981',
  },
  ANNULEE: {
    label: '✕ Annulée',
    dot: '#EF4444',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.25)',
    text: '#F87171',
  },
}

// ── Statut examens ────────────────────────────────────────────────────────────
const STATUT_EXAMEN = {
  dot: '#A855F7',
  bg: 'rgba(168,85,247,0.10)',
  border: 'rgba(168,85,247,0.35)',
  text: '#C084FC',
  label: '📝 Examen',
}

// ── Légende ───────────────────────────────────────────────────────────────────
const LEGENDE = [
  { key: 'EN_ATTENTE_PAIEMENT', label: 'En attente paiement', color: '#F59E0B' },
  { key: 'PLANIFIEE',           label: 'Planifiée (payée)',   color: '#409be5' },
  { key: 'EN_COURS',            label: 'En cours',            color: '#d72cc6' },
  { key: 'REALISEE',            label: 'Réalisée',            color: '#10B981' },
  { key: 'ANNULEE',             label: 'Annulée',             color: '#EF4444' },
  { key: 'EXAMEN',              label: 'Examen',              color: '#A855F7' },
]

// ── Styles globaux ────────────────────────────────────────────────────────────
const S = {
  bg:      '#F5F0E6',
  surface: '#FFFFFF',
  navy:    '#0A1628',
  navy2:   '#0F2040',
  gold:    '#C5A059',
  goldLt:  'rgba(197,160,89,0.12)',
  goldBrd: 'rgba(197,160,89,0.25)',
  muted:   '#8B9CB5',
  text:    '#0A1628',
  border:  '#E8D5A3',
}

export default function EmploiDuTemps() {
  const { user } = useAuth()
  const isTuteur  = user?.role === 'tuteur'
  const navigate  = useNavigate()

  const [seances,   setSeances]   = useState([])
  const [examens,   setExamens]   = useState([])
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [showCreate, setCreate]   = useState(false)
  const [mesSalles,  setMesSalles] = useState([])
  const [form, setForm]           = useState({ salleId:'', titre:'', matiere:'', dateDebut:'', duree:60 })
  const [loading, setLoading]     = useState(true)
  const [paiementSeanceId, setPaiementSeanceId] = useState(null)
  const { toasts, success, error } = useToast()

  const loadData = () => {
    const debut = format(weekStart, "yyyy-MM-dd'T'00:00:00")
    const fin   = format(addDays(weekStart, 6), "yyyy-MM-dd'T'23:59:59")
    setLoading(true)
    seancesAPI.getEmploiDuTemps({ debut, fin })
      .then(({ data }) => {
        // Support ancien format (tableau) ET nouveau format ({ seances, examens })
        if (Array.isArray(data)) {
          setSeances(data)
          setExamens([])
        } else {
          setSeances(data.seances || [])
          setExamens(data.examens || [])
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [weekStart])

  useEffect(() => {
    if (isTuteur) {
      sallesAPI.getMesSalles().then(({ data }) =>
        setMesSalles(data.filter(s => s.mon_role === 'CO_ADMIN'))
      )
    }
  }, [isTuteur])

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await seancesAPI.create(form)
      success('Séance planifiée !')
      setCreate(false)
      loadData()
    } catch (err) { error(err.response?.data?.error || 'Erreur') }
  }

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const getSeancesDay = (day) =>
    seances.filter(s => isSameDay(new Date(s.date_debut), day))

  const getExamensDay = (day) =>
    examens.filter(e => {
      const debut = e.date_debut ? new Date(e.date_debut) : null
      return debut && isSameDay(debut, day)
    })

  const isToday = (day) => isSameDay(day, new Date())

  return (
    <>
      <Header title="Emploi du temps" />
      <ToastContainer toasts={toasts} />

      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', padding:'20px 24px 24px', gap:16 }}>

        {/* ── Barre contrôle ─────────────────────────────────────────────── */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, flexWrap:'wrap', gap:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <button onClick={() => setWeekStart(d => addDays(d, -7))} style={{ padding:'7px 14px', borderRadius:9, border:`1px solid ${S.border}`, background:S.surface, color:S.text, cursor:'pointer', fontSize:13, fontWeight:600 }}>← Préc.</button>
            <div style={{ minWidth:220, textAlign:'center', fontSize:14, fontWeight:700, color:S.navy }}>
              {format(weekStart, 'dd MMM', { locale: fr })} – {format(addDays(weekStart, 6), 'dd MMM yyyy', { locale: fr })}
            </div>
            <button onClick={() => setWeekStart(d => addDays(d, 7))} style={{ padding:'7px 14px', borderRadius:9, border:`1px solid ${S.border}`, background:S.surface, color:S.text, cursor:'pointer', fontSize:13, fontWeight:600 }}>Suiv. →</button>
            <button onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn:1 }))} style={{ padding:'7px 12px', borderRadius:9, border:`1px solid ${S.goldBrd}`, background:S.goldLt, color:S.gold, cursor:'pointer', fontSize:12, fontWeight:600 }}>Aujourd'hui</button>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {isTuteur && (
              <button onClick={() => navigate('/dashboard/disponibilites')} style={{ padding:'7px 14px', borderRadius:9, border:`1px solid ${S.border}`, background:S.surface, color:S.muted, cursor:'pointer', fontSize:12, fontWeight:600 }}>🗓️ Disponibilités</button>
            )}
            {isTuteur && (
              <button onClick={() => setCreate(true)} style={{ padding:'7px 16px', borderRadius:9, border:'none', background:S.gold, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700 }}>➕ Planifier</button>
            )}
          </div>
        </div>

        {/* ── Légende ────────────────────────────────────────────────────── */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', flexShrink:0 }}>
          {LEGENDE.map(l => (
            <span key={l.key} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, fontWeight:600, padding:'4px 10px', borderRadius:20, background:`${l.color}18`, border:`1px solid ${l.color}40`, color:l.color }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:l.color, flexShrink:0 }} />
              {l.label}
            </span>
          ))}
        </div>

        {/* ── Calendrier ─────────────────────────────────────────────────── */}
        {loading ? (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}><Spinner size="lg" /></div>
        ) : (
          <div style={{ flex:1, display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:8, overflowY:'auto', minHeight:0 }}>
            {days.map((day, i) => {
              const daySeances = getSeancesDay(day)
              const dayExamens = getExamensDay(day)
              const today = isToday(day)
              const total = daySeances.length + dayExamens.length

              return (
                <div key={i} style={{
                  display:'flex', flexDirection:'column', borderRadius:14, overflow:'hidden', minHeight:200,
                  border: today ? '2px solid rgba(197,160,89,0.6)' : `1px solid ${S.border}`,
                  background: today ? 'rgba(197,160,89,0.04)' : S.surface,
                  boxShadow: today ? '0 0 0 3px rgba(197,160,89,0.10)' : 'none',
                }}>
                  {/* En-tête jour */}
                  <div style={{
                    padding:'8px 6px', textAlign:'center', flexShrink:0,
                    borderBottom: today ? '1px solid rgba(197,160,89,0.35)' : `1px solid ${S.border}`,
                    background: today ? 'rgba(197,160,89,0.10)' : '#FAFAF8',
                  }}>
                    <div style={{ fontSize:10, fontWeight:700, color:S.muted, textTransform:'uppercase', letterSpacing:'0.06em' }}>{JOURS[i]}</div>
                    <div style={{ fontSize:22, fontWeight:800, color: today ? S.gold : S.navy, lineHeight:1.1, marginTop:2 }}>{format(day, 'd')}</div>
                    {total > 0 && (
                      <div style={{ fontSize:9, fontWeight:700, color:S.gold, marginTop:2 }}>{total} événement{total>1?'s':''}</div>
                    )}
                  </div>

                  {/* Événements */}
                  <div style={{ flex:1, overflowY:'auto', padding:'6px', display:'flex', flexDirection:'column', gap:5 }}>
                    {total === 0 && (
                      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'#CBD5E1', fontSize:18 }}>·</div>
                    )}

                    {/* Séances */}
                    {daySeances.map(s => {
                      const cfg = STATUT_SEANCE[s.statut] || STATUT_SEANCE.PLANIFIEE
                      const estAdmin = s.mon_role === 'ADMIN'
                      return (
                        <div key={`s-${s.id}`} style={{
                          borderRadius:9, padding:'7px 8px', border:`1px solid ${cfg.border}`,
                          background: cfg.bg, display:'flex', flexDirection:'column', gap:4,
                        }}>
                          {/* Point statut + titre */}
                          <div style={{ display:'flex', alignItems:'flex-start', gap:5 }}>
                            <span style={{ width:7, height:7, borderRadius:'50%', background:cfg.dot, flexShrink:0, marginTop:3 }} />
                            <span style={{ fontSize:11, fontWeight:700, color:S.navy, lineHeight:1.3, flex:1 }}>{s.titre}</span>
                          </div>

                          {/* Heure + durée */}
                          <div style={{ fontSize:10, color:S.muted, paddingLeft:12 }}>
                            {format(new Date(s.date_debut), 'HH:mm')} · {s.duree}min
                          </div>

                          {/* Salle */}
                          {s.salle_nom && (
                            <div style={{ fontSize:10, color:S.muted, paddingLeft:12, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>🏠 {s.salle_nom}</div>
                          )}

                          {/* Statut */}
                          <div style={{ fontSize:10, fontWeight:700, color:cfg.text, paddingLeft:12 }}>{cfg.label}</div>

                          {/* Bouton payer — admin de salle + EN_ATTENTE_PAIEMENT */}
                          {estAdmin && s.statut === 'EN_ATTENTE_PAIEMENT' && s.statut_paiement !== 'PAYE' && (
                            <button onClick={() => setPaiementSeanceId(s.id)} style={{
                              marginTop:2, padding:'4px 0', borderRadius:7, border:'none', cursor:'pointer',
                              fontSize:10, fontWeight:700, background:S.gold, color:'#fff',
                            }}>💳 Payer la séance</button>
                          )}

                          {/* Payée
                          {s.statut_paiement === 'PAYE' && (
                            <div style={{ fontSize:10, fontWeight:700, color:'#10B981', paddingLeft:12 }}>✅ </div>
                          )} */}

                          {/* Info tuteur */}
                          {isTuteur && s.statut === 'EN_ATTENTE_PAIEMENT' && (
                            <div style={{ fontSize:10, color:S.muted, paddingLeft:12 }}>En attente du paiement admin</div>
                          )}
                        </div>
                      )
                    })}

                    {/* Examens */}
                    {dayExamens.map(ex => (
                      <div key={`e-${ex.id}`} style={{
                        borderRadius:9, padding:'7px 8px', border:`1px solid ${STATUT_EXAMEN.border}`,
                        background: STATUT_EXAMEN.bg, display:'flex', flexDirection:'column', gap:4,
                      }}>
                        <div style={{ display:'flex', alignItems:'flex-start', gap:5 }}>
                          <span style={{ width:7, height:7, borderRadius:'50%', background:STATUT_EXAMEN.dot, flexShrink:0, marginTop:3 }} />
                          <span style={{ fontSize:11, fontWeight:700, color:S.navy, lineHeight:1.3, flex:1 }}>{ex.titre}</span>
                        </div>
                        {ex.date_debut && (
                          <div style={{ fontSize:10, color:S.muted, paddingLeft:12 }}>
                            Début : {format(new Date(ex.date_debut), 'HH:mm')}
                            {ex.duree ? ` · ${ex.duree}min` : ''}
                          </div>
                        )}
                        {ex.date_fin && (
                          <div style={{ fontSize:10, color:S.muted, paddingLeft:12 }}>
                            Limite : {format(new Date(ex.date_fin), 'dd/MM HH:mm')}
                          </div>
                        )}
                        {ex.salle_nom && (
                          <div style={{ fontSize:10, color:S.muted, paddingLeft:12, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>🏠 {ex.salle_nom}</div>
                        )}
                        <div style={{ fontSize:10, fontWeight:700, color:STATUT_EXAMEN.text, paddingLeft:12 }}>{STATUT_EXAMEN.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Modal planifier ─────────────────────────────────────────────────── */}
      <Modal open={showCreate} onClose={() => setCreate(false)} title="📅 Planifier une séance">
        <form onSubmit={handleCreate} style={{ display:'flex', flexDirection:'column', gap:16 }}>
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
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <FormGroup label="Date et heure *">
              <input type="datetime-local" required value={form.dateDebut} onChange={set('dateDebut')} />
            </FormGroup>
            <FormGroup label="Durée (min)">
              <input type="number" min={15} max={480} value={form.duree} onChange={set('duree')} />
            </FormGroup>
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', paddingTop:4 }}>
            <Btn variant="secondary" onClick={() => setCreate(false)}>Annuler</Btn>
            <Btn type="submit">Planifier</Btn>
          </div>
        </form>
      </Modal>

      {/* ── Modal paiement ──────────────────────────────────────────────────── */}
      {paiementSeanceId && (
        <PaiementModal
          seanceId={paiementSeanceId}
          onClose={() => setPaiementSeanceId(null)}
          onSuccess={() => {
            setPaiementSeanceId(null)
            success('✅ Paiement effectué ! La séance est confirmée.')
            loadData()
          }}
        />
      )}
    </>
  )
}