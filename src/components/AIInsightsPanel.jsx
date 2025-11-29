import { useState, useEffect } from 'react'
import { Brain, TrendingUp, Lightbulb, AlertCircle, RefreshCw } from 'lucide-react'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts'
import { getAIInsights } from '../utils/storage'

export default function AIInsightsPanel({ user, monthlySavings, savingsTarget }) {
  const [data, setData] = useState({ insights: [], tip: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true)
        const result = await getAIInsights()
        
        if (Array.isArray(result)) {
            setData({ insights: result.slice(0, 3), tip: "Track daily to save more!" })
        } else {
            setData({ 
                insights: (result?.insights || []).slice(0, 3), 
                tip: result?.tip || "" 
            })
        }
      } catch (error) {
        console.error("Failed to load insights", error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchInsights()
    }
  }, [user]) 

  // --- FORECAST GENERATION ---
  const generateForecastData = () => {
    const now = new Date()
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const currentDay = now.getDate()
    
    const safeCurrentDay = Math.max(1, currentDay)
    const dailyRate = monthlySavings / safeCurrentDay
    
    const chartData = []
    
    for (let i = 1; i <= daysInMonth; i++) {
      let amount
      if (i <= currentDay) {
        amount = (monthlySavings / safeCurrentDay) * i
      } else {
        amount = monthlySavings + (dailyRate * (i - currentDay))
      }
      
      chartData.push({
        day: i,
        savings: Math.max(0, Math.round(amount)),
        isProjected: i > currentDay
      })
    }
    return chartData
  }

  const forecastData = generateForecastData()
  const projectEndValue = forecastData[forecastData.length - 1].savings

  return (
    <div className="space-y-6">
      {/* 1. AI Insights Card */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            <h3 className="text-xl font-bold">AI Insights</h3>
          </div>
          {loading && <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />}
        </div>
        
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-2">
              <div className="h-12 bg-gray-100 rounded-xl animate-pulse"></div>
              <div className="h-12 bg-gray-100 rounded-xl animate-pulse"></div>
            </div>
          ) : data.insights.length > 0 ? (
            data.insights.map((insight, index) => (
              <InsightCard key={index} insight={insight} />
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              Add transactions to see AI insights!
            </p>
          )}
        </div>

        <p className="text-xs text-gray-400 mt-4">
          💡 Personalized based on your spending patterns
        </p>
      </div>

      {/* 2. Savings Forecast Graph (New Area Chart) */}
      <div className="card bg-white border border-blue-100 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-800">Savings Projection</h3>
          </div>
          <span className="text-xs font-semibold bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
            Est. ₹{projectEndValue.toLocaleString()}
          </span>
        </div>
        
        <div className="h-48 w-full -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis 
                dataKey="day" 
                tickLine={false} 
                axisLine={false} 
                tick={{fontSize: 10, fill: '#9CA3AF'}} 
                interval="preserveStartEnd"
                minTickGap={15}
              />
              <YAxis 
                hide 
                domain={[0, Math.max(savingsTarget, projectEndValue) * 1.1]} 
              />
              <Tooltip 
                contentStyle={{backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px'}}
                itemStyle={{color: '#fff'}}
                labelStyle={{color: '#9CA3AF', marginBottom: '0.2rem'}}
                formatter={(value) => [`₹${value.toLocaleString()}`, 'Savings']}
                labelFormatter={(label) => `Day ${label}`}
              />
              <ReferenceLine 
                y={savingsTarget} 
                stroke="#10B981" 
                strokeDasharray="3 3" 
                label={{ position: 'insideTopRight', value: 'Goal', fill: '#10B981', fontSize: 10 }} 
              />
              <Area 
                type="monotone" 
                dataKey="savings" 
                stroke="#2563EB" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorSavings)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[10px] text-center text-gray-400 mt-1">
          Green line represents your monthly goal of ₹{savingsTarget.toLocaleString()}
        </p>
      </div>

      {/* 4. AI Tip of the Day */}
      <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-green-900">Spennies Tip of the Day</h3>
        </div>
        <p className="text-sm text-green-800 italic font-medium leading-relaxed">
          {loading ? "Generating smart tip..." : `"${data.tip || "Small savings today create big wealth tomorrow!"}"`}
        </p>
      </div>
    </div>
  )
}

function InsightCard({ insight }) {
  const icons = {
    warning: <AlertCircle className="w-5 h-5 text-orange-500" />,
    success: <TrendingUp className="w-5 h-5 text-green-500" />,
    info: <Lightbulb className="w-5 h-5 text-blue-500" />
  }

  return (
    <div className={`p-3 rounded-xl border ${
      insight.type === 'warning' ? 'bg-orange-50 border-orange-100' :
      insight.type === 'success' ? 'bg-green-50 border-green-100' :
      'bg-blue-50 border-blue-100'
    }`}>
      <div className="flex gap-3">
        <div className="mt-0.5">
          {icons[insight.type] || icons.info}
        </div>
        <p className="text-sm flex-1 text-gray-800">{insight.message}</p>
      </div>
    </div>
  )
}