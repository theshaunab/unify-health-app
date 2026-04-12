import { useState } from 'react'

const MOCK_MEMBERS = [
  { id: '1', name: 'Shauna Brown', email: 'shauna@unifyhealth.com', tier: 'full_access', lastActive: '2025-03-30', sessions: 42, role: 'admin' },
  { id: '2', name: 'Emma Wilson', email: 'emma@example.com', tier: 'personal_training', lastActive: '2025-03-29', sessions: 18 },
  { id: '3', name: 'Tom Hughes', email: 'tom@example.com', tier: 'group_class', lastActive: '2025-03-28', sessions: 7 },
  { id: '4', name: 'Priya Sharma', email: 'priya@example.com', tier: 'basic', lastActive: '2025-03-25', sessions: 3 },
]

const tierColors = {
  full_access: 'bg-brand-sage/20 text-brand-sage',
  group_class: 'bg-brand-linen/20 text-brand-linen',
  personal_training: 'bg-brand-gold/20 text-brand-gold',
  basic: 'bg-white/10 text-brand-offwhite/60',
}

const tierLabels = {
  full_access: 'Full Access',
  group_class: 'Group Class',
  personal_training: 'Personal Training',
  basic: 'Basic',
}

export default function Admin() {
  const [members, setMembers] = useState(MOCK_MEMBERS)
  const [selectedMember, setSelectedMember] = useState(null)
  const [showNewProgram, setShowNewProgram] = useState(false)
  const [editTier, setEditTier] = useState('')
  const [coachNote, setCoachNote] = useState('')

  const handleSelectMember = (m) => {
    setSelectedMember(m)
    setEditTier(m.tier)
    setCoachNote('')
  }

  const handleUpdateTier = () => {
    setMembers(prev => prev.map(m => m.id === selectedMember.id ? { ...m, tier: editTier } : m))
    setSelectedMember(prev => ({ ...prev, tier: editTier }))
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-brand-offwhite text-2xl font-semibold">Admin panel</h1>
          <p className="text-brand-offwhite/40 text-sm mt-1">{members.length} members</p>
        </div>
        <button
          onClick={() => setShowNewProgram(true)}
          className="px-4 py-2 bg-brand-sage text-brand-dark text-sm font-semibold rounded-lg hover:bg-brand-sage/90 transition-colors"
        >
          + New program
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Member list */}
        <div className="lg:col-span-2">
          <div className="bg-brand-surface border border-white/5 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5">
              <p className="text-brand-offwhite/50 text-xs uppercase tracking-widest font-semibold">Members</p>
            </div>
            <div className="divide-y divide-white/5">
              {members.map(member => (
                <button
                  key={member.id}
                  onClick={() => handleSelectMember(member)}
                  className={`w-full flex items-center gap-4 px-4 py-3 hover:bg-white/3 transition-colors text-left ${
                    selectedMember?.id === member.id ? 'bg-brand-sage/10' : ''
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-brand-sage/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-brand-sage text-xs font-bold">{member.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-brand-offwhite text-sm font-medium truncate">{member.name}</p>
                    <p className="text-brand-offwhite/40 text-xs truncate">{member.email}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded font-medium ${tierColors[member.tier]}`}>
                      {tierLabels[member.tier]}
                    </span>
                    <p className="text-brand-offwhite/30 text-xs mt-0.5">{member.sessions} sessions</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Member detail */}
        <div>
          {selectedMember ? (
            <div className="bg-brand-surface border border-white/5 rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-sage/20 flex items-center justify-center">
                  <span className="text-brand-sage font-bold">{selectedMember.name.charAt(0)}</span>
                </div>
                <div>
                  <p className="text-brand-offwhite font-semibold">{selectedMember.name}</p>
                  <p className="text-brand-offwhite/40 text-xs">{selectedMember.email}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-white/5">
                <p className="text-brand-offwhite/40 text-xs mb-2 uppercase tracking-widest">Edit tier</p>
                <select
                  value={editTier}
                  onChange={e => setEditTier(e.target.value)}
                  className="w-full bg-brand-dark border border-white/10 rounded-lg px-3 py-2 text-brand-offwhite text-sm focus:outline-none focus:border-brand-sage"
                >
                  <option value="full_access">Full Access</option>
                  <option value="group_class">Group Class</option>
                  <option value="personal_training">Personal Training</option>
                  <option value="basic">Basic</option>
                </select>
                <button
                  onClick={handleUpdateTier}
                  className="mt-2 w-full bg-brand-sage/20 border border-brand-sage/30 text-brand-sage text-xs py-2 rounded-lg hover:bg-brand-sage/30 transition-colors"
                >
                  Update tier
                </button>
              </div>

              <div className="pt-3 border-t border-white/5">
                <p className="text-brand-offwhite/40 text-xs mb-2 uppercase tracking-widest">Coach note</p>
                <textarea
                  value={coachNote}
                  onChange={e => setCoachNote(e.target.value)}
                  placeholder="Add a note for this member..."
                  rows={3}
                  className="w-full bg-brand-dark border border-white/10 rounded-lg p-3 text-brand-offwhite text-xs resize-none focus:outline-none focus:border-brand-sage/50 placeholder:text-brand-offwhite/20"
                />
                <button className="mt-2 w-full bg-brand-sage/20 border border-brand-sage/30 text-brand-sage text-xs py-2 rounded-lg hover:bg-brand-sage/30 transition-colors">
                  Save note
                </button>
              </div>

              <div className="pt-3 border-t border-white/5 grid grid-cols-2 gap-3">
                <div className="bg-brand-dark rounded-lg p-3 text-center">
                  <p className="text-brand-offwhite text-lg font-semibold">{selectedMember.sessions}</p>
                  <p className="text-brand-offwhite/40 text-xs">Sessions</p>
                </div>
                <div className="bg-brand-dark rounded-lg p-3 text-center">
                  <p className="text-brand-offwhite text-sm font-semibold">{selectedMember.lastActive}</p>
                  <p className="text-brand-offwhite/40 text-xs">Last active</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-brand-surface border border-white/5 rounded-xl p-6 flex items-center justify-center h-48">
              <p className="text-brand-offwhite/30 text-sm">Select a member to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* New program modal */}
      {showNewProgram && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-surface border border-white/10 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-brand-offwhite font-semibold">Create new program</h2>
              <button onClick={() => setShowNewProgram(false)} className="text-brand-offwhite/40 hover:text-brand-offwhite">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-brand-offwhite/50 text-xs block mb-1">Program name</label>
                <input className="w-full bg-brand-dark border border-white/10 rounded-lg px-3 py-2 text-brand-offwhite text-sm focus:outline-none focus:border-brand-sage" placeholder="e.g. Wednesday 4.2 W2" />
              </div>
              <div>
                <label className="text-brand-offwhite/50 text-xs block mb-1">Date</label>
                <input type="date" className="w-full bg-brand-dark border border-white/10 rounded-lg px-3 py-2 text-brand-offwhite text-sm focus:outline-none focus:border-brand-sage" />
              </div>
              <div>
                <label className="text-brand-offwhite/50 text-xs block mb-1">Coach note</label>
                <textarea rows={3} className="w-full bg-brand-dark border border-white/10 rounded-lg px-3 py-2 text-brand-offwhite text-sm resize-none focus:outline-none focus:border-brand-sage" placeholder="Motivation, cues, intent for the session..." />
              </div>
              <button className="w-full bg-brand-sage text-brand-dark font-semibold py-2.5 rounded-lg text-sm hover:bg-brand-sage/90 transition-colors">
                Create program
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
