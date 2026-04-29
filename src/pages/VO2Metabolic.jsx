import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

const MOCK_HISTORY = [
  { date: 'Oct 24', vo2max: 34.2, rmr: 1380 },
  { date: 'Dec 24', vo2max: 36.1, rmr: 1405 },
  { date: 'Feb 25', vo2max: 38.4, rmr: 1430 },
  { date: 'Mar 25', vo2max: 40.2, rmr: 1471 },
]

const VO2_ZONES = [
  { zone: 'Zone 1', label: 'Very Light', range: '< 50%',   color: 'bg-blue-400',   desc: 'Recovery, warm-up' },
  { zone: 'Zone 2', label: 'Light',      range: '50–60%',  color: 'bg-brand-sage', desc: 'Fat burning, base fitness' },
  { zone: 'Zone 3', label: 'Moderate',   range: '60–70%',  color: 'bg-brand-gold', desc: 'Aerobic development' },
  { zone: 'Zone 4', label: 'Hard',       range: '70–85%',  color: 'bg-orange-400', desc: 'Lactate threshold' },
  { zone: 'Zone 5', label: 'Max',        range: '85–100%', color: 'bg-red-400',    desc: 'VO2 Max intervals' },
]

const FITNESS_NORMS = [
  { label: 'Poor',      range: '< 28',  color: 'bg-red-400/30',    min: 0,  max: 28  },
  { label: 'Fair',      range: '28–34', color: 'bg-orange-400/30', min: 28, max: 34  },
  { label: 'Good',      range: '34–42', color: 'bg-brand-gold/30', min: 34, max: 42  },
  { label: 'Excellent', range: '42–50', color: 'bg-brand-sage/30', min: 42, max: 50  },
  { label: 'Superior',  range: '> 50',  color: 'bg-blue-400/30',   min: 50, max: 999 },
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

export default function VO2Metabolic() {
  const { user } = useAuth()
  const [history, setHistory] = useState(MOCK_HISTORY)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    supabase.from('metabolic_tests').select('*').eq('user_id', user.id).order('test_date', { ascending: true })
      .then(({ data }) => {
        if (data?.length > 0) {
          setHistory(data.map(t => ({
            date:   new Date(t.test_date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
            vo2max: t.vo2_max,
            rmr:    t.rmr,
          })))
        }
        setLoading(false)
      })
  }, [user?.id])

  const latest   = history[history.length - 1]
  const previous = history[history.length - 2]
  const vo2Delta = previous ? (latest.vo2max - previous.vo2max).toFixed(1) : null
  const rmrDelta = previous ? (latest.rmr    - previous.rmr).toFixed(0)    : null
  const fitnessClass = FITNESS_NORMS.find(n => (latest?.vo2max ?? 0) >= n.min && (latest?.vo2max ?? 0) < n.max) || FITNESS_NORMS[0]

  return (
    <div className="p-6 lg:p-8 max-w-5xl overflow-y-auto h-full">
      <div className="mb-6">
        <h1 className="text-brand-offwhite text-2xl font-semibold">VO2 &amp; metabolic</h1>
        <p className="text-brand-offwhite/40 text-sm mt-1">Cardiovascular fitness and metabolic testing results.</p>
      </div>

      {loading && <p className="text-brand-offwhite/30 text-sm text-center py-8">Loading test data...</p>}

      {!loading && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'VO2 Max',     value: latest?.vo2max, unit: 'ml/kg/min', change: vo2Delta ? `+${vo2Delta}` : null },
              { label: 'RMR',         value: latest?.rmr,    unit: 'kcal/day',  change: rmrDelta ? `+${rmrDelta}` : null },
              { label: 'Fitness age', value: '32',           unit: 'yrs',       sub: '3 yrs below actual' },
              { label: 'Percentile',  value: '68th',         unit: '',          sub: 'For age & gender' },
            ].map(s => (
              <div key={s.label} className="bg-brand-surface border border-white/5 rounded-xl p-4">
                <p className="text-brand-offwhite/40 text-xs mb-1">{s.label}</p>
                <div className="flex items-end gap-1.5">
                  <p className="text-brand-offwhite text-2xl font-semibold">{s.value}</p>
                  <p className="text-brand-offwhite/40 text-sm mb-0.5">{s.unit}</p>
                </div>
                {s.change && <p className="text-brand-sage text-xs mt-1 font-medium">{s.change} since last test</p>}
                {s.sub && <p className="text-brand-offwhite/30 text-xs mt-1">{s.sub}</p>}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            <div className="bg-brand-surface border border-white/5 rounded-xl p-5">
              <p className="text-brand-offwhite/60 text-xs uppercase tracking-widest mb-4">VO2 Max trend</p>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={history} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" tick={{ fill: 'rgba(240,236,230,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(240,236,230,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} domain={['auto','auto']} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={42} stroke="rgba(143,154,146,0.3)" strokeDasharray="4 4" label={{ value: 'Excellent', fill: 'rgba(143,154,146,0.5)', fontSize: 9 }} />
                  <Line type="monotone" dataKey="vo2max" name="VO2 Max" stroke="#8f9a92" strokeWidth={2} dot={{ fill: '#8f9a92', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-brand-surface border border-white/5 rounded-xl p-5">
              <p className="text-brand-offwhite/60 text-xs uppercase tracking-widest mb-4">Fitness classification</p>
              <div className="space-y-2">
                {FITNESS_NORMS.map(n => (
                  <div key={n.label} className={`flex items-center justify-between rounded-lg px-3 py-2 ${n.color} ${n.label === fitnessClass.label ? 'ring-1 ring-brand-gold/40' : ''}`}>
                    <span className="text-brand-offwhite/70 text-sm">{n.label}</span>
                    <span className="text-brand-offwhite/50 text-xs">{n.range} ml/kg/min</span>
                    {n.label === fitnessClass.label && <span className="text-brand-gold text-[10px] font-bold">YOU</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-brand-surface border border-white/5 rounded-xl p-5 mb-5">
            <p className="text-brand-offwhite/60 text-xs uppercase tracking-widest mb-4">Training zones</p>
            <div className="space-y-3">
              {VO2_ZONES.map(z => (
                <div key={z.zone} className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${z.color}`} />
                  <div className="w-16 flex-shrink-0">
                    <p className="text-brand-offwhite/70 text-xs font-medium">{z.zone}</p>
                    <p className="text-brand-offwhite/40 text-[10px]">{z.label}</p>
                  </div>
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${z.color} opacity-60`} style={{ width: '60%' }} />
                  </div>
                  <span className="text-brand-offwhite/40 text-xs w-16 text-right">{z.range}</span>
                  <span className="text-brand-offwhite/30 text-xs hidden lg:block w-40">{z.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-brand-surface border border-white/5 rounded-xl p-4">
            <p className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest mb-2">Coach note</p>
            <p className="text-brand-offwhite/70 text-sm leading-relaxed italic">"Your VO2 Max has improved significantly — your body is becoming a more efficient machine. Next test goal is 42+."</p>
            <p className="text-brand-offwhite/30 text-xs mt-2">— Shauna</p>
          </div>
        </>
      )}
    </div>
  )
}
