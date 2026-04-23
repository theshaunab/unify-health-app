import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'

// ─── Mock data ────────────────────────────────────────────────────────────────
const WEEKLY_ACTIVITY = [
  { day: 'Mon', sessions: 1, sets: 142 },
  { day: 'Tue', sessions: 1, sets: 138 },
  { day: 'Wed', sessions: 1, sets: 156 },
  { day: 'Thu', sessions: 0, sets: 0 },
  { day: 'Fri', sessions: 1, sets: 149 },
  { day: 'Sat', sessions: 0, sets: 0 },
  { day: 'Sun', sessions: 0, sets: 0 },
]

const BODY_TREND = [
  { month: 'Oct', weight: 72.4, muscle: 47.1, fat: 28.2 },
  { month: 'Nov', weight: 71.8, muscle: 47.4, fat: 27.6 },
  { month: 'Dec', weight: 71.2, muscle: 47.8, fat: 26.9 },
  { month: 'Jan', weight: 70.6, muscle: 48.2, fat: 26.1 },
  { month: 'Feb', weight: 70.1, muscle: 48.6, fat: 25.4 },
  { month: 'Mar', weight: 69.8, muscle: 49.1, fat: 24.8 },
]

const STRENGTH_TREND = [
  { month: 'Oct', squat: 60, deadlift: 80 },
  { month: 'Dec', squat: 67, deadlift: 90 },
  { month: 'Feb', squat: 75, deadlift: 100 },
  { month: 'Mar', squat: 82, deadlift: 110 },
]

const GOALS_PROGRESS = [
  { name: 'strength', value: 68, fill: '#8f9a92' },
  { name: 'fitness', value: 82, fill: '#d4a853' },
  { name: 'body', value: 54, fill: '#c6bfb5' },
]

const TODAY_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function getTodayWorkout() {
  const day = new Date().getDay()
  const workouts = {
    1: { name: 'Monday 3.30 W1', focus: 'Strength & mobility', exercises: 18 },
    2: { name: 'Tuesday 3.31 W1', focus: 'Power & strength', exercises: 14 },
    3: { name: 'Wednesday 4.2 W1', focus: 'Strength & capacity', exercises: 16 },
    4: { name: 'Thursday 4.3 W1', focus: 'Mobility & recovery', exercises: 12 },
    5: { name: 'Friday 4.4 W1', focus: 'Strength & power', exercises: 15 },
    6: { name: 'Saturday 4.5 W1', focus: 'Conditioning', exercises: 11 },
  }
  return workouts[day] || null
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1a1918] border border-white/10 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-white/50 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

// ─── Ring chart for goals ─────────────────────────────────────────────────────
function GoalRing({ value, color, label, sublabel }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-20 h-20">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%" cy="50%"
            innerRadius="70%" outerRadius="100%"
            startAngle={90} endAngle={-270}
            data={[{ value, fill: color }]}
          >
            <RadialBar dataKey="value" cornerRadius={4} background={{ fill: 'rgba(255,255,255,0.05)' }} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white font-bold text-sm">{value}%</span>
        </div>
      </div>
      <p className="text-white/70 text-xs font-medium mt-2">{label}</p>
      <p className="text-white/30 text-[10px]">{sublabel}</p>
    </div>
  )
}

// ─── Stat pill ────────────────────────────────────────────────────────────────
function StatPill({ label, value, delta, deltaPositive, icon }) {
  return (
    <div className="bg-[#1a1918] border border-white/5 rounded-2xl p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-lg flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white/40 text-xs">{label}</p>
        <p className="text-white font-semibold text-lg leading-tight">{value}</p>
      </div>
      {delta && (
        <span className={`text-xs font-semibold flex-shrink-0 ${deltaPositive ? 'text-[#8f9a92]' : 'text-red-400'}`}>
          {delta}
        </span>
      )}
    </div>
  )
}

// ─── Week strip ───────────────────────────────────────────────────────────────
function WeekStrip() {
  const today = new Date().getDay()
  return (
    <div className="flex gap-1.5">
      {WEEKLY_ACTIVITY.map((d, i) => {
        const dayIdx = (i + 1) % 7
        const isToday = dayIdx === today
        const done = d.sessions > 0
        return (
          <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5">
            <div className={`w-full aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all ${
              isToday ? 'ring-2 ring-[#8f9a92] bg-[#8f9a92]/20 text-[#8f9a92]'
              : done ? 'bg-[#8f9a92]/30 text-[#8f9a92]'
              : 'bg-white/5 text-white/20'
            }`}>
              {done ? '✓' : d.day.charAt(0)}
            </div>
            <p className="text-white/30 text-[9px]">{d.day}</p>
          </div>
        )
      })}
    </div>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ title, linkTo, linkLabel }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <p className="text-white/50 text-[10px] uppercase tracking-widest font-semibold">{title}</p>
      {linkTo && (
        <Link to={linkTo} className="text-[#8f9a92] text-xs hover:text-[#8f9a92]/70 transition-colors">
          {linkLabel} →
        </Link>
      )}
    </div>
  )
}

// ─── Main dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth()
  const todayWorkout = getTodayWorkout()
  const firstName = user?.name?.split(' ')[0] || 'there'
  const [animIn, setAnimIn] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setAnimIn(true), 50)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className={`h-full overflow-y-auto transition-opacity duration-500 ${animIn ? 'opacity-100' : 'opacity-0'}`}>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8 pb-12">

        {/* ── Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/30 text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            <h1 className="text-white text-3xl font-semibold mt-1">
              {getGreeting()}, {firstName}.
            </h1>
            <p className="text-white/40 text-sm mt-1">Here's your health snapshot.</p>
          </div>
          <div className="hidden lg:flex items-center gap-2 bg-[#1a1918] border border-white/5 rounded-xl px-4 py-2.5">
            <span className="w-2 h-2 rounded-full bg-[#8f9a92] animate-pulse" />
            <span className="text-white/50 text-xs">Phase 1 — Week 3</span>
          </div>
        </div>

        {/* ── Key stats row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatPill label="Sessions this month" value="12" delta="+3 vs last" deltaPositive icon="◈" />
          <StatPill label="Current streak" value="5 days" delta="🔥" deltaPositive icon="▶" />
          <StatPill label="Sets logged" value="847" delta="+124" deltaPositive icon="◆" />
          <StatPill label="Programs complete" value="3" icon="☰" />
        </div>

        {/* ── This week + Today's workout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* This week */}
          <div className="bg-[#1a1918] border border-white/5 rounded-2xl p-5">
            <SectionHeader title="This week" />
            <WeekStrip />
            <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Completed', value: '4' },
                { label: 'Sets done', value: '585' },
                { label: 'Goal', value: '6 days' },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-white font-semibold text-lg">{s.value}</p>
                  <p className="text-white/30 text-[10px]">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Today's workout */}
          <div className="lg:col-span-2">
            {todayWorkout ? (
              <Link to="/workout" className="group block bg-[#1a1918] border border-white/5 rounded-2xl p-5 hover:border-[#8f9a92]/30 transition-all h-full">
                <SectionHeader title="Today's training" />
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-white font-semibold text-xl leading-tight">{todayWorkout.name}</p>
                    <p className="text-white/40 text-sm mt-1">{todayWorkout.focus}</p>
                    <div className="flex gap-3 mt-4">
                      <span className="bg-[#8f9a92]/15 text-[#8f9a92] text-xs px-3 py-1 rounded-full">{todayWorkout.exercises} exercises</span>
                      <span className="bg-white/5 text-white/40 text-xs px-3 py-1 rounded-full">Strength focus</span>
                    </div>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-[#8f9a92]/15 border border-[#8f9a92]/20 flex items-center justify-center group-hover:bg-[#8f9a92]/25 transition-colors flex-shrink-0">
                    <span className="text-[#8f9a92] text-xl group-hover:translate-x-0.5 transition-transform">▶</span>
                  </div>
                </div>
                <div className="mt-5 pt-4 border-t border-white/5">
                  <p className="text-white/30 text-xs italic">"Take the warm-up seriously today — hip mobility sets up everything in this session."</p>
                  <p className="text-white/20 text-[10px] mt-1">— Shauna</p>
                </div>
              </Link>
            ) : (
              <div className="bg-[#1a1918] border border-white/5 rounded-2xl p-5 flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-4xl mb-2">🌿</p>
                  <p className="text-white/50 font-medium">Rest day</p>
                  <p className="text-white/30 text-xs mt-1">Recovery is part of the program.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Body composition trend ── */}
        <div className="bg-[#1a1918] border border-white/5 rounded-2xl p-5">
          <SectionHeader title="Body composition — 6 months" linkTo="/body-composition" linkLabel="Full report" />
          <div className="grid grid-cols-3 gap-4 mb-5">
            {[
              { label: 'Weight', value: '69.8 kg', delta: '−2.6 kg', positive: true },
              { label: 'Body fat', value: '24.8%', delta: '−3.4%', positive: true },
              { label: 'Muscle', value: '49.1 kg', delta: '+2.0 kg', positive: true },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-white font-semibold text-lg">{s.value}</p>
                <p className="text-white/40 text-xs">{s.label}</p>
                <p className="text-[#8f9a92] text-xs font-medium mt-0.5">{s.delta}</p>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={BODY_TREND} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <defs>
                <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8f9a92" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8f9a92" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="muscleGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d4a853" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#d4a853" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: 'rgba(240,236,230,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(240,236,230,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="weight" name="Weight (kg)" stroke="#8f9a92" strokeWidth={2} fill="url(#weightGrad)" />
              <Area type="monotone" dataKey="muscle" name="Muscle (kg)" stroke="#d4a853" strokeWidth={2} fill="url(#muscleGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ── Goals + Strength row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Goals rings */}
          <div className="bg-[#1a1918] border border-white/5 rounded-2xl p-5">
            <SectionHeader title="Goal progress" linkTo="/goals" linkLabel="View goals" />
            <div className="flex justify-around py-2">
              <GoalRing value={68} color="#8f9a92" label="Strength" sublabel="Phase 1" />
              <GoalRing value={82} color="#d4a853" label="Fitness" sublabel="VO2 Max" />
              <GoalRing value={54} color="#c6bfb5" label="Body comp" sublabel="6-mo goal" />
            </div>
          </div>

          {/* Strength PRs */}
          <div className="bg-[#1a1918] border border-white/5 rounded-2xl p-5">
            <SectionHeader title="Strength — best lifts" linkTo="/strength" linkLabel="Full data" />
            <div className="space-y-3">
              {[
                { lift: 'Deadlift', value: 110, max: 140, color: '#8f9a92' },
                { lift: 'Back squat', value: 82, max: 120, color: '#d4a853' },
                { lift: 'Bench press', value: 60, max: 90, color: '#c6bfb5' },
                { lift: 'Bent-over row', value: 68, max: 100, color: '#8f9a92' },
              ].map(s => (
                <div key={s.lift}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/60">{s.lift}</span>
                    <span className="text-white/40">{s.value} kg</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${(s.value / s.max) * 100}%`, backgroundColor: s.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Quick nav cards ── */}
        <div>
          <SectionHeader title="Quick access" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Video library', sub: '8 videos available', to: '/videos', icon: '⬡', color: 'text-blue-300' },
              { label: 'Programs', sub: 'Phase 1 active', to: '/programs', icon: '☰', color: 'text-[#8f9a92]' },
              { label: 'Body comp', sub: 'Last scan: Mar 25', to: '/body-composition', icon: '◉', color: 'text-[#d4a853]' },
              { label: 'VO2 & metabolic', sub: 'VO2: 40.2 ml/kg/min', to: '/vo2', icon: '◎', color: 'text-[#c6bfb5]' },
            ].map(card => (
              <Link
                key={card.label}
                to={card.to}
                className="group bg-[#1a1918] border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-all"
              >
                <span className={`text-2xl ${card.color}`}>{card.icon}</span>
                <p className="text-white/80 text-sm font-medium mt-3">{card.label}</p>
                <p className="text-white/30 text-xs mt-0.5">{card.sub}</p>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
