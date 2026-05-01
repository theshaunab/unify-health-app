import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const TIER_CONFIG = {
  full_access:       { label: 'Full Access',       color: 'bg-brand-sage/20 text-brand-sage',    dot: 'bg-brand-sage' },
  personal_training: { label: 'Personal Training', color: 'bg-brand-gold/20 text-brand-gold',    dot: 'bg-brand-gold' },
  group_class:       { label: 'Group Class',        color: 'bg-brand-linen/20 text-brand-linen',  dot: 'bg-brand-linen' },
  basic:             { label: 'Basic',              color: 'bg-white/10 text-brand-offwhite/60',  dot: 'bg-white/30' },
}

const ROLE_CONFIG = {
  admin:  { label: 'Admin',  color: 'bg-purple-500/20 text-purple-300' },
  staff:  { label: 'Staff',  color: 'bg-blue-500/20 text-blue-300' },
  member: { label: 'Member', color: 'bg-white/10 text-brand-offwhite/50' },
}

const STAFF_ROLES = [
  { value: 'coach',      label: 'Coach' },
  { value: 'front_desk', label: 'Front Desk' },
  { value: 'physio',     label: 'Physiotherapist' },
  { value: 'manager',    label: 'Manager' },
]

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

function TierBadge({ tier }) {
  const cfg = TIER_CONFIG[tier] || TIER_CONFIG.basic
  return <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded tracking-wide ${cfg.color}`}>{cfg.label}</span>
}

function RoleBadge({ role }) {
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.member
  return <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded tracking-wide ${cfg.color}`}>{cfg.label}</span>
}

function Avatar({ name, size = 'sm', isStaff = false }) {
  const sz = size === 'lg' ? 'w-12 h-12 text-base' : 'w-8 h-8 text-xs'
  return (
    <div className={`${sz} rounded-full flex items-center justify-center flex-shrink-0 ${isStaff ? 'bg-blue-500/20' : 'bg-brand-sage/20'}`}>
      <span className={`font-bold ${isStaff ? 'text-blue-300' : 'text-brand-sage'}`}>{name?.charAt(0)?.toUpperCase() || '?'}</span>
    </div>
  )
}

function StatCard({ label, value, sub, color = 'text-brand-offwhite' }) {
  return (
    <div className="bg-brand-surface border border-white/5 rounded-xl p-4">
      <p className="text-brand-offwhite/40 text-xs mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${color}`}>{value}</p>
      {sub && <p className="text-brand-offwhite/30 text-xs mt-0.5">{sub}</p>}
    </div>
  )
}

function AddMemberModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ name: '', email: '', tier: 'basic', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const validate = () => {
    if (!form.name.trim())         return 'Full name is required.'
    if (!form.email.trim())        return 'Email is required.'
    if (!isValidEmail(form.email)) return 'Please enter a valid email address.'
    if (!form.password.trim())     return 'Password is required.'
    if (form.password.length < 6)  return 'Password must be at least 6 characters.'
    return null
  }

  const handleSubmit = async () => {
    const err = validate()
    if (err) { setError(err); return }
    setLoading(true); setError('')
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: form.email.toLowerCase().trim(),
        password: form.password,
      })
      if (authError) throw authError
      const newMember = {
        id: data?.user?.id || `mock-${Date.now()}`,
        name: form.name.trim(), email: form.email.toLowerCase().trim(),
        tier: form.tier, role: 'member',
        joinDate: new Date().toISOString().split('T')[0],
        sessions: 0, lastActive: '—', status: 'active',
      }
      if (data?.user?.id) {
        await supabase.from('users').upsert({
          id: data.user.id, email: form.email.toLowerCase().trim(),
          name: form.name.trim(), tier: form.tier, role: 'member',
        })
      }
      onAdd(newMember); onClose()
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-surface border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-brand-offwhite font-semibold text-lg">Add new member</h2>
          <button onClick={onClose} className="text-brand-offwhite/30 hover:text-brand-offwhite text-xl">✕</button>
        </div>
        <div className="space-y-4">
          {[
            { label: 'Full name *',          key: 'name',     type: 'text',     placeholder: 'e.g. Jane Smith' },
            { label: 'Email address *',      key: 'email',    type: 'email',    placeholder: 'jane@example.com' },
            { label: 'Temporary password *', key: 'password', type: 'password', placeholder: 'Min 6 characters' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest block mb-1.5">{f.label}</label>
              <input type={f.type} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full bg-brand-dark border border-white/10 rounded-xl px-4 py-2.5 text-brand-offwhite text-sm focus:outline-none focus:border-brand-sage/50 placeholder:text-brand-offwhite/20" />
            </div>
          ))}
          <div>
            <label className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest block mb-1.5">Membership tier</label>
            <select value={form.tier} onChange={e => setForm(p => ({ ...p, tier: e.target.value }))}
              className="w-full bg-brand-dark border border-white/10 rounded-xl px-4 py-2.5 text-brand-offwhite text-sm focus:outline-none focus:border-brand-sage/50">
              {Object.entries(TIER_CONFIG).map(([val, cfg]) => <option key={val} value={val}>{cfg.label}</option>)}
            </select>
          </div>
          {error && <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">⚠️ {error}</p>}
          <button onClick={handleSubmit} disabled={loading}
            className="w-full bg-brand-sage text-brand-dark font-semibold py-3 rounded-xl text-sm hover:bg-brand-sage/90 transition-colors disabled:opacity-50">
            {loading ? 'Creating account...' : 'Create member account'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AddStaffModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ name: '', email: '', staffRole: 'coach', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const validate = () => {
    if (!form.name.trim())         return 'Full name is required.'
    if (!form.email.trim())        return 'Email is required.'
    if (!isValidEmail(form.email)) return 'Please enter a valid email address (e.g. coach@unifyaz.com).'
    if (!form.password.trim())     return 'Password is required.'
    if (form.password.length < 6)  return 'Password must be at least 6 characters.'
    return null
  }

  const handleSubmit = async () => {
    const err = validate()
    if (err) { setError(err); return }
    setLoading(true); setError('')
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: form.email.toLowerCase().trim(),
        password: form.password,
      })
      if (authError) throw authError
      const newStaff = {
        id: data?.user?.id || `mock-staff-${Date.now()}`,
        name: form.name.trim(), email: form.email.toLowerCase().trim(),
        role: 'staff', staffRole: form.staffRole, tier: 'full_access',
        joinDate: new Date().toISOString().split('T')[0], status: 'active',
      }
      if (data?.user?.id) {
        await supabase.from('users').upsert({
          id: data.user.id, email: form.email.toLowerCase().trim(),
          name: form.name.trim(), role: 'staff',
          staff_role: form.staffRole, tier: 'full_access',
        })
      }
      onAdd(newStaff); onClose()
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-surface border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-brand-offwhite font-semibold text-lg">Add staff member</h2>
          <button onClick={onClose} className="text-brand-offwhite/30 hover:text-brand-offwhite text-xl">✕</button>
        </div>
        <p className="text-brand-offwhite/40 text-xs mb-5 leading-relaxed">
          Staff can access the Staff Portal and Workout Builder. They cannot see member health data.
        </p>
        <div className="space-y-4">
          {[
            { label: 'Full name *',          key: 'name',     type: 'text',     placeholder: 'e.g. Mike Johnson' },
            { label: 'Email address *',      key: 'email',    type: 'email',    placeholder: 'e.g. mike@unifyaz.com' },
            { label: 'Temporary password *', key: 'password', type: 'password', placeholder: 'Min 6 characters' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest block mb-1.5">{f.label}</label>
              <input type={f.type} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full bg-brand-dark border border-white/10 rounded-xl px-4 py-2.5 text-brand-offwhite text-sm focus:outline-none focus:border-brand-sage/50 placeholder:text-brand-offwhite/20" />
            </div>
          ))}
          <div>
            <label className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest block mb-1.5">Staff role</label>
            <select value={form.staffRole} onChange={e => setForm(p => ({ ...p, staffRole: e.target.value }))}
              className="w-full bg-brand-dark border border-white/10 rounded-xl px-4 py-2.5 text-brand-offwhite text-sm focus:outline-none focus:border-brand-sage/50">
              {STAFF_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          {error && <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">⚠️ {error}</p>}
          <button onClick={handleSubmit} disabled={loading}
            className="w-full bg-blue-500 text-white font-semibold py-3 rounded-xl text-sm hover:bg-blue-500/90 transition-colors disabled:opacity-50">
            {loading ? 'Creating account...' : 'Add staff member'}
          </button>
        </div>
      </div>
    </div>
  )
}

function MemberDetail({ member, onClose, onUpdate }) {
  const [editTier, setEditTier]     = useState(member.tier)
  const [editStatus, setEditStatus] = useState(member.status)
  const [coachNote, setCoachNote]   = useState('')
  const [saved, setSaved]           = useState(false)
  const [noteSaved, setNoteSaved]   = useState(false)

  const handleUpdate = async () => {
    try { await supabase.from('users').update({ tier: editTier }).eq('id', member.id) } catch {}
    onUpdate({ ...member, tier: editTier, status: editStatus })
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const daysAgo = member.lastActive === '—' ? '—' : (() => {
    const diff = Math.floor((new Date() - new Date(member.lastActive)) / 86400000)
    return diff === 0 ? 'Today' : `${diff}d ago`
  })()

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-start justify-between p-5 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Avatar name={member.name} size="lg" />
          <div>
            <p className="text-brand-offwhite font-semibold text-base">{member.name}</p>
            <p className="text-brand-offwhite/40 text-xs">{member.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <TierBadge tier={member.tier} />
              <RoleBadge role={member.role} />
            </div>
          </div>
        </div>
        <button onClick={onClose} className="text-brand-offwhite/30 hover:text-brand-offwhite text-xl">✕</button>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Sessions',    value: member.sessions || 0 },
            { label: 'Last active', value: daysAgo },
            { label: 'Joined',      value: member.joinDate ? new Date(member.joinDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—' },
          ].map(s => (
            <div key={s.label} className="bg-brand-dark/60 border border-white/5 rounded-xl p-3 text-center">
              <p className="text-brand-offwhite font-semibold text-sm">{s.value}</p>
              <p className="text-brand-offwhite/40 text-[10px] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="bg-brand-dark/40 border border-white/5 rounded-xl p-4 space-y-3">
          <p className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest">Membership</p>
          <div>
            <label className="text-brand-offwhite/30 text-xs block mb-1.5">Tier</label>
            <select value={editTier} onChange={e => setEditTier(e.target.value)}
              className="w-full bg-brand-dark border border-white/10 rounded-lg px-3 py-2.5 text-brand-offwhite text-sm focus:outline-none focus:border-brand-sage/50">
              {Object.entries(TIER_CONFIG).map(([val, cfg]) => <option key={val} value={val}>{cfg.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-brand-offwhite/30 text-xs block mb-1.5">Status</label>
            <select value={editStatus} onChange={e => setEditStatus(e.target.value)}
              className="w-full bg-brand-dark border border-white/10 rounded-lg px-3 py-2.5 text-brand-offwhite text-sm focus:outline-none focus:border-brand-sage/50">
              {['active','inactive','paused'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <button onClick={handleUpdate}
            className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${saved ? 'bg-brand-sage/20 text-brand-sage border border-brand-sage/30' : 'bg-brand-sage text-brand-dark hover:bg-brand-sage/90'}`}>
            {saved ? '✓ Saved' : 'Update membership'}
          </button>
        </div>
        <div className="bg-brand-dark/40 border border-white/5 rounded-xl p-4 space-y-3">
          <p className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest">Coach note (private)</p>
          <textarea value={coachNote} onChange={e => setCoachNote(e.target.value)} rows={3}
            placeholder="Private note about this member..."
            className="w-full bg-brand-dark border border-white/10 rounded-lg p-3 text-brand-offwhite text-xs resize-none focus:outline-none focus:border-brand-sage/50 placeholder:text-brand-offwhite/20" />
          <button onClick={() => { setNoteSaved(true); setTimeout(() => setNoteSaved(false), 2000) }}
            className={`w-full py-2 rounded-lg text-xs font-semibold transition-colors ${noteSaved ? 'bg-brand-sage/20 text-brand-sage border border-brand-sage/30' : 'bg-white/5 border border-white/10 text-brand-offwhite/60 hover:text-brand-offwhite'}`}>
            {noteSaved ? '✓ Note saved' : 'Save note'}
          </button>
        </div>
      </div>
    </div>
  )
}

function StaffDetail({ member, onClose, onRemove }) {
  const [removing, setRemoving] = useState(false)
  const [confirm, setConfirm]   = useState(false)
  const roleLabel = STAFF_ROLES.find(r => r.value === member.staffRole)?.label || 'Staff'

  const handleRemove = async () => {
    setRemoving(true)
    try {
      await supabase.from('users').update({ role: 'member' }).eq('id', member.id)
      onRemove(member.id); onClose()
    } catch {}
    setRemoving(false)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-start justify-between p-5 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Avatar name={member.name} size="lg" isStaff />
          <div>
            <p className="text-brand-offwhite font-semibold text-base">{member.name}</p>
            <p className="text-brand-offwhite/40 text-xs">{member.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">STAFF</span>
              <span className="text-[10px] font-bold bg-white/10 text-brand-offwhite/50 px-2 py-0.5 rounded">{roleLabel}</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="text-brand-offwhite/30 hover:text-brand-offwhite text-xl">✕</button>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-brand-dark/60 border border-white/5 rounded-xl p-3 text-center">
            <p className="text-brand-offwhite font-semibold text-sm">{roleLabel}</p>
            <p className="text-brand-offwhite/40 text-[10px] mt-0.5">Role</p>
          </div>
          <div className="bg-brand-dark/60 border border-white/5 rounded-xl p-3 text-center">
            <p className="text-brand-offwhite font-semibold text-sm">{member.joinDate ? new Date(member.joinDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}</p>
            <p className="text-brand-offwhite/40 text-[10px] mt-0.5">Added</p>
          </div>
        </div>
        <div className="bg-brand-dark/40 border border-white/5 rounded-xl p-4">
          <p className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest mb-3">Access permissions</p>
          <div className="space-y-2 text-sm">
            {[
              { label: 'Staff portal',       access: true },
              { label: 'Workout builder',    access: true },
              { label: 'Member admin',       access: true },
              { label: 'Member health data', access: false },
            ].map(a => (
              <div key={a.label} className="flex items-center justify-between">
                <span className="text-brand-offwhite/60">{a.label}</span>
                <span className={`text-xs ${a.access ? 'text-brand-sage' : 'text-brand-offwhite/25'}`}>{a.access ? '✓ Access' : '✕ No access'}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-brand-dark/40 border border-red-400/10 rounded-xl p-4">
          <p className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest mb-2">Remove staff access</p>
          <p className="text-brand-offwhite/40 text-xs mb-3">This will change their role to member. Their account stays active.</p>
          {!confirm ? (
            <button onClick={() => setConfirm(true)} className="w-full py-2 rounded-lg text-xs font-semibold border border-red-400/30 text-red-400/70 hover:text-red-400 hover:border-red-400/50 transition-colors">
              Remove staff access
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-red-400 text-xs text-center">Are you sure?</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setConfirm(false)} className="py-2 rounded-lg text-xs border border-white/10 text-brand-offwhite/50 hover:text-brand-offwhite transition-colors">Cancel</button>
                <button onClick={handleRemove} disabled={removing} className="py-2 rounded-lg text-xs bg-red-400/20 text-red-400 border border-red-400/30 hover:bg-red-400/30 transition-colors disabled:opacity-50">
                  {removing ? 'Removing...' : 'Confirm'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function OverviewTab({ members, staff }) {
  const byTier = Object.keys(TIER_CONFIG).reduce((acc, tier) => {
    acc[tier] = members.filter(m => m.tier === tier).length
    return acc
  }, {})
  const active = members.filter(m => m.status === 'active').length
  const totalSessions = members.reduce((a, m) => a + (m.sessions || 0), 0)

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div>
        <h2 className="text-brand-offwhite font-semibold text-lg mb-1">Overview</h2>
        <p className="text-brand-offwhite/40 text-sm">Studio performance at a glance.</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total members"  value={members.length} sub="All tiers" />
        <StatCard label="Active members" value={active}         sub="This month"      color="text-brand-sage" />
        <StatCard label="Staff members"  value={staff.length}   sub="Coaches & admin" color="text-blue-300" />
        <StatCard label="Total sessions" value={totalSessions}  sub="All time" />
      </div>
      <div className="bg-brand-surface border border-white/5 rounded-2xl p-5">
        <p className="text-brand-offwhite/50 text-[10px] uppercase tracking-widest mb-4">Members by tier</p>
        <div className="space-y-3">
          {Object.entries(TIER_CONFIG).map(([tier, cfg]) => {
            const count = byTier[tier] || 0
            const pct   = Math.round((count / Math.max(members.length, 1)) * 100)
            return (
              <div key={tier}>
                <div className="flex justify-between text-sm mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    <span className="text-brand-offwhite/70">{cfg.label}</span>
                  </div>
                  <span className="text-brand-offwhite/40">{count} member{count !== 1 ? 's' : ''}</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${cfg.dot} opacity-70`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
      {staff.length > 0 && (
        <div className="bg-brand-surface border border-white/5 rounded-2xl p-5">
          <p className="text-brand-offwhite/50 text-[10px] uppercase tracking-widest mb-4">Staff team</p>
          <div className="space-y-3">
            {staff.map(s => (
              <div key={s.id} className="flex items-center gap-3">
                <Avatar name={s.name} isStaff />
                <div className="flex-1 min-w-0">
                  <p className="text-brand-offwhite text-sm truncate">{s.name}</p>
                  <p className="text-brand-offwhite/40 text-xs">{STAFF_ROLES.find(r => r.value === s.staffRole)?.label || 'Staff'}</p>
                </div>
                <span className="text-[10px] font-bold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">STAFF</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MembersTab({ members, onAdd, onUpdate }) {
  const [search, setSearch]         = useState('')
  const [filterTier, setFilterTier] = useState('all')
  const [selected, setSelected]     = useState(null)
  const [showAdd, setShowAdd]       = useState(false)

  const filtered = members.filter(m => {
    const matchSearch = m.name?.toLowerCase().includes(search.toLowerCase()) || m.email?.toLowerCase().includes(search.toLowerCase())
    const matchTier   = filterTier === 'all' || m.tier === filterTier
    return matchSearch && matchTier
  })

  return (
    <div className="flex h-full overflow-hidden">
      <div className={`flex flex-col overflow-hidden flex-shrink-0 transition-all duration-300 ${selected ? 'w-[380px]' : 'flex-1'}`}>
        <div className="p-5 border-b border-white/5 flex-shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-brand-offwhite font-semibold">{filtered.length} members</p>
            <button onClick={() => setShowAdd(true)} className="bg-brand-sage text-brand-dark text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand-sage/90 transition-colors">+ Add member</button>
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..."
            className="w-full bg-brand-dark border border-white/10 rounded-lg px-3 py-2 text-brand-offwhite text-sm focus:outline-none focus:border-brand-sage/50 placeholder:text-brand-offwhite/20" />
          <div className="flex gap-1.5 flex-wrap">
            {[{ val: 'all', label: 'All' }, ...Object.entries(TIER_CONFIG).map(([val, cfg]) => ({ val, label: cfg.label }))].map(f => (
              <button key={f.val} onClick={() => setFilterTier(f.val)}
                className={`text-[11px] font-medium px-3 py-1 rounded-full transition-colors ${filterTier === f.val ? 'bg-brand-sage text-brand-dark' : 'bg-white/5 text-brand-offwhite/50 hover:text-brand-offwhite'}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-12 px-5 py-2 border-b border-white/5 flex-shrink-0">
          {['Member','Tier','Sessions','Last active','Status'].map((h, i) => (
            <p key={h} className={`text-brand-offwhite/30 text-[10px] uppercase tracking-widest ${i === 0 ? 'col-span-4' : i === 1 ? 'col-span-3' : 'col-span-2 text-center'}`}>{h}</p>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-white/5">
          {filtered.map(m => (
            <button key={m.id} onClick={() => setSelected(m)}
              className={`w-full grid grid-cols-12 items-center px-5 py-3.5 hover:bg-white/3 transition-colors text-left ${selected?.id === m.id ? 'bg-brand-sage/5' : ''}`}>
              <div className="col-span-4 flex items-center gap-3 min-w-0">
                <Avatar name={m.name} />
                <div className="min-w-0">
                  <p className="text-brand-offwhite text-sm font-medium truncate">{m.name}</p>
                  <p className="text-brand-offwhite/30 text-xs truncate">{m.email}</p>
                </div>
              </div>
              <div className="col-span-3"><TierBadge tier={m.tier} /></div>
              <div className="col-span-2 text-center"><p className="text-brand-offwhite/70 text-sm">{m.sessions || 0}</p></div>
              <div className="col-span-2 text-center"><p className="text-brand-offwhite/50 text-xs">{m.lastActive || '—'}</p></div>
              <div className="col-span-1 flex justify-center">
                <span className={`w-2 h-2 rounded-full ${m.status === 'active' ? 'bg-brand-sage' : 'bg-white/20'}`} />
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="flex items-center justify-center py-16">
              <p className="text-brand-offwhite/30 text-sm">No members found.</p>
            </div>
          )}
        </div>
      </div>
      {selected && (
        <div className="flex-1 border-l border-white/5 overflow-hidden">
          <MemberDetail member={selected} onClose={() => setSelected(null)}
            onUpdate={updated => { onUpdate(updated); setSelected(updated) }} />
        </div>
      )}
      {showAdd && <AddMemberModal onClose={() => setShowAdd(false)} onAdd={m => { onAdd(m); setShowAdd(false) }} />}
    </div>
  )
}

function StaffTab({ staff, onAdd, onRemove }) {
  const [selected, setSelected] = useState(null)
  const [showAdd, setShowAdd]   = useState(false)
  const [search, setSearch]     = useState('')

  const filtered = staff.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex h-full overflow-hidden">
      <div className={`flex flex-col overflow-hidden flex-shrink-0 transition-all duration-300 ${selected ? 'w-[380px]' : 'flex-1 max-w-3xl'}`}>
        <div className="p-5 border-b border-white/5 flex-shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-brand-offwhite font-semibold">{staff.length} staff member{staff.length !== 1 ? 's' : ''}</p>
              <p className="text-brand-offwhite/40 text-xs mt-0.5">Coaches and admin with portal access</p>
            </div>
            <button onClick={() => setShowAdd(true)} className="bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-blue-500/90 transition-colors">+ Add staff</button>
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search staff..."
            className="w-full bg-brand-dark border border-white/10 rounded-lg px-3 py-2 text-brand-offwhite text-sm focus:outline-none focus:border-brand-sage/50 placeholder:text-brand-offwhite/20" />
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">👥</p>
              <p className="text-brand-offwhite/40 text-sm font-medium">No staff members yet</p>
              <p className="text-brand-offwhite/25 text-xs mt-1">Click "+ Add staff" to add a coach or admin</p>
            </div>
          ) : (
            filtered.map(s => {
              const roleLabel = STAFF_ROLES.find(r => r.value === s.staffRole)?.label || 'Staff'
              return (
                <button key={s.id} onClick={() => setSelected(s)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${selected?.id === s.id ? 'border-blue-400/40 bg-blue-400/5' : 'border-white/5 bg-brand-surface hover:border-white/10'}`}>
                  <div className="flex items-center gap-3">
                    <Avatar name={s.name} isStaff />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-brand-offwhite font-medium text-sm truncate">{s.name}</p>
                        <span className="text-[9px] font-bold bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded flex-shrink-0">STAFF</span>
                      </div>
                      <p className="text-brand-offwhite/40 text-xs truncate">{s.email}</p>
                      <p className="text-blue-300/60 text-xs mt-0.5">{roleLabel}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-brand-offwhite/50 text-xs">{s.joinDate ? new Date(s.joinDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}</p>
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>
      {selected && (
        <div className="flex-1 border-l border-white/5 overflow-hidden">
          <StaffDetail member={selected} onClose={() => setSelected(null)}
            onRemove={id => { onRemove(id); setSelected(null) }} />
        </div>
      )}
      {showAdd && <AddStaffModal onClose={() => setShowAdd(false)} onAdd={s => { onAdd(s); setShowAdd(false) }} />}
    </div>
  )
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: '◈' },
  { id: 'members',  label: 'Members',  icon: '◉' },
  { id: 'staff',    label: 'Staff',    icon: '★' },
]

export default function Admin() {
  const { user } = useAuth()
  if (user?.role !== 'admin') return <Navigate to="/" replace />

  const [activeTab, setActiveTab] = useState('members')
  const [members, setMembers]     = useState([])
  const [staff, setStaff]         = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    supabase.from('users').select('*').order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data?.length > 0) {
          const all = data.map(m => ({
            ...m,
            joinDate:   m.created_at?.split('T')[0] || '—',
            sessions:   0,
            lastActive: m.last_active || '—',
            status:     m.status || 'active',
            staffRole:  m.staff_role || null,
          }))
          setMembers(all.filter(u => u.role === 'member' || u.role === 'admin'))
          setStaff(all.filter(u => u.role === 'staff'))
        }
        setLoading(false)
      })
  }, [])

  return (
    <div className="flex h-full overflow-hidden">
      <div className="w-[180px] flex-shrink-0 border-r border-white/5 flex flex-col">
        <div className="p-5 border-b border-white/5">
          <p className="text-brand-offwhite font-semibold text-base">Admin panel</p>
          <p className="text-brand-offwhite/40 text-xs mt-0.5">{members.length} members · {staff.length} staff</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${activeTab === t.id ? 'bg-brand-surface text-brand-offwhite font-medium border border-white/8' : 'text-brand-offwhite/50 hover:text-brand-offwhite hover:bg-white/3'}`}>
              <span className="opacity-60">{t.icon}</span>
              {t.label}
              {t.id === 'staff' && staff.length > 0 && (
                <span className="ml-auto text-[10px] bg-blue-500/20 text-blue-300 font-bold px-1.5 py-0.5 rounded">{staff.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5">
          <p className="text-brand-offwhite/20 text-[10px]">Logged in as</p>
          <p className="text-brand-offwhite/50 text-xs mt-0.5 truncate">{user?.name}</p>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-brand-offwhite/30 text-sm">Loading...</p>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && <OverviewTab members={members} staff={staff} />}
            {activeTab === 'members'  && <MembersTab  members={members} onAdd={m => setMembers(p => [m,...p])} onUpdate={u => setMembers(p => p.map(m => m.id === u.id ? u : m))} />}
            {activeTab === 'staff'    && <StaffTab    staff={staff}     onAdd={s => setStaff(p => [s,...p])}   onRemove={id => setStaff(p => p.filter(s => s.id !== id))} />}
          </>
        )}
      </div>
    </div>
  )
}
