import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const MOCK_HISTORY = [
  { date: 'Oct 24', squat: 60, deadlift: 80,  bench: 45, row: 50 },
  { date: 'Dec 24', squat: 67, deadlift: 90,  bench: 50, row: 57 },
  { date: 'Feb 25', squat: 75, deadlift: 100, bench: 55, row: 62 },
  { date: 'Mar 25', squat: 82, deadlift: 110, bench: 60, row: 68 },
]

const MOCK_LIFTS = [
  { lift: 'Back squat',    value: 82,  max: 120, color: '#8f9a92' },
  { lift: 'Deadlift',      value: 110, max: 140, color: '#d4a853' },
  { lift: 'Bench press',   value: 60,  max: 90,  color: '#c6bfb5' },
  { lift: 'Bent-over row', value: 68,  max: 100, color: '#8f9a92' },
]

const VALD_DATA = {
  jumpHeight:  { value: 32.4, unit: 'cm', benchmark: 35,   prev: 29.8 },
  peakPower:   { value: 2840, unit: 'W',  benchmark: 3000, prev: 2610 },
  rsiModified: { value: 0.84, unit: '',   benchmark: 1.0,  prev: 0.76 },
  forceAsym:   { value: 4.2,  unit: '%',  benchmark: 10,   prev: 6.1  },
}

const MOVEMENT_SCORES = [
  { label: 'Hip hinge',    score: 8, max: 10 },
  { label: 'Squat pattern',score: 7, max: 10 },
  { label: 'Push',         score: 9, max: 10 },
  { label: 'Pull',         score: 8, max: 10 },
  { label: 'Single leg',   score: 6, max: 10 },
  { label: 'Rotation',     score: 7, max: 10 },
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
  const delta = (data.value - data.prev).toFixed(1)
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
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('strength')
  const [strengthHistory, setStrengthHistory] = useState(MOCK_HISTORY)
  const [currentLifts, setCurrentLifts] = useState(MOCK_LIFTS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    supabase.from('strength_logs').select('*').eq('user_id', user.id).order('log_date', { ascending: true })
      .then(({ data }) => {
        if (data?.length > 0) {
          const byDate = {}
          data.forEach(row => {
            const d = new Date(row.log_date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
            if (!byDate[d]) byDate[d] = { date: d, squat: 0, deadlift: 0, bench: 0, row: 0 }
            if (row.lift_name === 'Back squat')    byDate[d].squat    = Math.max(byDate[d].squat,    row.weight_kg)
            if (row.lift_name === 'Deadlift')      byDate[d].deadlift = Math.max(byDate[d].deadlift, row.weight_kg)
            if (row.lift_name === 'Bench press')   byDate[d].bench    = Math.max(byDate[d].bench,    row.weight_kg)
            if (row.lift_name === 'Bent-over row') byDate[d].row      = Math.max(byDate[d].row,      row.weight_kg)
          })
          setStrengthHistory(Object.values(byDate))
          const lifts = ['Back squat','Deadlift','Bench press','Bent-over row']
          const colors = ['#8f9a92','#d4a853','#c6bfb5','#8f9a92']
          const maxes  = [120, 140, 90, 100]
          setCurrentLifts(lifts.map((lift, i) => {
            const best = Math.max(...data.filter(s => s.lift_name === lift).map(s => s.weight_kg), 0)
            return { lift, value: best || MOCK_LIFTS[i].value, max: maxes[i], color: colors[i] }
          }))
        }
        setLoading(false)
      })
  }, [user?.id])

  return (
    <div className="p-6 lg:p-8 max-w-5xl overflow-y-auto h-full">
      <div className="mb-6">
        <h1 className="text-brand-offwhite text-2xl font-semibold">Strength &amp; VALD</h1>
        <p className="text-brand-offwhite/40 text-sm mt-1">Performance testing, strength milestones, and movement quality.</p>
      </div>

      <div className="flex gap-1 bg-brand-surface/50 border border-white/5 rounded-lg p-1 mb-6 w-fit">
        {['strength','vald','movement'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`text-xs font-medium py-1.5 px-4 rounded-md transition-colors capitalize ${activeTab === t ? 'bg-brand-sage text-brand-dark' : 'text-brand-offwhite/50 hover:text-brand-offwhite'}`}>
            {t === 'vald' ? 'VALD testing' : t}
          </button>
        ))}
      </div>

      {loading && <p className="text-brand-offwhite/30 text-sm text-center py-8">Loading strength data...</p>}

      {!loading && activeTab === 'strength' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {currentLifts.map(s => (
              <div key={s.lift} className="bg-brand-surface border border-white/5 rounded-xl p-4">
                <p className="text-brand-offwhite/40 text-xs mb-1">{s.lift}</p>
                <div className="flex items-end gap-1.5">
                  <p className="text-brand-offwhite text-2xl font-semibold">{s.value}</p>
                  <p className="text-brand-offwhite/40 text-sm mb-0.5">kg</p>
                </div>
                <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(s.value/s.max)*100}%`, backgroundColor: s.color }} />
                </div>
              </div>
            ))}
          </div>
          <div className="bg-brand-surface border border-white/5 rounded-xl p-5">
            <p className="text-brand-offwhite/60 text-xs uppercase tracking-widest mb-4">Strength progress (kg)</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={strengthHistory} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fill: 'rgba(240,236,230,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(240,236,230,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="squat"    name="Squat"    fill="#8f9a92" radius={[2,2,0,0]} />
                <Bar dataKey="deadlift" name="Deadlift" fill="#d4a853" radius={[2,2,0,0]} />
                <Bar dataKey="bench"    name="Bench"    fill="#c6bfb5" radius={[2,2,0,0]} />
                <Bar dataKey="row"      name="Row"      fill="#7eb8a0" radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-brand-surface border border-white/5 rounded-xl p-4">
            <p className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest mb-2">Coach note</p>
            <p className="text-brand-offwhite/70 text-sm leading-relaxed italic">"Deadlift is progressing beautifully. Focus on single-leg strength this phase — that's where the next level unlocks."</p>
            <p className="text-brand-offwhite/30 text-xs mt-2">— Shauna</p>
          </div>
        </div>
      )}

      {!loading && activeTab === 'vald' && (
        <div className="space-y-5">
          <p className="text-brand-offwhite/40 text-sm">Force plate and jump testing data from your VALD assessments.</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <VALDCard label="Jump height"     data={VALD_DATA.jumpHeight} />
            <VALDCard label="Peak power"      data={VALD_DATA.peakPower} />
            <VALDCard label="RSI-modified"    data={VALD_DATA.rsiModified} />
            <VALDCard label="Force asymmetry" data={VALD_DATA.forceAsym} higherIsBetter={false} />
          </div>
          <div className="bg-brand-surface border border-white/5 rounded-xl p-5">
            <p className="text-brand-offwhite/60 text-xs uppercase tracking-widest mb-3">What these mean</p>
            <div className="space-y-3 text-sm">
              {[
                { label: 'Jump height',     desc: 'Measures lower body power. Higher = more explosive.' },
                { label: 'Peak power',      desc: 'Maximum power output during a jump. Key marker of athletic capacity.' },
                { label: 'RSI-modified',    desc: 'Reactive strength — how well you load and explode. Target is above 1.0.' },
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

      {!loading && activeTab === 'movement' && (
        <div className="space-y-5">
          <p className="text-brand-offwhite/40 text-sm">Movement quality scores from your last screen. Each pattern rated 1–10.</p>
          <div className="bg-brand-surface border border-white/5 rounded-xl p-5 space-y-4">
            {MOVEMENT_SCORES.map(s => (
              <div key={s.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-brand-offwhite/70">{s.label}</span>
                  <span className={`font-semibold ${s.score >= 8 ? 'text-brand-sage' : s.score >= 6 ? 'text-brand-gold' : 'text-red-400'}`}>{s.score}/{s.max}</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${s.score >= 8 ? 'bg-brand-sage' : s.score >= 6 ? 'bg-brand-gold' : 'bg-red-400'}`} style={{ width: `${(s.score/s.max)*100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="bg-brand-surface border border-white/5 rounded-xl p-4">
            <p className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest mb-2">Coach note</p>
            <p className="text-brand-offwhite/70 text-sm leading-relaxed italic">"Single-leg stability is the priority this phase. Keep working the hip hinge and we'll retest in 6 weeks."</p>
            <p className="text-brand-offwhite/30 text-xs mt-2">— Shauna</p>
          </div>
        </div>
      )}
    </div>
  )
}
