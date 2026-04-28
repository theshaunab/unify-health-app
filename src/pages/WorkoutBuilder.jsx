import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const BLOCK_TYPES = [
  { value: 'warmup',     label: 'Warmup' },
  { value: 'circuit',    label: 'Circuit' },
  { value: 'superset_a', label: 'Superset A' },
  { value: 'superset_b', label: 'Superset B' },
  { value: 'superset_c', label: 'Superset C' },
  { value: 'amrap',      label: 'AMRAP' },
  { value: 'cooldown',   label: 'Cooldown' },
]

const REPS_UNITS = ['reps', 'each side', 'timed', 'metres']

const emptyExercise = () => ({
  id: `ex-${Date.now()}-${Math.random()}`,
  label: '', name: '', sub_label: '',
  sets: 3, reps: 10, reps_unit: 'reps', coaching_cue: '',
})

const emptyBlock = () => ({
  id: `block-${Date.now()}`,
  label: 'SUPERSET A', type: 'superset_a',
  sets: 3, rounds: null,
  exercises: [emptyExercise()],
})

function ExerciseEditor({ exercise, onChange, onRemove, index }) {
  return (
    <div className="bg-brand-dark/60 border border-white/5 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-brand-offwhite/40 text-xs uppercase tracking-widest">Exercise {index + 1}</p>
        <button onClick={onRemove} className="text-brand-offwhite/20 hover:text-red-400 text-sm transition-colors">✕</button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest block mb-1">Label</label>
          <input value={exercise.label} onChange={e => onChange({ ...exercise, label: e.target.value })} placeholder="A1, B2..."
            className="w-full bg-brand-surface border border-white/10 rounded-lg px-3 py-2 text-brand-offwhite text-sm focus:outline-none focus:border-brand-sage/50 placeholder:text-brand-offwhite/20" />
        </div>
        <div>
          <label className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest block mb-1">Reps unit</label>
          <select value={exercise.reps_unit} onChange={e => onChange({ ...exercise, reps_unit: e.target.value })}
            className="w-full bg-brand-surface border border-white/10 rounded-lg px-3 py-2 text-brand-offwhite text-sm focus:outline-none focus:border-brand-sage/50">
            {REPS_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest block mb-1">Exercise name *</label>
        <input value={exercise.name} onChange={e => onChange({ ...exercise, name: e.target.value })} placeholder="e.g. Front foot elevated split squats"
          className="w-full bg-brand-surface border border-white/10 rounded-lg px-3 py-2 text-brand-offwhite text-sm focus:outline-none focus:border-brand-sage/50 placeholder:text-brand-offwhite/20" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest block mb-1">Sets</label>
          <input type="number" value={exercise.sets} onChange={e => onChange({ ...exercise, sets: parseInt(e.target.value) || 1 })}
            className="w-full bg-brand-surface border border-white/10 rounded-lg px-3 py-2 text-brand-offwhite text-sm focus:outline-none focus:border-brand-sage/50" />
        </div>
        <div>
          <label className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest block mb-1">Reps</label>
          <input type={exercise.reps_unit === 'timed' ? 'text' : 'number'} value={exercise.reps || ''} onChange={e => onChange({ ...exercise, reps: e.target.value })}
            placeholder={exercise.reps_unit === 'timed' ? '30 sec' : '10'}
            className="w-full bg-brand-surface border border-white/10 rounded-lg px-3 py-2 text-brand-offwhite text-sm focus:outline-none focus:border-brand-sage/50 placeholder:text-brand-offwhite/20" />
        </div>
        <div>
          <label className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest block mb-1">Sub-label</label>
          <input value={exercise.sub_label} onChange={e => onChange({ ...exercise, sub_label: e.target.value })} placeholder="e.g. 8 each side"
            className="w-full bg-brand-surface border border-white/10 rounded-lg px-3 py-2 text-brand-offwhite text-sm focus:outline-none focus:border-brand-sage/50 placeholder:text-brand-offwhite/20" />
        </div>
      </div>
      <div>
        <label className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest block mb-1">Coaching cue</label>
        <input value={exercise.coaching_cue} onChange={e => onChange({ ...exercise, coaching_cue: e.target.value })} placeholder="e.g. Drive through heel, keep torso tall"
          className="w-full bg-brand-surface border border-white/10 rounded-lg px-3 py-2 text-brand-offwhite text-sm focus:outline-none focus:border-brand-sage/50 placeholder:text-brand-offwhite/20" />
      </div>
    </div>
  )
}

function BlockEditor({ block, onChange, onRemove, index }) {
  const updateExercise = (i, u) => { const e = [...block.exercises]; e[i] = u; onChange({ ...block, exercises: e }) }
  const removeExercise = (i) => onChange({ ...block, exercises: block.exercises.filter((_, idx) => idx !== i) })
  const addExercise = () => onChange({ ...block, exercises: [...block.exercises, emptyExercise()] })

  return (
    <div className="bg-brand-surface border border-white/8 rounded-2xl p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-brand-offwhite font-medium text-sm">Block {index + 1}</p>
        <button onClick={onRemove} className="text-brand-offwhite/20 hover:text-red-400 text-xs transition-colors px-2 py-1">Remove</button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div>
          <label className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest block mb-1">Block type</label>
          <select value={block.type} onChange={e => { const f = BLOCK_TYPES.find(b => b.value === e.target.value); onChange({ ...block, type: e.target.value, label: f?.label.toUpperCase() || block.label }) }}
            className="w-full bg-brand-dark border border-white/10 rounded-lg px-3 py-2 text-brand-offwhite text-sm focus:outline-none focus:border-brand-sage/50">
            {BLOCK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest block mb-1">Label</label>
          <input value={block.label} onChange={e => onChange({ ...block, label: e.target.value })}
            className="w-full bg-brand-dark border border-white/10 rounded-lg px-3 py-2 text-brand-offwhite text-sm focus:outline-none focus:border-brand-sage/50" />
        </div>
        <div>
          <label className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest block mb-1">Sets</label>
          <input type="number" value={block.sets || ''} onChange={e => onChange({ ...block, sets: parseInt(e.target.value) || null })} placeholder="3"
            className="w-full bg-brand-dark border border-white/10 rounded-lg px-3 py-2 text-brand-offwhite text-sm focus:outline-none focus:border-brand-sage/50 placeholder:text-brand-offwhite/20" />
        </div>
        <div>
          <label className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest block mb-1">Rounds</label>
          <input type="number" value={block.rounds || ''} onChange={e => onChange({ ...block, rounds: parseInt(e.target.value) || null })} placeholder="—"
            className="w-full bg-brand-dark border border-white/10 rounded-lg px-3 py-2 text-brand-offwhite text-sm focus:outline-none focus:border-brand-sage/50 placeholder:text-brand-offwhite/20" />
        </div>
      </div>
      <div className="space-y-3">
        {block.exercises.map((ex, i) => (
          <ExerciseEditor key={ex.id} exercise={ex} index={i} onChange={u => updateExercise(i, u)} onRemove={() => removeExercise(i)} />
        ))}
      </div>
      <button onClick={addExercise} className="mt-3 w-full border border-dashed border-white/15 text-brand-offwhite/40 hover:text-brand-offwhite/60 text-xs py-2.5 rounded-xl transition-colors">+ Add exercise</button>
    </div>
  )
}

function SavedWorkouts({ userId, onSelect }) {
  const [workouts, setWorkouts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('personal_workouts').select('*').eq('assigned_by', userId).is('assigned_to', null).order('created_at', { ascending: false })
      .then(({ data }) => { setWorkouts(data || []); setLoading(false) })
  }, [userId])

  if (loading) return <p className="text-brand-offwhite/30 text-xs text-center py-6">Loading...</p>
  if (workouts.length === 0) return <p className="text-brand-offwhite/25 text-xs text-center py-6">No saved workouts yet.</p>

  return (
    <div className="space-y-2">
      {workouts.map(w => (
        <div key={w.id} className="flex items-start gap-3 bg-brand-surface border border-white/5 rounded-xl p-3">
          <div className="flex-1 min-w-0">
            <p className="text-brand-offwhite text-sm font-medium">{w.name}</p>
            <p className="text-brand-offwhite/40 text-xs mt-0.5">{w.focus} · {w.blocks?.length || 0} blocks</p>
          </div>
          <button onClick={() => onSelect(w)} className="text-brand-sage text-xs flex-shrink-0 hover:opacity-70 transition-opacity mt-0.5">Assign →</button>
        </div>
      ))}
    </div>
  )
}

export default function WorkoutBuilder() {
  const { user } = useAuth()
  if (user?.role !== 'admin') return <Navigate to="/" replace />

  const [step, setStep] = useState(1)
  const [workoutName, setWorkoutName] = useState('')
  const [coachNote, setCoachNote] = useState('')
  const [focus, setFocus] = useState('')
  const [equipment, setEquipment] = useState('')
  const [blocks, setBlocks] = useState([emptyBlock()])
  const [selectedMembers, setSelectedMembers] = useState([])
  const [members, setMembers] = useState([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('build')

  useEffect(() => {
    supabase.from('users').select('id, name, email, tier').order('name')
      .then(({ data }) => setMembers(data || []))
  }, [])

  const updateBlock  = (i, u) => { const b = [...blocks]; b[i] = u; setBlocks(b) }
  const removeBlock  = (i) => setBlocks(blocks.filter((_, idx) => idx !== i))
  const addBlock     = () => setBlocks([...blocks, emptyBlock()])
  const toggleMember = (id) => setSelectedMembers(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id])
  const totalExercises = blocks.reduce((a, b) => a + b.exercises.length, 0)

  const TIER_COLORS = {
    full_access: 'bg-brand-sage/20 text-brand-sage',
    personal_training: 'bg-brand-gold/20 text-brand-gold',
    group_class: 'bg-brand-linen/20 text-brand-linen',
    basic: 'bg-white/10 text-brand-offwhite/50',
  }

  const handleSave = async () => {
    if (!workoutName.trim()) { setError('Please add a workout name.'); return }
    setSaving(true); setError('')
    try {
      if (selectedMembers.length > 0) {
        const inserts = selectedMembers.map(memberId => ({
          assigned_to: memberId, assigned_by: user.id,
          name: workoutName, coach_note: coachNote, focus, equipment, blocks, status: 'active',
        }))
        const { error: err } = await supabase.from('personal_workouts').insert(inserts)
        if (err) throw err
      } else {
        const { error: err } = await supabase.from('personal_workouts').insert({
          assigned_by: user.id, assigned_to: null,
          name: workoutName, coach_note: coachNote, focus, equipment, blocks, status: 'active',
        })
        if (err) throw err
      }
      setSaved(true)
      setTimeout(() => {
        setSaved(false)
        setWorkoutName(''); setCoachNote(''); setFocus(''); setEquipment('')
        setBlocks([emptyBlock()]); setSelectedMembers([]); setStep(1)
      }, 2000)
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    }
    setSaving(false)
  }

  return (
    <div className="flex h-full overflow-hidden">
      <div className="w-[210px] flex-shrink-0 border-r border-white/5 flex flex-col">
        <div className="p-5 border-b border-white/5">
          <p className="text-brand-offwhite font-semibold text-base">Workout Builder</p>
          <p className="text-brand-offwhite/40 text-xs mt-0.5">Create & assign</p>
        </div>
        <div className="p-3 border-b border-white/5 flex gap-1">
          {[{ id: 'build', label: 'Build new' }, { id: 'saved', label: 'Saved' }].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex-1 text-xs font-medium py-1.5 rounded-lg transition-colors ${activeTab === t.id ? 'bg-brand-sage text-brand-dark' : 'text-brand-offwhite/50 hover:text-brand-offwhite'}`}>
              {t.label}
            </button>
          ))}
        </div>
        {activeTab === 'build' && (
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {[
              { step: 1, label: 'Details',   sub: 'Name, notes, focus' },
              { step: 2, label: 'Exercises', sub: `${totalExercises} added` },
              { step: 3, label: 'Assign',    sub: selectedMembers.length > 0 ? `${selectedMembers.length} selected` : 'Save as template' },
            ].map(s => (
              <button key={s.step} onClick={() => setStep(s.step)}
                className={`w-full text-left rounded-xl p-3 transition-all ${step === s.step ? 'bg-brand-surface border border-white/8' : 'hover:bg-white/3'}`}>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0 ${step === s.step ? 'bg-brand-sage text-brand-dark' : 'bg-white/10 text-brand-offwhite/40'}`}>{s.step}</span>
                  <p className={`text-sm font-medium ${step === s.step ? 'text-brand-offwhite' : 'text-brand-offwhite/50'}`}>{s.label}</p>
                </div>
                <p className="text-brand-offwhite/30 text-[10px] pl-7">{s.sub}</p>
              </button>
            ))}
          </nav>
        )}
        {activeTab === 'saved' && (
          <div className="flex-1 overflow-y-auto p-3">
            <SavedWorkouts userId={user?.id} onSelect={(w) => { setWorkoutName(w.name); setCoachNote(w.coach_note || ''); setFocus(w.focus || ''); setEquipment(w.equipment || ''); setBlocks(w.blocks || [emptyBlock()]); setActiveTab('build'); setStep(3) }} />
          </div>
        )}
        {activeTab === 'build' && (
          <div className="p-4 border-t border-white/5">
            {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
            <button onClick={handleSave} disabled={saving || saved}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${saved ? 'bg-brand-sage/30 text-brand-sage border border-brand-sage/40' : saving ? 'bg-brand-sage/50 text-brand-dark cursor-not-allowed' : 'bg-brand-sage text-brand-dark hover:bg-brand-sage/90'}`}>
              {saved ? '✓ Saved!' : saving ? 'Saving...' : selectedMembers.length > 0 ? `Assign to ${selectedMembers.length}` : 'Save as template'}
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'build' && step === 1 && (
          <div className="max-w-2xl space-y-5">
            <div>
              <h2 className="text-brand-offwhite font-semibold text-lg mb-1">Workout details</h2>
              <p className="text-brand-offwhite/40 text-sm">Give this workout a name and your coaching context.</p>
            </div>
            <div>
              <label className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest block mb-1.5">Workout name *</label>
              <input value={workoutName} onChange={e => setWorkoutName(e.target.value)} placeholder="e.g. Hip Stability Protocol — Week 1"
                className="w-full bg-brand-surface border border-white/10 rounded-xl px-4 py-3 text-brand-offwhite text-sm focus:outline-none focus:border-brand-sage/50 placeholder:text-brand-offwhite/20" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest block mb-1.5">Focus area</label>
                <input value={focus} onChange={e => setFocus(e.target.value)} placeholder="e.g. Rehab & activation"
                  className="w-full bg-brand-surface border border-white/10 rounded-xl px-4 py-3 text-brand-offwhite text-sm focus:outline-none focus:border-brand-sage/50 placeholder:text-brand-offwhite/20" />
              </div>
              <div>
                <label className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest block mb-1.5">Equipment needed</label>
                <input value={equipment} onChange={e => setEquipment(e.target.value)} placeholder="e.g. Resistance bands, mat"
                  className="w-full bg-brand-surface border border-white/10 rounded-xl px-4 py-3 text-brand-offwhite text-sm focus:outline-none focus:border-brand-sage/50 placeholder:text-brand-offwhite/20" />
              </div>
            </div>
            <div>
              <label className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest block mb-1.5">Coach note</label>
              <textarea value={coachNote} onChange={e => setCoachNote(e.target.value)} placeholder="Motivation, intent, and key cues for this session..." rows={4}
                className="w-full bg-brand-surface border border-white/10 rounded-xl px-4 py-3 text-brand-offwhite text-sm resize-none focus:outline-none focus:border-brand-sage/50 placeholder:text-brand-offwhite/20" />
            </div>
            <button onClick={() => setStep(2)} className="bg-brand-sage text-brand-dark font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-brand-sage/90 transition-colors">Next: Add exercises →</button>
          </div>
        )}

        {activeTab === 'build' && step === 2 && (
          <div className="max-w-2xl">
            <div className="mb-5">
              <h2 className="text-brand-offwhite font-semibold text-lg mb-1">Build the workout</h2>
              <p className="text-brand-offwhite/40 text-sm">Add blocks and exercises.</p>
            </div>
            {blocks.map((block, i) => (
              <BlockEditor key={block.id} block={block} index={i} onChange={u => updateBlock(i, u)} onRemove={() => removeBlock(i)} />
            ))}
            <button onClick={addBlock} className="w-full border border-dashed border-white/15 text-brand-offwhite/40 hover:text-brand-offwhite/60 text-sm py-3 rounded-2xl transition-colors mb-5">+ Add block</button>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="px-5 py-2.5 rounded-xl text-sm border border-white/10 text-brand-offwhite/60 hover:text-brand-offwhite transition-colors">← Back</button>
              <button onClick={() => setStep(3)} className="bg-brand-sage text-brand-dark font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-brand-sage/90 transition-colors">Next: Assign →</button>
            </div>
          </div>
        )}

        {activeTab === 'build' && step === 3 && (
          <div className="max-w-2xl space-y-5">
            <div>
              <h2 className="text-brand-offwhite font-semibold text-lg mb-1">Assign to members</h2>
              <p className="text-brand-offwhite/40 text-sm">Select members or save as a template to assign later.</p>
            </div>
            <div className="bg-brand-surface border border-white/5 rounded-2xl p-5">
              <p className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest mb-3">Workout summary</p>
              <p className="text-brand-offwhite font-semibold text-lg">{workoutName || 'Untitled workout'}</p>
              <div className="flex gap-4 mt-2 text-sm">
                <span className="text-brand-offwhite/40">{blocks.length} blocks</span>
                <span className="text-brand-offwhite/40">{totalExercises} exercises</span>
                {focus && <span className="text-brand-offwhite/40">{focus}</span>}
              </div>
              {coachNote && <p className="text-brand-offwhite/35 text-xs mt-3 italic line-clamp-2">"{coachNote}"</p>}
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest">Assign to members</p>
                {selectedMembers.length > 0 && <button onClick={() => setSelectedMembers([])} className="text-brand-offwhite/30 text-xs hover:text-brand-offwhite/60">Clear all</button>}
              </div>
              {members.length === 0 ? (
                <p className="text-brand-offwhite/25 text-xs text-center py-4">No members found yet.</p>
              ) : (
                <div className="space-y-2">
                  {members.map(m => (
                    <button key={m.id} onClick={() => toggleMember(m.id)}
                      className={`w-full flex items-center gap-4 p-3.5 rounded-xl border transition-all text-left ${selectedMembers.includes(m.id) ? 'border-brand-sage/40 bg-brand-sage/5' : 'border-white/5 bg-brand-surface hover:border-white/10'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${selectedMembers.includes(m.id) ? 'bg-brand-sage' : 'bg-brand-sage/20'}`}>
                        <span className={`text-xs font-bold ${selectedMembers.includes(m.id) ? 'text-brand-dark' : 'text-brand-sage'}`}>
                          {selectedMembers.includes(m.id) ? '✓' : m.name?.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-brand-offwhite text-sm font-medium">{m.name}</p>
                        <p className="text-brand-offwhite/40 text-xs">{m.email}</p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded flex-shrink-0 ${TIER_COLORS[m.tier] || 'bg-white/10 text-brand-offwhite/50'}`}>
                        {m.tier === 'personal_training' ? 'PT' : m.tier === 'full_access' ? 'Full' : m.tier === 'group_class' ? 'Group' : 'Basic'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-brand-surface border border-white/5 rounded-xl p-4">
              <p className="text-brand-offwhite/40 text-xs leading-relaxed">
                {selectedMembers.length > 0
                  ? `This workout will appear in the Personal section for ${selectedMembers.length} selected member${selectedMembers.length > 1 ? 's' : ''}.`
                  : 'No members selected — workout will be saved as a template to assign later from the Staff Portal.'}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="px-5 py-2.5 rounded-xl text-sm border border-white/10 text-brand-offwhite/60 hover:text-brand-offwhite transition-colors">← Back</button>
              <button onClick={handleSave} disabled={saving || saved}
                className={`flex-1 font-semibold py-2.5 rounded-xl text-sm transition-colors ${saved ? 'bg-brand-sage/30 text-brand-sage border border-brand-sage/30' : saving ? 'bg-brand-sage/50 text-brand-dark cursor-not-allowed' : 'bg-brand-sage text-brand-dark hover:bg-brand-sage/90'}`}>
                {saved ? '✓ Saved to Supabase!' : saving ? 'Saving...' : selectedMembers.length > 0 ? `Save & assign to ${selectedMembers.length} member${selectedMembers.length !== 1 ? 's' : ''}` : 'Save as template'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
