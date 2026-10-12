import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Filter } from 'lucide-react'
import TransactionList from '../components/TransactionList'
import { getTransactions, getSMSTransactions } from '../utils/storage'

export default function Transactions() {
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState([])
  const [filter, setFilter] = useState('all') // all, income, expense

  useEffect(() => {
    const fetchData = async () => {
      const apiTx = await getTransactions() || []
      const smsTx = getSMSTransactions() || []
      setTransactions([...apiTx, ...smsTx])
    }
    fetchData()
  }, [])

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true
    return t.type.toLowerCase() === filter
  })

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-white rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold">Transaction History</h1>
          <div className="w-10"></div> {/* Spacer */}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['all', 'income', 'expense'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors ${
                filter === f 
                  ? 'bg-primary text-white shadow-md' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* List */}
        <TransactionList transactions={filteredTransactions} showFullList={true} />
      </div>
    </div>
  )
}