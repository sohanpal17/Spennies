import { X, Calendar, TrendingUp, Award } from 'lucide-react'

export default function WeeklyStoryModal({ onClose, story }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" />
            <h3 className="text-2xl font-bold">Your Weekly Story</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-8 h-8 text-primary" />
            <div>
              <h4 className="font-bold text-lg">{story.title}</h4>
              <p className="text-sm text-gray-600">{story.period}</p>
            </div>
          </div>

          <div className="space-y-4">
            {story.highlights.map((highlight, index) => (
              <div key={index} className="bg-white rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{highlight.emoji}</span>
                  <div className="flex-1">
                    <h5 className="font-semibold mb-1">{highlight.title}</h5>
                    <p className="text-sm text-gray-700">{highlight.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
          <h4 className="font-semibold text-green-800 mb-2">✨ This Week's Win</h4>
          <p className="text-sm text-green-700">{story.win}</p>
        </div>

        {story.challenge && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
            <h4 className="font-semibold text-orange-800 mb-2">💪 Challenge for Next Week</h4>
            <p className="text-sm text-orange-700">{story.challenge}</p>
          </div>
        )}

        <button onClick={onClose} className="btn-primary w-full">
          Got it! 🎉
        </button>
      </div>
    </div>
  )
}