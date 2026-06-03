import React from 'react'

export const adminAccent = {
  blue: '#2563eb',
  blueSoft: 'rgba(37,99,235,0.14)',
  gold: '#f59e0b',
  goldSoft: 'rgba(245,158,11,0.14)',
  borderBlue: 'rgba(37,99,235,0.32)',
  borderGold: 'rgba(245,158,11,0.32)',
}

export const adminPage = 'flex-1 overflow-y-auto p-6 flex flex-col gap-5 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.08),transparent_32%),radial-gradient(circle_at_top_right,rgba(37,99,235,0.11),transparent_34%)]'
export const adminPanel = 'bg-ink-800/95 border border-blue-500/20 rounded-2xl overflow-hidden shadow-[0_18px_50px_rgba(0,0,0,0.24)]'
export const adminPanelHeader = 'bg-ink-900/95 border-b border-amber-400/15 text-xs font-semibold text-slate-400 uppercase tracking-wide'
export const adminRow = 'border-b border-blue-500/10 hover:bg-blue-500/5 transition-colors'

export function AdminHero({ title, subtitle, metric, icon = 'Admin' }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-400/25 bg-gradient-to-br from-ink-900 via-ink-800 to-blue-950/40 px-5 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.24)]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/80 to-transparent" />
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-amber-300">{icon}</p>
          <h2 className="font-display text-2xl font-extrabold text-white mt-1">{title}</h2>
          {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
        </div>
        {metric && (
          <div className="hidden sm:block rounded-xl border border-blue-400/25 bg-blue-500/10 px-4 py-3 text-right">
            <p className="text-2xl font-black text-amber-300">{metric.value}</p>
            <p className="text-xs text-slate-400">{metric.label}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export function AdminKpi({ label, value, icon, tone = 'blue', sub }) {
  const isGold = tone === 'gold'
  return (
    <div className={`rounded-2xl border p-5 bg-ink-800/95 ${isGold ? 'border-amber-400/25' : 'border-blue-400/25'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className={`font-display mt-2 text-3xl font-black ${isGold ? 'text-amber-300' : 'text-blue-300'}`}>{value}</p>
          {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
        </div>
        <div className={`rounded-xl px-3 py-2 text-lg ${isGold ? 'bg-amber-400/12 text-amber-300' : 'bg-blue-500/12 text-blue-300'}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

export function AdminFilterButton({ active, children, onClick, count }) {
  return (
    <button onClick={onClick}
      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border flex items-center gap-2
        ${active
          ? 'bg-amber-400/15 text-amber-300 border-amber-400/35 shadow-[0_0_22px_rgba(245,158,11,0.10)]'
          : 'bg-ink-800/90 text-slate-400 border-blue-400/15 hover:border-blue-400/35 hover:text-blue-200'}`}>
      {children}
      {count !== undefined && (
        <span className={`text-xs px-1.5 py-0.5 rounded-full ${active ? 'bg-amber-300/20 text-amber-200' : 'bg-blue-500/10 text-blue-300'}`}>
          {count}
        </span>
      )}
    </button>
  )
}