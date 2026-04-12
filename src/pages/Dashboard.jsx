import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'

const stats = [
  { label: 'Sessions this month', value: '12' },
  { label: 'Streak', value: '5 days' },
  { label: 'Sets logged', value: '847' },
  { label: 'Programs complete', value: '3' },
]

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-brand-offwhite text-2xl font-semibold">
          Good morning, {user?.name?.split(' ')[0] || 'there'}.
        </h1>
        <p className="text-brand-offwhite/40 text-sm mt-1">Your training snapshot for today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="bg-brand-surface border border-white/5 rounded-xl p-4">
            <p className="text-brand-offwhite/40 text-xs mb-1">{s.label}</p>
            <p className="text-brand-offwhite text-2xl font-semibold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/workout" className="group bg-brand-surface border border-white/5 rounded-xl p-5 hover:border-brand-sage/30 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-brand-offwhite/50 text-xs mb-1">Today's training</p>
              <p className="text-brand-offwhite font-semibold">Monday 3.30 W1</p>
              <p className="text-brand-offwhite/40 text-sm mt-1">14 exercises · Strength focus</p>
            </div>
            <span className="text-brand-sage text-xl group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </Link>

        <div className="bg-brand-surface border border-white/5 rounded-xl p-5">
          <p className="text-brand-offwhite/50 text-xs mb-1">Coach note</p>
          <p className="text-brand-offwhite text-sm leading-relaxed">
            "Take the warm-up seriously today — hip mobility sets up everything in this session."
          </p>
          <p className="text-brand-offwhite/30 text-xs mt-2">— Shauna</p>
        </div>
      </div>
    </div>
  )
}
