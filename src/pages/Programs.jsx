import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MONDAY_WORKOUT, TUESDAY_WORKOUT, WEDNESDAY_WORKOUT, THURSDAY_WORKOUT, FRIDAY_WORKOUT, SATURDAY_WORKOUT } from '../data/workoutData'

// ─── Static program data ─────────────────────────────────────────────────────
const WEEK_1_SESSIONS = [
  { ...MONDAY_WORKOUT,    dayLabel: 'Mon' },
  { ...TUESDAY_WORKOUT,   dayLabel: 'Tue' },
  { ...WEDNESDAY_WORKOUT, dayLabel: 'Wed' },
  { ...THURSDAY_WORKOUT,  dayLabel: 'Thu' },
  { ...FRIDAY_WORKOUT,    dayLabel: 'Fri' },
  { ...SATURDAY_WORKOUT,  dayLabel: 'Sat' },
]

const PHASE_PROGRAMS = [
  {
    id: 'phase-1',
    name: 'Phase 1 — Foundation',
    description: 'Build your base. 6 weeks of foundational movement, strength, and mobility work designed to prepare your body for progressive loading.',
    weeks: 6,
    status: 'active',
    startDate: '2025-03-24',
    endDate: '2025-05-04',
    focus: ['Strength', 'Mobility', 'Conditioning'],
    sessions: WEEK_1_SESSIONS,
    completedSessions: 4,
    totalSessions: 6,
    coachNote: 'Consistency is the goal here — show up, move well, and trust the process. The details matter in Phase 1.',
  },
  {
    id: 'phase-2',
    name: 'Phase 2 — Accumulation',
    description: 'Increase volume and load. Build on your Phase 1 base with progressive overload across all major movement patterns.',
    weeks: 6,
    status: 'locked',
    startDate: '2025-05-05',
    endDate: '2025-06-15',
    focus: ['Strength', 'Power', 'Capacity'],
    sessions: [],
    completedSessions: 0,
    totalSessions: 6,
    coachNote: 'Unlocks after Phase 1 is complete.',
  },
  {
    id: 'phase-3',
    name: 'Phase 3 — Intensification',
    description: 'Peak performance. Higher intensity, lower volume — this is PR territory. Built for athletes ready to test their limits.',
    weeks: 4,
    status: 'locked',
    startDate: '2025-06-16',
    endDate: '2025-07-13',
    focus: ['Power', 'Strength', 'Testing'],
    sessions: [],
    completedSessions: 0,
    totalSessions: 4,
    coachNote: 'Unlocks after Phase 2 is complete.',
  },
]

const REHAB_PROGRAMS = [
  {
    id: 'rehab-hip',
    name: 'Hip & Glute Activation',
    description: '4-week protocol to restore hip function, reduce tightness, and activate glutes before loading.',
    weeks: 4,
    status: 'available',
    focus: ['Rehab', 'Mobility'],
    sessionsPerWeek: 3,
    coachNote: 'Ideal for desk workers or anyone with anterior pelvic tilt. Do this before lower body days.',
  },
  {
    id: 'rehab-shoulder',
    name: 'Shoulder Health Protocol',
    description: 'Rotator cuff strengthening and scapular stability. Safe to pair with any upper body training.',
    weeks: 4,
    status: 'available',
    focus: ['Rehab', 'Strength'],
    sessionsPerWeek: 3,
    coachNote: 'Run this as a warm-up before any pressing work. 15 minutes is all you need.',
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
const focusColors = {
  Strength:     'bg-brand-sage/20 text-brand-sage',
  Mobility:     'bg-blue-500/20 text-blue-300',
  Conditioning: 'bg-amber-500/20 text-amber-300',
  Recovery:     'bg-brand-linen/20 text-brand-linen',
  Power:        'bg-brand-gold/20 text-brand-gold',
  Testing:      'bg-purple-500/20 text-purple-300',
  Rehab:        'bg-red-400/20 text-red-300',
  Capacity:     'bg-teal-500/20 text-teal-300',
}

function FocusTag({ label }) {
  return (
    <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded tracking-wide ${focusColors[label] || 'bg-white/10 text-brand-offwhite/60'}`}>
      {label}
    </span>
  )
}

function ProgressBar({ completed, total }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  return (
    <div>
      <div className="flex justify-between text-[10px] text-brand-offwhite/40 mb-1.5">
        <span>{completed} of {total} sessions this week</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full bg-brand-sage rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// ─── Session card inside phase detail ────────────────────────────────────────
function SessionCard({ session, isToday }) {
  const exerciseCount = session.blocks?.reduce((acc, b) => acc + (b.exercises?.length || 0), 0) || 0
  return (
    <Link
      to="/workout"
      className={`group block rounded-xl border p-4 hover:border-brand-sage/30 transition-colors ${
        isToday ? 'border-brand-sage/40 bg-brand-sage/5' : 'border-white/5 bg-brand-dark/40'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-brand-offwhite/40 text-xs font-medium">{session.dayLabel}</span>
            {isToday && <span className="text-[9px] font-bold bg-brand-sage text-brand-dark px-1.5 py-0.5 rounded tracking-wide">TODAY</span>}
          </div>
          <p className="text-brand-offwhite font-medium text-sm truncate">{session.name}</p>
          <p className="text-brand-offwhite/40 text-xs mt-0.5">{exerciseCount} exercises · {session.focus}</p>
        </div>
        <span className="text-brand-sage text-sm group-hover:translate-x-0.5 transition-transform flex-shrink-0 mt-0.5">→</span>
      </div>
      {session.coach_note && (
        <p className="text-brand-offwhite/30 text-xs mt-2.5 leading-relaxed line-clamp-2 italic">"{session.coach_note}"</p>
      )}
    </Link>
  )
}

// ─── Phase detail (right panel) ───────────────────────────────────────────────
function PhaseDetail({ phase, onClose }) {
  const isLocked = phase.status === 'locked'
  const isActive = phase.status === 'active'

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-start justify-between p-6 border-b border-white/5 flex-shrink-0">
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2 mb-1">
            {isActive && <span className="w-1.5 h-1.5 rounded-full bg-brand-sage" />}
            <span className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest">
              {isActive ? 'Current program' : isLocked ? 'Locked' : 'Upcoming'}
            </span>
          </div>
          <h2 className="text-brand-offwhite font-semibold text-lg leading-tight">{phase.name}</h2>
          <p className="text-brand-offwhite/50 text-sm mt-2 leading-relaxed">{phase.description}</p>
        </div>
        <button onClick={onClose} className="text-brand-offwhite/30 hover:text-brand-offwhite transition-colors text-xl leading-none flex-shrink-0">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: phase.weeks, label: 'Weeks' },
            { value: `${phase.totalSessions}x`, label: 'Per week' },
            { value: phase.weeks * phase.totalSessions, label: 'Sessions total' },
          ].map(s => (
            <div key={s.label} className="bg-brand-dark/60 border border-white/5 rounded-xl p-3 text-center">
              <p className="text-brand-offwhite font-semibold text-lg">{s.value}</p>
              <p className="text-brand-offwhite/40 text-[10px] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Focus */}
        <div>
          <p className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest mb-2">Focus areas</p>
          <div className="flex flex-wrap gap-1.5">
            {phase.focus.map(f => <FocusTag key={f} label={f} />)}
          </div>
        </div>

        {/* Progress */}
        {isActive && (
          <div className="bg-brand-dark/60 border border-white/5 rounded-xl p-4">
            <p className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest mb-3">This week's progress</p>
            <ProgressBar completed={phase.completedSessions} total={phase.totalSessions} />
          </div>
        )}

        {/* Coach note */}
        <div className="bg-brand-surface border border-white/5 rounded-xl p-4">
          <p className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest mb-2">Coach note</p>
          <p className="text-brand-offwhite/70 text-sm leading-relaxed italic">"{phase.coachNote}"</p>
          <p className="text-brand-offwhite/30 text-xs mt-2">— Shauna</p>
        </div>

        {/* Sessions */}
        {!isLocked && phase.sessions.length > 0 && (
          <div>
            <p className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest mb-3">Week 1 sessions</p>
            <div className="space-y-2.5">
              {phase.sessions.map((session, i) => (
                <SessionCard key={session.id} session={session} isToday={i === 0} />
              ))}
            </div>
          </div>
        )}

        {/* Locked */}
        {isLocked && (
          <div className="bg-brand-dark/60 border border-white/5 rounded-xl p-10 text-center">
            <p className="text-5xl mb-4">🔒</p>
            <p className="text-brand-offwhite/60 font-medium text-sm">Complete the previous phase</p>
            <p className="text-brand-offwhite/30 text-xs mt-1">to unlock this program</p>
          </div>
        )}

        {/* Dates */}
        {phase.startDate && (
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Start date', value: phase.startDate },
              { label: 'End date', value: phase.endDate },
            ].map(d => (
              <div key={d.label}>
                <p className="text-brand-offwhite/30 text-xs mb-0.5">{d.label}</p>
                <p className="text-brand-offwhite/70 text-sm">
                  {new Date(d.value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Rehab detail (right panel) ───────────────────────────────────────────────
function RehabDetail({ program, onClose }) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-start justify-between p-6 border-b border-white/5 flex-shrink-0">
        <div className="flex-1 min-w-0 pr-4">
          <p className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest mb-1">Rehab & recovery</p>
          <h2 className="text-brand-offwhite font-semibold text-lg leading-tight">{program.name}</h2>
          <p className="text-brand-offwhite/50 text-sm mt-2 leading-relaxed">{program.description}</p>
        </div>
        <button onClick={onClose} className="text-brand-offwhite/30 hover:text-brand-offwhite transition-colors text-xl leading-none flex-shrink-0">✕</button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: program.weeks, label: 'Weeks' },
            { value: `${program.sessionsPerWeek}x`, label: 'Per week' },
          ].map(s => (
            <div key={s.label} className="bg-brand-dark/60 border border-white/5 rounded-xl p-3 text-center">
              <p className="text-brand-offwhite font-semibold text-lg">{s.value}</p>
              <p className="text-brand-offwhite/40 text-[10px] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
        <div>
          <p className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest mb-2">Focus</p>
          <div className="flex flex-wrap gap-1.5">
            {program.focus.map(f => <FocusTag key={f} label={f} />)}
          </div>
        </div>
        <div className="bg-brand-surface border border-white/5 rounded-xl p-4">
          <p className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest mb-2">Coach note</p>
          <p className="text-brand-offwhite/70 text-sm leading-relaxed italic">"{program.coachNote}"</p>
          <p className="text-brand-offwhite/30 text-xs mt-2">— Shauna</p>
        </div>
        <button className="w-full bg-brand-sage text-brand-dark font-semibold py-3 rounded-xl text-sm hover:bg-brand-sage/90 transition-colors">
          Add to my plan
        </button>
      </div>
    </div>
  )
}

// ─── Phase card (list item) ───────────────────────────────────────────────────
function PhaseCard({ phase, isSelected, onClick }) {
  const isActive = phase.status === 'active'
  const isLocked = phase.status === 'locked'
  return (
    <button
      onClick={onClick}
      disabled={isLocked}
      className={`w-full text-left rounded-xl border p-4 transition-all ${
        isSelected ? 'border-brand-sage/40 bg-brand-sage/5'
          : isLocked ? 'border-white/5 bg-brand-surface/50 opacity-50 cursor-not-allowed'
          : 'border-white/5 bg-brand-surface hover:border-white/10'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? 'bg-brand-sage' : isLocked ? 'bg-white/20' : 'bg-brand-gold'}`} />
            <span className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest">
              {isActive ? 'Current' : isLocked ? 'Locked' : 'Upcoming'}
            </span>
          </div>
          <p className="text-brand-offwhite font-medium text-sm">{phase.name}</p>
          <p className="text-brand-offwhite/40 text-xs mt-0.5">{phase.weeks} weeks · {phase.totalSessions} sessions/wk</p>
        </div>
        {isActive && (
          <div className="flex-shrink-0 text-right">
            <p className="text-brand-sage text-sm font-semibold">{Math.round((phase.completedSessions / phase.totalSessions) * 100)}%</p>
            <p className="text-brand-offwhite/30 text-[10px]">this week</p>
          </div>
        )}
        {isLocked && <span className="flex-shrink-0 text-sm">🔒</span>}
      </div>
      {isActive && (
        <div className="mt-3 h-0.5 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-brand-sage rounded-full" style={{ width: `${Math.round((phase.completedSessions / phase.totalSessions) * 100)}%` }} />
        </div>
      )}
      <div className="flex flex-wrap gap-1 mt-3">
        {phase.focus.map(f => <FocusTag key={f} label={f} />)}
      </div>
    </button>
  )
}

// ─── Rehab card (list item) ───────────────────────────────────────────────────
function RehabCard({ program, isSelected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border p-4 transition-all ${
        isSelected ? 'border-brand-sage/40 bg-brand-sage/5' : 'border-white/5 bg-brand-surface hover:border-white/10'
      }`}
    >
      <p className="text-brand-offwhite font-medium text-sm">{program.name}</p>
      <p className="text-brand-offwhite/40 text-xs mt-0.5">{program.weeks} weeks · {program.sessionsPerWeek}x/wk</p>
      <div className="flex flex-wrap gap-1 mt-3">
        {program.focus.map(f => <FocusTag key={f} label={f} />)}
      </div>
    </button>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Programs() {
  const [tab, setTab] = useState('phases')
  const [selectedPhase, setSelectedPhase] = useState(PHASE_PROGRAMS[0])
  const [selectedRehab, setSelectedRehab] = useState(null)

  const detailOpen = tab === 'phases' ? !!selectedPhase : !!selectedRehab

  const switchTab = (id) => {
    setTab(id)
    setSelectedPhase(id === 'phases' ? PHASE_PROGRAMS[0] : null)
    setSelectedRehab(null)
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left list column */}
      <div className={`flex flex-col overflow-hidden transition-all duration-300 flex-shrink-0 ${detailOpen ? 'w-[320px]' : 'flex-1 max-w-2xl'}`}>
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex-shrink-0">
          <h1 className="text-brand-offwhite text-2xl font-semibold">Programs &amp; plans</h1>
          <p className="text-brand-offwhite/40 text-sm mt-1">Your periodized training and rehab protocols.</p>
          <div className="mt-5 flex gap-1 bg-brand-surface/50 border border-white/5 rounded-lg p-1">
            {[{ id: 'phases', label: 'Training phases' }, { id: 'rehab', label: 'Rehab & recovery' }].map(t => (
              <button
                key={t.id}
                onClick={() => switchTab(t.id)}
                className={`flex-1 text-xs font-medium py-1.5 px-3 rounded-md transition-colors ${
                  tab === t.id ? 'bg-brand-sage text-brand-dark' : 'text-brand-offwhite/50 hover:text-brand-offwhite'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {tab === 'phases' && PHASE_PROGRAMS.map(phase => (
            <PhaseCard
              key={phase.id}
              phase={phase}
              isSelected={selectedPhase?.id === phase.id}
              onClick={() => phase.status !== 'locked' && setSelectedPhase(phase)}
            />
          ))}
          {tab === 'rehab' && (
            <>
              <p className="text-brand-offwhite/30 text-xs px-1 pb-1 leading-relaxed">
                Targeted protocols to address common movement limitations. Stack with your main training.
              </p>
              {REHAB_PROGRAMS.map(program => (
                <RehabCard
                  key={program.id}
                  program={program}
                  isSelected={selectedRehab?.id === program.id}
                  onClick={() => setSelectedRehab(program)}
                />
              ))}
            </>
          )}
        </div>
      </div>

      {/* Right detail panel */}
      {tab === 'phases' && selectedPhase && (
        <div className="flex-1 border-l border-white/5 overflow-hidden">
          <PhaseDetail phase={selectedPhase} onClose={() => setSelectedPhase(null)} />
        </div>
      )}
      {tab === 'rehab' && selectedRehab && (
        <div className="flex-1 border-l border-white/5 overflow-hidden">
          <RehabDetail program={selectedRehab} onClose={() => setSelectedRehab(null)} />
        </div>
      )}
      {tab === 'rehab' && !selectedRehab && (
        <div className="flex-1 border-l border-white/5 hidden lg:flex items-center justify-center">
          <p className="text-brand-offwhite/20 text-sm">Select a protocol to view details</p>
        </div>
      )}
    </div>
  )
}
