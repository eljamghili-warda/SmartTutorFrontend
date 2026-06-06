import React, { useState, useEffect } from 'react'
import { seancesAPI } from '../../services/api'
import Header from '../../components/Header/Header'
import { Btn, Spinner, ToastContainer } from '../../components/UI'
import { useToast } from '../../hooks/useToast'

const HEURES = Array.from({ length: 29 }, (_, i) => {
  const h = Math.floor(i / 2) + 6
  const m = i % 2 === 0 ? '00' : '30'
  return `${String(h).padStart(2,'0')}:${m}`
}).filter(h => h <= '22:00')

const JOURS_COURT = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam']
const MOIS_NOMS   = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

const duree = (debut, fin) => {
  const [dh, dm] = debut.split(':').map(Number)
  const [fh, fm] = fin.split(':').map(Number)
  const tot = (fh*60+fm) - (dh*60+dm)
  if (tot <= 0) return ''
  return tot >= 60
    ? `${Math.floor(tot/60)}h${tot%60 ? String(tot%60).padStart(2,'0') : ''}`
    : `${tot}min`
}

const toISO = (d) => {
  const y = d.getFullYear()
  const m = String(d.getMonth()+1).padStart(2,'0')
  const j = String(d.getDate()).padStart(2,'0')
  return `${y}-${m}-${j}`
}

const formatDate = (isoStr) => {
  // Parser manuellement pour éviter tout décalage de fuseau horaire
  const [y, m, j] = isoStr.slice(0,10).split('-').map(Number)
  const d = new Date(y, m-1, j)
  return d.toLocaleDateString('fr-FR', { weekday:'short', day:'numeric', month:'long', year:'numeric' })
}

// ── Mini calendrier ───────────────────────────────────────────────────────────
function Calendrier({ selectedDates, onToggle, disabledBefore }) {
  const today = new Date()
  today.setHours(0,0,0,0)

  const [viewYear,  setViewYear]  = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1) }
    else setViewMonth(m => m-1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y+1) }
    else setViewMonth(m => m+1)
  }

  // Jours du mois
  const firstDay = new Date(viewYear, viewMonth, 1)
  const lastDay  = new Date(viewYear, viewMonth+1, 0)
  // Décalage : lundi = 0
  const startOffset = (firstDay.getDay() + 6) % 7
  const totalCells  = startOffset + lastDay.getDate()
  const rows        = Math.ceil(totalCells / 7)

  const cells = []
  for (let r = 0; r < rows * 7; r++) {
    const dayNum = r - startOffset + 1
    if (dayNum < 1 || dayNum > lastDay.getDate()) { cells.push(null); continue }
    const d = new Date(viewYear, viewMonth, dayNum)
    cells.push(d)
  }

  return (
    <div style={{
      background:'#FFFFFF', border:'1px solid #E8D5A3', borderRadius:16,
      padding:20, width:'100%', maxWidth:380,
      boxShadow:'0 4px 20px rgba(10,22,40,0.08)',
    }}>
      {/* Navigation mois */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <button onClick={prevMonth} style={{
          width:32, height:32, borderRadius:8, border:'1px solid #E8D5A3',
          background:'#FDF9F0', cursor:'pointer', fontSize:16, color:'#8B6914',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>‹</button>
        <span style={{ fontWeight:700, fontSize:15, color:'#0A1628', fontFamily:'Plus Jakarta Sans, sans-serif' }}>
          {MOIS_NOMS[viewMonth]} {viewYear}
        </span>
        <button onClick={nextMonth} style={{
          width:32, height:32, borderRadius:8, border:'1px solid #E8D5A3',
          background:'#FDF9F0', cursor:'pointer', fontSize:16, color:'#8B6914',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>›</button>
      </div>

      {/* En-têtes jours */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, marginBottom:6 }}>
        {['Lu','Ma','Me','Je','Ve','Sa','Di'].map(j => (
          <div key={j} style={{ textAlign:'center', fontSize:11, fontWeight:700,
            color:'#94A3B8', padding:'4px 0', fontFamily:'Plus Jakarta Sans, sans-serif' }}>
            {j}
          </div>
        ))}
      </div>

      {/* Grille jours */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3 }}>
        {cells.map((d, i) => {
          if (!d) return <div key={i} />
          const iso       = toISO(d)
          const isPast    = d < today
          const isToday   = toISO(d) === toISO(today)
          const isSelected = selectedDates.includes(iso)

          let bg = 'transparent', color = '#374151', border = '1px solid transparent'
          if (isPast)       { color = '#CBD5E1' }
          if (isToday)      { border = '1px solid #C5A059'; color = '#8B6914' }
          if (isSelected)   { bg = '#0A1628'; color = '#E8D5A3'; border = '1px solid #C5A059' }

          return (
            <button key={i} onClick={() => !isPast && onToggle(iso)}
              disabled={isPast}
              style={{
                width:'100%', aspectRatio:'1', borderRadius:8,
                background: bg, border, color,
                fontSize:13, fontWeight: isSelected ? 700 : 400,
                cursor: isPast ? 'not-allowed' : 'pointer',
                display:'flex', alignItems:'center', justifyContent:'center',
                transition:'all 0.1s', fontFamily:'Plus Jakarta Sans, sans-serif',
                opacity: isPast ? 0.4 : 1,
              }}
              onMouseEnter={e => { if (!isPast && !isSelected) e.currentTarget.style.background = '#F5F0E6' }}
              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
            >
              {d.getDate()}
            </button>
          )
        })}
      </div>

      {selectedDates.length > 0 && (
        <div style={{
          marginTop:14, padding:'8px 12px', background:'#F5F0E6',
          borderRadius:9, border:'1px solid #E8D5A3',
          fontSize:12, color:'#8B6914', fontWeight:600,
          fontFamily:'Plus Jakarta Sans, sans-serif',
        }}>
          {selectedDates.length} date{selectedDates.length > 1 ? 's' : ''} sélectionnée{selectedDates.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function MesDisponibilites() {
  const [dispos,     setDispos]     = useState([])
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [deleting,   setDeleting]   = useState(null)
  const [showForm,   setShowForm]   = useState(false)
  const [selDates,   setSelDates]   = useState([])   // dates sélectionnées dans le calendrier
  const [heureDebut, setHeureDebut] = useState('09:00')
  const [heureFin,   setHeureFin]   = useState('11:00')
  const [formErr,    setFormErr]    = useState('')
  const { toasts, success, error } = useToast()

  const load = () => {
    setLoading(true)
    seancesAPI.getDisponibilites()
      .then(({ data }) => setDispos(data))
      .catch(() => error('Impossible de charger vos disponibilités'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const toggleDate = (iso) => {
    setSelDates(prev =>
      prev.includes(iso) ? prev.filter(d => d !== iso) : [...prev, iso].sort()
    )
  }

  const handleAjouter = async () => {
    setFormErr('')
    if (selDates.length === 0) { setFormErr('Sélectionnez au moins une date sur le calendrier.'); return }
    if (heureDebut >= heureFin) { setFormErr("L'heure de fin doit être après l'heure de début."); return }
    const [dh,dm] = heureDebut.split(':').map(Number)
    const [fh,fm] = heureFin.split(':').map(Number)
    if ((fh*60+fm)-(dh*60+dm) < 30) { setFormErr('La plage doit durer au moins 30 minutes.'); return }

    setSaving(true)
    let ok = 0, fail = 0
    for (const date of selDates) {
      try {
        await seancesAPI.setDisponibilite({ dateSpecifique: date, heureDebut, heureFin })
        ok++
      } catch (e) {
        const msg = e.response?.data?.error || ''
        if (msg.toLowerCase().includes('chevauchement')) fail++
        else { fail++; console.warn(`Erreur date ${date}:`, msg) }
      }
    }
    setSaving(false)
    if (ok > 0) success(`${ok} disponibilité${ok>1?'s':''} ajoutée${ok>1?'s':''}${fail>0?` (${fail} chevauchement${fail>1?'s':''} ignoré${fail>1?'s':''})`:''} !`)
    else error('Aucune disponibilité ajoutée (chevauchements).')
    setShowForm(false)
    setSelDates([])
    load()
  }

  const handleSupprimer = async (id) => {
    setDeleting(id)
    try {
      await seancesAPI.deleteDisponibilite(id)
      success('Supprimée')
      setDispos(prev => prev.filter(d => d.id !== id))
    } catch { error('Erreur suppression') }
    finally { setDeleting(null) }
  }

  // Grouper par date — extraire YYYY-MM-DD sans conversion timezone
  const parseDateKey = (ds) => {
    if (!ds) return null
    // Prendre seulement la partie date "YYYY-MM-DD" sans interprétation UTC
    const str = typeof ds === 'string' ? ds : ds.toISOString()
    // Si format ISO complet "2026-06-07T..." → prendre les 10 premiers chars directement
    // MAIS si la date UTC est "2026-06-06T22:00:00Z" (décalage -2h), slice donne "2026-06-06"
    // Fix : utiliser la date locale en parsant les composantes
    if (str.includes('T')) {
      const localDate = new Date(str)
      const y = localDate.getFullYear()
      const m = String(localDate.getMonth()+1).padStart(2,'0')
      const j = String(localDate.getDate()).padStart(2,'0')
      return `${y}-${m}-${j}`
    }
    return str.slice(0, 10)
  }

  const disposByDate = {}
  dispos.forEach(d => {
    const key = d.date_specifique
      ? parseDateKey(d.date_specifique)
      : `jour-${d.jour_semaine}`
    if (!disposByDate[key]) disposByDate[key] = []
    disposByDate[key].push(d)
  })

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', fontFamily:'Plus Jakarta Sans, sans-serif' }}>
      <Header title="Mes disponibilités" />
      <ToastContainer toasts={toasts} />

      <div style={{ flex:1, overflowY:'auto', padding:'24px 32px', background:'#F5F0E6' }}>
        <div style={{ maxWidth:820, margin:'0 auto', display:'flex', flexDirection:'column', gap:20 }}>

          {/* ── Header ── */}
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
            <div>
              <h1 style={{ fontSize:22, fontWeight:800, color:'#0A1628', margin:0 }}>Mes disponibilités</h1>
              <p style={{ fontSize:13, color:'#64748B', marginTop:4 }}>
                Choisissez des dates précises sur le calendrier et définissez vos plages horaires.
              </p>
            </div>
            <button
              onClick={() => { setShowForm(true); setFormErr(''); setSelDates([]) }}
              style={{
                display:'flex', alignItems:'center', gap:8,
                padding:'10px 20px', borderRadius:12,
                background:'linear-gradient(135deg, #0A1628, #162B55)',
                color:'#E8D5A3', border:'1px solid rgba(197,160,89,0.3)',
                fontSize:13, fontWeight:700, cursor:'pointer',
                boxShadow:'0 4px 16px rgba(10,22,40,0.2)',
              }}
            >
              <span style={{ fontSize:16 }}>+</span>
              Ajouter des disponibilités
            </button>
          </div>

          {/* ── Stats ── */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12 }}>
            {[
              { label:'Dates configurées', value: Object.keys(disposByDate).length, color:'#1565C0' },
              { label:'Plages définies',    value: dispos.length,                    color:'#C5A059' },
              { label:'Statut',             value: dispos.length > 0 ? 'Actif' : 'Inactif', color: dispos.length > 0 ? '#059669' : '#DC2626' },
            ].map(s => (
              <div key={s.label} style={{
                background:'#FFFFFF', border:'1px solid #E8D5A3', borderRadius:14,
                padding:'16px 20px', boxShadow:'0 2px 8px rgba(10,22,40,0.05)',
              }}>
                <div style={{ fontSize:24, fontWeight:800, color:s.color }}>{s.value}</div>
                <div style={{ fontSize:11, color:'#94A3B8', marginTop:2, fontWeight:500 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* ── Formulaire calendrier ── */}
          {showForm && (
            <div style={{
              background:'#FFFFFF', border:'1px solid #E8D5A3', borderRadius:20,
              padding:24, boxShadow:'0 4px 24px rgba(10,22,40,0.1)',
            }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                <h3 style={{ fontSize:16, fontWeight:700, color:'#0A1628', margin:0 }}>
                  Nouvelle disponibilité
                </h3>
                <button onClick={() => { setShowForm(false); setSelDates([]) }}
                  style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:'#94A3B8' }}>✕</button>
              </div>

              <div style={{ display:'flex', gap:24, flexWrap:'wrap', alignItems:'flex-start' }}>
                {/* Calendrier */}
                <div style={{ flex:'0 0 auto' }}>
                  <p style={{ fontSize:12, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:1, marginBottom:10 }}>
                    1. Sélectionnez les dates
                  </p>
                  <Calendrier selectedDates={selDates} onToggle={toggleDate} />
                </div>

                {/* Heures + Récap */}
                <div style={{ flex:1, minWidth:220, display:'flex', flexDirection:'column', gap:16 }}>
                  <p style={{ fontSize:12, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:1, margin:0 }}>
                    2. Définissez les heures
                  </p>

                  <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                    {[['Heure de début', heureDebut, setHeureDebut, HEURES],
                      ['Heure de fin',   heureFin,   setHeureFin,   HEURES.filter(h => h > heureDebut)]
                    ].map(([lbl, val, setter, opts]) => (
                      <div key={lbl}>
                        <label style={{ fontSize:12, fontWeight:600, color:'#64748B', display:'block', marginBottom:6 }}>{lbl}</label>
                        <select value={val} onChange={e => setter(e.target.value)}
                          style={{
                            width:'100%', padding:'10px 14px', borderRadius:10,
                            border:'1px solid #C5A059',
                            background:'#FFFFFF',
                            fontSize:14, color:'#0A1628', fontWeight:600,
                            outline:'none', cursor:'pointer',
                            fontFamily:'Plus Jakarta Sans, sans-serif',
                            WebkitAppearance:'none',
                            MozAppearance:'none',
                            appearance:'none',
                            backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23C5A059' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                            backgroundRepeat:'no-repeat',
                            backgroundPosition:'right 12px center',
                            paddingRight:36,
                          }}>
                          {opts.map(h => <option key={h} value={h} style={{color:'#0A1628', background:'#FFFFFF'}}>{h}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>

                  {/* Aperçu */}
                  {heureDebut < heureFin && (
                    <div style={{
                      background:'#F5F0E6', border:'1px solid #E8D5A3', borderRadius:10,
                      padding:'10px 14px', fontSize:13, color:'#8B6914',
                    }}>
                      <strong>{heureDebut}</strong> → <strong>{heureFin}</strong>
                      {' '}· <strong>{duree(heureDebut, heureFin)}</strong>
                      {selDates.length > 0 && (
                        <div style={{ marginTop:6, fontSize:12, color:'#94A3B8' }}>
                          Sur {selDates.length} date{selDates.length>1?'s':''}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Erreur */}
                  {formErr && (
                    <div style={{
                      background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:10,
                      padding:'8px 12px', fontSize:13, color:'#DC2626',
                    }}>
                      {formErr}
                    </div>
                  )}

                  {/* Boutons */}
                  <div style={{ display:'flex', gap:10, marginTop:4 }}>
                    <button onClick={handleAjouter} disabled={saving}
                      style={{
                        flex:1, padding:'11px', borderRadius:11,
                        background: saving ? '#CBD5E1' : 'linear-gradient(135deg,#0A1628,#162B55)',
                        color:'#E8D5A3', border:'1px solid rgba(197,160,89,0.3)',
                        fontSize:13, fontWeight:700, cursor: saving ? 'not-allowed' : 'pointer',
                        fontFamily:'Plus Jakarta Sans, sans-serif',
                      }}>
                      {saving ? 'Enregistrement…' : `Enregistrer${selDates.length > 1 ? ` (${selDates.length})` : ''}`}
                    </button>
                    <button onClick={() => { setShowForm(false); setSelDates([]) }}
                      style={{
                        padding:'11px 18px', borderRadius:11,
                        background:'#F5F0E6', border:'1px solid #E8D5A3',
                        fontSize:13, fontWeight:600, color:'#64748B', cursor:'pointer',
                        fontFamily:'Plus Jakarta Sans, sans-serif',
                      }}>
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Liste disponibilités ── */}
          {loading ? (
            <div style={{ display:'flex', justifyContent:'center', padding:48 }}><Spinner /></div>
          ) : dispos.length === 0 ? (
            <div style={{
              background:'#FFFFFF', border:'1px dashed #E8D5A3', borderRadius:16,
              padding:'40px 24px', textAlign:'center',
            }}>
              <div style={{ fontSize:48, marginBottom:12 }}>📅</div>
              <p style={{ fontSize:15, fontWeight:700, color:'#0A1628' }}>Aucune disponibilité</p>
              <p style={{ fontSize:13, color:'#94A3B8', marginTop:4 }}>
                Cliquez sur "Ajouter des disponibilités" et sélectionnez vos dates sur le calendrier.
              </p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <h3 style={{ fontSize:14, fontWeight:700, color:'#0A1628', margin:0 }}>
                Vos disponibilités ({dispos.length})
              </h3>
              {Object.entries(disposByDate)
                .sort(([a],[b]) => a.localeCompare(b))
                .map(([dateKey, plages]) => (
                <div key={dateKey} style={{
                  background:'#FFFFFF', border:'1px solid #E8D5A3', borderRadius:14,
                  overflow:'hidden', boxShadow:'0 2px 8px rgba(10,22,40,0.05)',
                }}>
                  {/* Header date */}
                  <div style={{
                    padding:'10px 16px', background:'linear-gradient(90deg,#0A1628,#162B55)',
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                  }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{
                        width:36, height:36, borderRadius:9, background:'rgba(197,160,89,0.2)',
                        border:'1px solid rgba(197,160,89,0.4)',
                        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                      }}>
                        <span style={{ fontSize:9, fontWeight:700, color:'#C5A059', lineHeight:1 }}>
                          {dateKey.startsWith('jour-') ? '—'
                            : (() => { const [y,m,j]=dateKey.slice(0,10).split('-').map(Number); return new Date(y,m-1,j).toLocaleDateString('fr-FR',{month:'short'}).toUpperCase() })()}
                        </span>
                        <span style={{ fontSize:15, fontWeight:800, color:'#E8D5A3', lineHeight:1 }}>
                          {dateKey.startsWith('jour-') ? ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'][parseInt(dateKey.split('-')[1])-1]
                            : parseInt(dateKey.slice(8,10))}
                        </span>
                      </div>
                      <div>
                        <p style={{ fontSize:13, fontWeight:700, color:'#FFFFFF', margin:0 }}>
                          {dateKey.startsWith('jour-')
                            ? ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'][parseInt(dateKey.split('-')[1])-1]
                            : formatDate(dateKey.slice(0,10))}
                        </p>
                        <p style={{ fontSize:11, color:'rgba(255,255,255,0.45)', margin:0 }}>
                          {plages.length} plage{plages.length>1?'s':''}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Plages */}
                  <div style={{ padding:'12px 16px', display:'flex', flexWrap:'wrap', gap:8 }}>
                    {plages.sort((a,b) => a.heure_debut.localeCompare(b.heure_debut)).map(p => (
                      <div key={p.id} style={{
                        display:'flex', alignItems:'center', gap:8,
                        padding:'7px 12px', borderRadius:99,
                        background:'#F5F0E6', border:'1px solid #E8D5A3',
                      }}>
                        <span style={{ fontSize:13, fontWeight:700, color:'#0A1628' }}>
                          {p.heure_debut.slice(0,5)} – {p.heure_fin.slice(0,5)}
                        </span>
                        <span style={{
                          fontSize:11, color:'#8B6914', background:'rgba(197,160,89,0.15)',
                          padding:'1px 7px', borderRadius:99,
                        }}>
                          {duree(p.heure_debut.slice(0,5), p.heure_fin.slice(0,5))}
                        </span>
                        <button onClick={() => handleSupprimer(p.id)} disabled={deleting===p.id}
                          style={{
                            width:20, height:20, borderRadius:'50%',
                            background:'none', border:'none',
                            color: deleting===p.id ? '#CBD5E1' : '#FCA5A5',
                            cursor: deleting===p.id ? 'not-allowed' : 'pointer',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            fontSize:14, fontWeight:700, padding:0,
                          }}>
                          {deleting===p.id ? '…' : '×'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}