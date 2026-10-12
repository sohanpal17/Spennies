from app.services.ai.gemini_client import generate_with_gemini
import re
import json
from datetime import date

def parse_natural_language_transaction(message: str, language: str = 'en'):
    """Parse user message to detect transaction intent (Add/Delete Transaction OR Loan)"""
    try:
        today_str = date.today().strftime('%Y-%m-%d')
        
        # Simplified prompt for parsing only (No user context needed here)
        prompt = f"""
        User said: "{message}"
        Today is: {today_str}
        
        Analyze the intent strictly.
        
        --- INTENT 1: LOAN ACTIONS ---
        - ADD Loan: "Loan taken 5000 from Ramesh", "Borrowed 200 from friend"
          Return: {{ "action": "add_loan", "amount": 5000, "lender": "Ramesh", "due_date": "YYYY-MM-DD" (default today+7 days if not said) }}
        
        - PAY Loan: "Paid loan to Ramesh", "Cleared debt of 5000", "Repaid friend"
          Return: {{ "action": "pay_loan", "lender": "Ramesh" }}
        
        - DELETE Loan: "Delete loan from Ramesh", "Remove loan entry"
          Return: {{ "action": "delete_loan", "lender": "Ramesh" }}

        --- INTENT 2: TRANSACTION ACTIONS ---
        - ADD Transaction: "Spent 50 on chai", "Add 500 income", "Paid 200 for auto yesterday"
          Return: {{ 
              "action": "add", 
              "amount": 50, 
              "description": "chai", 
              "type": "expense",
              "date": "YYYY-MM-DD" (If user says 'yesterday' or specific day, calculate it. Default to {today_str})
          }}
        
        - DELETE Transaction: "Delete 50 chai", "Remove last expense", "Undo 200 auto"
          Return: {{ "action": "delete", "amount": 50, "description": "chai" }} 
        
        --- INTENT 3: CHAT ---
        - Examples: "How much did I spend?", "Hi", "Advice please", "What is my budget?", "My name is..."
          Return: {{ "action": "chat" }}
        
        Return ONLY JSON. No markdown.
        """
        
        response = generate_with_gemini(prompt)
        
        if not response:
            return {"action": "chat"}
            
        # Clean JSON
        clean_response = response.replace("```json", "").replace("```", "").strip()
        
        json_match = re.search(r'\{.*\}', clean_response, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
            
        return json.loads(clean_response)
        
    except Exception as e:
        print(f"❌ AI Parsing Error: {e}")
        return {"action": "chat"}

def chat_with_ai(user_message: str, user_context: dict, language: str = 'en', tone: str = 'friendly') -> str:
    """Generate AI chat response with Rich Context & Tone"""
    try:
        lang_instruction = {
            'en': 'Respond in English.',
            'hi': 'Respond in Hindi (हिंदी में जवाब दें).',
            'mr': 'Respond in Marathi (मराठीत उत्तर द्या).'
        }.get(language, 'Respond in English.')
        
        tone_instruction = {
            'friendly': "Be casual, warm, and like a helpful friend. Use emojis.",
            'motivational': "Be high-energy, encouraging, and inspiring! Use 'You got this!' and 🔥 emojis.",
            'professional': "Be formal, concise, and objective. Focus on facts. No slang."
        }.get(tone, "Be helpful.")
        
        prompt = f"""
        You are Spennies, a smart financial companion.
        
        👤 **USER PROFILE:**
        - Name: {user_context.get('name', 'User')}
        - Job: {user_context.get('job_type', 'Worker')}
        
        🎭 **YOUR PERSONA:**
        {tone_instruction}
        
        📊 **USER FINANCIAL DATA (Real-time):**
        
        1. **Overview:**
           - Monthly Income: ₹{user_context.get('monthly_income', 0)}
           - Monthly Expense: ₹{user_context.get('monthly_expense', 0)}
           - Current Savings: ₹{user_context.get('monthly_savings', 0)}
           - Goal: ₹{user_context.get('savings_target', 0)}
        
        2. **Category Breakdown (This Month):**
        {user_context.get('categories', 'N/A')}
        
        3. **Budget Limits (Estimates):**
        {user_context.get('budget_limits', 'No limits set.')}

        4. **Recent 10 Transactions:**
        {user_context.get('recent_transactions', 'N/A')}
        
        5. **Active Loans:**
        {user_context.get('loans', 'N/A')}
        
        ---
        
        👤 **USER QUESTION:** 
        "{user_message}"
        
        ---
        
        💡 **GUIDELINES:**
        - {lang_instruction}
        - Be concise (max 2-3 sentences).
        - If asked "Am I over budget?", compare spending to Budget Limits.
        - If asked "How much spent on X?", look at Category Breakdown.
        - Always address the user by name if relevant.
        """
        
        response = generate_with_gemini(prompt)
        return response or "I'm having trouble analyzing your data right now."
        
    except Exception as e:
        print(f"❌ AI Chat Error: {e}")
        return "System Error: Unable to generate response."