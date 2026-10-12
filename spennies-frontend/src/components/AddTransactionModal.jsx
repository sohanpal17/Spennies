import { useState } from 'react'
import { X } from 'lucide-react'
import { addTransaction } from '../utils/storage'

export default function AddTransactionModal({ type, onClose, onSave }) {
  const [formData, setFormData] = useState({
    amount: '',
    category: type === 'income' ? 'Salary' : 'Food',
    description: '',
    date: new Date().toISOString().split('T')[0]
  })

  const incomeCategories = ['Salary', 'Freelance', 'Business', 'Tips', 'Other']
  const expenseCategories = ['Food', 'Transport', 'Bills', 'Shopping', 'Entertainment', 'Healthcare', 'Other']

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const transaction = {
      id: Date.now().toString(),
      ...formData,
      amount: parseFloat(formData.amount),
      type,
      source: 'manual'
    }

    addTransaction(transaction)
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold">
            Add {type === 'income' ? 'Income' : 'Expense'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Amount (₹)</label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="input-field"
              placeholder="Enter amount"
              required
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="input-field"
              required
            >
              {(type === 'income' ? incomeCategories : expenseCategories).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field"
              placeholder="e.g., Grocery shopping"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="input-field"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1">
              Add {type === 'income' ? 'Income' : 'Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}