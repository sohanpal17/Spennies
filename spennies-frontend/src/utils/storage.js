import api from '../services/api';
import { auth } from '../config/firebase';

// Local keys for fallback/cache
const KEYS = {
  USER: 'spennies_user',
  TRANSACTIONS: 'spennies_transactions',
  SMS_TRANSACTIONS: 'spennies_sms_transactions',
  LOANS: 'spennies_loans',
  CHALLENGES: 'spennies_challenges'
};

// ============ USER MANAGEMENT ============

export async function getUser(skipWait = false) {
  // Wait for Firebase Auth unless skipped
  if (!skipWait) {
    await new Promise(resolve => {
      const unsubscribe = auth.onAuthStateChanged(u => {
        unsubscribe();
        resolve(u);
      });
    });
  }

  if (auth.currentUser) {
    try {
      const response = await api.get('/api/auth/me');
      const userData = response.data;

      // Fetch Estimates
      const estRes = await api.get('/api/estimates/');
      const estimatesList = estRes.data || [];

      const expenses = { food: 0, transport: 0, bills: 0, other: 0 };
      estimatesList.forEach(est => {
        if (est.category && est.estimated_amount) {
          expenses[est.category.toLowerCase()] = parseFloat(est.estimated_amount);
        }
      });

      return {
        ...userData,
        savingsTarget: parseFloat(userData.savings_target || 0),
        avgIncome: parseFloat(userData.avg_income || 0),
        expenses: expenses
      };

    } catch (error) {
      console.warn('Backend user fetch failed', error);
    }
  }
  
  const data = localStorage.getItem(KEYS.USER);
  return data ? JSON.parse(data) : null;
}

export function loginUser(email, password) {
  return true; // Handled by Auth.jsx directly via Firebase
}

export function logout() {
  localStorage.removeItem(KEYS.USER);
  auth.signOut().catch(e => console.error(e));
}

export function isAuthenticated() {
  return !!localStorage.getItem(KEYS.USER) || !!auth.currentUser;
}

export async function updateUserEstimates(estimates) {
  try {
    if (auth.currentUser) {
      // 1. Update Savings Target (User Profile)
      await api.put('/api/users/me', {
        savings_target: parseFloat(estimates.savingsTarget)
      });

      // 2. Update Category Estimates
      const month = new Date().getMonth();
      const year = new Date().getFullYear();

      const categories = ['Food', 'Transport', 'Bills', 'Other'];
      
      const promises = categories.map(cat => {
        const amount = parseFloat(estimates[cat.toLowerCase()] || 0);
        return api.post('/api/estimates/', {
          category: cat,
          estimated_amount: amount,
          month,
          year
        });
      });

      await Promise.all(promises);
      console.log("Estimates updated on backend");
    }
  } catch (e) {
    console.warn('Backend update failed', e);
  }

  // Update local storage (fallback)
  const userData = JSON.parse(localStorage.getItem(KEYS.USER) || '{}');
  userData.expenses = {
    food: estimates.food,
    transport: estimates.transport,
    bills: estimates.bills,
    other: estimates.other
  };
  userData.savingsTarget = estimates.savingsTarget;
  localStorage.setItem(KEYS.USER, JSON.stringify(userData));
}

// ============ TRANSACTIONS ============

export async function getTransactions() {
  if (auth.currentUser) {
    try {
      const response = await api.get('/api/transactions/');
      return Array.isArray(response.data) ? response.data : [];
    } catch (e) {
      return []; 
    }
  }
  const data = localStorage.getItem(KEYS.TRANSACTIONS);
  return data ? JSON.parse(data) : [];
}

export async function addTransaction(transaction) {
  if (auth.currentUser) {
    try {
      await api.post('/api/transactions/', transaction);
    } catch (e) { console.warn('API sync failed'); }
  }
  const transactions = JSON.parse(localStorage.getItem(KEYS.TRANSACTIONS) || '[]');
  transactions.push(transaction);
  localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));
}

export async function deleteTransaction(id) {
  if (auth.currentUser) {
    try {
      await api.delete(`/api/transactions/${id}`);
    } catch (e) { console.warn('API delete failed', e); }
  }
  const transactions = JSON.parse(localStorage.getItem(KEYS.TRANSACTIONS) || '[]');
  const filtered = transactions.filter(t => t.id !== id);
  localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(filtered));
}

// ============ SMS TRANSACTIONS ============

export function getSMSTransactions() {
  // API handles SMS storage, so we return empty here to avoid duplicates
  // unless we are in offline/mock mode
  if (auth.currentUser) return [];
  
  const data = localStorage.getItem(KEYS.SMS_TRANSACTIONS);
  return data ? JSON.parse(data) : [];
}

export async function parseSMSTransaction(smsText) {
  if (auth.currentUser) {
    const response = await api.post('/api/ai/parse-sms', { sms_text: smsText });
    // Backend saves it, we just return data for UI feedback
    return response.data;
  }
  return null;
}

// ============ LOANS ============

export async function getLoans() {
  if (auth.currentUser) {
    try {
      const response = await api.get(`/api/loans/?_t=${Date.now()}`);
      return response.data;
    } catch (e) { return []; }
  }
  const data = localStorage.getItem(KEYS.LOANS);
  return data ? JSON.parse(data) : [];
}

export async function addLoan(loan) {
  if (auth.currentUser) {
    try {
      await api.post('/api/loans/', loan);
    } catch (e) { console.warn("Add loan failed"); }
  }
  const localLoans = JSON.parse(localStorage.getItem(KEYS.LOANS) || '[]');
  localLoans.push(loan);
  localStorage.setItem(KEYS.LOANS, JSON.stringify(localLoans));
}

export async function markLoanAsPaid(loanId) {
  if (auth.currentUser) {
    try {
      await api.put(`/api/loans/${loanId}/paid`);
    } catch (e) { console.warn("Update loan failed"); }
  }
  const loans = JSON.parse(localStorage.getItem(KEYS.LOANS) || '[]');
  const updated = loans.map(l => l.id === loanId ? { ...l, isPaid: true } : l);
  localStorage.setItem(KEYS.LOANS, JSON.stringify(updated));
}

export async function deleteLoan(loanId) {
  if (auth.currentUser) {
    try {
      await api.delete(`/api/loans/${loanId}`);
    } catch (e) { console.warn("Delete loan failed"); }
  }
  const loans = JSON.parse(localStorage.getItem(KEYS.LOANS) || '[]');
  const filtered = loans.filter(l => l.id !== loanId);
  localStorage.setItem(KEYS.LOANS, JSON.stringify(filtered));
}

export function getUpcomingLoanReminders() {
  const loans = JSON.parse(localStorage.getItem(KEYS.LOANS) || '[]');
  return loans.filter(l => !l.isPaid);
}

// ============ AI CHAT & INSIGHTS ============

export async function chatWithAI(message, language = 'en') {
  if (auth.currentUser) {
    try {
      const response = await api.post('/api/ai/chat', { 
        message: message || "", 
        language: language || "en"
      });
      return response.data;
    } catch (error) {
      return { response: "⚠️ Error connecting to AI." };
    }
  }
  return { response: "Please login to use AI." };
}

export async function getAIInsights() {
  if (auth.currentUser) {
    try {
      const response = await api.get('/api/ai/insights');
      if (response.data && response.data.insights) {
        return response.data; 
      }
      return { insights: response.data || [], tip: "Track every expense to find savings!" };
    } catch (error) {
      console.error('Insights failed', error);
    }
  }
  return { insights: [], tip: "Log in to see insights." };
}

// ============ WEEKLY STORY & CHALLENGES ============

export function generateWeeklyStory() {
  return {
    title: "Your Financial Week",
    period: "This Week",
    highlights: [
      { emoji: "💰", title: "Income", description: "You earned ₹12,000" },
      { emoji: "📉", title: "Spending", description: "You spent ₹8,000" }
    ],
    win: "You saved ₹4,000!",
    challenge: "Try to save ₹500 more next week."
  };
}

// Random active challenge
export function getCurrentChallenge() {
  const pool = [
    { id: 'ch_01', title: "Skip one chai", description: "Save ₹20 by skipping one tea break today", reward: 20, status: 'active' },
    { id: 'ch_02', title: "No Delivery Lunch", description: "Cook at home for one day to save approx ₹100", reward: 100, status: 'active' },
    { id: 'ch_03', title: "Transport Saver", description: "Use shared rides or public transport for one day and save ~₹50", reward: 50, status: 'active' },
    { id: 'ch_04', title: "Small Sell", description: "Sell one unused item and add the money to emergency fund (estimate ₹200)", reward: 200, status: 'active' },
    { id: 'ch_05', title: "Light Snack", description: "Replace evening snack with fruit for 3 days to save ₹30/day", reward: 90, status: 'active' },
    { id: 'ch_06', title: "Pause Subscriptions", description: "Review and pause one small recurring subscription this month", reward: 150, status: 'active' },
    { id: 'ch_07', title: "Round-Up Save", description: "Round up each payment this week to nearest ₹10 and save the difference", reward: 50, status: 'active' },
    { id: 'ch_08', title: "Bring Water", description: "Bring water from home for 5 days instead of buying; save approx ₹25/day", reward: 125, status: 'active' },
    { id: 'ch_09', title: "Plan a Meal", description: "Plan two meals for the week and avoid impulse buys", reward: 60, status: 'active' },
    { id: 'ch_10', title: "Emergency Jar", description: "Put aside ₹10 every day for 7 days into an emergency jar", reward: 70, status: 'active' }
  ];

  const lastId = localStorage.getItem('last_challenge_id');
  const candidates = pool.filter(c => c.id !== lastId);
  const choices = candidates.length ? candidates : pool;
  const choice = choices[Math.floor(Math.random() * choices.length)];

  localStorage.setItem('last_challenge_id', choice.id);
  return choice;
}

export function completeChallenge(id) { 
  console.log('Challenge completed:', id);
  localStorage.setItem('challenge_completed_' + id, 'true');
}

export function skipChallenge(id) { 
  console.log('Challenge skipped:', id); 
}

export function loadMockData() {
  const mockUser = {
    name: 'Demo User',
    email: 'demo@example.com',
    savingsTarget: 5000,
    expenses: { food: 3000, transport: 2000, bills: 1000, other: 500 }
  };
  localStorage.setItem(KEYS.USER, JSON.stringify(mockUser));
  window.location.reload();
}

export function clearAllData() {
  localStorage.clear();
  window.location.reload();
}