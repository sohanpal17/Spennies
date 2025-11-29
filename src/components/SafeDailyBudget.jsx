import { useState, useEffect } from 'react'
import { DollarSign, TrendingDown } from 'lucide-react'
import { getUser, getTransactions, getSMSTransactions } from '../utils/storage'

export default function SafeDailyBudget() {
  const [user, setUser] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await getUser()
        const apiTx = (await getTransactions()) || []
        const smsTx = getSMSTransactions() || []

        setUser(userData)
        setTransactions([...apiTx, ...smsTx])
      } catch (e) {
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  if (isLoading) {
    return <div className="card h-32 animate-pulse bg-gray-100"></div>
  }

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

  const savingsTarget = parseFloat(
    user?.savingsTarget || user?.savings_target || 5000
  )

  const dailySavingsTarget = savingsTarget / daysInMonth

  // Today's transactions
  const todayTransactions = transactions.filter(t => {
    if (!t?.date) return false
    const tDate = new Date(t.date)
    return tDate.toDateString() === now.toDateString()
  })

  const todayIncome = todayTransactions
    .filter(t => (t.type || '').toLowerCase() === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)

  const todayExpense = todayTransactions
    .filter(t => (t.type || '').toLowerCase() === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)

  const netToday = todayIncome - todayExpense
  const surplus = netToday - dailySavingsTarget

  const case1 = surplus > 0        // Surplus daily funds
  const case2 = surplus < 0        // Behind daily target
  const case3 = surplus === 0      // Target exactly met

  // Monthly extra calculations (for Case 3 and monthly check)
  const currentMonthTransactions = transactions.filter(t => {
    if (!t?.date) return false
    const d = new Date(t.date)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  })

  const monthlyIncome = currentMonthTransactions
    .filter(t => (t.type || '').toLowerCase() === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)

  const monthlyExpense = currentMonthTransactions
    .filter(t => (t.type || '').toLowerCase() === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)

  const monthlyNet = monthlyIncome - monthlyExpense
  const extraMonthly = monthlyNet - savingsTarget // Extra beyond full monthly goal
  const monthlyMet = monthlyNet >= savingsTarget

  return (
    <div className="card bg-gradient-to-br from-cyan-50 to-blue-50 pd-0">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="w-6 h-6 text-cyan-600" />
        <h3 className="text-lg font-bold">Daily Buffer</h3>
      </div>

      <div className="text-center mb-4">
        {/* If monthly target already met: special UI, no target lines */}
        {monthlyMet ? (
          <>
            <p className="text-lg font-bold text-green-700">Monthly goal achieved! 🎉</p>
            <p className="text-sm text-green-600 mt-1">
              You've already met your monthly savings target.
            </p>                          
            <p className="text-3xl font-bold mt-3 text-cyan-600">
              ₹{Math.max(0, Math.round(extraMonthly)).toLocaleString()}
            </p>
            <div className="flex flex-col items-center mt-2">
  <p className="text-sm text-gray-600 ">
    Can spend wisely from these.
  </p>
</div>
          </>
        ) : (
          /* Normal daily logic when monthly target not met */
          <>
            {case1 && (
              <>
                <p className="text-sm text-gray-600 mb-2">
                  You can spend today, but wisely:
                </p>
                <p className="text-4xl font-bold mb-1 text-cyan-600">
                  ₹{Math.round(surplus).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  after setting aside your daily savings
                </p>
              </>
            )}

            {case2 && (
              <>
                <p className="text-sm text-red-600 mb-2 font-medium">
                  Think twice before spending!
                </p>
                <p className="text-xs text-red-400">
                  You are behind today's target by ₹
                  {Math.abs(Math.round(surplus)).toLocaleString()}
                </p>
              </>
            )}

            {case3 && (
              <>
                <p className="text-sm text-gray-600 mb-2">
                  You've met today's savings target.
                </p>

                {extraMonthly > 0 ? (
                  <>
                    <p className="text-xs text-gray-500 mb-1">
                      You also have extra monthly savings.
                    </p>
                    <p className="text-3xl font-bold mb-1 text-cyan-600">
                      ₹{Math.round(extraMonthly).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      You may use these funds, but wisely.
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-gray-500">
                    No extra monthly funds available. Stay cautious.
                  </p>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* If monthlyMet, skip showing Today's Goal / progress bar as requested */}
      {!monthlyMet && (
        <div className="bg-white rounded-xl p-3 mb-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Today's Goal:</span>
            <span className="font-bold text-gray-800">
              Save ₹{Math.round(dailySavingsTarget).toLocaleString()}
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                case2 ? 'bg-red-500' : 'bg-green-500'
              }`}
              style={{
                width: `${Math.min((netToday / (dailySavingsTarget || 1)) * 100, 100)}%`
              }}
            />
          </div>

          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500">Net Saved Today:</span>
            <span
              className={`text-sm font-semibold ${
                netToday >= dailySavingsTarget ? 'text-green-600' : 'text-red-600'
              }`}
            >
              ₹{Math.round(netToday).toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {(!monthlyMet && case2) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <TrendingDown className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-800">
              You haven't met your daily savings target yet.
              Try to earn more or spend less today.
            </p>
          </div>
        </div>
      )}

      {(!monthlyMet && case1) && (
        <p className="text-xs text-center text-gray-500">
          💡 Good job! You've secured today's savings and still have extra to use wisely.
        </p>
      )}

      {(!monthlyMet && case3) && (
        <p className="text-xs text-center text-gray-500">
          💡 Today's savings target achieved.
        </p>
      )}
    </div>
  )
}
