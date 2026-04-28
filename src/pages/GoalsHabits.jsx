import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const INITIAL_GOALS = [
  { id: 'g1', label: 'Get stronger',            active: true },
  { id: 'g2', label: 'Be healthier & feel better', active: true },
  { id: 'g3', label: 'Recover & rehab',          active: false },
]

const CATEGORY_COLORS = {
  Training:  'text-brand-sage bg-brand-sage/10',
  Nutrition: 'text-brand-gold bg-brand-gold/10',
  Recovery:  'text-blue-300 bg-blue-500/10',
}

const today = new Date().toISOString().split('T')[0]

function HabitRow({ habit, onToggle }) {
  return (
    <div className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${habit.completedToday ? 'border-brand-sage/20 bg-brand-sage/5' : 'border-white/5 bg-brand-surface'}`}>
      <button
        onClick={onToggle}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
          habit.completedToday ? 'bg-brand-sage border-brand-sage' : 'border-white/20 hover:border-brand-sage/50'
        }`}
      >
        {habit.completedToday && <span className="text-brand-dark text-[10px] font-bold">✓</span>}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${habit.completedToday ? 'text-brand-offwhite/50 line-through' : 'text-brand-offwhite'}`}>{habit.label}</p>
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded mt-0.5 inline-block ${CATEGORY_COLORS[habit.category] || CATEGORY_COLORS.Training}`}>{habit.category}</span>
      </div>
      {habit.streak > 0 && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-brand-gold text-xs">🔥</span>
          <span className="text-brand-offwhite/50 text-xs">{habit.streak}d</span>
        </div>
      )}
    </div>
  )
}

export default function GoalsHabits() {
  const { user } = useAuth()
  const [habits, setHabits]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [newHabit, setNewHabit] = useState('')
  const [showAdd, setShowAdd]   = useState(false)
  const [weekLogs, setWeekLogs] = useState([])

  // Load habits from Supabase
  useEffect(() => {
    if (!user?.id) return
    const load = async () => {
      const weekStart = new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0]
      const [{ data: habitsData }, { data: logsData }, { data: weekData }] = await Promise.all([
        supabase.from('habits').select('*').eq('user_id', user.id).eq('active', true),
        supabase.from('habit_logs').select('*').eq('user_id', user.id).eq('date', today),
        supabase.from('workout_logs').select('date, completed').eq('user_id', user.id).gte('date', weekStart),
      ])
      const todayDone = new Set((logsData || []).filter(l => l.completed).map(l => l.habit_id))
      // Use mock habits if none in DB yet
      const base = habitsData?.length > 0 ? habitsData : [
        { id: 'h1', label: "Complete today's workout",       category: 'Training',  streak: 5 },
        { id: 'h2', label: 'Hit daily protein target (130g)', category: 'Nutrition', streak: 3 },
        { id: 'h3', label: '7+ hours sleep',                  category: 'Recovery',  streak: 2 },
        { id: 'h4', label: 'Contrast therapy session',        category: 'Recovery',  streak: 1 },
        { id: 'h5', label: '2L+ water',                       category: 'Nutrition', streak: 7 },
        { id: 'h6', label: 'Morning mobility (10 min)',        category: 'Training',  streak: 0 },
      ]
      setHabits(base.map(h => ({ ...h, completedToday: todayDone.has(h.id) })))
      setWeekLogs(weekData || [])
      setLoading(false)
    }
    load()
  }, [user?.id])

  const toggleHabit = async (id) => {
    const habit   = habits.find(h => h.id === id)
    const newDone = !habit.completedToday
    setHabits(prev => prev.map(h => h.id === id ? { ...h, completedToday: newDone, streak: newDone ? h.streak + 1 : Math.max(0, h.streak - 1) } : h))
    await supabase.from('habit_logs').upsert({ habit_id: id, user_id: user.id, date: today, completed: newDone }, { onConflict: 'habit_id,date' })
  }

  const addHabit = async () => {
    if (!newHabit.trim()) return
    const { data } = await supabase.from('habits').insert({ user_id: user.id, label: newHabit.trim(), category: 'Training' }).select().single()
    const newItem = data || { id: `h${Date.now()}`, label: newHabit.trim(), category: 'Training', streak: 0 }
    setHabits(prev => [...prev, { ...newItem, completedToday: false }])
    setNewHabit('')
    setShowAdd(false)
  }

  const completedCount  = habits.filter(h => h.completedToday).length
  const completionPct   = habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0
  const weekDone        = new Set((weekLogs || []).filter(l => l.completed).map(l => l.date)).size

  const WEEK_CHECK = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000)
    const dateStr = d.toISOString().split('T')[0]
    return { day: ['S','M','T','W','T','F','S'][d.getDay()], done: (weekLogs || []).some(l => l.date === dateStr && l.completed) }
  })

  return (
    <div className="p-6 lg:p-8 max-w-3xl overflow-y-auto h-full">
      <div className="mb-6">
        <h1 className="text-brand-offwhite text-2xl font-semibold">Goals &amp; habits</h1>
        <p className="text-brand-offwhite/40 text-sm mt-1">Track your daily habits and long-term goals.</p>
      </div>

      {/* Today's score */}
      <div className="bg-brand-surface border border-white/5 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-brand-offwhite/60 text-xs uppercase tracking-widest">Today's score</p>
          <p className="text-brand-offwhite font-semibold text-lg">{completedCount}/{habits.length}</p>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-brand-sage rounded-full transition-all duration-500" style={{ width: `${completionPct}%` }} />
        </div>
        <p className="text-brand-offwhite/30 text-xs mt-2">
          {completionPct === 100 ? '🎉 Perfect day!' : completionPct >= 50 ? '💪 Great progress, keep going.' : 'Start checking off your habits.'}
        </p>
      </div>

      {/* Weekly check-in — real workout data */}
      <div className="bg-brand-surface border border-white/5 rounded-xl p-5 mb-6">
        <p className="text-brand-offwhite/60 text-xs uppercase tracking-widest mb-3">Workouts this week</p>
        <div className="flex gap-2">
          {WEEK_CHECK.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${d.done ? 'bg-brand-sage text-brand-dark' : 'bg-white/5 text-brand-offwhite/30'}`}>
                {d.done ? '✓' : d.day}
              </div>
              <p className="text-brand-offwhite/30 text-[10px]">{d.day}</p>
            </div>
          ))}
        </div>
        <p className="text-brand-offwhite/30 text-xs mt-3">{weekDone} session{weekDone !== 1 ? 's' : ''} completed this week</p>
      </div>

      {/* Goals */}
      <div className="mb-6">
        <p className="text-brand-offwhite/60 text-xs uppercase tracking-widest mb-3">My goals</p>
        <div className="space-y-2">
          {INITIAL_GOALS.map(g => (
            <div key={g.id} className={`flex items-center gap-3 p-3 rounded-xl border ${g.active ? 'border-brand-sage/20 bg-brand-sage/5' : 'border-white/5 bg-brand-surface opacity-50'}`}>
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${g.active ? 'bg-brand-sage' : 'bg-white/20'}`} />
              <p className={`text-sm ${g.active ? 'text-brand-offwhite' : 'text-brand-offwhite/40'}`}>{g.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Daily habits */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-brand-offwhite/60 text-xs uppercase tracking-widest">Daily habits</p>
          <button onClick={() => setShowAdd(s => !s)} className="text-brand-sage text-xs hover:opacity-70 transition-opacity">+ Add habit</button>
        </div>
        {showAdd && (
          <div className="flex gap-2 mb-3">
            <input
              value={newHabit}
              onChange={e => setNewHabit(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addHabit()}
              placeholder="New habit..."
              className="flex-1 bg-brand-surface border border-white/10 rounded-lg px-3 py-2 text-brand-offwhite text-sm focus:outline-none focus:border-brand-sage/50 placeholder:text-brand-offwhite/30"
            />
            <button onClick={addHabit} className="bg-brand-sage text-brand-dark text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand-sage/90 transition-colors">Add</button>
          </div>
        )}
        {loading ? (
          <div className="text-center py-8"><p className="text-brand-offwhite/30 text-sm">Loading habits...</p></div>
        ) : (
          <div className="space-y-2">
            {habits.map(h => <HabitRow key={h.id} habit={h} onToggle={() => toggleHabit(h.id)} />)}
          </div>
        )}
      </div>
    </div>
  )
}
