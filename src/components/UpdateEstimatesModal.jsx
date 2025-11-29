import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { updateUserEstimates } from '../utils/storage'
import api from '../services/api'

export default function UpdateEstimatesModal({ user, onClose, onSave }) {
  const [loading, setLoading] = useState(false)
  
  // Initialize state from user prop
  const [formData, setFormData] = useState({
    name: '',
    jobType: 'freelancer',
    jobTypeCustom: '',
    aiTone: 'friendly',
    food: '',
    transport: '',
    bills: '',
    other: '',
    savingsTarget: ''
  })

  // Populate form when user data is available
  useEffect(() => {
    if (user) {
      const standardJobs = ['freelancer','driver','vendor','student','housewife']
      const initialJobType = standardJobs.includes(user.job_type) ? user.job_type : 'custom'
      
      setFormData({
        name: user.name || '',
        jobType: initialJobType,
        jobTypeCustom: initialJobType === 'custom' ? user.job_type : '',
        aiTone: user.ai_tone || 'friendly',
        
        // Safely access nested expenses object
        food: user.expenses?.food ?? '',
        transport: user.expenses?.transport ?? '',
        bills: user.expenses?.bills ?? '',
        other: user.expenses?.other ?? '',
        
        // Handle both casing styles just in case
        savingsTarget: user.savingsTarget ?? user.savings_target ?? ''
      })
    }
  }, [user])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      let finalJobType = formData.jobType
      if (formData.jobType === 'custom') {
        finalJobType = (formData.jobTypeCustom || '').trim() || 'other'
      }

      // 1. Update Profile
      await api.put('/api/users/me', {
        name: formData.name,
        job_type: finalJobType,
        ai_tone: formData.aiTone
      })

      // 2. Update Estimates
      await updateUserEstimates({
        food: formData.food,
        transport: formData.transport,
        bills: formData.bills,
        other: formData.other,
        savingsTarget: formData.savingsTarget
      })

      // 3. Refresh and Close
      window.dispatchEvent(new Event('refresh_dashboard'))
      // Short delay to allow backend update
      setTimeout(() => {
        window.location.reload()
      }, 500)
      
    } catch (error) {
      console.error("Failed to update settings", error)
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold">Settings</h3>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* PROFILE SECTION */}
          <div className="space-y-4">
            <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wide border-b pb-2">Profile</h4>
            
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Job Type</label>
              {formData.jobType !== 'custom' ? (
                <select
                  name="jobType"
                  value={formData.jobType}
                  onChange={(e) => {
                    if (e.target.value === 'other') {
                      setFormData(prev => ({ ...prev, jobType: 'custom' }))
                    } else {
                      handleInputChange(e)
                    }
                  }}
                  className="input-field bg-white"
                >
                  <option value="freelancer">Freelancer</option>
                  <option value="driver">Driver</option>
                  <option value="vendor">Vendor/Shopkeeper</option>
                  <option value="student">Student</option>
                  <option value="housewife">Housewife</option>
                  <option value="other">Other (Custom)</option>
                </select>
              ) : (
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    name="jobTypeCustom"
                    value={formData.jobTypeCustom}
                    onChange={handleInputChange}
                    className="input-field flex-1"
                    placeholder="e.g. Chef, Artist..."
                    required
                  />
                  <button
                    type="button"
                    className="text-sm text-primary hover:underline"
                    onClick={() => setFormData(prev => ({ ...prev, jobType: 'freelancer' }))}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">AI Coach Tone</label>
              <select
                name="aiTone"
                value={formData.aiTone}
                onChange={handleInputChange}
                className="input-field bg-white"
              >
                <option value="friendly">Friendly & Casual</option>
                <option value="motivational">Motivational</option>
                <option value="professional">Professional</option>
              </select>
            </div>
          </div>

          {/* BUDGET SECTION */}
          <div className="space-y-4">
            <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wide border-b pb-2">Monthly Budgets</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Food</label>
                <input
                  type="number"
                  name="food"
                  value={formData.food}
                  onChange={handleInputChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Transport</label>
                <input
                  type="number"
                  name="transport"
                  value={formData.transport}
                  onChange={handleInputChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Bills</label>
                <input
                  type="number"
                  name="bills"
                  value={formData.bills}
                  onChange={handleInputChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Other</label>
                <input
                  type="number"
                  name="other"
                  value={formData.other}
                  onChange={handleInputChange}
                  className="input-field"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-sm font-bold text-primary mb-2">
                Monthly Savings Target (₹)
              </label>
              <input
                type="number"
                name="savingsTarget"
                value={formData.savingsTarget}
                onChange={handleInputChange}
                className="input-field border-primary text-primary font-bold"
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary flex-1 flex justify-center items-center"
              disabled={loading}
            >
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}