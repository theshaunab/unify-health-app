import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// ─── Static data ──────────────────────────────────────────────────────────────
const INITIAL_MEMBERS = [
  { id: 'f1027b40-eb9d-451f-ba67-cc0947024c5d', name: 'Shauna Brown',  email: 'shauna@unifyaz.com',   tier: 'full_access',       role: 'admin',  joinDate: '2025-01-01', sessions: 42, lastActive: '2025-04-25', status: 'active' },
  { id: '2',                                     name: 'Emma Wilson',   email: 'emma@example.com',     tier: 'personal_training', role: 'member', joinDate: '2025-02-10', sessions: 18, lastActive: '2025-04-24', status: 'active' },
  { id: '3',                                     name: 'Tom Hughes',    email: 'tom@example.com',      tier: 'group_class',       role: 'member', joinDate: '2025-02-20', sessions: 7,  lastActive: '2025-04-22', status: 'active' },
  { id: '4',                                     name: 'Priya Sharma',  email: 'priya@example.com',    tier: 'basic',             role: 'member', joinDate: '2025-03-05', sessions: 3,  lastActive: '2025-04-18', status: 'active' },
]

const TIER_CONFIG = {
  full_access:       { label: 'Full Access',        color: 'bg-brand-sage/20 text-brand-sage',         dot: 'bg-brand-sage' },
  personal_training: { label: 'Personal Training',  color: 'bg-brand-gold/20 text-brand-gold',         dot: 'bg-brand-gold' },
  group_class:       { label: 'Group Class',         color: 'bg-brand-linen/20 text-brand-linen',       dot: 'bg-brand-linen' },
  basic:             { label: 'Basic',               color: 'bg-white/10 text-brand-offwhite/60',       dot: 'bg-white/30' },
}

const STATUS_CONFIG = {
  active:   { label: 'Active',   color: 'text-brand-sage',  dot: 'bg-brand-sage' },
  inactive: { label: 'Inactive', color: 'text-red-400',     dot: 'bg-red-400' },
  paused:   { label: 'Paused',   color: 'text-brand-gold',  dot: 'bg-brand-gold' },
}

// ─── Shared UI ────────────────────────────────────────────────────────────────
function TierBadge({ tier }) {
  const cfg = TIER_CONFIG[tier] || TIER_CONFIG.basic
  return (
    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded tracking-wide ${cfg.color}`}>
      {cfg.label}
    </span>
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

function Input({ label, ...props }) {
  return (
    <div>
      {label && <label className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest block mb-1.5">{label}</label>}
      <input
        className="w-full bg-brand-dark border border-white/10 rounded-xl px-4 py-2.5 text-brand-offwhite text-sm focus:outline-none focus:border-brand-sage/50 placeholder:text-brand-offwhite/20"
        {...props}
      />
    </div>
  )
}

// ─── Add member modal ─────────────────────────────────────────────────────────
function AddMemberModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ name: '', email: '', tier: 'basic', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.password) { setError('Name, email and password are required.'); return }
    setLoading(true)
    setError('')
    try {
      // Create auth user in Supabase
      const { data, error: authError } = await supabase.auth.admin
        ? await supabase.auth.signUp({ email: form.email, password: form.password })
        : await supabase.auth.signUp({ email: form.email, password: form.password })

      if (authError) throw authError

      const newMember = {
        id: data?.user?.id || `mock-${Date.now()}`,
        name: form.name,
        email: form.email,
        tier: form.tier,
        role: 'member',
        joinDate: new Date().toISOString().split('T')[0],
        sessions: 0,
        lastActive: '—',
        status: 'active',
      }

      // Insert profile row
      if (data?.user?.id) {
        await supabase.from('users').insert({
          id: data.user.id,
          email: form.email,
          name: form.name,
          tier: form.tier,
          role: 'member',
        })
      }

      onAdd(newMember)
      onClose()
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
          <button onClick={onClose} className="text-brand-offwhite/30 hover:text-brand-offwhite text-xl leading-none">✕</button>
        </div>
        <div className="space-y-4">
          <Input label="Full name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Jane Smith" />
          <Input label="Email address *" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jane@example.com" />
          <Input label="Temporary password *" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 6 characters" />
          <div>
            <label className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest block mb-1.5">Membership tier</label>
            <select
              value={form.tier}
              onChange={e => setForm(f => ({ ...f, tier: e.target.value }))}
              className="w-full bg-brand-dark border border-white/10 rounded-xl px-4 py-2.5 text-brand-offwhite text-sm focus:outline-none focus:border-brand-sage/50"
            >
              {Object.entries(TIER_CONFIG).map(([val, cfg]) => (
                <option key={val} value={val}>{cfg.label}</option>
              ))}
            </select>
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-brand-sage text-brand-dark font-semibold py-3 rounded-xl text-sm hover:bg-brand-sage/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create member account'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Member detail panel ──────────────────────────────────────────────────────
function MemberDetail({ member, onClose, onUpdate }) {
  const [editTier, setEditTier] = useState(member.tier)
  const [editStatus, setEditStatus] = useState(member.status)
  const [coachNote, setCoachNote] = useState('')
  const [saved, setSaved] = useState(false)
  const [noteSaved, setNoteSaved] = useState(false)

  const handleUpdateTier = async () => {
    try {
      await supabase.from('users').update({ tier: editTier }).eq('id', member.id)
    } catch (e) {}
    onUpdate({ ...member, tier: editTier, status: editStatus })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleSaveNote = () => {
    setNoteSaved(true)
    setTimeout(() => setNoteSaved(false), 2000)
  }

  const daysAgo = member.lastActive === '—' ? '—' : (() => {
    const diff = Math.floor((new Date() - new Date(member.lastActive)) / 86400000)
    return diff === 0 ? 'Today' : `${diff}d ago`
  })()

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-5 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-brand-sage/20 flex items-center justify-center flex-shrink-0">
            <span className="text-brand-sage font-bold text-lg">{member.name.charAt(0)}</span>
          </div>
          <div>
            <p className="text-brand-offwhite font-semibold text-base">{member.name}</p>
            <p className="text-brand-offwhite/40 text-xs">{member.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <TierBadge tier={member.tier} />
              {member.role === 'admin' && (
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-bold">ADMIN</span>
              )}
            </div>
          </div>
        </div>
        <button onClick={onClose} className="text-brand-offwhite/30 hover:text-brand-offwhite text-xl leading-none flex-shrink-0">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Sessions',    value: member.sessions },
            { label: 'Last active', value: daysAgo },
            { label: 'Joined',      value: member.joinDate ? new Date(member.joinDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—' },
          ].map(s => (
            <div key={s.label} className="bg-brand-dark/60 border border-white/5 rounded-xl p-3 text-center">
              <p className="text-brand-offwhite font-semibold text-sm">{s.value}</p>
              <p className="text-brand-offwhite/40 text-[10px] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Edit tier */}
        <div className="bg-brand-dark/40 border border-white/5 rounded-xl p-4 space-y-3">
          <p className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest">Membership</p>
          <div>
            <label className="text-brand-offwhite/30 text-xs block mb-1.5">Tier</label>
            <select
              value={editTier}
              onChange={e => setEditTier(e.target.value)}
              className="w-full bg-brand-dark border border-white/10 rounded-lg px-3 py-2.5 text-brand-offwhite text-sm focus:outline-none focus:border-brand-sage/50"
            >
              {Object.entries(TIER_CONFIG).map(([val, cfg]) => (
                <option key={val} value={val}>{cfg.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-brand-offwhite/30 text-xs block mb-1.5">Status</label>
            <select
              value={editStatus}
              onChange={e => setEditStatus(e.target.value)}
              className="w-full bg-brand-dark border border-white/10 rounded-lg px-3 py-2.5 text-brand-offwhite text-sm focus:outline-none focus:border-brand-sage/50"
            >
              {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                <option key={val} value={val}>{cfg.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleUpdateTier}
            className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${saved ? 'bg-brand-sage/20 text-brand-sage border border-brand-sage/30' : 'bg-brand-sage text-brand-dark hover:bg-brand-sage/90'}`}
          >
            {saved ? '✓ Saved' : 'Update membership'}
          </button>
        </div>

        {/* Coach note */}
        <div className="bg-brand-dark/40 border border-white/5 rounded-xl p-4 space-y-3">
          <p className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest">Coach note</p>
          <textarea
            value={coachNote}
            onChange={e => setCoachNote(e.target.value)}
            placeholder="Private note about this member — goals, injuries, progress observations..."
            rows={4}
            className="w-full bg-brand-dark border border-white/10 rounded-lg p-3 text-brand-offwhite text-xs resize-none focus:outline-none focus:border-brand-sage/50 placeholder:text-brand-offwhite/20"
          />
          <button
            onClick={handleSaveNote}
            className={`w-full py-2 rounded-lg text-xs font-semibold transition-colors ${noteSaved ? 'bg-brand-sage/20 text-brand-sage border border-brand-sage/30' : 'bg-white/5 border border-white/10 text-brand-offwhite/60 hover:text-brand-offwhite hover:bg-white/10'}`}
          >
            {noteSaved ? '✓ Note saved' : 'Save note'}
          </button>
        </div>

        {/* Quick actions */}
        <div className="bg-brand-dark/40 border border-white/5 rounded-xl p-4">
          <p className="text-brand-offwhite/40 text-[10px] uppercase tracking-widest mb-3">Quick actions</p>
          <div className="space-y-2">
            {[
              { label: '→ Assign personal workout', to: '/workout-builder', color: 'text-brand-sage' },
              { label: '→ View their workout history', color: 'text-brand-offwhite/50' },
              { label: '→ Send reset password email', color: 'text-brand-offwhite/50' },
            ].map(a => (
              <button key={a.label} className={`w-full text-left text-sm py-1.5 ${a.color} hover:opacity-70 transition-opacity`}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Overview tab ─────────────────────────────────────────────────────────────
function OverviewTab({ members }) {
  const byTier = Object.keys(TIER_CONFIG).reduce((acc, tier) => {
    acc[tier] = members.filter(m => m.tier === tier).length
    return acc
  }, {})
  const active = members.filter(m => m.status === 'active').length
  const totalSessions = members.reduce((a, m) => a + m.sessions, 0)

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div>
        <h2 className="text-brand-offwhite font-semibold text-lg mb-1">Overview</h2>
        <p className="text-brand-offwhite/40 text-sm">Studio performance at a glance.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total members"   value={members.length}  sub="All tiers" />
        <StatCard label="Active members"  value={active}          sub="This month"      color="text-brand-sage" />
        <StatCard label="Total sessions"  value={totalSessions}   sub="All time" />
        <StatCard label="Avg sessions"    value={(totalSessions / Math.max(members.length, 1)).toFixed(1)} sub="Per member" />
      </div>

      {/* Tier breakdown */}
      <div className="bg-brand-surface border border-white/5 rounded-2xl p-5">
        <p className="text-brand-offwhite/50 text-[10px] uppercase tracking-widest mb-4">Members by tier</p>
        <div className="space-y-3">
          {Object.entries(TIER_CONFIG).map(([tier, cfg]) => {
            const count = byTier[tier] || 0
            const pct = Math.round((count / Math.max(members.length, 1)) * 100)
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

      {/* Recent activity */}
      <div className="bg-brand-surface border border-white/5 rounded-2xl p-5">
        <p className="text-brand-offwhite/50 text-[10px] uppercase tracking-widest mb-4">Most active members</p>
        <div className="space-y-3">
          {[...members].sort((a, b) => b.sessions - a.sessions).slice(0, 4).map(m => (
            <div key={m.id} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-sage/20 flex items-center justify-center flex-shrink-0">
                <span className="text-brand-sage text-xs font-bold">{m.name.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-brand-offwhite text-sm truncate">{m.name}</p>
                <TierBadge tier={m.tier} />
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-brand-offwhite font-semibold text-sm">{m.sessions}</p>
                <p className="text-brand-offwhite/30 text-[10px]">sessions</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Members tab ──────────────────────────────────────────────────────────────
function MembersTab({ members, onAdd, onUpdate }) {
  const [search, setSearch] = useState('')
  const [filterTier, setFilterTier] = useState('all')
  const [selected, setSelected] = useState(null)
  const [showAdd, setShowAdd] = useState(false)

  const filtered = members.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase())
    const matchTier = filterTier === 'all' || m.tier === filterTier
    return matchSearch && matchTier
  })

  const handleUpdate = (updated) => {
    onUpdate(updated)
    setSelected(updated)
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* List */}
      <div className={`flex flex-col overflow-hidden flex-shrink-0 transition-all duration-300 ${selected ? 'w-[360px]' : 'flex-1'}`}>
        {/* Toolbar */}
        <div className="p-5 border-b border-white/5 flex-shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-brand-offwhite font-semibold">{filtered.length} members</p>
            <button
              onClick={() => setShowAdd(true)}
              className="bg-brand-sage text-brand-dark text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand-sage/90 transition-colors"
            >
              + Add member
            </button>
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-brand-dark border border-white/10 rounded-lg px-3 py-2 text-brand-offwhite text-sm focus:outline-none focus:border-brand-sage/50 placeholder:text-brand-offwhite/20"
          />
          <div className="flex gap-1.5 flex-wrap">
            {[{ val: 'all', label: 'All' }, ...Object.entries(TIER_CONFIG).map(([val, cfg]) => ({ val, label: cfg.label }))].map(f => (
              <button
                key={f.val}
                onClick={() => setFilterTier(f.val)}
                className={`text-[11px] font-medium px-3 py-1 rounded-full transition-colors ${filterTier === f.val ? 'bg-brand-sage text-brand-dark' : 'bg-white/5 text-brand-offwhite/50 hover:text-brand-offwhite'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table header */}
        <div className="grid grid-cols-12 px-5 py-2 border-b border-white/5 flex-shrink-0">
          {['Member', 'Tier', 'Sessions', 'Last active', 'Status'].map((h, i) => (
            <p key={h} className={`text-brand-offwhite/30 text-[10px] uppercase tracking-widest ${i === 0 ? 'col-span-4' : i === 1 ? 'col-span-3' : 'col-span-2 text-center'}`}>{h}</p>
          ))}
        </div>

        {/* Rows */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/5">
          {filtered.map(m => {
            const statusCfg = STATUS_CONFIG[m.status] || STATUS_CONFIG.active
            const daysAgo = m.lastActive === '—' ? '—' : (() => {
              const diff = Math.floor((new Date() - new Date(m.lastActive)) / 86400000)
              return diff === 0 ? 'Today' : `${diff}d ago`
            })()
            return (
              <button
                key={m.id}
                onClick={() => setSelected(m)}
                className={`w-full grid grid-cols-12 items-center px-5 py-3.5 hover:bg-white/3 transition-colors text-left ${selected?.id === m.id ? 'bg-brand-sage/5' : ''}`}
              >
                {/* Member */}
                <div className="col-span-4 flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-brand-sage/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-brand-sage text-xs font-bold">{m.name.charAt(0)}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-brand-offwhite text-sm font-medium truncate">{m.name}</p>
                    <p className="text-brand-offwhite/30 text-xs truncate">{m.email}</p>
                  </div>
                </div>
                {/* Tier */}
                <div className="col-span-3"><TierBadge tier={m.tier} /></div>
                {/* Sessions */}
                <div className="col-span-2 text-center">
                  <p className="text-brand-offwhite/70 text-sm">{m.sessions}</p>
                </div>
                {/* Last active */}
                <div className="col-span-2 text-center">
                  <p className="text-brand-offwhite/50 text-xs">{daysAgo}</p>
                </div>
                {/* Status */}
                <div className="col-span-1 flex justify-center">
                  <span className={`w-2 h-2 rounded-full ${statusCfg.dot}`} title={statusCfg.label} />
                </div>
              </button>
            )
          })}

          {filtered.length === 0 && (
            <div className="flex items-center justify-center py-16">
              <p className="text-brand-offwhite/30 text-sm">No members found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="flex-1 border-l border-white/5 overflow-hidden">
          <MemberDetail
            member={selected}
            onClose={() => setSelected(null)}
            onUpdate={handleUpdate}
          />
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <AddMemberModal
          onClose={() => setShowAdd(false)}
          onAdd={(newMember) => {
            onAdd(newMember)
            setShowAdd(false)
          }}
        />
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview', label: 'Overview', icon: '◈' },
  { id: 'members',  label: 'Members',  icon: '◉' },
]

export default function Admin() {
  const { user } = useAuth()
  if (user?.role !== 'admin') return <Navigate to="/" replace />

  const [activeTab, setActiveTab] = useState('members')
  const [members, setMembers] = useState(INITIAL_MEMBERS)

  const handleAdd    = (m) => setMembers(prev => [...prev, m])
  const handleUpdate = (updated) => setMembers(prev => prev.map(m => m.id === updated.id ? updated : m))

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left nav */}
      <div className="w-[180px] flex-shrink-0 border-r border-white/5 flex flex-col">
        <div className="p-5 border-b border-white/5">
          <p className="text-brand-offwhite font-semibold text-base">Admin panel</p>
          <p className="text-brand-offwhite/40 text-xs mt-0.5">{members.length} members total</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                activeTab === t.id ? 'bg-brand-surface text-brand-offwhite font-medium border border-white/8' : 'text-brand-offwhite/50 hover:text-brand-offwhite hover:bg-white/3'
              }`}
            >
              <span className="opacity-60">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5">
          <p className="text-brand-offwhite/20 text-[10px]">Logged in as</p>
          <p className="text-brand-offwhite/50 text-xs mt-0.5 truncate">{user?.name}</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'overview' && <OverviewTab members={members} />}
        {activeTab === 'members'  && <MembersTab  members={members} onAdd={handleAdd} onUpdate={handleUpdate} />}
      </div>
    </div>
  )
}
