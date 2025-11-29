import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
// ✅ CORRECT IMPORT: Using the real auth service
import { registerUser, loginUser } from '../services/auth' 
import { Wallet, AlertCircle } from 'lucide-react'

export default function Auth({ mode = 'register' }) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(mode)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('') 

  // Registration Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    jobType: '', // Default empty to show placeholder
    jobTypeCustom: '',
    language: 'en',
    aiTone: 'friendly',
    avgIncome: '',
    expenses: {
      food: '',
      transport: '',
      bills: '',
      other: ''
    },
    savingsTarget: ''
  })

  // Login Form State
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    if (name.includes('.')) {
      const [parent, child] = name.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleExpenseChange = (fieldName, rawValue) => {
    handleInputChange({ 
      target: { 
        name: `expenses.${fieldName}`, 
        value: rawValue 
      } 
    })
  }

  // ✅ REAL BACKEND REGISTRATION
  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const avgIncomeNum = Number(formData.avgIncome || 0)

    // Step 2 Validation
    if (step === 2) {
      if (!Number.isFinite(avgIncomeNum) || avgIncomeNum <= 0) {
        setError('Please enter a valid positive Average Monthly Income before proceeding.')
        return
      }
      // Validate expenses...
      const expenses = formData.expenses || {}
      for (const [k, v] of Object.entries(expenses)) {
        const num = v === '' ? 0 : Number(v)
        if (num < 0) {
          setError(`${k} cannot be negative.`)
          return
        }
      }
    }

    if (step < 3) {
      setStep(step + 1)
      return
    }

    // Step 3 Validation
    const savingsNum = Number(formData.savingsTarget || 0)
    if (savingsNum >= avgIncomeNum) {
      setError(`Savings target cannot exceed monthly income (₹${avgIncomeNum.toLocaleString()}).`)
      return
    }

    setLoading(true)
    try {
      // Handle custom job type
      const payload = { ...formData }
      if (payload.jobType === 'custom') {
        payload.jobType = (payload.jobTypeCustom || '').trim() || 'other'
      }
      delete payload.jobTypeCustom

      console.log('Submitting to backend:', payload)
      await registerUser(payload)
      navigate('/dashboard')
    } catch (err) {
      console.error(err)
      setError('Registration failed. Please check your inputs.')
      setLoading(false)
    }
  }

  // ✅ REAL BACKEND LOGIN
  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const success = await loginUser(loginData.email, loginData.password)
      if (success) navigate('/dashboard')
      else setError('Invalid credentials.')
    } catch (err) {
      setError('Login failed. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-primary p-3 rounded-full">
              <Wallet className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-primary">Spennies</h1>
          <p className="text-gray-600">Money made mindful</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex mb-6 bg-white rounded-2xl p-2 shadow-lg">
          <button
            onClick={() => { setActiveTab('login'); setError(''); }}
            className={`flex-1 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'login' 
                ? 'bg-primary text-white' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => { setActiveTab('register'); setError(''); }}
            className={`flex-1 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'register' 
                ? 'bg-primary text-white' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Register
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Forms */}
        <div className="card">
          {activeTab === 'login' ? (
            <LoginForm 
              data={loginData}
              setData={setLoginData}
              onSubmit={handleLoginSubmit}
              loading={loading}
            />
          ) : (
            <RegisterForm 
              step={step}
              data={formData}
              onChange={handleInputChange}
              onExpenseChange={handleExpenseChange}
              onSubmit={handleRegisterSubmit}
              onBack={() => setStep(step - 1)}
              loading={loading}
            />
          )}
        </div>

        {/* Footer Links */}
        <div className="text-center mt-6 text-sm text-gray-600">
          {activeTab === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button 
                onClick={() => setActiveTab('register')}
                className="text-primary font-medium hover:underline"
              >
                Create one
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button 
                onClick={() => setActiveTab('login')}
                className="text-primary font-medium hover:underline"
              >
                Login
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---------- Helper subcomponents ---------- */

function LoginForm({ data, setData, onSubmit, loading }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Email or Phone</label>
        <input
          type="text"
          name="email"
          value={data.email}
          onChange={(e) => setData({ ...data, email: e.target.value })}
          className="input-field"
          placeholder="Enter your email or phone"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Password</label>
        <input
          type="password"
          name="password"
          value={data.password}
          onChange={(e) => setData({ ...data, password: e.target.value })}
          className="input-field"
          placeholder="Enter your password"
          required
        />
      </div>

      <button 
        type="button" 
        className="text-sm text-primary hover:underline"
      >
        Forgot Password?
      </button>

      <button 
        type="submit" 
        className="btn-primary w-full flex justify-center items-center"
        disabled={loading}
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : 'Login'}
      </button>
    </form>
  )
}

function RegisterForm({ step, data, onChange, onExpenseChange, onSubmit, onBack, loading }) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-lg text-gray-600">Setting up your financial coach...</p>
      </div>
    )
  }

  // safe accessor
  const getExpense = (k) => (data.expenses && data.expenses[k] !== undefined) ? data.expenses[k] : ''

  // total expenses calc (for display)
  const totalExpenses = ['food','transport','bills','other'].reduce((s,k) => s + Number(getExpense(k) || 0), 0)

  return (
    <form onSubmit={onSubmit}>
      {/* Step Indicator */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                s === step 
                  ? 'bg-primary text-white' 
                  : s < step 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {s}
              </div>
              {s < 3 && <div className="w-12 h-1 bg-gray-200 mx-2" />}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold mb-4">Basic Information</h3>
           
          <div>
            <label className="block text-sm font-medium mb-2">Full Name</label>
            <input
              type="text"
              name="name"
              value={data.name}
              onChange={onChange}
              className="input-field"
              placeholder="Enter your full name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={data.email}
              onChange={onChange}
              className="input-field"
              placeholder="your.email@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              name="password"
              value={data.password}
              onChange={onChange}
              className="input-field"
              placeholder="Create a strong password"
              required
            />
          </div>

          {/* Job Type / Custom inline */}
          <div>
            <label className="block text-sm font-medium mb-2">Job Type</label>

            {data.jobType !== 'custom' ? (
              <select
                name="jobType"
                value={['freelancer','driver','vendor','student','housewife'].includes(data.jobType) ? data.jobType : ''}
                onChange={(e) => {
                  const v = e.target.value
                  if (v === 'other') {
                    onChange({ target: { name: 'jobType', value: 'custom' } })
                  } else {
                    onChange(e)
                  }
                }}
                className="input-field"
                required
              >
                <option value="" disabled>Select your job type</option>
                <option value="freelancer">Freelancer</option>
                <option value="driver">Driver (Uber/Ola/Delivery)</option>
                <option value="vendor">Vendor/Shopkeeper</option>
                <option value="student">Student</option>
                <option value="housewife">Housewife</option>
                <option value="other">Other</option>
              </select>
            ) : (
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  name="jobTypeCustom"
                  value={data.jobTypeCustom || ''}
                  onChange={onChange}
                  className="input-field flex-1"
                  placeholder="Describe your job (e.g., Cook, Gardener...)"
                  required
                />
                <button
                  type="button"
                  className="text-sm text-gray-500 hover:underline"
                  onClick={() => {
                    onChange({ target: { name: 'jobType', value: '' } })
                  }}
                >
                  Use preset
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Preferred Language</label>
            <select
              name="language"
              value={data.language}
              onChange={onChange}
              className="input-field"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी (Hindi)</option>
              <option value="mr">मराठी (Marathi)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">AI Coach Tone</label>
            <select
              name="aiTone"
              value={data.aiTone}
              onChange={onChange}
              className="input-field"
            >
              <option value="friendly">Friendly & Casual</option>
              <option value="motivational">Motivational</option>
              <option value="professional">Professional</option>
            </select>
          </div>
        </div>
      )}

      {/* Step 2: Financial Info */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold mb-4">Financial Information</h3>
           
          <div>
            <label className="block text-sm font-medium mb-2">
              Average Monthly Income (₹)
            </label>
            <input
              type="number"
              name="avgIncome"
              value={data.avgIncome}
              onChange={onChange}
              className="input-field"
              placeholder="e.g., 15000"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Food Expenses (₹/month)</label>
              <input
                type="number"
                name="expenses.food"
                value={getExpense('food')}
                onChange={(e) => onExpenseChange('food', e.target.value)}
                className="input-field"
                placeholder="e.g., 3000"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Transport (₹/month)</label>
              <input
                type="number"
                name="expenses.transport"
                value={getExpense('transport')}
                onChange={(e) => onExpenseChange('transport', e.target.value)}
                className="input-field"
                placeholder="e.g., 1500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Bills (₹/month)</label>
              <input
                type="number"
                name="expenses.bills"
                value={getExpense('bills')}
                onChange={(e) => onExpenseChange('bills', e.target.value)}
                className="input-field"
                placeholder="e.g., 2000"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Other Expenses</label>
              <input
                type="number"
                name="expenses.other"
                value={getExpense('other')}
                onChange={(e) => onExpenseChange('other', e.target.value)}
                className="input-field"
                placeholder="e.g., 1000"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Savings Goal */}
      {step === 3 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold mb-4">Set Your Savings Goal</h3>
           
          <div>
            <label className="block text-sm font-medium mb-2">
              Monthly Savings Target (₹)
            </label>
            <input
              type="number"
              name="savingsTarget"
              value={data.savingsTarget}
              onChange={onChange}
              className="input-field"
              placeholder="e.g., 5000"
              required
            />
            {/* Validation Message */}
            {Number(data.savingsTarget || 0) >= Number(data.avgIncome || 0) && (
                <p className="text-xs text-red-600 mt-1">
                    Savings target cannot exceed monthly income.
                </p>
            )}
            
            <p className="text-sm text-gray-500 mt-2">
              Based on your income, we recommend saving at least{' '}
              <span className="font-semibold text-primary">
                ₹{Math.max(0, (Number(data.avgIncome || 0)) * 0.2)}
              </span>{' '}
              per month
            </p>
          </div>

          <div className="bg-accent rounded-xl p-4">
            <h4 className="font-semibold mb-2">Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Monthly Income:</span>
                <span className="font-semibold">₹{data.avgIncome}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Expenses:</span>
                <span className="font-semibold text-red-500">₹{totalExpenses}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Savings Target:</span>
                <span className={`font-semibold ${Number(data.savingsTarget) > Number(data.avgIncome) ? 'text-red-600' : 'text-green-500'}`}>
                    ₹{data.savingsTarget}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-4 mt-8">
        {step > 1 && (
          <button
            type="button"
            onClick={onBack}
            className="btn-secondary flex-1"
          >
            Back
          </button>
        )}
        <button
          type="submit"
          className="btn-primary flex-1 flex justify-center items-center"
          disabled={loading}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (step === 3 ? 'Complete Setup' : 'Continue')}
        </button>
      </div>
    </form>
  )
}