import { useState, useMemo } from 'react'
import { MONDAY_WORKOUT, TUESDAY_WORKOUT, WEDNESDAY_WORKOUT, THURSDAY_WORKOUT, FRIDAY_WORKOUT, SATURDAY_WORKOUT } from '../data/workoutData'

// Block type → color styling
const BLOCK_STYLES = {
  warmup: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', tag: 'bg-blue-500/20 text-blue-300', dot: 'bg-blue-400' },
  warmup_superset: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', tag: 'bg-amber-500/20 text-amber-300', dot: 'bg-amber-400' },
  circuit: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', tag: 'bg-amber-500/20 text-amber-300', dot: 'bg-amber-400' },
  superset_a: { bg: 'bg-brand-sage/10', border: 'border-brand-sage/30', tag: 'bg-brand-sage/20 text-brand-sage', dot: 'bg-brand-sage' },
  superset_c: { bg: 'bg-brand-sage/10', border: 'border-brand-sage/30', tag: 'bg-brand-sage/20 text-brand-sage', dot: 'bg-brand-sage' },
  superset_b: { bg: 'bg-brand-linen/10', border: 'border-brand-linen/30', tag: 'bg-brand-linen/20 text-brand-linen', dot: 'bg-brand-linen' },
  superset_d: { bg: 'bg-brand-linen/10', border: 'border-brand-linen/30', tag: 'bg-brand-linen/20 text-brand-linen', dot: 'bg-brand-linen' },
  amrap: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', tag: 'bg-amber-500/20 text-amber-300', dot: 'bg-amber-400' },
  cooldown: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', tag: 'bg-blue-500/20 text-blue-300', dot: 'bg-blue-400' },
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const WORKOUT_BY_DAY = { Mon: MONDAY_WORKOUT, Tue: TUESDAY_WORKOUT, Wed: WEDNESDAY_WORKOUT, Thu: THURSDAY_WORKOUT, Fri: FRIDAY_WORKOUT, Sat: SATURDAY_WORKOUT }

function SetTable({ exercise, setLogs, onSetChange }) {
  if (exercise.reps_unit === 'timed') {
    return (
      <div className="mt-2 px-3 py-2 rounded bg-blue-500/10 border border-blue-500/20">
        <p className="text-blue-300 text-xs">Timed hold — no weight logging</p>
      </div>
    )
  }

  return (
    <div className="mt-2">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-brand-offwhite/30">
            <th className="text-left py-1 pr-3 font-normal w-8">Set</th>
            <th className="text-left py-1 pr-3 font-normal w-16">Reps</th>
            <th className="text-left py-1 pr-3 font-normal w-24">Weight (kg)</th>
            <th className="text-left py-1 pr-3 font-normal w-24">Last time</th>
            <th className="text-right py-1 font-normal w-8">Done</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: exercise.sets }, (_, i) => {
            const setNum = i + 1
            const log = setLogs[`${exercise.id}-${setNum}`] || {}
            return (
              <tr key={setNum} className={`border-t border-white/5 ${log.completed ? 'opacity-60' : ''}`}>
                <td className="py-1.5 pr-3 text-brand-offwhite/40">{setNum}</td>
                <td className="py-1.5 pr-3 text-brand-offwhite/60">{exercise.reps}</td>
                <td className="py-1.5 pr-3">
                  <input
                    type="number"
                    value={log.weight || ''}
                    onChange={e => onSetChange(exercise.id, setNum, 'weight', e.target.value)}
                    placeholder="—"
                    className="w-20 bg-white/5 border border-white/10 rounded px-2 py-0.5 text-brand-offwhite focus:outline-none focus:border-brand-sage text-xs"
                  />
                </td>
                <td className="py-1.5 pr-3 text-brand-offwhite/30">—</td>
                <td className="py-1.5 text-right">
                  <button
                    onClick={() => onSetChange(exercise.id, setNum, 'completed', !log.completed)}
                    className={`w-5 h-5 rounded border transition-colors ${
                      log.completed
                        ? 'bg-brand-sage border-brand-sage text-brand-dark'
                        : 'border-white/20 hover:border-brand-sage/50'
                    } flex items-center justify-center ml-auto`}
                  >
                    {log.completed && <span className="text-[10px]">✓</span>}
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function ExerciseRow({ exercise, index, setLogs, onSetChange, onSelectExercise, isSelected }) {
  return (
    <div
      className={`rounded-lg border transition-colors ${isSelected ? 'border-brand-sage/40 bg-brand-sage/5' : 'border-white/5 bg-brand-dark/40'}`}
    >
      <div
        className="flex items-center gap-3 p-3 cursor-pointer"
        onClick={() => onSelectExercise(exercise)}
      >
        {/* Index number */}
        <span className="text-brand-offwhite/30 text-xs w-5 text-center flex-shrink-0">{index + 1}</span>

        {/* Play button */}
        <button
          onClick={e => { e.stopPropagation(); onSelectExercise(exercise) }}
          className="w-7 h-7 rounded-full bg-brand-gold/20 border border-brand-gold/40 flex items-center justify-center flex-shrink-0 hover:bg-brand-gold/30 transition-colors"
        >
          <span className="text-brand-gold text-[10px] ml-0.5">▶</span>
        </button>

        {/* Exercise name */}
        <div className="flex-1 min-w-0">
          {exercise.label && (
            <span className="text-[10px] font-bold text-brand-offwhite/40 mr-2">{exercise.label}</span>
          )}
          <span className="text-brand-offwhite text-sm font-medium">{exercise.name}</span>
          {exercise.sub_label && (
            <p className="text-brand-offwhite/40 text-xs mt-0.5">{exercise.sub_label}</p>
          )}
        </div>
      </div>

      <div className="px-3 pb-3">
        <SetTable
          exercise={exercise}
          setLogs={setLogs}
          onSetChange={onSetChange}
        />
      </div>
    </div>
  )
}

function BlockCard({ block, setLogs, onSetChange, onSelectExercise, selectedExercise }) {
  const style = BLOCK_STYLES[block.type] || BLOCK_STYLES.warmup

  return (
    <div className={`rounded-xl border ${style.border} ${style.bg} p-4 mb-4`}>
      {/* Block header */}
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-2 h-2 rounded-full ${style.dot}`} />
        <span className={`text-[10px] font-bold tracking-widest px-2 py-0.5 rounded ${style.tag}`}>
          {block.label}
        </span>
        {block.rounds && <span className="text-brand-offwhite/30 text-xs">{block.rounds} rounds</span>}
        {block.sets && !block.rounds && <span className="text-brand-offwhite/30 text-xs">{block.sets} sets</span>}
        {block.duration && <span className="text-brand-offwhite/30 text-xs">{block.duration} min AMRAP</span>}
      </div>

      {/* AMRAP special layout */}
      {block.type === 'amrap' ? (
        <div className="space-y-2">
          {block.exercises.map((ex) => (
            <div key={ex.id} className="flex items-center gap-3 py-1.5">
              <button
                onClick={() => onSelectExercise(ex)}
                className="w-6 h-6 rounded-full bg-brand-gold/20 border border-brand-gold/40 flex items-center justify-center flex-shrink-0"
              >
                <span className="text-brand-gold text-[9px] ml-0.5">▶</span>
              </button>
              <div className="flex-1">
                <span className="text-brand-offwhite text-sm">{ex.name}</span>
                <span className="text-brand-offwhite/40 text-xs ml-2">{ex.sub_label}</span>
              </div>
            </div>
          ))}
          <div className="mt-3 pt-3 border-t border-white/10 flex gap-4">
            <div>
              <p className="text-brand-offwhite/40 text-xs mb-1">KB weight (kg)</p>
              <input
                type="number"
                className="w-24 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-brand-offwhite text-sm focus:outline-none focus:border-brand-sage"
                placeholder="—"
              />
            </div>
            <div>
              <p className="text-brand-offwhite/40 text-xs mb-1">Rounds completed</p>
              <input
                type="number"
                className="w-24 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-brand-offwhite text-sm focus:outline-none focus:border-brand-sage"
                placeholder="—"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {block.exercises.map((ex, i) => (
            <ExerciseRow
              key={ex.id}
              exercise={ex}
              index={i}
              setLogs={setLogs}
              onSetChange={onSetChange}
              onSelectExercise={onSelectExercise}
              isSelected={selectedExercise?.id === ex.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function RightPanel({ selectedExercise, notes, onNotesChange, onSaveNotes }) {
  return (
    <div className="w-[300px] flex-shrink-0 flex flex-col gap-4 h-full overflow-y-auto p-4">
      {/* Video panel */}
      <div className="bg-brand-surface border border-white/5 rounded-xl overflow-hidden">
        <div className="aspect-video bg-brand-dark flex items-center justify-center relative">
          {selectedExercise?.youtube_url ? (
            <iframe
              src={selectedExercise.youtube_url}
              className="w-full h-full"
              allowFullScreen
            />
          ) : (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-brand-gold/20 border border-brand-gold/40 flex items-center justify-center mx-auto mb-2">
                <span className="text-brand-gold text-lg ml-1">▶</span>
              </div>
              <p className="text-brand-offwhite/30 text-xs">
                {selectedExercise ? selectedExercise.name : 'Select an exercise'}
              </p>
            </div>
          )}
        </div>
        {selectedExercise && (
          <div className="p-3">
            <p className="text-brand-offwhite text-sm font-medium">{selectedExercise.name}</p>
            {selectedExercise.coaching_cue && (
              <p className="text-brand-offwhite/50 text-xs mt-1">{selectedExercise.coaching_cue}</p>
            )}
          </div>
        )}
      </div>

      {/* Session notes */}
      <div className="bg-brand-surface border border-white/5 rounded-xl p-4">
        <p className="text-brand-offwhite/50 text-xs mb-2 tracking-wide uppercase font-semibold">Session notes</p>
        <textarea
          value={notes}
          onChange={e => onNotesChange(e.target.value)}
          placeholder="How did this session feel? Any PRs, niggles, or observations..."
          rows={5}
          className="w-full bg-brand-dark border border-white/5 rounded-lg p-3 text-brand-offwhite text-xs resize-none focus:outline-none focus:border-brand-sage/50 placeholder:text-brand-offwhite/20"
        />
        <button
          onClick={onSaveNotes}
          className="mt-2 w-full bg-brand-sage/20 hover:bg-brand-sage/30 border border-brand-sage/30 text-brand-sage text-xs py-2 rounded-lg transition-colors font-medium"
        >
          Save notes
        </button>
      </div>
    </div>
  )
}

export default function TodaysWorkout() {
  const [activeDay, setActiveDay] = useState('Mon')
  const [setLogs, setSetLogs] = useState({})
  const [selectedExercise, setSelectedExercise] = useState(null)
  const [notes, setNotes] = useState('')
  const [markedComplete, setMarkedComplete] = useState(false)

  const workout = WORKOUT_BY_DAY[activeDay] || null

  const handleSetChange = (exerciseId, setNum, field, value) => {
    const key = `${exerciseId}-${setNum}`
    setSetLogs(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }))
  }

  // Calculate progress
  const { totalSets, doneSets } = useMemo(() => {
    if (!workout) return { totalSets: 0, doneSets: 0 }
    let total = 0
    let done = 0
    workout.blocks.forEach(block => {
      block.exercises.forEach(ex => {
        if (ex.reps_unit === 'timed' || ex.sets === null) return
        const sets = ex.sets || 1
        total += sets
        for (let i = 1; i <= sets; i++) {
          const key = `${ex.id}-${i}`
          if (setLogs[key]?.completed) done++
        }
      })
    })
    return { totalSets: total, doneSets: done }
  }, [workout, setLogs])

  const pct = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0

  const today = new Date()
  const dateStr = today.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main workout column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5 flex-shrink-0 flex-wrap gap-y-2">
          {/* Day pills */}
          <div className="flex gap-1">
            {DAYS.map(day => (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  activeDay === day
                    ? 'bg-brand-sage text-brand-dark'
                    : WORKOUT_BY_DAY[day]
                    ? 'bg-white/10 text-brand-offwhite hover:bg-white/15'
                    : 'bg-white/5 text-brand-offwhite/30 cursor-not-allowed'
                }`}
                disabled={!WORKOUT_BY_DAY[day] && day !== activeDay}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Date pill */}
          <span className="px-3 py-1.5 rounded-full bg-white/5 text-brand-offwhite/50 text-xs">{dateStr}</span>

          <div className="ml-auto flex gap-2">
            <button
              onClick={() => setMarkedComplete(true)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                markedComplete
                  ? 'bg-brand-sage text-brand-dark'
                  : 'bg-brand-sage/20 border border-brand-sage/40 text-brand-sage hover:bg-brand-sage/30'
              }`}
            >
              {markedComplete ? '✓ Complete' : 'Mark complete'}
            </button>
            <button
              onClick={() => {}}
              className="px-4 py-1.5 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-brand-offwhite/60 hover:text-brand-offwhite hover:bg-white/10 transition-colors"
            >
              Save notes
            </button>
          </div>
        </div>

        {/* Workout content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {workout ? (
            <>
              {/* Program header card */}
              <div className="bg-brand-surface border border-white/5 rounded-xl p-5 mb-6">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <h2 className="text-brand-offwhite text-lg font-semibold">{workout.name}</h2>
                    <div className="flex flex-wrap gap-3 mt-2">
                      <span className="text-brand-offwhite/40 text-xs">{workout.date}</span>
                      <span className="text-brand-offwhite/40 text-xs">·</span>
                      <span className="text-brand-offwhite/40 text-xs">{workout.equipment}</span>
                      <span className="text-brand-offwhite/40 text-xs">·</span>
                      <span className="text-brand-offwhite/40 text-xs">{workout.focus}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/5">
                  <p className="text-brand-offwhite/40 text-xs mb-1 uppercase tracking-widest font-semibold">Coach note</p>
                  <p className="text-brand-offwhite/70 text-sm leading-relaxed italic">"{workout.coach_note}"</p>
                  <p className="text-brand-offwhite/30 text-xs mt-1">— Shauna</p>
                </div>
              </div>

              {/* Blocks */}
              {workout.blocks.map(block => (
                <BlockCard
                  key={block.id}
                  block={block}
                  setLogs={setLogs}
                  onSetChange={handleSetChange}
                  onSelectExercise={setSelectedExercise}
                  selectedExercise={selectedExercise}
                />
              ))}
            </>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-brand-offwhite/40 text-sm">No workout scheduled for {activeDay}</p>
                <p className="text-brand-offwhite/20 text-xs mt-1">Rest day — recover well.</p>
              </div>
            </div>
          )}
        </div>

        {/* Summary bar */}
        {workout && (
          <div className="flex items-center gap-6 px-6 py-3 border-t border-white/5 bg-brand-surface flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-brand-offwhite text-sm font-semibold">{doneSets}</span>
              <span className="text-brand-offwhite/30 text-sm">/</span>
              <span className="text-brand-offwhite/50 text-sm">{totalSets} sets</span>
            </div>
            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-sage rounded-full transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-brand-sage text-sm font-semibold">{pct}%</span>
          </div>
        )}
      </div>

      {/* Right panel */}
      <div className="border-l border-white/5 hidden lg:flex flex-col">
        <RightPanel
          selectedExercise={selectedExercise}
          notes={notes}
          onNotesChange={setNotes}
          onSaveNotes={() => {}}
        />
      </div>
    </div>
  )
}
