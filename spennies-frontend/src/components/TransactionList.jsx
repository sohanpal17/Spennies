import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, TrendingDown, Trash2, ArrowRight } from 'lucide-react'
import { deleteTransaction } from '../utils/storage'

export default function TransactionList({ transactions, showFullList = false }) {
  const navigate = useNavigate()

  // Sort by Date (desc) -> Created Time (desc) -> ID (desc)
  // This ensures the absolute newest transaction is always first
  const sortedTransactions = [...(transactions || [])].sort((a, b) => {
    const dateA = a?.date ? new Date(a.date).getTime() : 0
    const dateB = b?.date ? new Date(b.date).getTime() : 0

    // Primary: Sort by Date
    if (dateB !== dateA) return dateB - dateA

    // Secondary: Sort by Created Timestamp (if available)
    const timeA = a?.created_at ? new Date(a.created_at).getTime() : 0
    const timeB = b?.created_at ? new Date(b.created_at).getTime() : 0
    if (timeB !== timeA) return timeB - timeA

    // Tertiary: Sort by ID as fallback
    return String(b?.id || '').localeCompare(String(a?.id || ''))
  })

  const displayTransactions = showFullList ? sortedTransactions : sortedTransactions.slice(0, 5)

  const handleDelete = async (id) => {
    if (window.confirm('Delete this transaction?')) {
      await deleteTransaction(id)

      // Trigger global refresh
      window.dispatchEvent(new Event('refresh_dashboard'))

      // If we are on the full list page, we might need a hard reload to reflect changes if state isn't managed by parent
      if (showFullList) {
        window.location.reload()
      }
    }
  }

  return (
    <div className={showFullList ? '' : 'card'}>
      {!showFullList && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Recent Transactions</h3>
          <button
            onClick={() => navigate('/transactions')}
            className="text-sm text-primary font-medium hover:underline flex items-center gap-1 transition-transform hover:translate-x-1"
          >
            View All <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {sortedTransactions.length === 0 ? (
        <div
          className={`text-center py-12 text-gray-400 ${showFullList ? 'bg-white rounded-xl border border-dashed border-gray-200' : ''}`}
        >
          <p>No transactions found</p>
          {!showFullList && <p className="text-xs mt-1">Add one to get started!</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {displayTransactions.map((transaction) => (
            <TransactionItem
              key={transaction.id}
              transaction={transaction}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function TransactionItem({ transaction, onDelete }) {
  const isIncome = (transaction?.type || '').toString().toLowerCase() === 'income'

  return (
    <div className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:shadow-md hover:border-primary/20 transition-all duration-200 group">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${isIncome ? 'bg-green-50' : 'bg-red-50'}`}>
          {isIncome ? (
            <TrendingUp className="w-5 h-5 text-green-600" />
          ) : (
            <TrendingDown className="w-5 h-5 text-red-600" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-800 truncate pr-2">{transaction?.description || 'No description'}</p>
          <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-0.5">
            <span className="bg-gray-50 border border-gray-200 px-2 py-0.5 rounded text-gray-600 font-medium">
              {transaction?.category || 'Uncategorized'}
            </span>
            <span className="py-0.5 flex items-center">
              {transaction?.date ? new Date(transaction.date).toLocaleDateString() : '—'}
            </span>
            {transaction?.source && transaction.source.toLowerCase() === 'sms' && (
              <span className="bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-wider">
                SMS
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pl-2">
        <p className={`font-bold text-base whitespace-nowrap ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
          {isIncome ? '+' : '-'}₹{Number(parseFloat(transaction?.amount || 0)).toLocaleString()}
        </p>

        <button
          onClick={() => onDelete(transaction.id)}
          className="p-2 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
