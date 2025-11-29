import { useState, useEffect } from 'react'
import { Target, CheckCircle, X, RefreshCw } from 'lucide-react'
import api from '../services/api' // Use API directly for AI challenge
import { auth } from '../config/firebase'

export default function MicroChallengeCard() {
  const [challenge, setChallenge] = useState(null)
  const [loading, setLoading] = useState(false)
  const [completed, setCompleted] = useState(false)

  // helper: stable per-user key id (tries Firebase uid, falls back to local user email/id, else 'anon')
  const getUserKeyId = () => {
    try {
      const fbUser = auth?.currentUser
      if (fbUser && fbUser.uid) return fbUser.uid
    } catch (e) {
      // ignore
    }

    try {
      const cached = localStorage.getItem('spennies_user')
      if (cached) {
        const parsed = JSON.parse(cached)
        if (parsed.id) return parsed.id
        if (parsed.email) return parsed.email
        if (parsed.name) return parsed.name
      }
    } catch (e) {
      // ignore
    }

    return 'anon'
  }

  const userIdKey = getUserKeyId()
  const today = new Date().toISOString().split('T')[0]
  const todayKey = `challenge_done_${userIdKey}_${today}`
  const storedKey = `current_challenge_${userIdKey}`
  const storedDateKey = `current_challenge_date_${userIdKey}`

  useEffect(() => {
    const loadChallenge = async () => {
      // 1. Check if already completed today (user-scoped)
      if (localStorage.getItem(todayKey)) {
        setCompleted(true)
        return
      }

      // 2. Load stored challenge for this user/day if exists
      const stored = localStorage.getItem(storedKey)
      const storedDate = localStorage.getItem(storedDateKey)

      if (stored && storedDate === today) {
        try {
          setChallenge(JSON.parse(stored))
          return
        } catch (e) {
          // parse failed -> fetch new
        }
      }

      await fetchNewChallenge()
    }
    loadChallenge()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // run once on mount

  const fetchNewChallenge = async () => {
    setLoading(true)
    try {
      // Call backend AI
      const response = await api.get('/api/ai/challenge?refresh=true')
      const newChallenge = {
        ...response.data,
        id: Date.now().toString() // Unique ID
      }
      
      setChallenge(newChallenge)
      
      // Save to local storage user-scoped
      localStorage.setItem(storedKey, JSON.stringify(newChallenge))
      localStorage.setItem(storedDateKey, today)
      
    } catch (error) {
      console.error("Failed to fetch challenge", error)
      // Fallback
      setChallenge({
        title: "Track every expense",
        description: "Log all your spending today accurately.",
        reward: 0,
        id: Date.now().toString()
      })
      localStorage.setItem(storedKey, JSON.stringify({
        title: "Track every expense",
        description: "Log all your spending today accurately.",
        reward: 0,
        id: Date.now().toString()
      }))
      localStorage.setItem(storedDateKey, today)
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = () => {
    setCompleted(true)
    localStorage.setItem(todayKey, 'true')
    // Optional: Call backend to log achievement
  }

  const handleSkip = () => {
    // fetch a fresh challenge (this will overwrite the user-scoped stored challenge)
    fetchNewChallenge()
  }

  if (completed) {
    return (
      <div className="card bg-green-50 border border-green-200 opacity-75">
        <div className="flex items-center gap-2 text-green-700">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">Daily Challenge Completed! 🎉</span>
        </div>
      </div>
    )
  }

  if (!challenge && !loading) return null

  return (
    <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-6 h-6 text-green-600" />
          <h3 className="font-bold text-green-900">Today's Challenge</h3>
        </div>
        <button 
          onClick={handleSkip}
          disabled={loading}
          className="p-1.5 hover:bg-green-100 rounded-full transition-colors text-green-600"
          title="New Challenge"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Content */}
      <div className="bg-white/80 rounded-xl p-4 mb-4 backdrop-blur-sm">
        {loading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-green-100 rounded w-3/4"></div>
            <div className="h-3 bg-green-100 rounded w-full"></div>
          </div>
        ) : (
          <>
            <p className="text-lg font-bold text-gray-800 mb-1">
              {challenge.title}
            </p>
            <p className="text-sm text-gray-600 mb-3 leading-relaxed">
              {challenge.description}
            </p>
            <div className="flex items-center gap-2 text-green-700 bg-green-50 w-fit px-3 py-1 rounded-full border border-green-100">
              <span className="text-xl font-bold">₹{challenge.reward}</span>
              <span className="text-xs font-medium uppercase tracking-wide">Potential Savings</span>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleComplete}
          disabled={loading}
          className="flex-1 bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-200 font-bold flex items-center justify-center gap-2 active:scale-95"
        >
          <CheckCircle className="w-5 h-5" />
          I did it!
        </button>
      </div>
    </div>
  )
}
