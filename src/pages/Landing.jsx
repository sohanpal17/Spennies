import { useNavigate } from 'react-router-dom'
import { Wallet, TrendingUp, Brain, BarChart3, Shield, Zap,Megaphone } from 'lucide-react'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-white to-secondary/10">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="bg-primary/10 p-4 rounded-full">
              <Wallet className="w-16 h-16 text-primary" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Spennies
          </h1>
          
          <p className="text-2xl md:text-3xl text-gray-600 mb-4 font-medium">
            Money made mindful
          </p>
          
          <p className="text-lg md:text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Your AI-powered financial companion. Track daily income, 
            manage expenses, and save smarter with personalized insights.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/register')}
              className="btn-primary text-lg px-8 py-4"
            >
              Get Started 
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="btn-secondary text-lg px-8 py-4"
            >
              Login
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Why Choose Spennies?
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <FeatureCard 
            icon={<Brain className="w-12 h-12 text-primary" />}
            title="AI Financial Coach"
            description="Learns your spending habits and gives personalized advice to help you save more."
          />
          <FeatureCard 
            icon={<BarChart3 className="w-12 h-12 text-primary" />}
            title="Smart Analytics"
            description="Visualize your income and expenses with beautiful charts and real-time insights."
          />
          <FeatureCard 
            icon={<Zap className="w-12 h-12 text-primary" />}
            title="SMS Tracking"
            description="Categorize bank SMS transactions and track spending effortlessly."
          />
          <FeatureCard 
            icon={<TrendingUp className="w-12 h-12 text-primary" />}
            title="Savings Forecast"
            description="Get AI-powered predictions of your monthly savings based on spending patterns."
          />
          <FeatureCard 
            icon={<Shield className="w-12 h-12 text-primary" />}
            title="Extra Fund"
            description="Hit your savings goal, and the extra stacks up automatically."
          />
          <FeatureCard 
            icon={<Megaphone className="w-12 h-12 text-primary" />}
            title="Multi-Tone"
            description="Use Spennies in your preferred tone for a personalized experience."
          />
        </div>
      </section>

      {/* Preview Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="card max-w-4xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-4">Built for Everyone</h3>
          <p className="text-gray-600 mb-8">
            Whether you're a freelancer, driver, vendor, or student, Spennies adapts to your lifestyle
          </p>
          <div className="bg-accent rounded-xl p-8">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-primary">₹12,450</p>
                <p className="text-sm text-gray-600">This Month's Income</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-red-500">₹8,230</p>
                <p className="text-sm text-gray-600">Expenses</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-green-500">₹4,220</p>
                <p className="text-sm text-gray-600">Saved</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center gap-8 mb-6">
            <a href="#" className="hover:text-primary">About</a>
            <a href="#" className="hover:text-primary">Contact</a>
            <a href="#" className="hover:text-primary">Privacy Policy</a>
          </div>
          <p className="text-gray-400">© 2025 Spennies - Money made mindful</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="card hover:shadow-2xl transition-shadow duration-300">
      <div className="flex justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3 text-center">{title}</h3>
      <p className="text-gray-600 text-center">{description}</p>
    </div>
  )
}