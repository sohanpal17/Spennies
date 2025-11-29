import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile 
} from 'firebase/auth';
import { auth } from '../config/firebase';
import api from './api';

// Register user
export const registerUser = async (userData) => {
  try {
    console.log("🔵 1. Starting Firebase Registration...");
    
    // 1. Create user in Firebase
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      userData.email, 
      userData.password
    );
    const user = userCredential.user;
    const token = await user.getIdToken();
    
    console.log("🟢 2. Firebase Success! UID:", user.uid);

    console.log("🔵 3. Sending to Backend API...");
    
    // 2. Send to Backend
    const response = await api.post('/api/auth/register', {
      email: userData.email,
      name: userData.name,
      firebase_uid: user.uid,
      job_type: userData.jobType,
      language: userData.language,
      ai_tone: userData.aiTone,
      avg_income: parseFloat(userData.avgIncome) || 0,
      savings_target: parseFloat(userData.savingsTarget),
      expenses: userData.expenses
    });
    
    console.log("🟢 4. Backend Success!", response.data);
    return response.data;

  } catch (error) {
    console.error("🔴 REGISTRATION FAILED:", error);
    if (error.response) {
        alert(`Backend Error: ${JSON.stringify(error.response.data)}`);
    } else {
        alert(`Error: ${error.message}`);
    }
    throw error;
  }
};

// Login user
export const loginUser = async (email, password) => {
  try {
    console.log("🔵 Logging in...");
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();
    console.log("🟢 Login Success! Token:", token.substring(0, 10) + "...");
    return true;
  } catch (error) {
    console.error("🔴 LOGIN FAILED:", error);
    return false;
  }
};

// Logout user
export const logoutUser = async () => {
  try {
    await signOut(auth);
    localStorage.clear();
  } catch (error) {
    console.error("Logout failed", error);
  }
};

// Get current user profile from backend
export const getUserProfile = async () => {
  try {
    const response = await api.get('/api/auth/me');
    return response.data;
  } catch (error) {
    throw error;
  }
};