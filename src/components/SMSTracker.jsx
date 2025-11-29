import { useState } from 'react'
import { MessageSquare, RefreshCw } from 'lucide-react'
import { getSMSTransactions, parseSMSTransaction } from '../utils/storage'

export default function SMSTracker() {
  const [smsText, setSmsText] = useState('')
  const [showInput, setShowInput] = useState(false)
  const [loading, setLoading] = useState(false)
  // This state will update when we trigger refresh
  const [smsList, setSmsList] = useState(getSMSTransactions())

  const handleParseSMS = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await parseSMSTransaction(smsText)
      setSmsText('')
      setShowInput(false)
      
      // Trigger dashboard refresh
      window.dispatchEvent(new Event('refresh_dashboard'))
      
      // Update local list immediately
      setSmsList(getSMSTransactions())
      
    } catch (error) {
      console.error("SMS parse failed", error)
      alert("Failed to parse SMS. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-bold">SMS Transactions</h3>
        </div>
        <button
          onClick={() => setShowInput(!showInput)}
          className="btn-secondary text-sm py-2"
        >
          {showInput ? 'Cancel' : 'Add SMS'}
        </button>
      </div>

      {/* SMS Input Form */}
      {showInput && (
        <form onSubmit={handleParseSMS} className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Paste Bank SMS
          </label>
          <textarea
            value={smsText}
            onChange={(e) => setSmsText(e.target.value)}
            className="input-field resize-none"
            rows="4"
            placeholder="e.g., Your A/c XX1234 debited with Rs.500.00 on 15-Jan-24 at Swiggy. Avl Bal: Rs.5000.00"
            required
          />
          <p className="text-xs text-gray-500 mt-1 mb-3">
            💡 Paste any bank transaction SMS and our AI will automatically categorize it
          </p>
          <button 
            type="submit" 
            className="btn-primary w-full flex justify-center items-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Parsing with AI...
              </>
            ) : (
              'Parse & Add Transaction'
            )}
          </button>
        </form>
      )}

      {/* SMS Transaction List */}
      <div className="space-y-3">
        {smsList.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No SMS transactions yet</p>
            <p className="text-sm">Add your first bank SMS to auto-track spending</p>
          </div>
        ) : (
          smsList.slice(0, 5).map((transaction) => (
            <SMSTransactionItem key={transaction.id} transaction={transaction} />
          ))
        )}
      </div>

      {smsList.length > 0 && (
        <div className="mt-4 p-3 bg-primary/10 rounded-xl border border-primary/20">
          <p className="text-sm text-primary font-medium flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            AI Auto-Categorization Active
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {smsList.length} SMS transaction{smsList.length !== 1 ? 's' : ''} automatically processed
          </p>
        </div>
      )}
    </div>
  )
}

function SMSTransactionItem({ transaction }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl border-l-4 border-primary">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">SMS</span>
          <span className="text-xs bg-white border border-gray-200 px-2 py-0.5 rounded text-gray-700 font-medium">{transaction.category}</span>
        </div>
        <p className="font-medium text-sm text-gray-800">{transaction.description}</p>
        <p className="text-xs text-gray-500">{new Date(transaction.date).toLocaleDateString()}</p>
      </div>
      <div className="text-right">
        <p className="font-bold text-red-600">
          -₹{parseFloat(transaction.amount).toLocaleString()}
        </p>
        {transaction.confidence > 0.7 && (
          <p className="text-[10px] text-green-600 flex items-center justify-end gap-1">
            <span>✨ AI Verified</span>
          </p>
        )}
      </div>
    </div>
  )
}