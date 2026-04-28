import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { useAuth } from '../contexts/AuthContext'

// ─── Generic query hook ───────────────────────────────────────────────────────
export function useQuery(queryFn, deps = []) {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    queryFn()
      .then(result => { if (!cancelled) { setData(result); setLoading(false) } })
      .catch(err   => { if (!cancelled) { setError(err);   setLoading(false) } })
    return () => { cancelled = true }
  }, deps)

  return { data, loading, error, reload: () => setLoading(true) }
}

// ─── Member profile ───────────────────────────────────────────────────────────
export function useProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data }) => { setProfile(data); setLoading(false) })
  }, [user?.id])

  return { profile, loading }
}

// ─── Workout logs ─────────────────────────────────────────────────────────────
export function useWorkoutLogs() {
  const { user } = useAuth()
  const [logs, setLogs]       = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('workout_logs')
      .select('*, programs(name, date, focus)')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(30)
      .then(({ data }) => { setLogs(data || []); setLoading(false) })
  }, [user?.id])

  const logWorkout = async ({ programId, date, completed, notes }) => {
    const { data, error } = await supabase
      .from('workout_logs')
      .upsert({
        user_id:       user.id,
        program_id:    programId,
        date:          date || new Date().toISOString().split('T')[0],
        completed,
        session_notes: notes,
      }, { onConflict: 'user_id,program_id' })
      .select()
      .single()
    if (!error && data) setLogs(prev => [data, ...prev.filter(l => l.id !== data.id)])
    return { data, error }
  }

  return { logs, loading, logWorkout }
}

// ─── Set logs (for TodaysWorkout) ─────────────────────────────────────────────
export function useSetLogs(workoutLogId) {
  const [setLogs, setSetLogs] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!workoutLogId) { setLoading(false); return }
    supabase
      .from('set_logs')
      .select('*')
      .eq('workout_log_id', workoutLogId)
      .then(({ data }) => {
        const map = {}
        ;(data || []).forEach(s => { map[`${s.exercise_id}-${s.set_number}`] = s })
        setSetLogs(map)
        setLoading(false)
      })
  }, [workoutLogId])

  const saveSet = async ({ workoutLogId: wlId, exerciseId, setNumber, weight, repsCompleted, completed }) => {
    const { data } = await supabase
      .from('set_logs')
      .upsert({
        workout_log_id:  wlId,
        exercise_id:     exerciseId,
        set_number:      setNumber,
        weight,
        reps_completed:  repsCompleted,
        completed,
      }, { onConflict: 'workout_log_id,exercise_id,set_number' })
      .select()
      .single()
    if (data) {
      setSetLogs(prev => ({ ...prev, [`${exerciseId}-${setNumber}`]: data }))
    }
  }

  return { setLogs, loading, saveSet }
}

// ─── Dashboard stats ──────────────────────────────────────────────────────────
export function useDashboardStats() {
  const { user } = useAuth()
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    const fetchStats = async () => {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const weekStart  = new Date(now - 6 * 86400000).toISOString().split('T')[0]

      const [{ count: monthSessions }, { count: totalSessions }, { data: recentLogs }] = await Promise.all([
        supabase.from('workout_logs').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('completed', true).gte('date', monthStart),
        supabase.from('workout_logs').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('completed', true),
        supabase.from('workout_logs').select('date, completed').eq('user_id', user.id).gte('date', weekStart).order('date', { ascending: false }),
      ])

      // Calculate streak
      let streak = 0
      const today = now.toISOString().split('T')[0]
      const logDates = new Set((recentLogs || []).filter(l => l.completed).map(l => l.date))
      for (let i = 0; i < 7; i++) {
        const d = new Date(now - i * 86400000).toISOString().split('T')[0]
        if (logDates.has(d)) streak++
        else if (i > 0) break
      }

      setStats({ monthSessions: monthSessions || 0, totalSessions: totalSessions || 0, streak, weekLogs: recentLogs || [] })
      setLoading(false)
    }
    fetchStats()
  }, [user?.id])

  return { stats, loading }
}

// ─── Body composition (InBody) ────────────────────────────────────────────────
export function useBodyComposition() {
  const { user } = useAuth()
  const [scans, setScans]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('body_scans')
      .select('*')
      .eq('user_id', user.id)
      .order('scan_date', { ascending: true })
      .then(({ data }) => { setScans(data || []); setLoading(false) })
  }, [user?.id])

  return { scans, loading }
}

// ─── Goals & habits ───────────────────────────────────────────────────────────
export function useHabits() {
  const { user } = useAuth()
  const [habits, setHabits]   = useState([])
  const [loading, setLoading] = useState(true)
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('habits')
      .select('*, habit_logs(date, completed)')
      .eq('user_id', user.id)
      .then(({ data }) => {
        const enriched = (data || []).map(h => ({
          ...h,
          completedToday: h.habit_logs?.some(l => l.date === today && l.completed) || false,
        }))
        setHabits(enriched)
        setLoading(false)
      })
  }, [user?.id])

  const toggleHabit = async (habitId, currentlyDone) => {
    const newDone = !currentlyDone
    setHabits(prev => prev.map(h => h.id === habitId ? { ...h, completedToday: newDone } : h))
    await supabase.from('habit_logs').upsert({
      habit_id: habitId,
      user_id:  user.id,
      date:     today,
      completed: newDone,
    }, { onConflict: 'habit_id,date' })
  }

  const addHabit = async (label, category = 'Training') => {
    const { data } = await supabase
      .from('habits')
      .insert({ user_id: user.id, label, category })
      .select()
      .single()
    if (data) setHabits(prev => [...prev, { ...data, completedToday: false }])
  }

  return { habits, loading, toggleHabit, addHabit }
}

// ─── All members (admin only) ─────────────────────────────────────────────────
export function useAllMembers() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = async () => {
    const { data } = await supabase
      .from('users')
      .select('*, workout_logs(count)')
      .order('created_at', { ascending: false })
    setMembers((data || []).map(m => ({
      ...m,
      sessions:   m.workout_logs?.[0]?.count || 0,
      lastActive: m.last_active || m.created_at?.split('T')[0] || '—',
      status:     m.status || 'active',
    })))
    setLoading(false)
  }

  useEffect(() => { fetch() }, [])

  const updateMember = async (id, updates) => {
    await supabase.from('users').update(updates).eq('id', id)
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m))
  }

  return { members, loading, updateMember, reload: fetch }
}
