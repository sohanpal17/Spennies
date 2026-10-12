import { useState } from 'react'
import { Target, CheckCircle, X } from 'lucide-react'
import { getCurrentChallenge, completeChallenge, skipChallenge } from '../utils/storage'


export default function MicroChallengeCard() {
  const [challenge, setChallenge] = useState(getCurrentChallenge())

  if (!challenge || challenge.status !== 'active') return null

  const handleComplete = () => {
    completeChallenge(challenge.id)
    setChallenge(null)
  }

  const handleSkip = () => {
    skipChallenge(challenge.id)
    setChallenge(null)
  }

  return (
    <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-6 h-6 text-green-600" />
        <h3 className="font-bold text-green-900">Today's Micro-Challenge</h3>
      </div>

      <div className="bg-white rounded-xl p-4 mb-4">
        <p className="text-lg font-semibold text-gray-800 mb-2">
          {challenge.title}
        </p>
        <p className="text-sm text-gray-600 mb-3">
          {challenge.description}
        </p>
        <div className="flex items-center gap-2 text-green-600">
          <span className="text-2xl font-bold">+₹{challenge.reward}</span>
          <span className="text-sm">potential savings</span>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleComplete}
          className="flex-1 bg-green-500 text-white py-3 rounded-xl hover:bg-green-600 transition-colors font-medium flex items-center justify-center gap-2"
        >
          <CheckCircle className="w-5 h-5" />
          I did it!
        </button>
        <button
          onClick={handleSkip}
          className="px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <p className="text-xs text-gray-500 text-center mt-3">
        Small steps lead to big savings! 💪
      </p>
    </div>
  )
}