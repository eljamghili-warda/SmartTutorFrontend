import React, { useEffect, useState } from 'react'
import { examensAPI } from '../../services/api'
import Header from '../../components/Header/Header'
import { Spinner, EmptyState } from '../../components/UI'

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', {
  day: '2-digit', month: 'long', year: 'numeric'
}) : '—'

function CertificatCard({ cert }) {
  const [copie, setCopie] = useState(false)

  const copierNumero = () => {
    navigator.clipboard.writeText(cert.numero_certificat)
    setCopie(true)
    setTimeout(() => setCopie(false), 2000)
  }

  return (
    <div className="bg-ink-800 border border-amber-400/20 rounded-2xl p-5 flex flex-col gap-3
      hover:border-amber-400/40 transition-all relative overflow-hidden">
      {/* Decoration */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/5 rounded-full -translate-y-8 translate-x-8" />

      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-2xl flex-shrink-0">
          🎓
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-100 truncate">{cert.examen_titre}</h3>
          <p className="text-xs text-slate-500">{cert.salle_nom}</p>
          <p className="text-xs text-slate-500">Par {cert.tuteur_prenom} {cert.tuteur_nom}</p>
        </div>
        <div className={`px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0
          ${cert.est_valide
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
          {cert.est_valide ? '✅ Valide' : '❌ Révoqué'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-ink-700 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-amber-400">{parseFloat(cert.score_obtenu).toFixed(0)}%</p>
          <p className="text-xs text-slate-500">Score obtenu</p>
        </div>
        <div className="bg-ink-700 rounded-xl p-3 text-center">
          <p className="text-sm font-bold text-slate-200">{fmtDate(cert.date_emission)}</p>
          <p className="text-xs text-slate-500">Date d'émission</p>
        </div>
      </div>

      <div className="bg-ink-700/60 rounded-xl p-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs text-slate-500">Numéro de certificat</p>
          <p className="text-sm font-mono font-semibold text-slate-200">{cert.numero_certificat}</p>
        </div>
        <button onClick={copierNumero}
          className="text-xs text-violet-400 hover:text-violet-300 px-2 py-1 rounded-lg hover:bg-violet-500/10 transition-all flex-shrink-0">
          {copie ? '✅ Copié' : '📋 Copier'}
        </button>
      </div>

      <div className="flex gap-2">
        <a href={`/api/certificats/verifier/${cert.numero_certificat}`} target="_blank" rel="noreferrer"
          className="flex-1 text-center text-xs font-semibold text-slate-400 hover:text-slate-200 py-2 rounded-xl bg-ink-700 hover:bg-ink-600 border border-ink-600 transition-all">
          🔍 Vérifier l'authenticité
        </a>
      </div>
    </div>
  )
}

export default function MesCertificats() {
  const [certs, setCerts]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    examensAPI.mesCertificats()
      .then(({ data }) => setCerts(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-col h-full">
      <Header title="Mes Certificats" subtitle="Vos réussites et diplômes" />

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : certs.length === 0 ? (
          <EmptyState
            icon="🎓"
            title="Aucun certificat"
            desc="Réussissez un examen pour obtenir votre premier certificat." />
        ) : (
          <>
            <div className="mb-4 flex items-center gap-3">
              <div className="bg-amber-400/10 border border-amber-400/20 rounded-xl px-4 py-2">
                <span className="text-amber-400 font-bold text-lg">{certs.length}</span>
                <span className="text-amber-400/70 text-sm ml-2">certificat{certs.length > 1 ? 's' : ''}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {certs.map(c => <CertificatCard key={c.id} cert={c} />)}
            </div>
          </>
        )}
      </div>
    </div>
  )
}