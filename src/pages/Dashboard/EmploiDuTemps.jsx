import React, { useEffect, useState } from 'react'
import { seancesAPI, sallesAPI, tarifsAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import Header from '../../components/Header/Header'
import { Btn, Modal, FormGroup, Spinner, ToastContainer } from '../../components/UI'
import { useToast } from '../../hooks/useToast'
import { useNavigate } from 'react-router-dom'
import { format, startOfWeek, addDays, isSameDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import PaiementModal from '../Paiement/PaiementModal'
import { sendMessage } from '../../services/socket'

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

// ── Composant section étape dans le modal ─────────────────────────────────────
function StepBlock({ num, label, children }) {
  return (
    <div style={{ padding:'14px 24px', borderBottom:'1px solid #E8D5A3' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
        <div style={{ width:22, height:22, borderRadius:'50%', background:'#0A1628', border:'1.5px solid #C5A059', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <span style={{ fontSize:10, fontWeight:800, color:'#C5A059' }}>{num}</span>
        </div>
        <span style={{ fontSize:12, fontWeight:700, color:'#8B9CB5', textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</span>
      </div>
      {children}
    </div>
  )
}

// ── Statuts séances ───────────────────────────────────────────────────────────
const STATUT_SEANCE = {
  EN_ATTENTE_PAIEMENT: {
    label: '⏳ En attente de paiement',
    dot: '#F59E0B',
    bg: 'rgba(245,158,11,0.10)',
    border: 'rgba(245,158,11,0.30)',
    text: '#F59E0B',
    explication: "L'admin de la salle n'a pas encore payé cette séance. Le tuteur attend le paiement avant que la séance soit confirmée.",
  },
  PLANIFIEE: {
    label: '⏳ En attente de paiement',
    dot: '#F59E0B',
    bg: 'rgba(245,158,11,0.10)',
    border: 'rgba(245,158,11,0.30)',
    text: '#F59E0B',
    explication: "L'admin de la salle n'a pas encore payé cette séance.",
  },
  CONFIRMEE: {
    label: '🔒 Confirmée & payée',
    dot: '#3B82F6',
    bg: 'rgba(59,130,246,0.10)',
    border: 'rgba(59,130,246,0.30)',
    text: '#3B82F6',
    explication: "L'admin a payé la séance. Le montant est conservé en sécurité par SmartEdu et sera versé au tuteur après la réalisation de la séance.",
  },
  EN_COURS: {
    label: '🎙️ En cours',
    dot: '#f6e75c',
    bg: 'rgba(167, 165, 61, 0.12)',
    border: 'rgba(237, 220, 95, 0.35)',
    text: '#eeee6b',
    explication: "La séance est actuellement en cours. Les participants sont connectés en appel.",
  },
  REALISEE: {
    label: '✓ Réalisée',
    dot: '#10B981',
    bg: 'rgba(16,185,129,0.10)',
    border: 'rgba(16,185,129,0.30)',
    text: '#10B981',
    explication: "La séance s'est déroulée avec succès. Le paiement a été libéré : 85% versés au tuteur, 15% commission SmartEdu.",
  },
  ANNULEE: {
    label: '✕ Annulée',
    dot: '#EF4444',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.25)',
    text: '#F87171',
    explication: "La séance a été annulée par le tuteur. Si un paiement avait été effectué, l'admin a été remboursé à 100%.",
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
  { key: 'EN_ATTENTE_PAIEMENT', label: 'En attente paiement',   color: '#F59E0B',
    explication: "L'admin de la salle n'a pas encore payé. Le tuteur attend avant de confirmer la séance." },
  { key: 'CONFIRMEE',           label: 'Confirmée & payée',     color: '#3B82F6',
    explication: "L'admin a payé. Le montant est conservé par SmartEdu jusqu'à la réalisation. Tuteur = 85%, SmartEdu = 15%." },
  { key: 'EN_COURS',            label: 'En cours',              color: '#d72cc6',
    explication: "La séance est active maintenant. Les participants sont en appel audio/vidéo." },
  { key: 'REALISEE',            label: 'Réalisée',              color: '#10B981',
    explication: "Séance terminée avec succès. Paiement libéré : 85% → tuteur, 15% → SmartEdu." },
  { key: 'ANNULEE',             label: 'Annulée',               color: '#EF4444',
    explication: "Séance annulée par le tuteur. L'admin est remboursé à 100% si paiement déjà effectué." },
  { key: 'EXAMEN',              label: 'Examen',                color: '#A855F7',
    explication: "Un examen est planifié ce jour. Les étudiants peuvent y participer depuis leur salle." },
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
  const [form, setForm]           = useState({ salleId:'', titre:'', matiere:'', dateDebut:'', duree:60, heureDebut:'', creneauDispo:null })
  const [mesTarifs,  setMesTarifs]  = useState([])
  const [mesDispos,  setMesDispos]  = useState([])
  const [loadingPlan, setLoadingPlan] = useState(false)
  const [loading, setLoading]     = useState(true)
  const [paiementSeanceId, setPaiementSeanceId] = useState(null)
  const [activeLegende, setActiveLegende] = useState(null)
  const { toasts, success, error } = useToast()

  const loadData = () => {
    const debut = format(weekStart, "yyyy-MM-dd'T'00:00:00")
    const fin   = format(addDays(weekStart, 6), "yyyy-MM-dd'T'23:59:59")
    setLoading(true)
    seancesAPI.getEmploiDuTemps({ debut, fin })
      .then(({ data }) => {
        if (Array.isArray(data)) { setSeances(data); setExamens([]) }
        else { setSeances(data.seances || []); setExamens(data.examens || []) }
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

  const handleSalleChange = async (salleId) => {
    setForm(f => ({ ...f, salleId, matiere:'', creneauDispo:null, heureDebut:'', dateDebut:'', duree:60 }))
    if (!salleId) { setMesTarifs([]); setMesDispos([]); return }
    setLoadingPlan(true)
    try {
      const [tarifsRes, disposRes] = await Promise.all([
        tarifsAPI.getMesTarifs(),
        seancesAPI.getDisponibilites(),
      ])
      setMesTarifs(tarifsRes.data || [])
      setMesDispos(disposRes.data || [])
      if ((tarifsRes.data || []).length === 1)
        setForm(f => ({ ...f, matiere: tarifsRes.data[0].matiere }))
    } catch { error('Erreur lors du chargement.') }
    finally { setLoadingPlan(false) }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.matiere?.trim()) { error('Veuillez sélectionner une matière / tarif.'); return }
    if (!form.creneauDispo || !form.heureDebut) { error('Veuillez choisir un créneau et une heure de début.'); return }
    const dateDebut = `${form.creneauDispo.dateStr}T${form.heureDebut}`
    try {
      const { data } = await seancesAPI.create({ titre:form.titre, matiere:form.matiere, salleId:form.salleId, dateDebut, duree:form.duree })
      success('Séance planifiée !')
      setCreate(false)
      setForm({ salleId:'', titre:'', matiere:'', dateDebut:'', duree:60, heureDebut:'', creneauDispo:null })
      setMesTarifs([]); setMesDispos([])
      loadData()

      // ── Envoyer le message dans le chat de la salle (même format que Salle.jsx) ──
      const [hh, mm] = form.heureDebut.split(':').map(Number)
      const finMin   = hh * 60 + mm + Number(form.duree)
      const heureFin = `${String(Math.floor(finMin/60)).padStart(2,'0')}:${String(finMin%60).padStart(2,'0')}`
      const dateStr  = new Date(dateDebut).toLocaleString('fr-FR', {
        weekday:'long', day:'numeric', month:'long', hour:'2-digit', minute:'2-digit'
      })
      sendMessage(form.salleId, `📅 Séance planifiée : ${form.titre} — ${dateStr} → ${heureFin} (${form.duree} min). seance_id:${data.id}`)
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

        {/* ── Légende cliquable ───────────────────────────────────────── */}
        <div style={{ flexShrink:0 }}>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {LEGENDE.map(l => (
              <button key={l.key}
                onClick={() => setActiveLegende(activeLegende === l.key ? null : l.key)}
                style={{
                  display:'flex', alignItems:'center', gap:5,
                  fontSize:11, fontWeight:600,
                  padding:'4px 10px', borderRadius:20,
                  background: activeLegende === l.key ? `${l.color}30` : `${l.color}18`,
                  border: activeLegende === l.key ? `1.5px solid ${l.color}` : `1px solid ${l.color}40`,
                  color: l.color, cursor:'pointer',
                  transition:'all .15s',
                  transform: activeLegende === l.key ? 'translateY(-1px)' : 'none',
                  boxShadow: activeLegende === l.key ? `0 4px 12px ${l.color}25` : 'none',
                }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:l.color, flexShrink:0 }} />
                {l.label}
                <span style={{ fontSize:9, opacity:0.7, marginLeft:1 }}>{activeLegende === l.key ? '▲' : '▼'}</span>
              </button>
            ))}
          </div>

          {/* Fiche explicative */}
          {activeLegende && (() => {
            const l = LEGENDE.find(x => x.key === activeLegende)
            if (!l) return null
            return (
              <div style={{
                marginTop:8, padding:'12px 16px', borderRadius:12,
                background: `${l.color}10`,
                border: `1.5px solid ${l.color}40`,
                display:'flex', alignItems:'flex-start', gap:12,
                animation:'fadeIn .15s ease',
              }}>
                <span style={{
                  width:32, height:32, borderRadius:'50%',
                  background: `${l.color}20`,
                  border: `1.5px solid ${l.color}50`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:14, flexShrink:0,
                }}>
                  {l.key === 'EN_ATTENTE_PAIEMENT' ? '⏳'
                    : l.key === 'CONFIRMEE' ? '🔒'
                    : l.key === 'EN_COURS' ? '🎙️'
                    : l.key === 'REALISEE' ? '✅'
                    : l.key === 'ANNULEE' ? '❌'
                    : '📝'}
                </span>
                <div>
                  <p style={{ fontSize:12, fontWeight:700, color:l.color, margin:'0 0 4px' }}>{l.label}</p>
                  <p style={{ fontSize:12, color:S.text, margin:0, lineHeight:1.6, opacity:0.8 }}>{l.explication}</p>
                </div>
                <button onClick={() => setActiveLegende(null)}
                  style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:S.muted, fontSize:14, padding:'0 0 0 8px', flexShrink:0 }}>✕</button>
              </div>
            )
          })()}
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

      {/* ── Modal planifier AVEC SCROLL ─────────────────────────────────────── */}
      <Modal
        open={showCreate}
        onClose={() => { setCreate(false); setForm({ salleId:'', titre:'', matiere:'', dateDebut:'', duree:60, heureDebut:'', creneauDispo:null }); setMesTarifs([]); setMesDispos([]) }}
        title="📅 Planifier une séance"
      >
        {/* ✅ AJOUT DU SCROLL : max-h-[80vh] + overflow-y-auto */}
        <div style={{ maxHeight: '80vh', overflowY: 'auto' }}>
          <form onSubmit={handleCreate} style={{ display:'flex', flexDirection:'column', gap:0 }}>

            {/* ── Étape 1 : Salle ───────────────────────────────────────── */}
            <StepBlock num="1" label="Salle">
              <select required value={form.salleId} onChange={e => handleSalleChange(e.target.value)}
                style={{ width:'100%', padding:'9px 12px', borderRadius:10, border:`1.5px solid ${S.border}`, background:S.surface, color: form.salleId ? S.text : S.muted, fontSize:13, outline:'none', cursor:'pointer' }}>
                <option value="">— Sélectionner une salle —</option>
                {mesSalles.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
              </select>
            </StepBlock>

            {form.salleId && loadingPlan && (
              <div style={{ textAlign:'center', padding:'16px', color:S.muted, fontSize:13 }}>⏳ Chargement…</div>
            )}

            {form.salleId && !loadingPlan && (<>

              {/* ── Étape 2 : Titre ─────────────────────────────────────── */}
              <StepBlock num="2" label="Titre de la séance">
                <input required value={form.titre}
                  onChange={e => setForm(f=>({...f,titre:e.target.value}))}
                  placeholder="ex: Cours d'Algèbre Linéaire"
                  style={{ width:'100%', padding:'9px 12px', borderRadius:10, border:`1.5px solid ${S.border}`, background:S.surface, color:S.text, fontSize:13, outline:'none', boxSizing:'border-box' }}
                  onFocus={e => e.target.style.borderColor = S.gold}
                  onBlur={e => e.target.style.borderColor = S.border}
                />
              </StepBlock>

              {/* ── Étape 3 : Matière ───────────────────────────────────── */}
              <StepBlock num="3" label="Matière & Tarif">
                {mesTarifs.length > 0 ? (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {mesTarifs.map(t => {
                      const sel = form.matiere === t.matiere
                      return (
                        <button key={t.id} type="button" onClick={() => setForm(f=>({...f,matiere:t.matiere}))}
                          style={{ padding:'8px 14px', borderRadius:10, cursor:'pointer', transition:'all 0.15s', background:sel?S.navy:S.surface, border:sel?`2px solid ${S.gold}`:`1.5px solid ${S.border}`, display:'flex', flexDirection:'column', alignItems:'flex-start', gap:2 }}>
                          <span style={{ fontSize:12, fontWeight:700, color:sel?S.gold:S.text }}>{t.matiere}</span>
                          <span style={{ fontSize:10, color:sel?S.gold:S.muted }}>{t.tarif_heure} DH/h</span>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div>
                    <input required value={form.matiere} onChange={e => setForm(f=>({...f,matiere:e.target.value}))} placeholder="ex: Mathématiques"
                      style={{ width:'100%', padding:'9px 12px', borderRadius:10, border:`1.5px solid ${S.border}`, background:S.surface, color:S.text, fontSize:13, outline:'none', boxSizing:'border-box' }}
                      onFocus={e => e.target.style.borderColor = S.gold} onBlur={e => e.target.style.borderColor = S.border}
                    />
                    <p style={{ fontSize:11, color:'#F59E0B', marginTop:6 }}>⚠️ Configurez vos tarifs pour un calcul automatique.</p>
                  </div>
                )}
                {!form.matiere && <p style={{ fontSize:11, color:'#EF4444', marginTop:6, fontWeight:600 }}>⚠️ Matière obligatoire — l'admin ne peut pas payer sans tarif.</p>}
              </StepBlock>

              {/* ── Étape 4 : Créneau ───────────────────────────────────── */}
              <StepBlock num="4" label="Choisir un créneau">
                {mesDispos.length === 0 ? (
                  <div style={{ borderRadius:10, background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.3)', padding:'12px 14px' }}>
                    <p style={{ fontSize:12, color:'#F59E0B', margin:'0 0 4px' }}>⚠️ Aucune disponibilité configurée.</p>
                    <a href="/dashboard/disponibilites" style={{ fontSize:11, color:'#FCD34D' }}>→ Configurer mes disponibilités</a>
                  </div>
                ) : (() => {
                  const JNOMS = ['','Lun','Mar','Mer','Jeu','Ven','Sam','Dim']
                  const MOIS  = ['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc']
                  const seen  = new Set()
                  const creneaux = []
                  const now   = new Date()
                  const today = new Date(now); today.setHours(0,0,0,0)
                  for (let dayOffset = 0; dayOffset < 28; dayOffset++) {
                    const date = new Date(today)
                    date.setDate(today.getDate() + dayOffset)
                    const jourISO = date.getDay() === 0 ? 7 : date.getDay()
                    for (const d of mesDispos) {
                      if (d.jour_semaine !== jourISO) continue
                      const [h, m] = d.heure_debut.split(':').map(Number)
                      const dateAvecHeure = new Date(date); dateAvecHeure.setHours(h, m, 0, 0)
                      // Vérifier la fin du créneau (pas le début) — si la fin est déjà passée, on skip
                      const [hf, mf] = d.heure_fin.split(':').map(Number)
                      const dateFinCreneau = new Date(date); dateFinCreneau.setHours(hf, mf, 0, 0)
                      if (dateFinCreneau <= now) continue
                      const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
                      const key = `${dateStr}-${d.heure_debut}`
                      if (seen.has(key)) continue
                      seen.add(key)
                      creneaux.push({ key, dateStr, heureDebut:d.heure_debut, heureFin:d.heure_fin, dateObj:new Date(dateAvecHeure), jourNom:JNOMS[jourISO], jour:date.getDate(), mois:MOIS[date.getMonth()] })
                    }
                  }
                  if (creneaux.length === 0) return (
                    <p style={{ fontSize:12, color:'#F59E0B' }}>Aucun créneau dans les 28 prochains jours.</p>
                  )
                  return (
                    <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:220, overflowY:'auto', paddingRight:2 }}>
                      {creneaux.map(cr => {
                        const sel = form.creneauDispo?.key === cr.key
                        const [hd,md] = cr.heureDebut.split(':').map(Number)
                        const [hf,mf] = cr.heureFin.split(':').map(Number)
                        const maxDur = (hf*60+mf) - (hd*60+md)
                        return (
                          <button key={cr.key} type="button"
                            onClick={() => setForm(f => ({ ...f, creneauDispo:cr, heureDebut:cr.heureDebut, duree:Math.min(f.duree||60,maxDur), dateDebut:`${cr.dateStr}T${cr.heureDebut}` }))}
                            style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:11, cursor:'pointer', transition:'all 0.15s', background:sel?S.navy:'transparent', border:sel?`2px solid ${S.gold}`:`1px solid ${S.border}` }}>
                            <div style={{ flexShrink:0, width:40, height:40, borderRadius:10, background:sel?S.goldLt:'rgba(197,160,89,0.06)', border:`1px solid ${sel?S.gold:S.border}`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                              <span style={{ fontSize:8, fontWeight:700, color:sel?S.gold:S.muted, textTransform:'uppercase' }}>{cr.jourNom}</span>
                              <span style={{ fontSize:16, fontWeight:800, color:sel?S.gold:S.text, lineHeight:1.2 }}>{cr.jour}</span>
                              <span style={{ fontSize:8, color:sel?S.gold:S.muted }}>{cr.mois}</span>
                            </div>
                            <div style={{ flex:1, textAlign:'left' }}>
                              <div style={{ fontSize:13, fontWeight:700, color:sel?S.gold:S.text }}>{cr.heureDebut} – {cr.heureFin}</div>
                              <div style={{ fontSize:10, color:S.muted, marginTop:1 }}>{maxDur} min disponibles</div>
                            </div>
                            {sel && <span style={{ color:S.gold }}>✓</span>}
                          </button>
                        )
                      })}
                    </div>
                  )
                })()}
              </StepBlock>

              {/* ── Étape 5 : Heure + Durée ─────────────────────────────── */}
              {form.creneauDispo && (() => {
                const cr = form.creneauDispo
                const [hDeb,mDeb] = cr.heureDebut.split(':').map(Number)
                const [hFin,mFin] = cr.heureFin.split(':').map(Number)
                const totalMinFin = hFin*60+mFin
                const heures = []
                for (let min = hDeb*60+mDeb; min <= totalMinFin-30; min+=30)
                  heures.push(`${String(Math.floor(min/60)).padStart(2,'0')}:${String(min%60).padStart(2,'0')}`)
                const [hC,mC] = (form.heureDebut||cr.heureDebut).split(':').map(Number)
                const dureeMax = totalMinFin - (hC*60+mC)
                const finMin = hC*60+mC + Math.min(form.duree, dureeMax)
                const heureFin = `${String(Math.floor(finMin/60)).padStart(2,'0')}:${String(finMin%60).padStart(2,'0')}`
                return (
                  <StepBlock num="5" label="Heure & Durée">
                    <div style={{ display:'flex', flexWrap:'wrap', gap:7, marginBottom:12 }}>
                      {heures.map(h => {
                        const sel = form.heureDebut === h
                        return (
                          <button key={h} type="button"
                            onClick={() => { const [hh,mm]=h.split(':').map(Number); const max=totalMinFin-(hh*60+mm); setForm(f=>({...f,heureDebut:h,duree:Math.min(f.duree,max),dateDebut:`${cr.dateStr}T${h}`})) }}
                            style={{ padding:'7px 16px', borderRadius:9, cursor:'pointer', fontSize:13, fontWeight:700, transition:'all 0.15s', background:sel?S.gold:'transparent', border:sel?`2px solid ${S.gold}`:`1.5px solid ${S.border}`, color:sel?'#fff':S.muted }}>
                            {h}
                          </button>
                        )
                      })}
                    </div>
                    {form.heureDebut && (
                      <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, background:S.surface, border:`1.5px solid ${S.border}`, borderRadius:10, padding:'6px 12px' }}>
                          <span style={{ fontSize:11, color:S.muted }}>Durée :</span>
                          <input type="number" min={30} max={dureeMax} step={30} value={form.duree}
                            onChange={e => setForm(f=>({...f,duree:Math.min(Number(e.target.value),dureeMax)}))}
                            style={{ width:60, border:'none', background:'transparent', color:S.text, fontSize:13, fontWeight:700, outline:'none', textAlign:'center' }} />
                          <span style={{ fontSize:11, color:S.muted }}>min</span>
                        </div>
                        <div style={{ flex:1, minWidth:140, display:'flex', alignItems:'center', gap:8, padding:'9px 14px', borderRadius:10, background:`linear-gradient(135deg, ${S.navy}, rgba(197,160,89,0.12))`, border:`1.5px solid ${S.goldBrd}` }}>
                          <span style={{ fontSize:18 }}>🕐</span>
                          <div>
                            <div style={{ fontSize:14, fontWeight:800, color:S.gold }}>{form.heureDebut} → {heureFin}</div>
                            <div style={{ fontSize:10, color:S.muted }}>{form.duree} minutes</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </StepBlock>
                )
              })()}

            </>)}

            {/* ── Footer ──────────────────────────────────────────────────── */}
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', padding:'16px 24px 20px', borderTop:`1px solid ${S.border}`, marginTop:4 }}>
              <button type="button"
                onClick={() => { setCreate(false); setForm({ salleId:'', titre:'', matiere:'', dateDebut:'', duree:60, heureDebut:'', creneauDispo:null }); setMesTarifs([]); setMesDispos([]) }}
                style={{ padding:'9px 20px', borderRadius:10, border:`1.5px solid ${S.border}`, background:'transparent', color:S.muted, fontSize:13, fontWeight:600, cursor:'pointer' }}>
                Annuler
              </button>
              <button type="submit"
                disabled={!form.salleId || !form.creneauDispo || !form.heureDebut || !form.matiere || !form.titre}
                style={{ padding:'9px 24px', borderRadius:10, border:'none', fontSize:13, fontWeight:700, cursor:(!form.salleId||!form.creneauDispo||!form.heureDebut||!form.matiere||!form.titre)?'not-allowed':'pointer', transition:'all 0.2s', background:(!form.salleId||!form.creneauDispo||!form.heureDebut||!form.matiere||!form.titre)?'rgba(197,160,89,0.3)':S.gold, color:(!form.salleId||!form.creneauDispo||!form.heureDebut||!form.matiere||!form.titre)?'rgba(255,255,255,0.4)':'#fff' }}>
                📅 Planifier la séance
              </button>
            </div>
          </form>
        </div>
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