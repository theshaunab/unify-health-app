import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const MOCK_HISTORY = [
  { date: 'Oct 24', weight: 72.4, bodyFat: 28.2, muscleMass: 47.1, bmi: 24.8, visceralFat: 8,  bmr: 1420 },
  { date: 'Nov 24', weight: 71.8, bodyFat: 27.6, muscleMass: 47.4, bmi: 24.6, visceralFat: 7,  bmr: 1432 },
  { date: 'Dec 24', weight: 71.2, bodyFat: 26.9, muscleMass: 47.8, bmi: 24.4, visceralFat: 7,  bmr: 1441 },
  { date: 'Jan 25', weight: 70.6, bodyFat: 26.1, muscleMass: 48.2, bmi: 24.2, visceralFat: 6,  bmr: 1455 },
  { date: 'Feb 25', weight: 70.1, bodyFat: 25.4, muscleMass: 48.6, bmi: 24.0, visceralFat: 6,  bmr: 1463 },
  { date: 'Mar 25', weight: 69.8, bodyFat: 24.8, muscleMass: 49.1, bmi: 23.9, visceralFat: 5,  bmr: 1471 },
]

const SEGMENT_DATA = [
  { label: 'Right Arm', muscle: 3.2, fat: 0.8 },
  { label: 'Left Arm',  muscle: 3.1, fat: 0.7 },
  { label: 'Trunk',     muscle: 26.4, fat: 8.2 },
  { label: 'Right Leg', muscle: 9.8, fat: 2.1 },
  { label: 'Left Leg',  muscle: 9.6, fat: 2.0 },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-brand-surface border border-white/10 rounded-lg px-3 py-2 text-xs">
      <p className="text-brand-offwhite/50 mb-1">{label}</p>
      {payload.map(p => <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>)}
    </div>
  )
}

function StatCard({ label, value, unit, change, positive, sub }) {
  return (
    <div className="bg-brand-surface border border-white/5 rounded-xl p-4">
      <p className="text-brand-offwhite/40 text-xs mb-1">{label}</p>
      <div className="flex items-end gap-2">
        <p className="text-brand-offwhite text-2xl font-semibold">{value}</p>
        <p className="text-brand-offwhite/40 text-sm mb-0.5">{unit}</p>
      </div>
      {change && <p className={`text-xs mt-1 font-medium ${positive ? 'text-brand-sage' : 'text-red-400'}`}>{change} vs last scan</p>}
      {sub && <p className="text-brand-offwhite/30 text-xs mt-1">{sub}</p>}
    </div>
  )
}

function ChartCard({ title, dataKey, color, data, unit }) {
  return (
    <div className="bg-brand-surface border border-white/5 rounded-xl p-5">
      <p className="text-brand-offwhite/60 text-xs uppercase tracking-widest mb-4">{title}</p>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="date" tick={{ fill: 'rgba(240,236,230,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'rgba(240,236,230,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} domain={['auto','auto']} />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey={dataKey} name={`${title} (${unit})`} stroke={color} strokeWidth={2} dot={{ fill: color, r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function SegmentBar({ label, muscle, fat }) {
  const total = muscle + fat
  const musclePct = Math.round((muscle / total) * 100)
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-brand-offwhite/60">{label}</span>
        <span className="text-brand-offwhite/40">{muscle}kg muscle · {fat}kg fat</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden flex">
        <div className="h-full bg-brand-sage rounded-l-full" style={{ width: `${musclePct}%` }} />
        <div className="h-full bg-red-400/40 rounded-r-full" style={{ width: `${100 - musclePct}%` }} />
      </div>
    </div>
  )
}

export default function BodyComposition() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [history, setHistory] = useState(MOCK_HISTORY)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    supabase.from('body_scans').select('*').eq('user_id', user.id).order('scan_date', { ascending: true })
      .then(({ data }) => {
        if (data?.length > 0) {
          setHistory(data.map(s => ({
            date:        new Date(s.scan_date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
            weight:      s.weight,
            bodyFat:     s.body_fat_pct,
            muscleMass:  s.muscle_mass,
            bmi:         s.bmi,
            visceralFat: s.visceral_fat,
            bmr:         s.bmr,
          })))
        }
        setLoading(false)
      })
  }, [user?.id])

  const latest   = history[history.length - 1]
  const previous = history[history.length - 2]
  const first    = history[0]

  const delta = (cur, prev, invert = false) => {
    if (!prev) return null
    const diff = (cur - prev).toFixed(1)
    return { label: `${diff > 0 ? '+' : ''}${diff}`, positive: invert ? diff < 0 : diff > 0 }
  }

  const wDelta = delta(latest?.weight,     previous?.weight,     true)
  const fDelta = delta(latest?.bodyFat,    previous?.bodyFat,    true)
  const mDelta = delta(latest?.muscleMass, previous?.muscleMass)

  return (
    <div className="p-6 lg:p-8 max-w-5xl overflow-y-auto h-full">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-brand-offwhite text-2xl font-semibold">Body composition</h1>
          <p className="text-brand-offwhite/40 text-sm mt-1">InBody scan results over time.</p>
        </div>
        <div className="text-right">
          <p className="text-brand-offwhite/30 text-xs">Last scan</p>
          <p className="text-brand-offwhite/60 text-sm font-medium">{latest?.date || '—'}</p>
        </div>
      </div>

      <div className="flex gap-1 bg-brand-surface/50 border border-white/5 rounded-lg p-1 mb-6 w-fit">
        {['overview','trends','segmental'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`text-xs font-medium py-1.5 px-4 rounded-md transition-colors capitalize ${activeTab === t ? 'bg-brand-sage text-brand-dark' : 'text-brand-offwhite/50 hover:text-brand-offwhite'}`}>
            {t}
          </button>
        ))}
      </div>

      {loading && <p className="text-brand-offwhite/30 text-sm text-center py-8">Loading scan data...</p>}

      {!loading && activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Body weight" value={latest?.weight}        unit="kg" change={wDelta?.label}               positive={wDelta?.positive} />
            <StatCard label="Body fat"    value={`${latest?.bodyFat}%`} unit=""   change={fDelta ? fDelta.label+'%' : null} positive={fDelta?.positive} />
            <StatCard label="Muscle mass" value={latest?.muscleMass}    unit="kg" change={mDelta?.label}               positive={mDelta?.positive} />
            <StatCard label="BMI"         value={latest?.bmi}           unit=""   sub="Normal range: 18.5–24.9" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard label="Visceral fat"  value={latest?.visceralFat} unit="" sub="Target: below 10" />
            <StatCard label="BMR"           value={latest?.bmr}         unit="kcal/day" sub="Calories at rest" />
            <div className="bg-brand-surface border border-white/5 rounded-xl p-4">
              <p className="text-brand-offwhite/40 text-xs mb-3">Overall progress</p>
              <div className="space-y-2.5">
                {first && latest && [
                  { label: 'Weight lost',   value: `${(first.weight - latest.weight).toFixed(1)} kg`,          color: 'text-brand-sage' },
                  { label: 'Fat lost',      value: `${(first.bodyFat - latest.bodyFat).toFixed(1)}%`,          color: 'text-brand-sage' },
                  { label: 'Muscle gained', value: `+${(latest.muscleMass - first.muscleMass).toFixed(1)} kg`, color: 'text-brand-gold' },
                ].map(s => (
                  <div key={s.label} className="flex justify-between text-sm">
                    <span className="text-brand-offwhite/50">{s.label}</span>
                    <span className={`font-semibold ${s.color}`}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-brand-surface border border-white/5 rounded-xl p-4">
            <p className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest mb-2">Coach note</p>
            <p className="text-brand-offwhite/70 text-sm leading-relaxed italic">"Excellent progress — you're losing fat while gaining muscle, which is exactly the goal. Keep the protein high and trust the program."</p>
            <p className="text-brand-offwhite/30 text-xs mt-2">— Shauna</p>
          </div>
        </div>
      )}

      {!loading && activeTab === 'trends' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Body weight"  dataKey="weight"     color="#8f9a92" data={history} unit="kg" />
          <ChartCard title="Body fat %"   dataKey="bodyFat"    color="#d4a853" data={history} unit="%" />
          <ChartCard title="Muscle mass"  dataKey="muscleMass" color="#7eb8a0" data={history} unit="kg" />
          <ChartCard title="BMR (kcal)"   dataKey="bmr"        color="#c6bfb5" data={history} unit="kcal" />
        </div>
      )}

      {!loading && activeTab === 'segmental' && (
        <div className="space-y-5">
          <p className="text-brand-offwhite/40 text-sm">Muscle and fat distribution by body segment from your last InBody scan.</p>
          <div className="bg-brand-surface border border-white/5 rounded-xl p-5 space-y-5">
            <div className="flex gap-4 text-xs mb-2">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-brand-sage inline-block" />Muscle</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400/60 inline-block" />Fat</span>
            </div>
            {SEGMENT_DATA.map(s => <SegmentBar key={s.label} {...s} />)}
          </div>
        </div>
      )}
    </div>
  )
}
