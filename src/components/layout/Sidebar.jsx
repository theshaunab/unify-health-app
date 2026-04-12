import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const tierColors = {
  full_access: 'bg-brand-sage text-brand-dark',
  group_class: 'bg-brand-linen text-brand-dark',
  personal_training: 'bg-brand-gold text-brand-dark',
  basic: 'bg-brand-surface text-brand-offwhite border border-white/10',
}

const tierLabels = {
  full_access: 'Full Access',
  group_class: 'Group Class',
  personal_training: 'Personal Training',
  basic: 'Basic',
}

function NavItem({ to, label, icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
          isActive
            ? 'bg-brand-sage/15 text-brand-sage font-medium'
            : 'text-brand-offwhite/60 hover:text-brand-offwhite hover:bg-white/5'
        }`
      }
    >
      <span className="w-4 text-center opacity-70">{icon}</span>
      {label}
    </NavLink>
  )
}

function NavSection({ title, children }) {
  return (
    <div className="mb-6">
      <p className="px-4 mb-2 text-[10px] uppercase tracking-widest text-brand-offwhite/30 font-semibold">{title}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

export default function Sidebar({ collapsed, onClose }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <aside
      className={`flex flex-col h-full bg-brand-surface border-r border-white/5 transition-all duration-300 ${
        collapsed ? 'w-0 overflow-hidden' : 'w-[200px]'
      }`}
      style={{ minWidth: collapsed ? 0 : 200 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-6 border-b border-white/5">
        <div className="w-9 h-9 rounded-full border-2 border-brand-sage flex items-center justify-center flex-shrink-0">
          <span className="text-brand-sage font-bold text-base">U</span>
        </div>
        <div>
          <p className="text-brand-offwhite font-semibold text-sm tracking-widest">UNIFY</p>
          <p className="text-brand-offwhite/40 text-[10px] tracking-wide">Health &amp; Fitness</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto">
        <NavSection title="My Health">
          <NavItem to="/" label="Dashboard" icon="◈" />
          <NavItem to="/body-composition" label="Body composition" icon="◉" />
          <NavItem to="/vo2" label="VO2 &amp; metabolic" icon="◎" />
          <NavItem to="/strength" label="Strength &amp; VALD" icon="◆" />
          <NavItem to="/movement" label="Movement screen" icon="◇" />
        </NavSection>

        <NavSection title="Training">
          <NavItem to="/workout" label="Today's workout" icon="▶" />
          <NavItem to="/programs" label="Programs &amp; plans" icon="☰" />
          <NavItem to="/videos" label="Video library" icon="⬡" />
          <NavItem to="/webinars" label="Webinars" icon="⬡" />
        </NavSection>

        <NavSection title="Daily">
          <NavItem to="/goals" label="Goals &amp; habits" icon="◈" />
        </NavSection>

        {user?.role === 'admin' && (
          <NavSection title="Admin">
            <NavItem to="/admin" label="Admin panel" icon="⚙" />
          </NavSection>
        )}
      </nav>

      {/* Member footer */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-sage/20 flex items-center justify-center flex-shrink-0">
            <span className="text-brand-sage text-xs font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-brand-offwhite text-xs font-medium truncate">{user?.name || 'Member'}</p>
            <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded font-medium mt-0.5 ${tierColors[user?.tier] || tierColors.basic}`}>
              {tierLabels[user?.tier] || 'Member'}
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="text-brand-offwhite/30 hover:text-brand-offwhite/70 text-xs transition-colors"
            title="Sign out"
          >
            ⎋
          </button>
        </div>
      </div>
    </aside>
  )
}
