import { useState, useRef, useEffect } from 'react'
import { X, Send, Bot, User, Mic, Loader2, Trash2 } from 'lucide-react'
import { chatWithAI } from '../utils/storage'
import useVoiceInput from '../hooks/useVoiceInput'

export default function ChatBot({ onClose }) {
  // 1. Load messages from Local Storage (Persistence)
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('spennies_chat_history')
    return saved ? JSON.parse(saved) : [
      {
        id: 1,
        sender: 'bot',
        text: "Hi! I'm Spennies AI. Ask me about your finances or say 'Add 50 rupees chai'!"
      }
    ]
  })

  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  // Voice Input Hook
  const { isListening, transcript, startListening, setTranscript } = useVoiceInput()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  // 2. Save messages to Local Storage whenever they change
  useEffect(() => {
    localStorage.setItem('spennies_chat_history', JSON.stringify(messages))
  }, [messages])

  // When voice transcript updates, set it to input
  useEffect(() => {
    if (transcript) {
      setInput(transcript)
      setTranscript('') 
    }
  }, [transcript, setTranscript])

  const handleSend = async (e) => {
    if (e) e.preventDefault()
    if (!input.trim()) return

    const userText = input.trim()
    setInput('')
    
    // Add user message
    const userMessage = { id: Date.now(), sender: 'user', text: userText }
    setMessages(prev => [...prev, userMessage])
    setIsTyping(true)

    try {
      // Call Real Backend AI
      const data = await chatWithAI(userText)
      
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: data.response || "I processed that, but didn't get a text response."
      }])

      // Refresh Dashboard if Data Changed
      if (data.action === 'transaction_added' || data.action === 'transaction_deleted' || data.action === 'loan_updated' || data.action === 'budget_updated' || data.action === 'profile_updated') {
        window.dispatchEvent(new Event('refresh_dashboard'))
        
        // If profile changed, hard reload to update name context
        if (data.action === 'profile_updated') {
            setTimeout(() => window.location.reload(), 1000)
        }
      }

    } catch (error) {
      console.error("Chat Error:", error)
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: "⚠️ Connection error. Please try again."
      }])
    } finally {
      setIsTyping(false)
    }
  }

  // Clear Chat History
  const handleClearChat = () => {
    if (window.confirm("Clear chat history?")) {
      const initialMsg = [{
        id: Date.now(),
        sender: 'bot',
        text: "Chat cleared. How can I help you now?"
      }]
      setMessages(initialMsg)
      localStorage.setItem('spennies_chat_history', JSON.stringify(initialMsg))
    }
  }

  // Helper to send predefined prompts
  const sendPrompt = (text) => {
    setInput(text)
  }

  return (
    <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[600px] max-h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-100 animate-fade-in-up">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white p-4 rounded-t-2xl flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight">AI Assistant</h3>
            <p className="text-xs opacity-90">Voice Enabled 🎙️</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={handleClearChat} 
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Clear History"
          >
            <Trash2 className="w-5 h-5 text-white/80 hover:text-white" />
          </button>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}
        
        {isTyping && (
          <div className="flex items-start gap-2 animate-pulse">
            <div className="bg-primary/10 p-2 rounded-full">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100 rounded-b-2xl">
        
        {/* Quick Actions */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide">
          <QuickAction text="Add ₹50 chai" onClick={() => sendPrompt("Add ₹50 chai")} />
          <QuickAction text="Change name" onClick={() => sendPrompt("Change my name to...")} />
          <QuickAction text="Safe budget?" onClick={() => sendPrompt("What is my safe daily budget?")} />
        </div>

        <div className="flex gap-2 items-center bg-gray-50 p-2 rounded-xl border border-gray-200 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all">
          
          {/* Voice Input Button */}
          <button
            type="button"
            onClick={startListening}
            className={`p-2 rounded-full transition-all duration-300 ${
              isListening 
                ? 'bg-red-500 text-white animate-pulse' 
                : 'text-gray-500 hover:text-primary hover:bg-gray-200'
            }`}
            title="Speak"
          >
            {isListening ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? "Listening..." : "Type or speak..."}
            className="flex-1 bg-transparent border-none focus:ring-0 px-2 text-sm font-medium text-gray-700 placeholder:text-gray-400 outline-none"
          />
          
          <button
            type="submit"
            className="bg-primary text-white p-2 rounded-lg hover:bg-secondary transition-transform active:scale-95 disabled:opacity-50 disabled:scale-100"
            disabled={!input.trim() || isTyping}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        
        <p className="text-[10px] text-center text-gray-400 mt-2">
          {isListening ? "Speak now..." : "AI can make mistakes. Check your transactions."}
        </p>
      </form>
    </div>
  )
}

function Message({ message }) {
  const isBot = message.sender === 'bot'
  
  return (
    <div className={`flex items-start gap-2 ${isBot ? '' : 'flex-row-reverse'}`}>
      <div className={`p-2 rounded-full flex-shrink-0 ${
        isBot ? 'bg-primary/10 text-primary' : 'bg-green-100 text-green-600'
      }`}>
        {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
      </div>
      
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
        isBot 
          ? 'bg-white border border-gray-100 text-gray-700 rounded-tl-none' 
          : 'bg-primary text-white rounded-tr-none'
      }`}>
        {message.text}
      </div>
    </div>
  )
}

function QuickAction({ text, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="whitespace-nowrap text-xs bg-gray-100 hover:bg-primary/10 hover:text-primary text-gray-600 px-3 py-1.5 rounded-full transition-all border border-gray-200 hover:border-primary/30"
    >
      {text}
    </button>
  )
}