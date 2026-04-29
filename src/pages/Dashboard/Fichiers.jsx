import React, { useEffect, useState } from 'react'
import { sallesAPI } from '../../services/api'
import Header from '../../components/Header/Header'
import { EmptyState, Spinner } from '../../components/UI'

export default function Fichiers() {
  const [salles, setSalles]   = useState([])
  const [loading, setLoading] = useState(true)
  const [fichiers, setFichiers] = useState([])

  useEffect(() => {
    sallesAPI.getMesSalles().then(async ({ data }) => {
      setSalles(data)
      // Charger fichiers de toutes les salles
      const all = await Promise.all(
        data.map(s => sallesAPI.getFichiers(s.id).then(r => r.data.map(f => ({ ...f, salle_nom: s.nom }))))
      )
      setFichiers(all.flat().sort((a, b) => new Date(b.date_upload) - new Date(a.date_upload)))
    }).finally(() => setLoading(false))
  }, [])

  const getIcon = (mime) => {
    if (!mime) return '📄'
    if (mime.includes('pdf')) return '📕'
    if (mime.includes('image')) return '🖼️'
    if (mime.includes('video')) return '🎥'
    if (mime.includes('audio')) return '🎵'
    if (mime.includes('zip') || mime.includes('rar')) return '🗜️'
    if (mime.includes('word') || mime.includes('document')) return '📝'
    if (mime.includes('sheet') || mime.includes('excel')) return '📊'
    return '📄'
  }

  const formatSize = (bytes) => {
    if (!bytes) return '—'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <>
      <Header title="Fichiers partagés" />
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : fichiers.length === 0 ? (
          <EmptyState icon="📁" title="Aucun fichier partagé" desc="Les fichiers partagés dans vos salles apparaîtront ici." />
        ) : (
          <div className="bg-ink-800 border border-ink-700 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-0">
              <div className="contents text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {['', 'Fichier', 'Salle', 'Taille', 'Action'].map((h, i) => (
                  <div key={i} className="px-4 py-3 bg-ink-900 border-b border-ink-700">{h}</div>
                ))}
              </div>
              {fichiers.map((f, i) => (
                <div key={f.id} className="contents text-sm">
                  <div className="px-4 py-3.5 flex items-center border-b border-ink-700/50 text-xl">{getIcon(f.type_mime)}</div>
                  <div className="px-4 py-3.5 flex flex-col justify-center border-b border-ink-700/50">
                    <p className="text-slate-200 font-medium truncate max-w-xs">{f.nom_fichier}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {f.uploader_nom} · {new Date(f.date_upload).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="px-4 py-3.5 flex items-center border-b border-ink-700/50 text-xs text-violet-400">{f.salle_nom}</div>
                  <div className="px-4 py-3.5 flex items-center border-b border-ink-700/50 text-xs text-slate-500">{formatSize(f.taille)}</div>
                  <div className="px-4 py-3.5 flex items-center border-b border-ink-700/50">
                    <a href={`http://localhost:5000/${f.url_telechargement}`} download
                      className="text-xs px-3 py-1.5 rounded-lg bg-violet-600/15 text-violet-400 border border-violet-600/25 hover:bg-violet-600/25 transition-colors">
                      ⬇ Télécharger
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}