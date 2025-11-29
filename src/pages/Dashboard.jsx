import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Wallet, Plus, Settings, LogOut, TrendingUp, TrendingDown, 
  DollarSign, Shield, MessageCircle, Menu, X, Heart, Calendar, FileText, Trash2
} from 'lucide-react'
import SummaryCard from '../components/SummaryCard'
import TransactionList from '../components/TransactionList'
import AddTransactionModal from '../components/AddTransactionModal'
import UpdateEstimatesModal from '../components/UpdateEstimatesModal'
import ChartsSection from '../components/ChartsSection'
import AIInsightsPanel from '../components/AIInsightsPanel'
import SMSTracker from '../components/SMSTracker'
import ChatBot from '../components/ChatBot'
import LoanReminderModal from '../components/LoanReminderModal'
import LoanList from '../components/LoanList'


import MicroChallengeCard from '../components/MicroChallengeCard'
import SafeDailyBudget from '../components/SafeDailyBudget'
import WeeklyReportModal from '../components/WeeklyReportModal'
import { 
  getUser, 
  logout, 
  getTransactions, 
  getSMSTransactions,
  generateWeeklyStory,
  getUpcomingLoanReminders,
  clearAllData
} from '../utils/storage'

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [allTransactions, setAllTransactions] = useState([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [showChatBot, setShowChatBot] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showLoanModal, setShowLoanModal] = useState(false)

  const [showReportModal, setShowReportModal] = useState(false)

  const [modalType, setModalType] = useState('income')
  const [refreshKey, setRefreshKey] = useState(0)

  // 1. Check User Auth (fetch authoritative user)
  useEffect(() => {
    const checkUser = async () => {
      setIsAuthLoading(true)
      try {
        const userData = await getUser()
        if (!userData) {
          navigate('/login')
          return
        }
        setUser(userData)
      } catch (e) {
        console.error('Auth check failed', e)
        navigate('/login')
      } finally {
        setIsAuthLoading(false)
      }
    }
    checkUser()
  }, [navigate, refreshKey])

  // 2. Setup Refresh Listener
  useEffect(() => {
    const handleRefresh = () => setRefreshKey(prev => prev + 1)
    window.addEventListener('refresh_dashboard', handleRefresh)
    return () => window.removeEventListener('refresh_dashboard', handleRefresh)
  }, [])

  // 3. Fetch Transactions
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        setIsLoadingData(true)
        const [apiTx, smsTx] = await Promise.all([
          getTransactions().catch(() => []),
          Promise.resolve(getSMSTransactions() || [])
        ])

        const merged = [
          ...(Array.isArray(apiTx) ? apiTx : []),
          ...(Array.isArray(smsTx) ? smsTx : [])
        ].filter(t => !(t && t.is_deleted))

        setAllTransactions(merged)
      } catch (error) {
        console.error('Dashboard load error:', error)
        setAllTransactions([])
      } finally {
        setIsLoadingData(false)
      }
    }

    fetchData()
  }, [user, refreshKey])

  // 4. Weekly Story Logic
  useEffect(() => {
    const today = new Date().getDay()
    const storyDate = new Date().toISOString().split('T')[0]
    const hasSeenStory = localStorage.getItem('weekly_story_seen_' + storyDate)

    if (today === 0 && !hasSeenStory) {
      // const story = generateWeeklyStory() // Not used directly here
      // Logic kept intact as requested
      localStorage.setItem('weekly_story_seen_' + storyDate, 'true')
    }
  }, [])

  // 5. Loan Reminder Check
  useEffect(() => {
    const upcomingLoans = getUpcomingLoanReminders()
    if (upcomingLoans.length > 0) {
      console.log(`⚠️ You have ${upcomingLoans.length} loan(s) due soon!`)
    }
  }, [refreshKey])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleAddTransaction = () => {
    setRefreshKey(prev => prev + 1)
    setShowAddModal(false)
  }

  const handleUpdateEstimates = () => {
    setRefreshKey(prev => prev + 1)
    setShowUpdateModal(false)
  }

  const handleResetAccount = () => {
    clearAllData(); // Calls the backend delete function
  }

  // --- CALCULATIONS ---
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  const monthlyTransactions = allTransactions.filter(t => {
    if (!t || !t.date) return false
    const tDate = new Date(t.date)
    return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear
  })

  const todayTransactions = allTransactions.filter(t => {
    if (!t || !t.date) return false
    const tDate = new Date(t.date)
    const today = new Date()
    return tDate.toDateString() === today.toDateString()
  })

  const toNumber = (v) => {
    if (v == null) return 0
    const n = Number(v)
    return Number.isFinite(n) ? n : 0
  }

  const todayIncome = todayTransactions
    .filter(t => (t.type || '').toString().toLowerCase() === 'income')
    .reduce((sum, t) => sum + toNumber(t.amount), 0)

  const todayExpense = todayTransactions
    .filter(t => (t.type || '').toString().toLowerCase() === 'expense')
    .reduce((sum, t) => sum + toNumber(t.amount), 0)

  const monthlyIncome = monthlyTransactions
    .filter(t => (t.type || '').toString().toLowerCase() === 'income')
    .reduce((sum, t) => sum + toNumber(t.amount), 0)

  const monthlyExpense = monthlyTransactions
    .filter(t => (t.type || '').toString().toLowerCase() === 'expense')
    .reduce((sum, t) => sum + toNumber(t.amount), 0)

  const monthlySavings = monthlyIncome - monthlyExpense

  const rawSavings = user?.savingsTarget ?? user?.savings_target ?? 0
  const parsedSavingsTarget = Number.isFinite(Number(rawSavings)) ? parseFloat(rawSavings) : 0
  const savingsTarget = parsedSavingsTarget > 0 ? parsedSavingsTarget : 5000

  const savingsProgress = savingsTarget > 0 ? Math.min((monthlySavings / savingsTarget) * 100, 100) : 0
  const emergencyFund = monthlySavings > savingsTarget ? monthlySavings - savingsTarget : 0

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) return null

  const visibleMonthlyTx = monthlyTransactions.filter(t => !(t && t.is_deleted))
  const visibleAllTx = allTransactions.filter(t => !(t && t.is_deleted))

  return (
    <div className="min-h-screen bg-accent pb-20 md:pb-8">
      {/* Top Navigation */}
      <nav className="bg-white shadow-md sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary p-2 rounded-lg">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div className="hidden md:block">
                <h1 className="text-xl font-bold text-primary">Spennies</h1>
                <p className="text-xs text-gray-600">Money made mindful</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <div className="text-right mr-2">
                <p className="text-sm text-gray-600">Welcome back,</p>
                <p className="font-semibold">{user.name} 👋</p>
              </div>
              
              <button onClick={() => setShowUpdateModal(true)} className="p-2 hover:bg-accent rounded-lg transition-colors" title="Settings">
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
              
              <button onClick={handleResetAccount} className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-400" title="Reset Data">
                <Trash2 className="w-5 h-5" />
              </button>

              <button onClick={handleLogout} className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="Logout">
                <LogOut className="w-5 h-5 text-red-500" />
              </button>
            </div>

            <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="md:hidden p-2">
              {showMobileMenu ? <X /> : <Menu />}
            </button>
          </div>

          {showMobileMenu && (
            <div className="md:hidden mt-4 pt-4 border-t">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                  {user.name?.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
              </div>
              <button onClick={() => { setShowUpdateModal(true); setShowMobileMenu(false) }} className="w-full text-left px-4 py-2 hover:bg-accent rounded-lg flex items-center gap-2">
                <Settings className="w-5 h-5" /> Settings
              </button>
              <button onClick={handleResetAccount} className="w-full text-left px-4 py-2 hover:bg-red-50 rounded-lg flex items-center gap-2 text-red-500">
                <Trash2 className="w-5 h-5" /> Reset Data
              </button>
              <button onClick={handleLogout} className="w-full text-left px-4 py-2 hover:bg-red-50 rounded-lg flex items-center gap-2 text-red-500">
                <LogOut className="w-5 h-5" /> Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {isLoadingData ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-500">Loading your finances...</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - 2/3 width */}
            <div className="lg:col-span-2 space-y-8">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard title="Today's Income" value={`₹${todayIncome.toLocaleString()}`} icon={<TrendingUp className="w-6 h-6" />} color="green" />
                <SummaryCard title="Today's Expenses" value={`₹${todayExpense.toLocaleString()}`} icon={<TrendingDown className="w-6 h-6" />} color="red" />
                <SummaryCard title="Savings Progress" value={`${Math.round(savingsProgress)}%`} subtitle={monthlySavings >= savingsTarget ? `₹${savingsTarget.toLocaleString()} / ₹${savingsTarget.toLocaleString()}` : `₹${monthlySavings.toLocaleString()} / ₹${savingsTarget.toLocaleString()}`} icon={<DollarSign className="w-6 h-6" />} color="primary" />
                <SummaryCard title="Extra Funds" value={`₹${emergencyFund.toLocaleString()}`} icon={<Shield className="w-6 h-6" />} color="purple" />
              </div>

              <div className="flex flex-wrap gap-4">
                <button onClick={() => { setModalType('income'); setShowAddModal(true) }} className="btn-primary flex items-center gap-2"><Plus className="w-5 h-5" /> Add Income</button>
                <button onClick={() => { setModalType('expense'); setShowAddModal(true) }} className="btn-secondary flex items-center gap-2"><Plus className="w-5 h-5" /> Add Expense</button>
                <button onClick={() => setShowLoanModal(true)} className="btn-secondary flex items-center gap-2"><Plus className="w-5 h-5" /> Add Loan Reminder</button>
                <button onClick={() => setShowReportModal(true)} className="btn-secondary flex items-center gap-2 bg-white"><FileText className="w-5 h-5" /> Report</button>
              </div>

              <ChartsSection transactions={visibleMonthlyTx} />
              <SMSTracker />
              <TransactionList transactions={visibleAllTx} />
              <LoanList key={refreshKey} />
            </div>

            {/* Right Column - 1/3 width */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
                {/* Safe Daily Budget */}
                <SafeDailyBudget />
                
                {/* AI Insights Panel */}
                <AIInsightsPanel 
                  user={user}
                  monthlySavings={monthlySavings}
                  savingsTarget={savingsTarget}
                  transactions={visibleMonthlyTx}
                />
                
                <MicroChallengeCard />

                {/* Rewards Card */}
                <div className="card bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Heart className="w-5 h-5 text-pink-500" />
                    <h3 className="font-bold text-pink-900">Rewards</h3>
                  </div>
                  <div className="flex flex-col items-center justify-center py-4">
                    <span className="text-gray-500 text-sm font-medium">No rewards yet</span>
                    <p className="text-xs text-gray-400 mt-1 text-center">
                      Save consistently to unlock rewards!
                    </p>
                  </div>
                </div>

                {/* Upcoming Events Card */}
                <div className="card bg-gray-50 border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-5 h-5 text-gray-600" />
                    <h3 className="font-bold text-gray-800">Upcoming Events</h3>
                  </div>
                  <div className="flex flex-col items-center justify-center py-4">
                    <span className="text-gray-400 text-sm font-medium">No events yet</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddModal && <AddTransactionModal type={modalType} onClose={() => setShowAddModal(false)} onSave={handleAddTransaction} />}
      {showUpdateModal && <UpdateEstimatesModal user={user} onClose={() => setShowUpdateModal(false)} onSave={handleUpdateEstimates} />}
      {showLoanModal && <LoanReminderModal onClose={() => setShowLoanModal(false)} onSave={() => { setRefreshKey(prev => prev + 1); setShowLoanModal(false) }} />}
     
      {showReportModal && (
        <WeeklyReportModal 
          user={user} 
          transactions={visibleAllTx} 
          onClose={() => setShowReportModal(false)} 
        />
      )}

      <button onClick={() => setShowChatBot(!showChatBot)} className="fixed bottom-24 md:bottom-6 right-6 bg-primary text-white p-4 rounded-full shadow-2xl hover:bg-secondary transition-all z-50">
        <MessageCircle className="w-6 h-6" />
      </button>

      {showChatBot && <ChatBot onClose={() => setShowChatBot(false)} />}

      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t z-40">
        <div className="grid grid-cols-4 gap-1">
          <button className="flex flex-col items-center py-3 text-primary"><Wallet className="w-5 h-5" /><span className="text-xs mt-1">Dashboard</span></button>
          <button onClick={() => setShowAddModal(true)} className="flex flex-col items-center py-3 text-gray-600"><Plus className="w-5 h-5" /><span className="text-xs mt-1">Add</span></button>
          <button onClick={() => setShowChatBot(true)} className="flex flex-col items-center py-3 text-gray-600"><MessageCircle className="w-5 h-5" /><span className="text-xs mt-1">AI Chat</span></button>
          <button onClick={() => setShowUpdateModal(true)} className="flex flex-col items-center py-3 text-gray-600"><Settings className="w-5 h-5" /><span className="text-xs mt-1">Settings</span></button>
        </div>
      </div>
    </div>
  )
}