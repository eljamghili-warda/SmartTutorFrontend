import React, { useEffect, useState } from 'react'
import { tuteursAPI, evaluationsAPI, tarifsAPI, seancesAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import Header from '../../components/Header/Header'
import { Btn, Badge, Card, Avatar, Stars, Modal, FormGroup, EmptyState, Spinner, ToastContainer } from '../../components/UI'
import { useToast } from '../../hooks/useToast'

const JOURS_COURT = ['', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const JOURS_LONG  = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

// Parser date_specifique sans décalage UTC
const parseDateLocal = (ds) => {
  if (!ds) return null
  const str = typeof ds === 'string' ? ds : ''
  if (str.includes('T')) {
    const d = new Date(str)
    return new Date(d.getFullYear(), d.getMonth(), d.getDate())
  }
  const [y, m, j] = str.slice(0,10).split('-').map(Number)
  return new Date(y, m-1, j)
}

// Retourne SEULEMENT la prochaine disponibilité par jour de semaine
const getProchainesDispos = (dispos) => {
  const today = new Date()
  today.setHours(0,0,0,0)

  // Garder seulement les dispos futures ou aujourd'hui
  const futures = dispos
    .map(d => ({ ...d, _date: parseDateLocal(d.date_specifique) }))
    .filter(d => d._date && d._date >= today)
    .sort((a, b) => a._date - b._date || a.heure_debut.localeCompare(b.heure_debut))

  // Grouper par jour_semaine — garder seulement la date la plus proche par jour
  const byJour = {}
  futures.forEach(d => {
    const jour = d.jour_semaine
    if (!byJour[jour]) {
      byJour[jour] = { date: d._date, plages: [] }
    }
    // Si c'est la même date que déjà enregistrée, ajouter la plage
    if (d._date.getTime() === byJour[jour].date.getTime()) {
      byJour[jour].plages.push(d)
    }
  })

  return byJour
}

// Bloc disponibilités — affiche la PROCHAINE occurrence par jour
const DisposBlock = ({ tuteurId }) => {
  const [dispos,  setDispos]  = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [open,    setOpen]    = React.useState(false)

  React.useEffect(() => {
    seancesAPI.getDisponibilites(tuteurId)
      .then(({ data }) => setDispos(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [tuteurId])

  const prochainesDispos = getProchainesDispos(dispos)
  const joursActifs = Object.entries(prochainesDispos)
    .sort(([, a], [, b]) => a.date - b.date) // trier par date croissante

  if (loading) return (
    <div style={{ background:'#F5F0E6', borderRadius:12, padding:'10px 14px', textAlign:'center', border:'1px solid #E8D5A3' }}>
      <p style={{ fontSize:12, color:'#94A3B8', margin:0 }}>Chargement des disponibilités…</p>
    </div>
  )

  if (joursActifs.length === 0) return (
    <div style={{ background:'#F5F0E6', borderRadius:12, padding:'10px 14px', textAlign:'center', border:'1px solid #E8D5A3' }}>
      <p style={{ fontSize:12, color:'#94A3B8', margin:0 }}>Aucune disponibilité à venir</p>
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          width:'100%', background:'#F5F0E6', border:'1px solid #E8D5A3',
          borderRadius:12, padding:'8px 14px', cursor:'pointer',
          fontFamily:'Plus Jakarta Sans, sans-serif',
        }}
      >
        <span style={{ fontSize:12, fontWeight:700, color:'#8B6914', textTransform:'uppercase', letterSpacing:1 }}>
          Disponibilités · {joursActifs.length} jour{joursActifs.length > 1 ? 's' : ''}
        </span>
        <span style={{ fontSize:11, color:'#C5A059', fontWeight:700 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ border:'1px solid #E8D5A3', borderRadius:12, background:'#FFFFFF', overflow:'hidden' }}>
          {joursActifs.map(([jourIdx, { date, plages }], i) => {
            const jour = parseInt(jourIdx)
            const dateStr = date.toLocaleDateString('fr-FR', { day:'numeric', month:'short' })
            const isToday = date.toDateString() === new Date().toDateString()
            return (
              <div key={jourIdx}
                style={{
                  display:'flex', alignItems:'flex-start', gap:12,
                  padding:'10px 14px',
                  borderBottom: i < joursActifs.length-1 ? '1px solid #F5F0E6' : 'none',
                }}
              >
                {/* Badge jour + date */}
                <div style={{
                  minWidth:44, borderRadius:10, flexShrink:0, textAlign:'center',
                  background: isToday ? '#0A1628' : '#F5F0E6',
                  border: `1px solid ${isToday ? '#C5A059' : '#E8D5A3'}`,
                  padding:'4px 6px',
                }}>
                  <div style={{ fontSize:9, fontWeight:700, color: isToday ? '#C5A059' : '#8B6914', lineHeight:1, textTransform:'uppercase' }}>
                    {JOURS_COURT[jour]}
                  </div>
                  <div style={{ fontSize:14, fontWeight:800, color: isToday ? '#E8D5A3' : '#0A1628', lineHeight:1.2 }}>
                    {date.getDate()}
                  </div>
                  <div style={{ fontSize:9, color: isToday ? 'rgba(232,213,163,0.6)' : '#94A3B8', lineHeight:1 }}>
                    {date.toLocaleDateString('fr-FR',{month:'short'})}
                  </div>
                </div>

                {/* Plages horaires */}
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:12, fontWeight:700, color:'#0A1628', margin:'0 0 6px', fontFamily:'Plus Jakarta Sans, sans-serif' }}>
                    {JOURS_LONG[jour]}
                    {isToday && <span style={{ marginLeft:6, fontSize:10, color:'#059669', fontWeight:600 }}>· Aujourd'hui</span>}
                  </p>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                    {plages.map(p => (
                      <span key={p.id} style={{
                        fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:99,
                        background:'#F5F0E6', border:'1px solid #E8D5A3', color:'#8B6914',
                        fontFamily:'Plus Jakarta Sans, sans-serif',
                      }}>
                        {p.heure_debut.slice(0,5)} – {p.heure_fin.slice(0,5)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Carte tuteur pour étudiant — avec tarifs + disponibilités
const TuteurCardEtudiant = ({ t, onEval }) => {
  const [tarifs, setTarifs] = React.useState([])
  React.useEffect(() => {
    tarifsAPI.getByTuteur(t.id).then(({ data }) => setTarifs(data)).catch(() => {})
  }, [t.id])

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Avatar user={t} size="lg" />
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-ink-800 truncate">{t.prenom} {t.nom}</p>
          <Stars note={t.note_moyenne || 0} />
          <p className="text-xs text-slate-500 mt-0.5">
            ⭐ {t.note_moyenne ? Number(t.note_moyenne).toFixed(1) : 'Non évalué'}
          </p>
        </div>
      </div>

      {/* Spécialités */}
      <div className="flex flex-wrap gap-1.5">
        {(t.specialites || []).map(s => <Badge key={s} variant="primary">{s}</Badge>)}
      </div>

      {/* Biographie */}
      {t.biographie && (
        <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed">{t.biographie}</p>
      )}

      {/* ── Tarifs ── */}
      {tarifs.length > 0 ? (
        <div className="bg-blue-100/50 rounded-xl p-3 flex flex-col gap-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">💰 Tarifs</p>
          <div className="flex flex-col gap-1.5">
            {tarifs.map(tarif => (
              <div key={tarif.id} className="flex items-center justify-between">
                <span className="text-xs text-blue-800">{tarif.matiere}</span>
                <span className="text-xs font-bold text-blue-700">{Number(tarif.tarif_heure).toLocaleString('fr-FR')} DH/h</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-blue-100/30 rounded-xl p-2.5 text-center">
          <p className="text-xs text-slate-400">Tarifs non renseignés</p>
        </div>
      )}

      {/* ── Disponibilités ── */}
      <DisposBlock tuteurId={t.id} />

      <div className="flex gap-2 pt-2 border-t border-blue-200 mt-auto">
        <Btn size="sm" variant="secondary" onClick={() => onEval(t)} className="w-full justify-center">⭐ Évaluer</Btn>
      </div>
    </Card>
  )
}

// Carte tuteur pour tuteur (vue simple, avec tarifs + disponibilités)
const TuteurCardTuteur = ({ t }) => {
  const [tarifs, setTarifs] = React.useState([])
  React.useEffect(() => {
    tarifsAPI.getByTuteur(t.id).then(({ data }) => setTarifs(data)).catch(() => {})
  }, [t.id])

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Avatar user={t} size="lg" />
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-ink-800 truncate">{t.prenom} {t.nom}</p>
          <Stars note={t.note_moyenne || 0} />
          <p className="text-xs text-slate-500 mt-0.5">
            ⭐ {t.note_moyenne ? Number(t.note_moyenne).toFixed(1) : 'Non évalué'}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {(t.specialites || []).map(s => <Badge key={s} variant="primary">{s}</Badge>)}
      </div>
      {t.biographie && (
        <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed">{t.biographie}</p>
      )}
      {tarifs.length > 0 && (
        <div className="bg-blue-100/50 rounded-xl p-3 flex flex-col gap-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">💰 Tarifs</p>
          {tarifs.map(tarif => (
            <div key={tarif.id} className="flex items-center justify-between">
              <span className="text-xs text-blue-800">{tarif.matiere}</span>
              <span className="text-xs font-bold text-blue-700">{Number(tarif.tarif_heure).toLocaleString('fr-FR')} DH/h</span>
            </div>
          ))}
        </div>
      )}
      {/* ── Disponibilités ── */}
      <DisposBlock tuteurId={t.id} />
    </Card>
  )
}

export default function Tuteurs() {
  const { user } = useAuth()
  const isTuteur = user?.role === 'tuteur'

  const [tuteurs, setTuteurs]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [evalTarget, setEval]     = useState(null)
  const [evalNote, setEvalNote]   = useState(5)
  const [evalComment, setEvalCmt] = useState('')
  const { toasts, success, error } = useToast()

  useEffect(() => {
    tuteursAPI.getAll().then(({ data }) => setTuteurs(data)).finally(() => setLoading(false))

  }, [isTuteur])

  const handleSearch = (q) => {
    tuteursAPI.getAll({ search: q }).then(({ data }) => setTuteurs(data))
  }

  const handleEval = async () => {
    try {
      await evaluationsAPI.create({ tuteurId: evalTarget.id, note: evalNote, commentaire: evalComment })
      success('Évaluation envoyée !')
      setEval(null); setEvalNote(5); setEvalCmt('')
    } catch (err) { error(err.response?.data?.error || 'Erreur') }
  }

  return (
    <>
      <Header title={isTuteur ? 'Explorer les tuteurs' : 'Tuteurs'} onSearch={handleSearch} />
      <ToastContainer toasts={toasts} />
      <div className="flex-1 overflow-y-auto p-6">
        {isTuteur && (
          <p className="text-sm text-slate-500 mb-4">
            Découvrez les autres tuteurs de la plateforme.
          </p>
        )}
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : tuteurs.length === 0 ? (
          <EmptyState icon="👨‍🏫" title="Aucun tuteur disponible" desc="Revenez plus tard." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tuteurs.map(t =>
              isTuteur
                ? <TuteurCardTuteur key={t.id} t={t} />
                : <TuteurCardEtudiant key={t.id} t={t} onEval={setEval} />
            )}
          </div>
        )}
      </div>

      {/* Modal Inviter — étudiant seulement */}
      {!isTuteur && (
        <>
          <Modal open={!!evalTarget} onClose={() => setEval(null)}
            title={`Évaluer ${evalTarget?.prenom || ''} ${evalTarget?.nom || ''}`}>
            <div className="flex flex-col gap-4">
              <FormGroup label="Note">
                <div className="flex gap-2 items-center py-1">
                  <Stars note={evalNote} interactive onChange={setEvalNote} />
                  <span className="text-sm text-slate-500 ml-2">{evalNote}/5</span>
                </div>
              </FormGroup>
              <FormGroup label="Commentaire (optionnel)">
                <textarea rows={3} value={evalComment} onChange={e => setEvalCmt(e.target.value)} placeholder="Votre retour sur ce tuteur..." />
              </FormGroup>
              <div className="flex gap-3 justify-end">
                <Btn variant="secondary" onClick={() => setEval(null)}>Annuler</Btn>
                <Btn onClick={handleEval}>Envoyer</Btn>
              </div>
            </div>
          </Modal>
        </>
      )}
    </>
  )
}