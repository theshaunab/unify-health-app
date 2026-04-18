import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts'

// ─── Mock InBody data ─────────────────────────────────────────────────────────
const INBODY_HISTORY = [
  { date: 'Oct 24', weight: 72.4, bodyFat: 28.2, muscleMass: 47.1, bmi: 24.8, visceralFat: 8, bmr: 1420 },
  { date: 'Nov 24', weight: 71.8, bodyFat: 27.6, muscleMass: 47.4, bmi: 24.6, visceralFat: 7, bmr: 1432 },
  { date: 'Dec 24', weight: 71.2, bodyFat: 26.9, muscleMass: 47.8, bmi: 24.4, visceralFat: 7, bmr: 1441 },
  { date: 'Jan 25', weight: 70.6, bodyFat: 26.1, muscleMass: 48.2, bmi: 24.2, visceralFat: 6, bmr: 1455 },
  { date: 'Feb 25', weight: 70.1, bodyFat: 25.4, muscleMass: 48.6, bmi: 24.0, visceralFat: 6, bmr: 1463 },
  { date: 'Mar 25', weight: 69.8, bodyFat: 24.8, muscleMass: 49.1, bmi: 23.9, visceralFat: 5, bmr: 1471 },
]

const latest = INBODY_HISTORY[INBODY_HISTORY.length - 1]
const previous = INBODY_HISTORY[INBODY_HISTORY.length - 2]

const SEGMENT_DATA = [
  { label: 'Right Arm', muscle: 3.2, fat: 0.8 },
  { label: 'Left Arm',  muscle: 3.1, fat: 0.7 },
  { label: 'Trunk',     muscle: 26.4, fat: 8.2 },
  { label: 'Right Leg', muscle: 9.8, fat: 2.1 },
  { label: 'Left Leg',  muscle: 9.6, fat: 2.0 },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function delta(current, prev, invert = false) {
  const diff = (current - prev).toFixed(1)
  const positive = invert ? diff < 0 : diff > 0
  const sign = diff > 0 ? '+' : ''
  return { label: `${sign}${diff}`, positive }
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-brand-surface border border-white/10 rounded-lg px-3 py-2 text-xs">
      <p className="text-brand-offwhite/50 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, unit, change, positive, sub }) {
  return (
    <div className="bg-brand-surface border border-white/5 rounded-xl p-4">
      <p className="text-brand-offwhite/40 text-xs mb-1">{label}</p>
      <div className="flex items-end gap-2">
        <p className="text-brand-offwhite text-2xl font-semibold">{value}</p>
        <p className="text-brand-offwhite/40 text-sm mb-0.5">{unit}</p>
      </div>
      {change && (
        <p className={`text-xs mt-1 font-medium ${positive ? 'text-brand-sage' : 'text-red-400'}`}>
          {change} vs last scan
        </p>
      )}
      {sub && <p className="text-brand-offwhite/30 text-xs mt-1">{sub}</p>}
    </div>
  )
}

// ─── Chart card ───────────────────────────────────────────────────────────────
function ChartCard({ title, dataKey, color, data, unit, yDomain }) {
  return (
    <div className="bg-brand-surface border border-white/5 rounded-xl p-5">
      <p className="text-brand-offwhite/60 text-xs uppercase tracking-widest mb-4">{title}</p>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="date" tick={{ fill: 'rgba(240,236,230,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'rgba(240,236,230,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} domain={yDomain} />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey={dataKey} name={`${title} (${unit})`} stroke={color} strokeWidth={2} dot={{ fill: color, r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Segmental bar ────────────────────────────────────────────────────────────
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

// ─── Main page ────────────────────────────────────────────────────────────────
export default function BodyComposition() {
  const [activeTab, setActiveTab] = useState('overview')
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'trends', label: 'Trends' },
    { id: 'segmental', label: 'Segmental' },
  ]

  const weightDelta = delta(latest.weight, previous.weight, true)
  const fatDelta = delta(latest.bodyFat, previous.bodyFat, true)
  const muscleDelta = delta(latest.muscleMass, previous.muscleMass)

  return (
    <div className="p-6 lg:p-8 max-w-5xl overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-brand-offwhite text-2xl font-semibold">Body composition</h1>
          <p className="text-brand-offwhite/40 text-sm mt-1">InBody scan results over time.</p>
        </div>
        <div className="text-right">
          <p className="text-brand-offwhite/30 text-xs">Last scan</p>
          <p className="text-brand-offwhite/60 text-sm font-medium">Mar 2025</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-brand-surface/50 border border-white/5 rounded-lg p-1 mb-6 w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`text-xs font-medium py-1.5 px-4 rounded-md transition-colors ${
              activeTab === t.id ? 'bg-brand-sage text-brand-dark' : 'text-brand-offwhite/50 hover:text-brand-offwhite'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Body weight" value={latest.weight} unit="kg" change={weightDelta.label} positive={weightDelta.positive} />
            <StatCard label="Body fat" value={`${latest.bodyFat}%`} unit="" change={fatDelta.label + '%'} positive={fatDelta.positive} />
            <StatCard label="Muscle mass" value={latest.muscleMass} unit="kg" change={muscleDelta.label} positive={muscleDelta.positive} />
            <StatCard label="BMI" value={latest.bmi} unit="" sub="Normal range: 18.5–24.9" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard label="Visceral fat level" value={latest.visceralFat} unit="" sub="Target: below 10" />
            <StatCard label="Basal metabolic rate" value={latest.bmr} unit="kcal/day" sub="Calories burned at rest" />
            <div className="bg-brand-surface border border-white/5 rounded-xl p-4">
              <p className="text-brand-offwhite/40 text-xs mb-3">6-month progress</p>
              <div className="space-y-2.5">
                {[
                  { label: 'Weight lost', value: `${(INBODY_HISTORY[0].weight - latest.weight).toFixed(1)} kg`, color: 'text-brand-sage' },
                  { label: 'Fat lost', value: `${(INBODY_HISTORY[0].bodyFat - latest.bodyFat).toFixed(1)}%`, color: 'text-brand-sage' },
                  { label: 'Muscle gained', value: `+${(latest.muscleMass - INBODY_HISTORY[0].muscleMass).toFixed(1)} kg`, color: 'text-brand-gold' },
                ].map(s => (
                  <div key={s.label} className="flex justify-between text-sm">
                    <span className="text-brand-offwhite/50">{s.label}</span>
                    <span className={`font-semibold ${s.color}`}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Coach note */}
          <div className="bg-brand-surface border border-white/5 rounded-xl p-4">
            <p className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest mb-2">Coach note</p>
            <p className="text-brand-offwhite/70 text-sm leading-relaxed italic">"Excellent progress — you're losing fat while gaining muscle, which is exactly the goal. Keep the protein high and trust the program."</p>
            <p className="text-brand-offwhite/30 text-xs mt-2">— Shauna</p>
          </div>
        </div>
      )}

      {/* Trends tab */}
      {activeTab === 'trends' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Body weight" dataKey="weight" color="#8f9a92" data={INBODY_HISTORY} unit="kg" yDomain={[68, 74]} />
          <ChartCard title="Body fat %" dataKey="bodyFat" color="#d4a853" data={INBODY_HISTORY} unit="%" yDomain={[23, 30]} />
          <ChartCard title="Muscle mass" dataKey="muscleMass" color="#7eb8a0" data={INBODY_HISTORY} unit="kg" yDomain={[46, 50]} />
          <ChartCard title="BMR (kcal)" dataKey="bmr" color="#c6bfb5" data={INBODY_HISTORY} unit="kcal" yDomain={[1400, 1500]} />
        </div>
      )}

      {/* Segmental tab */}
      {activeTab === 'segmental' && (
        <div className="space-y-5">
          <p className="text-brand-offwhite/40 text-sm">Muscle and fat distribution by body segment from your last InBody scan.</p>
          <div className="bg-brand-surface border border-white/5 rounded-xl p-5 space-y-5">
            <div className="flex gap-4 text-xs mb-2">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-brand-sage inline-block" />Muscle mass</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400/60 inline-block" />Fat mass</span>
            </div>
            {SEGMENT_DATA.map(s => <SegmentBar key={s.label} {...s} />)}
          </div>
          <div className="bg-brand-surface border border-white/5 rounded-xl p-4">
            <p className="text-brand-offwhite/40 text-xs uppercase tracking-widest mb-3">Imbalance check</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-brand-offwhite/40 text-xs mb-1">Arms (L vs R)</p>
                <p className="text-brand-offwhite/70">3.1 vs 3.2 kg <span className="text-brand-sage text-xs">Good</span></p>
              </div>
              <div>
                <p className="text-brand-offwhite/40 text-xs mb-1">Legs (L vs R)</p>
                <p className="text-brand-offwhite/70">9.6 vs 9.8 kg <span className="text-brand-sage text-xs">Good</span></p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
