import React, { useEffect, useState } from 'react'
import { examensAPI } from '../../services/api'
import { Spinner } from '../../components/UI'

const fmt = (d) => d ? new Date(d).toLocaleDateString('fr-FR', {
  day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
}) : '—'

const S = {
  // Textes
  title:    { fontSize:14, fontWeight:700, color:'#0A1628', fontFamily:'Plus Jakarta Sans,sans-serif', margin:0 },
  label:    { fontSize:12, color:'#64748B', fontFamily:'Plus Jakarta Sans,sans-serif' },
  value:    { fontSize:13, fontWeight:600, color:'#0A1628', fontFamily:'Plus Jakarta Sans,sans-serif' },
  sub:      { fontSize:11, color:'#94A3B8', fontFamily:'Plus Jakarta Sans,sans-serif' },
  // Conteneurs
  card:     { background:'#FFFFFF', border:'1px solid #E8D5A3', borderRadius:12, padding:'14px 16px', marginBottom:8 },
  badge:    { fontSize:11, fontWeight:700, padding:'2px 10px', borderRadius:99, border:'1px solid #E8D5A3', background:'#F5F0E6', color:'#8B6914' },
  divider:  { borderBottom:'1px solid #F5F0E6', marginBottom:8 },
}

export default function PanelDetailsExamen({ examen, onClose }) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState('details')

  useEffect(() => {
    examensAPI.getStats(examen.id)
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [examen.id])

  return (
    <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif' }}>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:20, borderBottom:'2px solid #F5F0E6', paddingBottom:0 }}>
        {[
          { key:'details',   label:'ℹ️ Détails' },
          { key:'questions', label:`❓ Questions${data ? ` (${data.questions.length})` : ''}` },
          { key:'etudiants', label:`👥 Étudiants${data ? ` (${data.stats.total})` : ''}` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding:'8px 16px', borderRadius:'8px 8px 0 0', border:'none', cursor:'pointer',
            fontSize:13, fontWeight: tab===t.key ? 700 : 500,
            color:      tab===t.key ? '#8B6914' : '#94A3B8',
            background: tab===t.key ? '#FDF9F0' : 'transparent',
            borderBottom: tab===t.key ? '2px solid #C5A059' : '2px solid transparent',
            marginBottom:-2, transition:'all 0.15s',
          }}>{t.label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:40 }}><Spinner /></div>
      ) : !data ? (
        <div style={{ textAlign:'center', padding:40, color:'#DC2626', fontSize:13 }}>
          Impossible de charger les statistiques.
        </div>
      ) : tab === 'details' ? (
        <TabDetails examen={data.examen} stats={data.stats} />
      ) : tab === 'questions' ? (
        <TabQuestions questions={data.questions} />
      ) : (
        <TabEtudiants tentatives={data.tentatives} stats={data.stats} notePassage={data.examen.note_passage} />
      )}
    </div>
  )
}

// ─── Onglet Détails ───────────────────────────────────────────────────────────
function TabDetails({ examen, stats }) {
  const kpis = [
    { label:'Tentatives',     value: stats.total,      color:'#1565C0' },
    { label:'Terminées',      value: stats.terminees,  color:'#0EA5E9' },
    { label:'Réussies',       value: stats.reussies,   color:'#059669' },
    { label:'Échecs',         value: stats.echecs,     color:'#DC2626' },
    { label:'Taux réussite',  value: stats.tauxReussite ? `${stats.tauxReussite}%` : '—', color:'#C5A059' },
    { label:'Moy. score',     value: stats.moyenneScore ? `${stats.moyenneScore}%` : '—', color:'#8B6914' },
  ]
  const infos = [
    { label:'Date de publication',      value: fmt(examen.published_at) },
    { label:'Date de début',            value: fmt(examen.date_debut) },
    { label:'Date limite',              value: fmt(examen.date_limite) },
    { label:'Affichage des résultats',  value: fmt(examen.date_affichage_resultats) },
    { label:'Durée',                    value: `${examen.duree_minutes} minutes` },
    { label:'Note de passage',          value: `${examen.note_passage}%` },
    { label:'Tentatives max',           value: examen.max_tentatives || 'Illimité' },
    { label:'Mode affichage',           value: examen.mode_affichage === 'LISTE_COMPLETE' ? 'Liste complète' : 'Question par question' },
  ]

  return (
    <div>
      {/* KPIs */}
      <p style={{ fontSize:11, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:1, marginBottom:10 }}>
        Statistiques
      </p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:20 }}>
        {kpis.map(k => (
          <div key={k.label} style={{ background:'#FAFAFA', border:'1px solid #F0EBE0', borderRadius:10, padding:'10px 14px', textAlign:'center' }}>
            <div style={{ fontSize:22, fontWeight:800, color:k.color }}>{k.value}</div>
            <div style={{ fontSize:10, color:'#94A3B8', marginTop:2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Config */}
      <p style={{ fontSize:11, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:1, marginBottom:10 }}>
        Configuration
      </p>
      <div style={{ background:'#FAFAFA', border:'1px solid #F0EBE0', borderRadius:12, overflow:'hidden' }}>
        {infos.map((info, i) => (
          <div key={info.label} style={{
            display:'flex', justifyContent:'space-between', alignItems:'center',
            padding:'9px 14px',
            borderBottom: i < infos.length-1 ? '1px solid #F5F0E6' : 'none',
          }}>
            <span style={{ fontSize:12, color:'#64748B' }}>{info.label}</span>
            <span style={{ fontSize:12, fontWeight:600, color:'#0A1628' }}>{info.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Onglet Questions ─────────────────────────────────────────────────────────
function TabQuestions({ questions }) {
  const [openIdx, setOpenIdx] = useState(null)

  if (!questions.length) return (
    <p style={{ textAlign:'center', color:'#94A3B8', padding:32, fontSize:13 }}>Aucune question.</p>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      <p style={{ fontSize:11, color:'#94A3B8', marginBottom:4 }}>
        {questions.length} question{questions.length > 1 ? 's' : ''} · {questions.reduce((s,q) => s + parseFloat(q.points||0), 0)} pts total
      </p>
      {questions.map((q, i) => {
        const reponses  = Array.isArray(q.reponses) ? q.reponses : []
        const bonnes    = reponses.filter(r => r.est_correcte)
        const isOpen    = openIdx === i

        return (
          <div key={q.id} style={{ border:'1px solid #E8D5A3', borderRadius:12, overflow:'hidden', background:'#FFFFFF' }}>
            <button onClick={() => setOpenIdx(isOpen ? null : i)} style={{
              width:'100%', display:'flex', alignItems:'flex-start', gap:12,
              padding:'12px 14px', background:'none', border:'none', cursor:'pointer', textAlign:'left',
            }}>
              {/* Numéro */}
              <span style={{
                width:26, height:26, borderRadius:8, flexShrink:0,
                background:'#F5F0E6', border:'1px solid #E8D5A3',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:11, fontWeight:800, color:'#8B6914',
              }}>{i+1}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', gap:6, marginBottom:4, flexWrap:'wrap' }}>
                  <span style={{ fontSize:10, fontWeight:700, padding:'1px 8px', borderRadius:99, background:'#F5F0E6', color:'#8B6914', border:'1px solid #E8D5A3' }}>
                    {q.type}
                  </span>
                  <span style={{ fontSize:10, color:'#C5A059', fontWeight:600 }}>{q.points} pt{q.points>1?'s':''}</span>
                  <span style={{ fontSize:10, color:'#059669', fontWeight:600 }}>✓ {bonnes.length} bonne{bonnes.length>1?'s':''}</span>
                </div>
                <p style={{ fontSize:13, fontWeight:600, color:'#0A1628', margin:0, lineHeight:1.4 }}>{q.texte}</p>
              </div>
              <span style={{ fontSize:11, color:'#94A3B8', flexShrink:0, marginTop:2 }}>{isOpen ? '▲' : '▼'}</span>
            </button>

            {isOpen && (
              <div style={{ padding:'0 14px 12px', borderTop:'1px solid #F5F0E6' }}>
                <div style={{ display:'flex', flexDirection:'column', gap:6, paddingTop:10 }}>
                  {reponses.map(r => (
                    <div key={r.id} style={{
                      display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:9,
                      background: r.est_correcte ? '#F0FDF4' : '#FAFAFA',
                      border: `1px solid ${r.est_correcte ? '#86EFAC' : '#E8D5A3'}`,
                    }}>
                      <span style={{
                        width:20, height:20, borderRadius:'50%', flexShrink:0,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:11, fontWeight:800,
                        background: r.est_correcte ? '#059669' : '#F5F0E6',
                        color: r.est_correcte ? '#FFFFFF' : '#94A3B8',
                        border: `1px solid ${r.est_correcte ? '#059669' : '#E8D5A3'}`,
                      }}>
                        {r.est_correcte ? '✓' : ''}
                      </span>
                      <span style={{ fontSize:12, color: r.est_correcte ? '#065F46' : '#374151', fontWeight: r.est_correcte ? 600 : 400 }}>
                        {r.texte}
                      </span>
                      {r.est_correcte && (
                        <span style={{ marginLeft:'auto', fontSize:10, color:'#059669', fontWeight:700 }}>Correcte</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Onglet Étudiants ─────────────────────────────────────────────────────────
function TabEtudiants({ tentatives, stats, notePassage }) {
  if (!tentatives.length) return (
    <div style={{ textAlign:'center', padding:40 }}>
      <div style={{ fontSize:40, marginBottom:12 }}>👥</div>
      <p style={{ fontSize:14, fontWeight:700, color:'#0A1628' }}>Aucun étudiant n'a encore passé cet examen.</p>
    </div>
  )

  // Garder meilleure tentative par étudiant
  const parEtudiant = {}
  tentatives.forEach(t => {
    const key = t.etudiant_id
    if (!parEtudiant[key]) parEtudiant[key] = { ...t, nb: 0 }
    parEtudiant[key].nb++
    if (t.statut === 'REUSSI' ||
        (parEtudiant[key].statut !== 'REUSSI' && parseFloat(t.pourcentage||0) > parseFloat(parEtudiant[key].pourcentage||0))) {
      parEtudiant[key] = { ...t, nb: parEtudiant[key].nb }
    }
  })
  const etudiants = Object.values(parEtudiant)
    .sort((a,b) => parseFloat(b.pourcentage||0) - parseFloat(a.pourcentage||0))

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {/* Résumé */}
      <div style={{ display:'flex', gap:8, marginBottom:4, flexWrap:'wrap' }}>
        {[
          { label:'Participants', value:etudiants.length, color:'#1565C0' },
          { label:'Réussites',   value:stats.reussies,   color:'#059669' },
          { label:'Taux',        value:stats.tauxReussite?`${stats.tauxReussite}%`:'—', color:'#C5A059' },
        ].map(s => (
          <div key={s.label} style={{ flex:1, minWidth:90, background:'#FAFAFA', border:'1px solid #F0EBE0', borderRadius:10, padding:'8px 12px', textAlign:'center' }}>
            <div style={{ fontSize:18, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:10, color:'#94A3B8' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Liste */}
      {etudiants.map((e, idx) => {
        const reussi = e.statut === 'REUSSI'
        const pct    = parseFloat(e.pourcentage || 0)
        return (
          <div key={e.etudiant_id} style={{
            display:'flex', alignItems:'center', gap:12, padding:'12px 14px',
            background:'#FFFFFF', border:`1px solid ${reussi ? '#86EFAC' : '#E8D5A3'}`,
            borderRadius:12,
          }}>
            {/* Rang */}
            <span style={{
              width:26, height:26, borderRadius:8, flexShrink:0,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:11, fontWeight:800,
              background: idx===0?'#FEF3C7': idx===1?'#F5F0E6':'#FAFAFA',
              color: idx===0?'#D97706': idx===1?'#94A3B8':'#CBD5E1',
              border:'1px solid #E8D5A3',
            }}>{idx+1}</span>

            {/* Avatar */}
            <div style={{
              width:36, height:36, borderRadius:'50%', flexShrink:0,
              background:'linear-gradient(135deg,#1E3A6E,#4A90E2)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:13, fontWeight:800, color:'#FFFFFF',
              border:'1.5px solid #E8D5A3',
            }}>
              {(e.etudiant_prenom?.[0]||'?').toUpperCase()}
            </div>

            {/* Nom */}
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:13, fontWeight:700, color:'#0A1628', margin:0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                {e.etudiant_prenom} {e.etudiant_nom}
              </p>
              <p style={{ fontSize:11, color:'#94A3B8', margin:'2px 0 0' }}>
                {e.nb} tentative{e.nb>1?'s':''}
                {e.statut === 'EN_COURS' && ' · En cours'}
              </p>
            </div>

            {/* Score + barre */}
            <div style={{ textAlign:'right', flexShrink:0 }}>
              {e.statut === 'EN_COURS' ? (
                <span style={{ fontSize:11, color:'#D97706', fontWeight:700 }}>⏳ En cours</span>
              ) : (
                <>
                  <p style={{ fontSize:18, fontWeight:800, color: reussi?'#059669':'#DC2626', margin:0 }}>
                    {isNaN(pct)?'—':`${pct.toFixed(0)}%`}
                  </p>
                  <p style={{ fontSize:10, color: reussi?'#059669':'#DC2626', margin:0, fontWeight:600 }}>
                    {reussi ? '✅ Réussi' : '❌ Échoué'}
                  </p>
                </>
              )}
            </div>

            {/* Barre mini */}
            {e.statut !== 'EN_COURS' && !isNaN(pct) && (
              <div style={{ width:50, flexShrink:0 }}>
                <div style={{ height:4, background:'#F5F0E6', borderRadius:99, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${Math.min(100,pct)}%`, background: reussi?'#059669':'#DC2626', borderRadius:99 }} />
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}