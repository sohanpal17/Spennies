import { useState, useEffect } from 'react'
import { Clock, CheckCircle, AlertTriangle, Trash2 } from 'lucide-react'
import { getLoans, markLoanAsPaid, deleteLoan } from '../utils/storage'

export default function LoanList() {
  const [loans, setLoans] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    const handleRefresh = () => setRefresh(prev => prev + 1)
    window.addEventListener('refresh_dashboard', handleRefresh)
    return () => window.removeEventListener('refresh_dashboard', handleRefresh)
  }, [])

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        setIsLoading(true)
        const data = await getLoans()
        // Ensure we always have an array
        const loanData = Array.isArray(data) ? data : []
        setLoans(loanData)
      } catch (error) {
        console.error("Error loading loans:", error)
        setLoans([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchLoans()
  }, [refresh])

  const handleMarkPaid = async (loanId) => {
    if (window.confirm('Mark this loan as paid?')) {
      await markLoanAsPaid(loanId)
      window.dispatchEvent(new Event('refresh_dashboard'))
    }
  }

  const handleDelete = async (loanId) => {
    if (window.confirm('Delete this loan reminder?')) {
      await deleteLoan(loanId)
      window.dispatchEvent(new Event('refresh_dashboard'))
    }
  }

  if (isLoading) return <div className="card h-40 animate-pulse bg-gray-100"></div>

  // Helper to check payment status (handles both snake_case and camelCase)
  const isPaid = (loan) => {
    return loan.isPaid === true || loan.is_paid === true;
  }

  const activeLoans = loans.filter(l => !isPaid(l))
  const paidLoans = loans.filter(l => isPaid(l))

  const getDaysUntilDue = (dueDate) => {
    if (!dueDate) return 0;
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const calculateTotalAmount = (amount, interestRate, dateTaken, dueDate) => {
    const principal = parseFloat(amount || 0)
    const rate = parseFloat(interestRate || 0)
    if (rate === 0) return principal

    // Handle date strings
    const start = dateTaken ? new Date(dateTaken) : new Date()
    const end = dueDate ? new Date(dueDate) : new Date()
    
    // Calculate months difference
    const months = Math.max(1, (end - start) / (1000 * 60 * 60 * 24 * 30))
    const interest = (principal * rate * months) / 100
    
    return principal + interest
  }

  return (
    <div className="card">
      <h3 className="text-xl font-bold mb-4">Loan Reminders</h3>

      {activeLoans.length === 0 && paidLoans.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No loan reminders</p>
          <p className="text-sm">Add a loan to track repayments</p>
        </div>
      ) : (
        <>
          {/* Active Loans */}
          {activeLoans.length > 0 && (
            <div className="space-y-3 mb-6">
              <h4 className="text-sm font-semibold text-gray-600 uppercase">Active Loans</h4>
              {activeLoans.map(loan => {
                // Handle both casing styles
                const dueDateVal = loan.dueDate || loan.due_date
                const dateTakenVal = loan.dateTaken || loan.date_taken
                const lenderNameVal = loan.lenderName || loan.lender_name
                const interestRateVal = loan.interestRate || loan.interest_rate
                const reminderDaysVal = loan.reminderDays || loan.reminder_days || 3

                const daysUntilDue = getDaysUntilDue(dueDateVal)
                const totalAmount = calculateTotalAmount(
                  loan.amount,
                  interestRateVal,
                  dateTakenVal,
                  dueDateVal
                )
                const isUrgent = daysUntilDue <= reminderDaysVal

                return (
                  <div
                    key={loan.id}
                    className={`p-4 rounded-xl border-l-4 ${
                      isUrgent
                        ? 'bg-red-50 border-red-500'
                        : 'bg-blue-50 border-blue-500'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{lenderNameVal}</h4>
                          {isUrgent && (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                        {loan.purpose && (
                          <p className="text-sm text-gray-600">{loan.purpose}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-red-600">
                          ₹{totalAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                        {interestRateVal > 0 && (
                          <p className="text-xs text-gray-500">
                            @ {interestRateVal}% interest
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm mb-3">
                      <span className="text-gray-600">
                        Due: {new Date(dueDateVal).toLocaleDateString()}
                      </span>
                      <span
                        className={`font-medium ${
                          isUrgent ? 'text-red-600' : 'text-blue-600'
                        }`}
                      >
                        {daysUntilDue > 0
                          ? `${daysUntilDue} days left`
                          : daysUntilDue === 0
                          ? 'Due today!'
                          : `${Math.abs(daysUntilDue)} days overdue`}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleMarkPaid(loan.id)}
                        className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                      >
                        Mark as Paid
                      </button>
                      <button
                        onClick={() => handleDelete(loan.id)}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Paid Loans */}
          {paidLoans.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-600 uppercase">Paid Loans</h4>
              {paidLoans.map(loan => {
                const lenderNameVal = loan.lenderName || loan.lender_name
                const paidDateVal = loan.paidDate || loan.paid_date || Date.now()

                return (
                  <div
                    key={loan.id}
                    className="p-3 rounded-xl bg-green-50 border-l-4 border-green-500 opacity-60"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div>
                          <h4 className="font-semibold text-sm">{lenderNameVal}</h4>
                          <p className="text-xs text-gray-600">
                            Paid on {new Date(paidDateVal).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          ₹{parseFloat(loan.amount).toLocaleString()}
                        </p>
                        <button
                          onClick={() => handleDelete(loan.id)}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}