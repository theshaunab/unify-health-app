import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const STRENGTH_HISTORY = [
  { date: 'Oct 24', squat: 60, deadlift: 80, bench: 45, row: 50 },
  { date: 'Dec 24', squat: 67, deadlift: 90, bench: 50, row: 57 },
  { date: 'Feb 25', squat: 75, deadlift: 100, bench: 55, row: 62 },
  { date: 'Mar 25', squat: 82, deadlift: 110, bench: 60, row: 68 },
]

const VALD_DATA = {
  jumpHeight: { value: 32.4, unit: 'cm', benchmark: 35, prev: 29.8 },
  peakPower:  { value: 2840, unit: 'W',  benchmark: 3000, prev: 2610 },
  rsiModified:{ value: 0.84, unit: '',   benchmark: 1.0,  prev: 0.76 },
  forceAsym:  { value: 4.2,  unit: '%',  benchmark: 10,   prev: 6.1 },
}

const MOVEMENT_SCORES = [
  { label: 'Hip hinge',       score: 8, max: 10 },
  { label: 'Squat pattern',   score: 7, max: 10 },
  { label: 'Push',            score: 9, max: 10 },
  { label: 'Pull',            score: 8, max: 10 },
  { label: 'Single leg',      score: 6, max: 10 },
  { label: 'Rotation',        score: 7, max: 10 },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-brand-surface border border-white/10 rounded-lg px-3 py-2 text-xs">
      <p className="text-brand-offwhite/50 mb-1">{label}</p>
      {payload.map(p => <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value} kg</p>)}
    </div>
  )
}

function VALDCard({ label, data, higherIsBetter = true }) {
  const pct = Math.min(100, Math.round((data.value / data.benchmark) * 100))
  const delta = (data.value - data.prev).toFixed(higherIsBetter ? 1 : 1)
  const positive = higherIsBetter ? delta > 0 : delta < 0
  return (
    <div className="bg-brand-surface border border-white/5 rounded-xl p-4">
      <p className="text-brand-offwhite/40 text-xs mb-2">{label}</p>
      <div className="flex items-end gap-1.5 mb-2">
        <p className="text-brand-offwhite text-2xl font-semibold">{data.value}</p>
        <p className="text-brand-offwhite/40 text-sm mb-0.5">{data.unit}</p>
      </div>
      <div className="h-1 bg-white/5 rounded-full overflow-hidden mb-1.5">
        <div className="h-full bg-brand-sage rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-[10px]">
        <span className={positive ? 'text-brand-sage' : 'text-red-400'}>{delta > 0 ? '+' : ''}{delta} vs last</span>
        <span className="text-brand-offwhite/30">Target: {data.benchmark}{data.unit}</span>
      </div>
    </div>
  )
}

export default function StrengthVALD() {
  const [activeTab, setActiveTab] = useState('strength')
  const tabs = [
    { id: 'strength', label: 'Strength' },
    { id: 'vald', label: 'VALD testing' },
    { id: 'movement', label: 'Movement' },
  ]
  const latest = STRENGTH_HISTORY[STRENGTH_HISTORY.length - 1]
  const first = STRENGTH_HISTORY[0]

  return (
    <div className="p-6 lg:p-8 max-w-5xl overflow-y-auto h-full">
      <div className="mb-6">
        <h1 className="text-brand-offwhite text-2xl font-semibold">Strength &amp; VALD</h1>
        <p className="text-brand-offwhite/40 text-sm mt-1">Performance testing, strength milestones, and movement quality scores.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-brand-surface/50 border border-white/5 rounded-lg p-1 mb-6 w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`text-xs font-medium py-1.5 px-4 rounded-md transition-colors ${activeTab === t.id ? 'bg-brand-sage text-brand-dark' : 'text-brand-offwhite/50 hover:text-brand-offwhite'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Strength tab */}
      {activeTab === 'strength' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Back squat', value: latest.squat, gain: latest.squat - first.squat },
              { label: 'Deadlift', value: latest.deadlift, gain: latest.deadlift - first.deadlift },
              { label: 'Bench press', value: latest.bench, gain: latest.bench - first.bench },
              { label: 'Bent-over row', value: latest.row, gain: latest.row - first.row },
            ].map(s => (
              <div key={s.label} className="bg-brand-surface border border-white/5 rounded-xl p-4">
                <p className="text-brand-offwhite/40 text-xs mb-1">{s.label}</p>
                <div className="flex items-end gap-1.5">
                  <p className="text-brand-offwhite text-2xl font-semibold">{s.value}</p>
                  <p className="text-brand-offwhite/40 text-sm mb-0.5">kg</p>
                </div>
                <p className="text-brand-sage text-xs mt-1 font-medium">+{s.gain} kg since Oct</p>
              </div>
            ))}
          </div>

          <div className="bg-brand-surface border border-white/5 rounded-xl p-5">
            <p className="text-brand-offwhite/60 text-xs uppercase tracking-widest mb-4">Strength progress (kg)</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={STRENGTH_HISTORY} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fill: 'rgba(240,236,230,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(240,236,230,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="squat" name="Squat" fill="#8f9a92" radius={[2, 2, 0, 0]} />
                <Bar dataKey="deadlift" name="Deadlift" fill="#d4a853" radius={[2, 2, 0, 0]} />
                <Bar dataKey="bench" name="Bench" fill="#c6bfb5" radius={[2, 2, 0, 0]} />
                <Bar dataKey="row" name="Row" fill="#7eb8a0" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-brand-surface border border-white/5 rounded-xl p-4">
            <p className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest mb-2">Coach note</p>
            <p className="text-brand-offwhite/70 text-sm leading-relaxed italic">"Deadlift is progressing beautifully. I want to see more focus on single-leg strength in the next phase — that's where you'll unlock the next level."</p>
            <p className="text-brand-offwhite/30 text-xs mt-2">— Shauna</p>
          </div>
        </div>
      )}

      {/* VALD tab */}
      {activeTab === 'vald' && (
        <div className="space-y-5">
          <p className="text-brand-offwhite/40 text-sm">Force plate and jump testing data from your VALD assessments.</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <VALDCard label="Jump height" data={VALD_DATA.jumpHeight} />
            <VALDCard label="Peak power" data={VALD_DATA.peakPower} />
            <VALDCard label="RSI-modified" data={VALD_DATA.rsiModified} />
            <VALDCard label="Force asymmetry" data={VALD_DATA.forceAsym} higherIsBetter={false} />
          </div>
          <div className="bg-brand-surface border border-white/5 rounded-xl p-5">
            <p className="text-brand-offwhite/60 text-xs uppercase tracking-widest mb-3">What these mean</p>
            <div className="space-y-3 text-sm">
              {[
                { label: 'Jump height', desc: 'Measures lower body power. Higher = more explosive.' },
                { label: 'Peak power', desc: 'Maximum power output during a jump. Key marker of athletic capacity.' },
                { label: 'RSI-modified', desc: 'Reactive strength — how well you load and explode. Target is above 1.0.' },
                { label: 'Force asymmetry', desc: 'Left-right imbalance during landing. Under 10% is healthy.' },
              ].map(i => (
                <div key={i.label} className="flex gap-3">
                  <span className="text-brand-sage flex-shrink-0">◈</span>
                  <div>
                    <span className="text-brand-offwhite/70 font-medium">{i.label} — </span>
                    <span className="text-brand-offwhite/40">{i.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Movement tab */}
      {activeTab === 'movement' && (
        <div className="space-y-5">
          <p className="text-brand-offwhite/40 text-sm">Movement quality scores from your last screen. Each pattern is rated 1–10.</p>
          <div className="bg-brand-surface border border-white/5 rounded-xl p-5 space-y-4">
            {MOVEMENT_SCORES.map(s => (
              <div key={s.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-brand-offwhite/70">{s.label}</span>
                  <span className={`font-semibold ${s.score >= 8 ? 'text-brand-sage' : s.score >= 6 ? 'text-brand-gold' : 'text-red-400'}`}>{s.score}/{s.max}</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${s.score >= 8 ? 'bg-brand-sage' : s.score >= 6 ? 'bg-brand-gold' : 'bg-red-400'}`}
                    style={{ width: `${(s.score / s.max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            {[{ label: 'Strength', color: 'text-brand-sage', dot: 'bg-brand-sage' }, { label: 'Needs work', color: 'text-brand-gold', dot: 'bg-brand-gold' }, { label: 'Priority fix', color: 'text-red-400', dot: 'bg-red-400' }].map(l => (
              <div key={l.label} className="flex items-center justify-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${l.dot}`} />
                <span className={l.color}>{l.label}</span>
              </div>
            ))}
          </div>
          <div className="bg-brand-surface border border-white/5 rounded-xl p-4">
            <p className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest mb-2">Focus area</p>
            <p className="text-brand-offwhite/70 text-sm leading-relaxed italic">"Single-leg stability is the priority this phase. Everything else is solid — keep working the hip hinge and we'll retest in 6 weeks."</p>
            <p className="text-brand-offwhite/30 text-xs mt-2">— Shauna</p>
          </div>
        </div>
      )}
    </div>
  )
}
