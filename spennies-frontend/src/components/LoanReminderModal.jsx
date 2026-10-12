import { useState } from 'react'
import { X, AlertCircle } from 'lucide-react'
import { addLoan } from '../utils/storage'

export default function LoanReminderModal({ onClose, onSave }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    lenderName: '',
    amount: '',
    purpose: '',
    dateTaken: new Date().toISOString().split('T')[0],
    dueDate: '',
    interestRate: '0',
    reminderDays: '3'
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Create loan object with BOTH camelCase and snake_case
      // This ensures compatibility with both local logic and backend API
      const loan = {
        id: Date.now().toString(), // Temp ID for local update
        
        // Standardize fields
        lenderName: formData.lenderName,
        lender_name: formData.lenderName,
        
        amount: parseFloat(formData.amount),
        purpose: formData.purpose,
        
        dateTaken: formData.dateTaken,
        date_taken: formData.dateTaken,
        
        dueDate: formData.dueDate,
        due_date: formData.dueDate,
        
        interestRate: parseFloat(formData.interestRate),
        interest_rate: parseFloat(formData.interestRate),
        
        reminderDays: parseInt(formData.reminderDays),
        reminder_days: parseInt(formData.reminderDays),
        
        isPaid: false,
        is_paid: false,
        createdAt: new Date().toISOString()
      }

      await addLoan(loan)
      window.dispatchEvent(new Event('refresh_dashboard'))
      onSave()
    } catch (error) {
      console.error("Failed to add loan", error)
      alert("Failed to add loan. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // ... rest of the JSX remains same ...
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold">Add Loan Reminder</h3>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-6 flex gap-2">
          <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-orange-800">
            Track informal loans from friends, family, or local lenders. We'll remind you before the due date!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Lender Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.lenderName}
              onChange={(e) => setFormData({ ...formData, lenderName: e.target.value })}
              className="input-field"
              placeholder="e.g., Ramesh bhai, Local lender"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Loan Amount (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="input-field"
              placeholder="e.g., 5000"
              required
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Purpose
            </label>
            <input
              type="text"
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              className="input-field"
              placeholder="e.g., Medical emergency, Vehicle repair"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Date Taken
              </label>
              <input
                type="date"
                value={formData.dateTaken}
                onChange={(e) => setFormData({ ...formData, dateTaken: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="input-field"
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Interest Rate (%)
              </label>
              <input
                type="number"
                value={formData.interestRate}
                onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                className="input-field"
                placeholder="0"
                min="0"
                step="0.1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Remind me (days before)
              </label>
              <select
                value={formData.reminderDays}
                onChange={(e) => setFormData({ ...formData, reminderDays: e.target.value })}
                className="input-field"
              >
                <option value="1">1 day</option>
                <option value="3">3 days</option>
                <option value="5">5 days</option>
                <option value="7">7 days</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary flex-1 flex justify-center items-center"
              disabled={loading}
            >
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Add Loan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}