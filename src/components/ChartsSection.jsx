import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function ChartsSection({ transactions }) {
  // Weekly Income Data
  const getLast7Days = () => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      days.push(date.toISOString().split('T')[0])
    }
    return days
  }

  const weeklyData = getLast7Days().map(date => {
    const dayTransactions = transactions.filter(t => t.date === date)
    
    const income = dayTransactions
      .filter(t => t.type.toLowerCase() === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
      
    const expense = dayTransactions
      .filter(t => t.type.toLowerCase() === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
    
    return {
      date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      income,
      expense
    }
  })

  // Expense Breakdown Data
  const expensesByCategory = transactions
    .filter(t => t.type.toLowerCase() === 'expense')
    .reduce((acc, t) => {
      const amount = parseFloat(t.amount || 0)
      const category = t.category || 'Other'
      acc[category] = (acc[category] || 0) + amount
      return acc
    }, {})

  const pieData = Object.entries(expensesByCategory)
    .map(([name, value]) => ({ name, value }))
    .filter(item => item.value > 0) // Only show categories with spending

  const COLORS = ['#00BCD4', '#0E7490', '#F59E0B', '#EF4444', '#8B5CF6', '#10B981', '#6B7280']

  return (
    <div className="space-y-6">
      {/* Weekly Income vs Expense */}
      <div className="card">
        <h3 className="text-xl font-bold mb-4">Weekly Overview</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                formatter={(value) => `₹${value.toLocaleString()}`}
              />
              <Legend />
              <Bar dataKey="income" fill="#10B981" name="Income" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" fill="#EF4444" name="Expense" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Expense Breakdown */}
      <div className="card">
        <h3 className="text-xl font-bold mb-4">Expense Breakdown</h3>
        {pieData.length > 0 ? (
          <>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 grid grid-cols-2 gap-2">
              {pieData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm">{item.name}: ₹{item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-10 text-gray-400">
            <p>No expenses recorded yet</p>
          </div>
        )}
      </div>
    </div>
  )
}