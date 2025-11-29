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
  return true; 
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
      await api.put('/api/users/me', {
        savings_target: parseFloat(estimates.savingsTarget)
      });

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
    }
  } catch (e) {
    console.warn('Backend update failed', e);
  }

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
  // API handles SMS storage, so return empty unless offline
  if (auth.currentUser) return [];
  const data = localStorage.getItem(KEYS.SMS_TRANSACTIONS);
  return data ? JSON.parse(data) : [];
}

export async function parseSMSTransaction(smsText) {
  if (auth.currentUser) {
    const response = await api.post('/api/ai/parse-sms', { sms_text: smsText });
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
  // This function was synchronous but now we rely on API
  // If you need it synchronous for notifications, it might be tricky with API only
  // For now, return empty if auth exists (Dashboard handles it)
  if (auth.currentUser) return [];
  
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




export async function clearAllData() {
  if (auth.currentUser) {
    if (window.confirm("⚠️ Are you sure? This will delete ALL your transactions and data permanently.")) {
      try {
        await api.delete('/api/users/me/data');
        window.location.reload();
      } catch (e) {
        console.error("Failed to clear data", e);
        alert("Failed to delete data");
      }
    }
  } else {
    localStorage.clear();
    window.location.reload();
  }
}