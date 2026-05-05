import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const TIER_CONFIG = {
  full_access:       { label: 'Full Access',       color: 'bg-brand-sage/20 text-brand-sage',    dot: 'bg-brand-sage' },
  personal_training: { label: 'Personal Training', color: 'bg-brand-gold/20 text-brand-gold',    dot: 'bg-brand-gold' },
  group_class:       { label: 'Group Class',        color: 'bg-brand-linen/20 text-brand-linen',  dot: 'bg-brand-linen' },
  basic:             { label: 'Basic',              color: 'bg-white/10 text-brand-offwhite/50',  dot: 'bg-white/20' },
}

// Default permissions fallback (matches Admin.jsx)
const DEFAULT_PERMISSIONS = {
  coach:      { view_clients: true,  assign_workouts: true,  upload_programs: true,  view_health_data: false, manage_members: false },
  front_desk: { view_clients: true,  assign_workouts: false, upload_programs: false, view_health_data: false, manage_members: false },
  physio:     { view_clients: true,  assign_workouts: true,  upload_programs: true,  view_health_data: true,  manage_members: false },
  manager:    { view_clients: true,  assign_workouts: true,  upload_programs: true,  view_health_data: false, manage_members: true  },
}

function getPermissions(user) {
  // Use saved permissions if available, otherwise fall back to role defaults
  if (user?.permissions) return user.permissions
  return DEFAULT_PERMISSIONS[user?.staff_role] || DEFAULT_PERMISSIONS.coach
}

function TierBadge({ tier }) {
  const cfg = TIER_CONFIG[tier] || TIER_CONFIG.basic
  return <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded tracking-wide ${cfg.color}`}>{cfg.label}</span>
}

function Avatar({ name, size = 'md' }) {
  const sz = size === 'lg' ? 'w-14 h-14 text-lg' : 'w-9 h-9 text-sm'
  return (
    <div className={`${sz} rounded-full bg-brand-sage/20 flex items-center justify-center flex-shrink-0`}>
      <span className="text-brand-sage font-bold">{name?.charAt(0)?.toUpperCase()}</span>
    </div>
  )
}

function PermissionGate({ allowed, message, children }) {
  if (!allowed) {
    return (
      <div className="flex items-center justify-center py-10 px-4">
        <div className="text-center">
          <p className="text-2xl mb-2">🔒</p>
          <p className="text-brand-offwhite/40 text-sm font-medium">Access restricted</p>
          <p className="text-brand-offwhite/25 text-xs mt-1">{message || 'You do not have permission for this.'}</p>
        </div>
      </div>
    )
  }
  return children
}

function AssignWorkoutModal({ member, onClose, onAssigned }) {
  const { user } = useAuth()
  const [savedWorkouts, setSavedWorkouts] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    supabase.from('personal_workouts').select('*').eq('assigned_by', user?.id).order('created_at', { ascending: false })
      .then(({ data }) => { setSavedWorkouts(data || []); setLoading(false) })
  }, [user?.id])

  const handleAssign = async () => {
    if (!selected) return
    setSaving(true)
    const { error } = await supabase.from('personal_workouts').insert({
      ...selected, id: undefined, assigned_to: member.id, assigned_by: user?.id, created_at: new Date().toISOString(),
    })
    setSaving(false)
    if (!error) { setSuccess(true); setTimeout(() => { onAssigned(); onClose() }, 1500) }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-surface border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-5 border-b border-white/5 flex-shrink-0">
          <div>
            <p className="text-brand-offwhite font-semibold">Assign workout</p>
            <p className="text-brand-offwhite/40 text-xs mt-0.5">to {member.name}</p>
          </div>
          <button onClick={onClose} className="text-brand-offwhite/30 hover:text-brand-offwhite text-xl">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading ? (
            <p className="text-brand-offwhite/30 text-sm text-center py-8">Loading saved workouts...</p>
          ) : savedWorkouts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-brand-offwhite/40 text-sm">No saved workouts yet.</p>
              <p className="text-brand-offwhite/25 text-xs mt-1">Build one in the Workout Builder first.</p>
            </div>
          ) : (
            savedWorkouts.map(w => (
              <button key={w.id} onClick={() => setSelected(w)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${selected?.id === w.id ? 'border-brand-sage/40 bg-brand-sage/5' : 'border-white/5 bg-brand-dark/40 hover:border-white/10'}`}>
                <p className="text-brand-offwhite font-medium text-sm">{w.name}</p>
                <p className="text-brand-offwhite/40 text-xs mt-0.5">{w.focus} · {w.blocks?.length || 0} blocks</p>
                {w.coach_note && <p className="text-brand-offwhite/25 text-xs mt-1.5 italic line-clamp-1">"{w.coach_note}"</p>}
              </button>
            ))
          )}
        </div>
        <div className="p-5 border-t border-white/5 flex-shrink-0">
          <button onClick={handleAssign} disabled={!selected || saving || success}
            className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors ${success ? 'bg-brand-sage/20 text-brand-sage border border-brand-sage/30' : !selected ? 'bg-white/5 text-brand-offwhite/30 cursor-not-allowed' : 'bg-brand-sage text-brand-dark hover:bg-brand-sage/90'}`}>
            {success ? '✓ Assigned!' : saving ? 'Assigning...' : selected ? `Assign "${selected.name}"` : 'Select a workout above'}
          </button>
        </div>
      </div>
    </div>
  )
}

function UploadProgramModal({ member, onClose, onUploaded }) {
  const { user } = useAuth()
  const [form, setForm] = useState({ name: '', description: '', price: '', weeks: '', sessionsPerWeek: '', level: 'All levels', equipment: '', includes: '' })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!form.name || !form.description) { setError('Name and description are required.'); return }
    setSaving(true)
    setError('')
    const { error: err } = await supabase.from('downloadable_programs').insert({
      name: form.name, description: form.description,
      price: parseFloat(form.price) || 0, weeks: parseInt(form.weeks) || 0,
      sessions_per_week: parseInt(form.sessionsPerWeek) || 0,
      level: form.level, equipment: form.equipment,
      includes: form.includes.split('\n').filter(Boolean),
      created_by: user?.id, assigned_to: member?.id || null, status: 'active',
    })
    setSaving(false)
    if (err) { setError(err.message); return }
    setSuccess(true)
    setTimeout(() => { onUploaded(); onClose() }, 1500)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-surface border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-5 border-b border-white/5 flex-shrink-0">
          <div>
            <p className="text-brand-offwhite font-semibold">Upload program</p>
            <p className="text-brand-offwhite/40 text-xs mt-0.5">{member ? `for ${member.name}` : 'Available to all members'}</p>
          </div>
          <button onClick={onClose} className="text-brand-offwhite/30 hover:text-brand-offwhite text-xl">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest block mb-1.5">Program name *</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. 6-Week Home Strength"
              className="w-full bg-brand-dark border border-white/10 rounded-lg px-3 py-2.5 text-brand-offwhite text-sm focus:outline-none focus:border-brand-sage/50 placeholder:text-brand-offwhite/20" />
          </div>
          <div>
            <label className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest block mb-1.5">Description *</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3}
              placeholder="What members will get from this program..."
              className="w-full bg-brand-dark border border-white/10 rounded-lg px-3 py-2.5 text-brand-offwhite text-sm focus:outline-none focus:border-brand-sage/50 placeholder:text-brand-offwhite/20 resize-none" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Price ($)', key: 'price', placeholder: '49', type: 'number' },
              { label: 'Weeks', key: 'weeks', placeholder: '6', type: 'number' },
              { label: 'Sessions/wk', key: 'sessionsPerWeek', placeholder: '4', type: 'number' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest block mb-1.5">{f.label}</label>
                <input type={f.type} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder}
                  className="w-full bg-brand-dark border border-white/10 rounded-lg px-3 py-2.5 text-brand-offwhite text-sm focus:outline-none focus:border-brand-sage/50 placeholder:text-brand-offwhite/20" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest block mb-1.5">Level</label>
              <select value={form.level} onChange={e => setForm(p => ({ ...p, level: e.target.value }))}
                className="w-full bg-brand-dark border border-white/10 rounded-lg px-3 py-2.5 text-brand-offwhite text-sm focus:outline-none focus:border-brand-sage/50">
                {['All levels','Beginner','Intermediate','Advanced','Postpartum','Beginner–Intermediate'].map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest block mb-1.5">Equipment</label>
              <input value={form.equipment} onChange={e => setForm(p => ({ ...p, equipment: e.target.value }))} placeholder="e.g. Dumbbells, bands"
                className="w-full bg-brand-dark border border-white/10 rounded-lg px-3 py-2.5 text-brand-offwhite text-sm focus:outline-none focus:border-brand-sage/50 placeholder:text-brand-offwhite/20" />
            </div>
          </div>
          <div>
            <label className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest block mb-1.5">What's included (one per line)</label>
            <textarea value={form.includes} onChange={e => setForm(p => ({ ...p, includes: e.target.value }))} rows={3}
              placeholder={'PDF workout guide\nExercise demo videos\nNutrition tips'}
              className="w-full bg-brand-dark border border-white/10 rounded-lg px-3 py-2.5 text-brand-offwhite text-sm focus:outline-none focus:border-brand-sage/50 placeholder:text-brand-offwhite/20 resize-none" />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
        </div>
        <div className="p-5 border-t border-white/5 flex-shrink-0">
          <button onClick={handleSave} disabled={saving || success}
            className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors ${success ? 'bg-brand-sage/20 text-brand-sage border border-brand-sage/30' : 'bg-brand-sage text-brand-dark hover:bg-brand-sage/90 disabled:opacity-50'}`}>
            {success ? '✓ Program uploaded!' : saving ? 'Saving...' : 'Upload program'}
          </button>
        </div>
      </div>
    </div>
  )
}

function MemberCard({ member, isSelected, onClick }) {
  return (
    <button onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition-all ${isSelected ? 'border-brand-sage/40 bg-brand-sage/5' : 'border-white/5 bg-brand-surface hover:border-white/10'}`}>
      <div className="flex items-center gap-3">
        <Avatar name={member.name} />
        <div className="flex-1 min-w-0">
          <p className="text-brand-offwhite font-medium text-sm truncate">{member.name}</p>
          <p className="text-brand-offwhite/40 text-xs truncate">{member.email}</p>
          <div className="mt-1"><TierBadge tier={member.tier} /></div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-brand-offwhite/60 text-sm font-medium">{member.sessions}</p>
          <p className="text-brand-offwhite/30 text-[10px]">sessions</p>
        </div>
      </div>
    </button>
  )
}

function MemberPanel({ member, onClose, permissions }) {
  const navigate = useNavigate()
  const [assignedWorkouts, setAssignedWorkouts] = useState([])
  const [programs, setPrograms] = useState([])
  const [loadingWorkouts, setLoadingWorkouts] = useState(true)
  const [modal, setModal] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!member?.id) return
    Promise.all([
      supabase.from('personal_workouts').select('*').eq('assigned_to', member.id).order('created_at', { ascending: false }),
      supabase.from('downloadable_programs').select('*').eq('assigned_to', member.id).order('created_at', { ascending: false }),
    ]).then(([{ data: w }, { data: p }]) => {
      setAssignedWorkouts(w || [])
      setPrograms(p || [])
      setLoadingWorkouts(false)
    })
  }, [member?.id, refreshKey])

  const handleRefresh = () => { setLoadingWorkouts(true); setRefreshKey(k => k + 1) }

  const removeWorkout = async (id) => {
    await supabase.from('personal_workouts').delete().eq('id', id)
    setAssignedWorkouts(prev => prev.filter(w => w.id !== id))
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between p-5 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Avatar name={member.name} size="lg" />
          <div>
            <p className="text-brand-offwhite font-semibold text-lg">{member.name}</p>
            <p className="text-brand-offwhite/40 text-xs">{member.email}</p>
            <TierBadge tier={member.tier} />
          </div>
        </div>
        <button onClick={onClose} className="text-brand-offwhite/30 hover:text-brand-offwhite text-xl">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Sessions', value: member.sessions },
            { label: 'Workouts', value: assignedWorkouts.length },
            { label: 'Programs', value: programs.length },
          ].map(s => (
            <div key={s.label} className="bg-brand-dark/60 border border-white/5 rounded-xl p-3 text-center">
              <p className="text-brand-offwhite font-semibold text-lg">{s.value}</p>
              <p className="text-brand-offwhite/40 text-[10px] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Action buttons — only shown if permitted */}
        <div className="grid grid-cols-2 gap-3">
          {permissions.assign_workouts && (
            <button onClick={() => setModal('workout')} className="bg-brand-sage text-brand-dark font-semibold py-3 rounded-xl text-sm hover:bg-brand-sage/90 transition-colors">
              + Assign workout
            </button>
          )}
          {permissions.upload_programs && (
            <button onClick={() => setModal('program')} className={`bg-brand-gold text-brand-dark font-semibold py-3 rounded-xl text-sm hover:bg-brand-gold/90 transition-colors ${!permissions.assign_workouts ? 'col-span-2' : ''}`}>
              + Upload program
            </button>
          )}
          {permissions.assign_workouts && (
            <button onClick={() => navigate('/workout-builder')} className="col-span-2 border border-white/10 text-brand-offwhite/60 hover:text-brand-offwhite font-medium py-2.5 rounded-xl text-sm transition-colors">
              Build new workout →
            </button>
          )}
        </div>

        {/* Assigned workouts */}
        <div>
          <p className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest mb-3">Assigned workouts ({assignedWorkouts.length})</p>
          <PermissionGate allowed={permissions.assign_workouts} message="You don't have permission to assign workouts.">
            {loadingWorkouts ? (
              <p className="text-brand-offwhite/25 text-xs text-center py-4">Loading...</p>
            ) : assignedWorkouts.length === 0 ? (
              <div className="border border-dashed border-white/10 rounded-xl p-5 text-center">
                <p className="text-brand-offwhite/30 text-sm">No workouts assigned yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {assignedWorkouts.map(w => (
                  <div key={w.id} className="flex items-start gap-3 bg-brand-dark/40 border border-white/5 rounded-xl p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-brand-offwhite text-sm font-medium">{w.name}</p>
                      <p className="text-brand-offwhite/40 text-xs mt-0.5">{w.focus} · {w.blocks?.length || 0} blocks</p>
                      {w.coach_note && <p className="text-brand-offwhite/25 text-xs mt-1 italic line-clamp-1">"{w.coach_note}"</p>}
                    </div>
                    <button onClick={() => removeWorkout(w.id)} className="text-brand-offwhite/20 hover:text-red-400 text-xs transition-colors flex-shrink-0 mt-0.5">✕</button>
                  </div>
                ))}
              </div>
            )}
          </PermissionGate>
        </div>

        {/* Uploaded programs */}
        <div>
          <p className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest mb-3">Uploaded programs ({programs.length})</p>
          <PermissionGate allowed={permissions.upload_programs} message="You don't have permission to upload programs.">
            {programs.length === 0 ? (
              <div className="border border-dashed border-white/10 rounded-xl p-5 text-center">
                <p className="text-brand-offwhite/30 text-sm">No programs uploaded yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {programs.map(p => (
                  <div key={p.id} className="bg-brand-dark/40 border border-white/5 rounded-xl p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-brand-offwhite text-sm font-medium">{p.name}</p>
                        <p className="text-brand-offwhite/40 text-xs mt-0.5">{p.weeks} weeks · {p.level}</p>
                      </div>
                      {p.price > 0 && <span className="text-brand-gold text-sm font-semibold flex-shrink-0">${p.price}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </PermissionGate>
        </div>
      </div>

      {modal === 'workout' && permissions.assign_workouts && (
        <AssignWorkoutModal member={member} onClose={() => setModal(null)} onAssigned={handleRefresh} />
      )}
      {modal === 'program' && permissions.upload_programs && (
        <UploadProgramModal member={member} onClose={() => setModal(null)} onUploaded={handleRefresh} />
      )}
    </div>
  )
}

// ── FIXED: all hooks at the top, staff + admin can access, permissions control what they see ──
export default function StaffPortal() {
  const { user, loading: authLoading } = useAuth()
  const [members, setMembers]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState(null)
  const [search, setSearch]     = useState('')
  const [modal, setModal]       = useState(null)

  // Resolve permissions once user is loaded
  const permissions = getPermissions(user)

  useEffect(() => {
    if (!user) return
    supabase.from('users')
      .select('*')
      .eq('role', 'member')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setMembers(data?.map(m => ({ ...m, sessions: 0 })) || [])
        setLoading(false)
      })
  }, [user])

  // Early returns AFTER all hooks
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-brand-offwhite/40 text-sm">Loading...</p>
      </div>
    )
  }

  // Allow both admin and staff roles
  if (user?.role !== 'admin' && user?.role !== 'staff') {
    return <Navigate to="/" replace />
  }

  // Staff must have view_clients permission to access the portal at all
  if (user?.role === 'staff' && !permissions.view_clients) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-4xl mb-3">🔒</p>
          <p className="text-brand-offwhite/50 font-medium">Access restricted</p>
          <p className="text-brand-offwhite/25 text-sm mt-1">You don't have permission to view clients.<br />Contact your admin to update your access.</p>
        </div>
      </div>
    )
  }

  const filtered = members.filter(m =>
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex h-full overflow-hidden">
      <div className={`flex flex-col overflow-hidden flex-shrink-0 transition-all duration-300 border-r border-white/5 ${selected ? 'w-[300px]' : 'flex-1 max-w-2xl'}`}>
        <div className="p-5 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-brand-offwhite font-semibold text-lg">Staff portal</h1>
              <p className="text-brand-offwhite/40 text-xs mt-0.5">
                {user?.role === 'staff'
                  ? `Logged in as ${user?.staff_role || 'staff'}`
                  : 'Admin view'}
              </p>
            </div>
            {/* Only show upload button if permitted */}
            {permissions.upload_programs && (
              <button onClick={() => setModal('program')} className="bg-brand-gold text-brand-dark text-xs font-bold px-3 py-2 rounded-lg hover:bg-brand-gold/90 transition-colors">
                + Upload program
              </button>
            )}
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members..."
            className="w-full bg-brand-dark border border-white/10 rounded-xl px-4 py-2.5 text-brand-offwhite text-sm focus:outline-none focus:border-brand-sage/50 placeholder:text-brand-offwhite/20" />
        </div>

        <div className="grid grid-cols-4 divide-x divide-white/5 border-b border-white/5 flex-shrink-0">
          {[
            { label: 'Total',  value: members.length },
            { label: 'Full',   value: members.filter(m => m.tier === 'full_access').length },
            { label: 'PT',     value: members.filter(m => m.tier === 'personal_training').length },
            { label: 'Group',  value: members.filter(m => m.tier === 'group_class').length },
          ].map(s => (
            <div key={s.label} className="p-3 text-center">
              <p className="text-brand-offwhite font-semibold text-base">{s.value}</p>
              <p className="text-brand-offwhite/30 text-[10px]">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Permission banner for staff */}
        {user?.role === 'staff' && (
          <div className="mx-4 mt-3 px-3 py-2 bg-blue-500/10 border border-blue-400/20 rounded-lg flex-shrink-0">
            <p className="text-blue-300/70 text-[10px]">
              Your access: {[
                permissions.assign_workouts && 'Assign workouts',
                permissions.upload_programs && 'Upload programs',
                permissions.view_health_data && 'Health data',
              ].filter(Boolean).join(' · ') || 'View only'}
            </p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading
            ? <p className="text-brand-offwhite/30 text-sm text-center py-8">Loading members...</p>
            : filtered.length === 0
            ? <p className="text-brand-offwhite/30 text-sm text-center py-8">No members found.</p>
            : filtered.map(m => (
                <MemberCard key={m.id} member={m} isSelected={selected?.id === m.id} onClick={() => setSelected(m)} />
              ))
          }
        </div>
      </div>

      {selected ? (
        <div className="flex-1 overflow-hidden">
          <MemberPanel member={selected} onClose={() => setSelected(null)} permissions={permissions} />
        </div>
      ) : (
        <div className="flex-1 hidden lg:flex items-center justify-center border-l border-white/5">
          <div className="text-center">
            <p className="text-4xl mb-3">👤</p>
            <p className="text-brand-offwhite/30 text-sm font-medium">Select a member</p>
            <p className="text-brand-offwhite/20 text-xs mt-1">to assign workouts and upload programs</p>
          </div>
        </div>
      )}

      {modal === 'program' && permissions.upload_programs && (
        <UploadProgramModal member={null} onClose={() => setModal(null)} onUploaded={() => setModal(null)} />
      )}
    </div>
  )
}
