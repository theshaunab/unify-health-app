import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { MONDAY_WORKOUT, TUESDAY_WORKOUT, WEDNESDAY_WORKOUT, THURSDAY_WORKOUT, FRIDAY_WORKOUT, SATURDAY_WORKOUT } from '../data/workoutData'

// ─── Tier access config ───────────────────────────────────────────────────────
const TIER_ORDER = { full_access: 0, personal_training: 1, group_class: 2, basic: 3 }
const canAccess = (userTier, requiredTier) => TIER_ORDER[userTier] <= TIER_ORDER[requiredTier]

// ─── Mock data ────────────────────────────────────────────────────────────────
const IN_STUDIO_WORKOUTS = [
  { ...MONDAY_WORKOUT,    dayLabel: 'Mon', requiredTier: 'group_class' },
  { ...TUESDAY_WORKOUT,   dayLabel: 'Tue', requiredTier: 'group_class' },
  { ...WEDNESDAY_WORKOUT, dayLabel: 'Wed', requiredTier: 'group_class' },
  { ...THURSDAY_WORKOUT,  dayLabel: 'Thu', requiredTier: 'group_class' },
  { ...FRIDAY_WORKOUT,    dayLabel: 'Fri', requiredTier: 'group_class' },
  { ...SATURDAY_WORKOUT,  dayLabel: 'Sat', requiredTier: 'group_class' },
]

const PERSONAL_WORKOUTS = [
  {
    id: 'pw-1',
    name: 'Hip Stability Focus',
    assignedDate: '2025-03-28',
    coachNote: 'Work through this before your Monday sessions. Focus on feeling the glute activate on the single-leg work.',
    focus: 'Rehab & activation',
    equipment: 'Resistance band, mat',
    status: 'active',
    blocks: [
      {
        id: 'pb1', label: 'ACTIVATION', type: 'circuit', rounds: 3,
        exercises: [
          { id: 'pe1', name: 'Banded clamshells', sub_label: '15 each side', sets: 3, reps: 15, reps_unit: 'each side', label: null, coaching_cue: 'Keep hips stacked. Drive knee up against the band.' },
          { id: 'pe2', name: 'Single leg glute bridge', sub_label: '12 each side', sets: 3, reps: 12, reps_unit: 'each side', label: null, coaching_cue: 'Drive through heel. Squeeze glute at top.' },
          { id: 'pe3', name: 'Side lying hip abduction', sub_label: '15 each side', sets: 3, reps: 15, reps_unit: 'each side', label: null, coaching_cue: 'Keep toes pointing forward. Slow and controlled.' },
        ],
      },
      {
        id: 'pb2', label: 'STABILITY', type: 'superset_a', sets: 3,
        exercises: [
          { id: 'pe4', name: 'Single leg Romanian deadlift', sub_label: '8 each side · bodyweight', sets: 3, reps: 8, reps_unit: 'each side', label: 'A1', coaching_cue: 'Hinge at hip. Keep back flat. Feel the hamstring.' },
          { id: 'pe5', name: 'Copenhagen plank hold', sub_label: '20 sec each side', sets: 3, reps: null, reps_unit: 'timed', label: 'A2', coaching_cue: 'Keep hips level. Feel the adductor loading.' },
        ],
      },
    ],
  },
  {
    id: 'pw-2',
    name: 'Upper Body Accessory',
    assignedDate: '2025-03-25',
    coachNote: 'Add this after any upper body session. Should take 20 mins max.',
    focus: 'Shoulder health',
    equipment: 'Light dumbbells, cable machine',
    status: 'active',
    blocks: [
      {
        id: 'pb3', label: 'SHOULDER CIRCUIT', type: 'circuit', rounds: 3,
        exercises: [
          { id: 'pe6', name: 'Band pull-aparts', sub_label: '15 reps', sets: 3, reps: 15, reps_unit: 'reps', label: null, coaching_cue: 'Keep arms straight. Squeeze shoulder blades together.' },
          { id: 'pe7', name: 'DB lateral raises', sub_label: '12 reps · light weight', sets: 3, reps: 12, reps_unit: 'reps', label: null, coaching_cue: 'Lead with elbows. No shrugging.' },
          { id: 'pe8', name: 'Face pulls', sub_label: '15 reps', sets: 3, reps: 15, reps_unit: 'reps', label: null, coaching_cue: 'Pull toward face. Elbows high and wide.' },
        ],
      },
    ],
  },
]

const DOWNLOADABLE_PROGRAMS = [
  {
    id: 'dp-1',
    name: '6-Week Home Strength Program',
    price: 49,
    description: 'A complete 6-week progressive strength program you can do at home with minimal equipment.',
    equipment: 'Dumbbells, resistance bands',
    weeks: 6,
    sessionsPerWeek: 4,
    level: 'Beginner–Intermediate',
    includes: ['PDF workout guide', '40+ exercise demos', 'Nutrition tips', 'Progress tracker'],
    mindbodyUrl: 'https://clients.mindbodyonline.com/classic/ws?studioid=139698',
    tag: 'Best seller',
    tagColor: 'bg-brand-gold/20 text-brand-gold',
  },
  {
    id: 'dp-2',
    name: '4-Week Mobility Reset',
    price: 29,
    description: 'Four weeks of targeted mobility work to restore movement quality and reduce pain.',
    equipment: 'Mat, foam roller',
    weeks: 4,
    sessionsPerWeek: 5,
    level: 'All levels',
    includes: ['PDF workout guide', 'Video library access', 'Daily movement checklist'],
    mindbodyUrl: 'https://clients.mindbodyonline.com/classic/ws?studioid=139698',
    tag: 'Most popular',
    tagColor: 'bg-brand-sage/20 text-brand-sage',
  },
  {
    id: 'dp-3',
    name: 'Postpartum Return to Training',
    price: 79,
    description: 'A safe, structured 8-week return-to-training program designed specifically for postpartum women.',
    equipment: 'Minimal — bodyweight focus',
    weeks: 8,
    sessionsPerWeek: 3,
    level: 'Postpartum',
    includes: ['PDF workout guide', 'Pelvic floor guidance', 'Nutrition guide', '1x check-in call with Shauna'],
    mindbodyUrl: 'https://clients.mindbodyonline.com/classic/ws?studioid=139698',
    tag: 'New',
    tagColor: 'bg-blue-400/20 text-blue-300',
  },
]

// ─── Shared components ────────────────────────────────────────────────────────
const BLOCK_STYLES = {
  warmup:          { bg: 'bg-blue-500/10',      border: 'border-blue-500/30',      tag: 'bg-blue-500/20 text-blue-300',      dot: 'bg-blue-400' },
  warmup_superset: { bg: 'bg-amber-500/10',     border: 'border-amber-500/30',     tag: 'bg-amber-500/20 text-amber-300',    dot: 'bg-amber-400' },
  circuit:         { bg: 'bg-amber-500/10',     border: 'border-amber-500/30',     tag: 'bg-amber-500/20 text-amber-300',    dot: 'bg-amber-400' },
  superset_a:      { bg: 'bg-brand-sage/10',    border: 'border-brand-sage/30',    tag: 'bg-brand-sage/20 text-brand-sage',  dot: 'bg-brand-sage' },
  superset_b:      { bg: 'bg-brand-linen/10',   border: 'border-brand-linen/30',   tag: 'bg-brand-linen/20 text-brand-linen',dot: 'bg-brand-linen' },
  superset_c:      { bg: 'bg-brand-sage/10',    border: 'border-brand-sage/30',    tag: 'bg-brand-sage/20 text-brand-sage',  dot: 'bg-brand-sage' },
  superset_d:      { bg: 'bg-brand-linen/10',   border: 'border-brand-linen/30',   tag: 'bg-brand-linen/20 text-brand-linen',dot: 'bg-brand-linen' },
  amrap:           { bg: 'bg-amber-500/10',     border: 'border-amber-500/30',     tag: 'bg-amber-500/20 text-amber-300',    dot: 'bg-amber-400' },
  cooldown:        { bg: 'bg-blue-500/10',      border: 'border-blue-500/30',      tag: 'bg-blue-500/20 text-blue-300',      dot: 'bg-blue-400' },
}

function MiniBlock({ block }) {
  const style = BLOCK_STYLES[block.type] || BLOCK_STYLES.warmup
  return (
    <div className={`rounded-xl border ${style.border} ${style.bg} p-3 mb-3`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
        <span className={`text-[10px] font-bold tracking-widest px-2 py-0.5 rounded ${style.tag}`}>{block.label}</span>
        {block.rounds && <span className="text-brand-offwhite/30 text-xs">{block.rounds} rounds</span>}
        {block.sets && !block.rounds && <span className="text-brand-offwhite/30 text-xs">{block.sets} sets</span>}
      </div>
      <div className="space-y-1.5">
        {block.exercises.map(ex => (
          <div key={ex.id} className="flex items-start gap-2">
            {ex.label && <span className="text-[10px] font-bold text-brand-offwhite/40 w-5 flex-shrink-0 mt-0.5">{ex.label}</span>}
            <div className="flex-1 min-w-0">
              <p className="text-brand-offwhite text-sm">{ex.name}</p>
              {ex.sub_label && <p className="text-brand-offwhite/40 text-xs">{ex.sub_label}</p>}
              {ex.coaching_cue && <p className="text-brand-offwhite/30 text-xs italic mt-0.5">"{ex.coaching_cue}"</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Section 1: In Studio ─────────────────────────────────────────────────────
function InStudioSection({ userTier }) {
  const [selected, setSelected] = useState(null)
  const today = new Date().getDay()
  const dayMap = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }

  return (
    <div className="flex h-full overflow-hidden">
      {/* List */}
      <div className={`flex flex-col overflow-hidden flex-shrink-0 transition-all duration-300 ${selected ? 'w-[300px]' : 'flex-1 max-w-2xl'}`}>
        <div className="p-6 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-brand-sage" />
            <p className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest">In Studio Daily Workouts</p>
          </div>
          <p className="text-brand-offwhite font-semibold text-lg">This week's sessions</p>
          <p className="text-brand-offwhite/40 text-sm mt-1">Mon–Sat group class workouts. New each week.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {IN_STUDIO_WORKOUTS.map((w, i) => {
            const accessible = canAccess(userTier, w.requiredTier)
            const isToday = dayMap[w.dayLabel] === today
            const exerciseCount = w.blocks?.reduce((a, b) => a + b.exercises.length, 0) || 0
            return (
              <button
                key={w.id}
                onClick={() => accessible && setSelected(w)}
                className={`w-full text-left rounded-xl border p-4 transition-all ${
                  selected?.id === w.id ? 'border-brand-sage/40 bg-brand-sage/5'
                  : !accessible ? 'border-white/5 bg-brand-surface/40 opacity-50 cursor-not-allowed'
                  : isToday ? 'border-brand-sage/20 bg-brand-surface hover:border-brand-sage/40'
                  : 'border-white/5 bg-brand-surface hover:border-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-brand-offwhite/40 text-xs font-medium">{w.dayLabel}</span>
                      {isToday && <span className="text-[9px] font-bold bg-brand-sage text-brand-dark px-1.5 py-0.5 rounded tracking-wide">TODAY</span>}
                      {!accessible && <span className="text-[9px] bg-white/10 text-brand-offwhite/40 px-1.5 py-0.5 rounded">Members only</span>}
                    </div>
                    <p className="text-brand-offwhite font-medium text-sm truncate">{w.name}</p>
                    <p className="text-brand-offwhite/40 text-xs mt-0.5">{exerciseCount} exercises · {w.focus}</p>
                  </div>
                  {accessible
                    ? <span className="text-brand-sage text-sm flex-shrink-0 mt-0.5">→</span>
                    : <span className="flex-shrink-0 text-sm">🔒</span>
                  }
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Detail */}
      {selected && (
        <div className="flex-1 border-l border-white/5 flex flex-col overflow-hidden">
          <div className="flex items-start justify-between p-5 border-b border-white/5 flex-shrink-0">
            <div>
              <p className="text-brand-offwhite font-semibold text-lg">{selected.name}</p>
              <p className="text-brand-offwhite/40 text-sm mt-0.5">{selected.focus} · {selected.equipment}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link to="/workout" className="bg-brand-sage text-brand-dark text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand-sage/90 transition-colors">
                Start workout →
              </Link>
              <button onClick={() => setSelected(null)} className="text-brand-offwhite/30 hover:text-brand-offwhite text-xl leading-none ml-1">✕</button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            <div className="bg-brand-surface border border-white/5 rounded-xl p-4 mb-5">
              <p className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest mb-2">Coach note</p>
              <p className="text-brand-offwhite/70 text-sm leading-relaxed italic">"{selected.coach_note}"</p>
              <p className="text-brand-offwhite/30 text-xs mt-2">— Shauna</p>
            </div>
            {selected.blocks?.map(block => <MiniBlock key={block.id} block={block} />)}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Section 2: Personal Workouts ────────────────────────────────────────────
function PersonalSection() {
  const { user } = useAuth()
  const [selected, setSelected]   = useState(null)
  const [workouts, setWorkouts]   = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('personal_workouts')
      .select('*')
      .eq('assigned_to', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        // Fall back to mock data if DB is empty
        setWorkouts(data?.length > 0 ? data : PERSONAL_WORKOUTS)
        setLoading(false)
      })
  }, [user?.id])

  return (
    <div className="flex h-full overflow-hidden">
      <div className={`flex flex-col overflow-hidden flex-shrink-0 transition-all duration-300 ${selected ? 'w-[300px]' : 'flex-1 max-w-2xl'}`}>
        <div className="p-6 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-brand-gold" />
            <p className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest">Personal Workouts</p>
          </div>
          <p className="text-brand-offwhite font-semibold text-lg">Prescribed by Shauna</p>
          <p className="text-brand-offwhite/40 text-sm mt-1">Custom workouts assigned to you personally.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="text-center py-16">
              <p className="text-brand-offwhite/30 text-sm">Loading workouts...</p>
            </div>
          ) : workouts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-3xl mb-3">📋</p>
              <p className="text-brand-offwhite/40 text-sm">No personal workouts yet.</p>
              <p className="text-brand-offwhite/25 text-xs mt-1">Shauna will assign workouts to you here.</p>
            </div>
          ) : (
            workouts.map(w => {
              const exerciseCount = (w.blocks || []).reduce((a, b) => a + (b.exercises?.length || 0), 0)
              const dateStr = w.created_at || w.assignedDate
              return (
                <button
                  key={w.id}
                  onClick={() => setSelected(w)}
                  className={`w-full text-left rounded-xl border p-4 transition-all ${
                    selected?.id === w.id ? 'border-brand-gold/40 bg-brand-gold/5' : 'border-white/5 bg-brand-surface hover:border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-bold bg-brand-gold/20 text-brand-gold px-1.5 py-0.5 rounded tracking-wide">PERSONAL</span>
                        {dateStr && <span className="text-brand-offwhite/30 text-xs">{new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                      </div>
                      <p className="text-brand-offwhite font-medium text-sm">{w.name}</p>
                      <p className="text-brand-offwhite/40 text-xs mt-0.5">{exerciseCount} exercises · {w.focus}</p>
                    </div>
                    <span className="text-brand-gold text-sm flex-shrink-0 mt-0.5">→</span>
                  </div>
                  {(w.coach_note || w.coachNote) && (
                    <p className="text-brand-offwhite/30 text-xs mt-2.5 leading-relaxed line-clamp-2 italic">"{w.coach_note || w.coachNote}"</p>
                  )}
                </button>
              )
            })
          )}
        </div>
      </div>

      {selected && (
        <div className="flex-1 border-l border-white/5 flex flex-col overflow-hidden">
          <div className="flex items-start justify-between p-5 border-b border-white/5 flex-shrink-0">
            <div>
              <span className="text-[9px] font-bold bg-brand-gold/20 text-brand-gold px-1.5 py-0.5 rounded tracking-wide">PERSONAL</span>
              <p className="text-brand-offwhite font-semibold text-lg mt-1">{selected.name}</p>
              <p className="text-brand-offwhite/40 text-sm">{selected.focus} · {selected.equipment}</p>
            </div>
            <button onClick={() => setSelected(null)} className="text-brand-offwhite/30 hover:text-brand-offwhite text-xl leading-none">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            {(selected.coach_note || selected.coachNote) && (
              <div className="bg-brand-surface border border-white/5 rounded-xl p-4 mb-5">
                <p className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest mb-2">Coach note</p>
                <p className="text-brand-offwhite/70 text-sm leading-relaxed italic">"{selected.coach_note || selected.coachNote}"</p>
                <p className="text-brand-offwhite/30 text-xs mt-2">— Shauna</p>
              </div>
            )}
            {(selected.blocks || []).map(block => <MiniBlock key={block.id} block={block} />)}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Section 3: Downloadable Programs ────────────────────────────────────────
function DownloadableSection() {
  const [selected, setSelected] = useState(null)

  return (
    <div className="flex h-full overflow-hidden">
      <div className={`flex flex-col overflow-hidden flex-shrink-0 transition-all duration-300 ${selected ? 'w-[320px]' : 'flex-1 max-w-3xl'}`}>
        <div className="p-6 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <p className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest">Paid Downloadable Programs</p>
          </div>
          <p className="text-brand-offwhite font-semibold text-lg">Programs by Shauna</p>
          <p className="text-brand-offwhite/40 text-sm mt-1">Purchase and download complete training programs.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {DOWNLOADABLE_PROGRAMS.map(p => (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className={`w-full text-left rounded-xl border p-4 transition-all ${
                selected?.id === p.id ? 'border-blue-400/40 bg-blue-400/5' : 'border-white/5 bg-brand-surface hover:border-white/10'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${p.tagColor}`}>{p.tag}</span>
                    <span className="text-brand-offwhite/30 text-xs">{p.weeks} weeks</span>
                  </div>
                  <p className="text-brand-offwhite font-medium text-sm">{p.name}</p>
                  <p className="text-brand-offwhite/40 text-xs mt-0.5">{p.level} · {p.sessionsPerWeek}x/wk</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-brand-offwhite font-semibold text-lg">${p.price}</p>
                  <p className="text-brand-offwhite/30 text-[10px]">one-time</p>
                </div>
              </div>
              <p className="text-brand-offwhite/35 text-xs mt-2.5 leading-relaxed line-clamp-2">{p.description}</p>
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <div className="flex-1 border-l border-white/5 flex flex-col overflow-hidden">
          <div className="flex items-start justify-between p-5 border-b border-white/5 flex-shrink-0">
            <div className="flex-1 min-w-0 pr-4">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${selected.tagColor}`}>{selected.tag}</span>
              <p className="text-brand-offwhite font-semibold text-lg mt-1 leading-tight">{selected.name}</p>
              <p className="text-brand-offwhite/40 text-sm mt-0.5">{selected.level}</p>
            </div>
            <button onClick={() => setSelected(null)} className="text-brand-offwhite/30 hover:text-brand-offwhite text-xl leading-none flex-shrink-0">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Duration', value: `${selected.weeks} wks` },
                { label: 'Sessions', value: `${selected.sessionsPerWeek}x/wk` },
                { label: 'Level', value: selected.level.split('–')[0] },
              ].map(s => (
                <div key={s.label} className="bg-brand-dark/60 border border-white/5 rounded-xl p-3 text-center">
                  <p className="text-brand-offwhite font-semibold">{s.value}</p>
                  <p className="text-brand-offwhite/40 text-[10px] mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest mb-2">About</p>
              <p className="text-brand-offwhite/70 text-sm leading-relaxed">{selected.description}</p>
            </div>
            <div>
              <p className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest mb-2">Equipment</p>
              <p className="text-brand-offwhite/60 text-sm">{selected.equipment}</p>
            </div>
            <div>
              <p className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest mb-2">What's included</p>
              <div className="space-y-1.5">
                {selected.includes.map(item => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="text-brand-sage text-xs">✓</span>
                    <span className="text-brand-offwhite/60 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-brand-surface border border-white/5 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-brand-offwhite font-semibold text-xl">${selected.price}</p>
                <p className="text-brand-offwhite/30 text-xs">one-time purchase</p>
              </div>
              <a
                href={selected.mindbodyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-brand-sage text-brand-dark font-semibold py-3 rounded-xl text-sm text-center hover:bg-brand-sage/90 transition-colors"
              >
                Purchase via Mindbody →
              </a>
              <p className="text-brand-offwhite/25 text-[10px] text-center mt-2">Secure payment through Mindbody</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
const SECTIONS = [
  { id: 'studio',     label: 'In Studio',      sub: 'Daily group workouts',       dot: 'bg-brand-sage',  requiredTier: 'group_class' },
  { id: 'personal',   label: 'Personal',        sub: 'Prescribed by Shauna',       dot: 'bg-brand-gold',  requiredTier: 'basic' },
  { id: 'downloads',  label: 'Programs',        sub: 'Paid downloadable content',  dot: 'bg-blue-400',    requiredTier: 'basic' },
]

export default function Workouts() {
  const { user } = useAuth()
  const [activeSection, setActiveSection] = useState('studio')

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left nav */}
      <div className="w-[200px] flex-shrink-0 border-r border-white/5 flex flex-col">
        <div className="p-5 border-b border-white/5">
          <h1 className="text-brand-offwhite font-semibold text-base">Workouts</h1>
          <p className="text-brand-offwhite/40 text-xs mt-0.5">3 sections</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {SECTIONS.map(s => {
            const accessible = canAccess(user?.tier || 'basic', s.requiredTier)
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full text-left rounded-xl p-3 transition-all ${
                  activeSection === s.id
                    ? 'bg-brand-surface border border-white/8'
                    : 'hover:bg-white/3'
                }`}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
                  <p className={`text-sm font-medium ${activeSection === s.id ? 'text-brand-offwhite' : 'text-brand-offwhite/60'}`}>{s.label}</p>
                </div>
                <p className="text-brand-offwhite/30 text-[10px] pl-3.5">{s.sub}</p>
              </button>
            )
          })}
        </nav>

        {/* Tier badge */}
        <div className="p-4 border-t border-white/5">
          <p className="text-brand-offwhite/30 text-[10px] mb-1.5">Your access</p>
          <span className={`inline-block text-[10px] font-bold px-2 py-1 rounded ${
            user?.tier === 'full_access' ? 'bg-brand-sage/20 text-brand-sage'
            : user?.tier === 'personal_training' ? 'bg-brand-gold/20 text-brand-gold'
            : user?.tier === 'group_class' ? 'bg-brand-linen/20 text-brand-linen'
            : 'bg-white/10 text-brand-offwhite/50'
          }`}>
            {user?.tier === 'full_access' ? 'Full Access'
              : user?.tier === 'personal_training' ? 'Personal Training'
              : user?.tier === 'group_class' ? 'Group Class'
              : 'Basic'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeSection === 'studio'    && <InStudioSection userTier={user?.tier || 'basic'} />}
        {activeSection === 'personal'  && <PersonalSection />}
        {activeSection === 'downloads' && <DownloadableSection />}
      </div>
    </div>
  )
}
