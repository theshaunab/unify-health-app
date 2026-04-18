import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

const VIDEOS = [
  {
    id: 'v1', title: 'Hip Mobility Masterclass', duration: '28 min', category: 'Mobility',
    tier: 'full_access', thumbnail: null,
    description: 'A complete guide to restoring hip mobility — couch stretch, 90/90, and loaded progressions.',
    coach: 'Shauna Brown', date: 'Mar 2025', tags: ['Hips', 'Mobility', 'Warm-up'],
  },
  {
    id: 'v2', title: 'Deadlift Technique Deep Dive', duration: '34 min', category: 'Strength',
    tier: 'full_access', thumbnail: null,
    description: 'From setup to lockout — everything you need to build a safe, strong deadlift.',
    coach: 'Shauna Brown', date: 'Feb 2025', tags: ['Deadlift', 'Technique', 'Strength'],
  },
  {
    id: 'v3', title: 'Contrast Therapy Protocol', duration: '12 min', category: 'Recovery',
    tier: 'group_class', thumbnail: null,
    description: 'How to use cold plunge and sauna together for optimal recovery. Timings, protocols, and science.',
    coach: 'Shauna Brown', date: 'Feb 2025', tags: ['Recovery', 'Cold', 'Sauna'],
  },
  {
    id: 'v4', title: 'Building Your Aerobic Base', duration: '22 min', category: 'Conditioning',
    tier: 'full_access', thumbnail: null,
    description: 'Zone 2 training explained — why it matters, how to measure it, and how to program it.',
    coach: 'Shauna Brown', date: 'Jan 2025', tags: ['Cardio', 'Zone 2', 'Conditioning'],
  },
  {
    id: 'v5', title: 'Shoulder Health & Longevity', duration: '19 min', category: 'Rehab',
    tier: 'personal_training', thumbnail: null,
    description: 'Rotator cuff, scapular stability, and how to press without pain for decades.',
    coach: 'Shauna Brown', date: 'Jan 2025', tags: ['Shoulders', 'Rehab', 'Prevention'],
  },
  {
    id: 'v6', title: 'Nutrition Basics for Body Composition', duration: '41 min', category: 'Education',
    tier: 'full_access', thumbnail: null,
    description: 'Protein targets, meal timing, and how to eat to support your training without obsessing.',
    coach: 'Shauna Brown', date: 'Dec 2024', tags: ['Nutrition', 'Body composition', 'Education'],
  },
  {
    id: 'v7', title: 'Breathing & Bracing for Performance', duration: '15 min', category: 'Technique',
    tier: 'group_class', thumbnail: null,
    description: 'Intra-abdominal pressure and how proper breathing changes everything in your lifts.',
    coach: 'Shauna Brown', date: 'Dec 2024', tags: ['Breathing', 'Core', 'Technique'],
  },
  {
    id: 'v8', title: 'Monthly Q&A — March 2025', duration: '58 min', category: 'Webinar',
    tier: 'full_access', thumbnail: null,
    description: 'Live Q&A covering programming, recovery, supplements, and member questions.',
    coach: 'Shauna Brown', date: 'Mar 2025', tags: ['Q&A', 'Programming', 'Community'],
  },
]

const TIER_ORDER = { full_access: 0, personal_training: 1, group_class: 2, basic: 3 }

const CATEGORY_COLORS = {
  Mobility: 'bg-blue-500/20 text-blue-300',
  Strength: 'bg-brand-sage/20 text-brand-sage',
  Recovery: 'bg-brand-linen/20 text-brand-linen',
  Conditioning: 'bg-amber-500/20 text-amber-300',
  Rehab: 'bg-red-400/20 text-red-300',
  Education: 'bg-purple-500/20 text-purple-300',
  Technique: 'bg-brand-gold/20 text-brand-gold',
  Webinar: 'bg-teal-500/20 text-teal-300',
}

const TIER_LABELS = {
  full_access: 'Full Access',
  personal_training: 'Personal Training',
  group_class: 'Group Class',
  basic: 'Basic',
}

function canAccess(userTier, requiredTier) {
  return TIER_ORDER[userTier] <= TIER_ORDER[requiredTier]
}

function VideoCard({ video, userTier, isSelected, onClick }) {
  const accessible = canAccess(userTier, video.tier)
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border p-4 transition-all ${
        isSelected ? 'border-brand-sage/40 bg-brand-sage/5'
          : !accessible ? 'border-white/5 bg-brand-surface/40 opacity-60'
          : 'border-white/5 bg-brand-surface hover:border-white/10'
      }`}
    >
      {/* Thumbnail placeholder */}
      <div className={`w-full aspect-video rounded-lg mb-3 flex items-center justify-center relative overflow-hidden ${accessible ? 'bg-brand-dark/80' : 'bg-brand-dark/40'}`}>
        <span className={`text-3xl ${accessible ? 'text-brand-offwhite/20' : 'text-brand-offwhite/10'}`}>▶</span>
        {!accessible && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="text-center">
              <p className="text-2xl">🔒</p>
              <p className="text-brand-offwhite/50 text-[10px] mt-1">{TIER_LABELS[video.tier]}</p>
            </div>
          </div>
        )}
        <span className="absolute bottom-2 right-2 bg-black/60 text-brand-offwhite/70 text-[10px] px-1.5 py-0.5 rounded">
          {video.duration}
        </span>
      </div>

      <div className="flex items-start justify-between gap-2">
        <p className={`text-sm font-medium leading-tight ${accessible ? 'text-brand-offwhite' : 'text-brand-offwhite/50'}`}>{video.title}</p>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded flex-shrink-0 ${CATEGORY_COLORS[video.category] || 'bg-white/10 text-brand-offwhite/50'}`}>
          {video.category}
        </span>
      </div>
      <p className="text-brand-offwhite/30 text-xs mt-1">{video.date}</p>
    </button>
  )
}

function VideoDetail({ video, userTier, onClose }) {
  const accessible = canAccess(userTier, video.tier)
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-start justify-between p-6 border-b border-white/5 flex-shrink-0">
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${CATEGORY_COLORS[video.category] || ''}`}>{video.category}</span>
            <span className="text-brand-offwhite/30 text-xs">{video.duration}</span>
          </div>
          <h2 className="text-brand-offwhite font-semibold text-lg leading-tight">{video.title}</h2>
        </div>
        <button onClick={onClose} className="text-brand-offwhite/30 hover:text-brand-offwhite text-xl leading-none flex-shrink-0">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Video player area */}
        <div className="w-full aspect-video bg-brand-dark rounded-xl flex items-center justify-center relative overflow-hidden">
          {accessible ? (
            <div className="text-center">
              <button className="w-16 h-16 rounded-full bg-brand-sage/20 border-2 border-brand-sage flex items-center justify-center hover:bg-brand-sage/30 transition-colors">
                <span className="text-brand-sage text-2xl ml-1">▶</span>
              </button>
              <p className="text-brand-offwhite/40 text-xs mt-3">Click to play · {video.duration}</p>
            </div>
          ) : (
            <div className="text-center p-6">
              <p className="text-4xl mb-3">🔒</p>
              <p className="text-brand-offwhite/60 font-medium text-sm">Requires {TIER_LABELS[video.tier]}</p>
              <p className="text-brand-offwhite/30 text-xs mt-1">Upgrade your membership to access this content</p>
              <button className="mt-4 bg-brand-sage text-brand-dark text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand-sage/90 transition-colors">
                Upgrade membership
              </button>
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <p className="text-brand-offwhite/70 text-sm leading-relaxed">{video.description}</p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {video.tags.map(t => (
            <span key={t} className="text-[10px] bg-white/5 text-brand-offwhite/50 px-2 py-0.5 rounded">{t}</span>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-brand-offwhite/30 text-xs mb-0.5">Coach</p>
            <p className="text-brand-offwhite/70">{video.coach}</p>
          </div>
          <div>
            <p className="text-brand-offwhite/30 text-xs mb-0.5">Published</p>
            <p className="text-brand-offwhite/70">{video.date}</p>
          </div>
        </div>

        {accessible && (
          <button className="w-full bg-brand-sage text-brand-dark font-semibold py-3 rounded-xl text-sm hover:bg-brand-sage/90 transition-colors">
            Watch now
          </button>
        )}
      </div>
    </div>
  )
}

export default function VideoLibrary() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('All')
  const [selectedVideo, setSelectedVideo] = useState(null)

  const categories = ['All', ...Array.from(new Set(VIDEOS.map(v => v.category)))]

  const filtered = VIDEOS.filter(v => {
    const matchSearch = v.title.toLowerCase().includes(search.toLowerCase()) || v.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
    const matchCat = filterCategory === 'All' || v.category === filterCategory
    return matchSearch && matchCat
  })

  const accessible = filtered.filter(v => canAccess(user?.tier || 'basic', v.tier))
  const locked = filtered.filter(v => !canAccess(user?.tier || 'basic', v.tier))

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left */}
      <div className={`flex flex-col overflow-hidden flex-shrink-0 transition-all duration-300 ${selectedVideo ? 'w-[360px]' : 'flex-1'}`}>
        <div className="p-6 border-b border-white/5 flex-shrink-0">
          <h1 className="text-brand-offwhite text-2xl font-semibold">Video library</h1>
          <p className="text-brand-offwhite/40 text-sm mt-1">Classes, tutorials, and education from Shauna.</p>

          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search videos..."
            className="mt-4 w-full bg-brand-surface border border-white/10 rounded-lg px-4 py-2.5 text-brand-offwhite text-sm placeholder:text-brand-offwhite/30 focus:outline-none focus:border-brand-sage/50 transition-colors"
          />

          <div className="flex gap-1.5 mt-3 flex-wrap">
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setFilterCategory(c)}
                className={`text-[11px] font-medium px-3 py-1 rounded-full transition-colors ${filterCategory === c ? 'bg-brand-sage text-brand-dark' : 'bg-white/5 text-brand-offwhite/50 hover:text-brand-offwhite'}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {accessible.length > 0 && (
            <>
              <p className="text-brand-offwhite/30 text-[10px] uppercase tracking-widest px-1 mb-3">Available to you</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {accessible.map(v => (
                  <VideoCard key={v.id} video={v} userTier={user?.tier} isSelected={selectedVideo?.id === v.id} onClick={() => setSelectedVideo(v)} />
                ))}
              </div>
            </>
          )}

          {locked.length > 0 && (
            <>
              <p className="text-brand-offwhite/30 text-[10px] uppercase tracking-widest px-1 mb-3">Upgrade to unlock</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {locked.map(v => (
                  <VideoCard key={v.id} video={v} userTier={user?.tier} isSelected={selectedVideo?.id === v.id} onClick={() => setSelectedVideo(v)} />
                ))}
              </div>
            </>
          )}

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-brand-offwhite/30 text-sm">No videos match your search.</p>
            </div>
          )}
        </div>
      </div>

      {/* Right detail */}
      {selectedVideo && (
        <div className="flex-1 border-l border-white/5 overflow-hidden">
          <VideoDetail video={selectedVideo} userTier={user?.tier} onClose={() => setSelectedVideo(null)} />
        </div>
      )}
    </div>
  )
}
