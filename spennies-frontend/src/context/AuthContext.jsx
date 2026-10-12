import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import api from '../services/api';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      
      if (user) {
        try {
          // Force token refresh to ensure valid session
          await user.getIdToken(true);
          
          // Fetch additional data from backend
          // Note: api.js interceptor automatically attaches the token
          const response = await api.get('/api/auth/me');
          
          // Merge Firebase User + Backend Data
          setCurrentUser({ 
            ...user, 
            ...response.data,
            // Normalize fields just in case
            savingsTarget: parseFloat(response.data.savings_target || 0),
            avgIncome: parseFloat(response.data.avg_income || 0)
          });
          
        } catch (error) {
          console.warn("Backend sync failed, using Firebase user only", error);
          // Fallback: User is logged in via Firebase, but backend sync failed.
          // We still allow them in to prevent lockout loops.
          setCurrentUser(user);
        }
      } else {
        setCurrentUser(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}