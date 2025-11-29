from app.services.ai.gemini_client import generate_with_gemini
import re
import json
from datetime import date

def parse_natural_language_transaction(message: str, language: str = 'en'):
    """Parse user message to detect transaction intent (Add/Delete/Update/Loan)"""
    try:
        today_str = date.today().strftime('%Y-%m-%d')
        
        prompt = f"""
        User said: "{message}"
        Today is: {today_str}
        
        Analyze the intent.
        
        --- INTENT 1: UPDATE SETTINGS ---
        - "Change my name to Ramesh" -> {{ "action": "update_profile", "field": "name", "value": "Ramesh" }}
        - "Set job to Driver" -> {{ "action": "update_profile", "field": "job_type", "value": "driver" }}
        - "Set food budget to 5000" -> {{ "action": "update_budget", "category": "Food", "amount": 5000 }}
        - "Change savings target to 10000" -> {{ "action": "update_profile", "field": "savings_target", "value": 10000 }}
        
        --- INTENT 2: LOAN ACTIONS ---
        - ADD Loan: "Loan taken 5000 from Ramesh", "Borrowed 200 from friend"
          Return: {{ "action": "add_loan", "amount": 5000, "lender": "Ramesh", "due_date": "YYYY-MM-DD" (default today+7 days if not said) }}
        
        - PAY Loan: "Paid loan to Ramesh", "Cleared debt of 5000", "Repaid friend"
          Return: {{ "action": "pay_loan", "lender": "Ramesh" }}
        
        - DELETE Loan: "Delete loan from Ramesh", "Remove loan entry"
          Return: {{ "action": "delete_loan", "lender": "Ramesh" }}

        --- INTENT 3: TRANSACTION ACTIONS ---
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
        
        --- INTENT 4: CHAT ---
        - Examples: "How much did I spend?", "Hi", "Advice please", "What is my budget?"
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
        
        user_job = user_context.get('job_type', 'other')
        job_instruction = {
            'driver': "User is a Driver. Relate to fuel, maintenance, rides.",
            'freelancer': "User is a Freelancer. Relate to irregular income, clients.",
            'student': "User is a Student. Relate to budget food, books, pocket money.",
            'vendor': "User is a Vendor. Relate to daily cash flow, inventory.",
            'housewife': "User is a Homemaker. Relate to household savings.",
            'other': ""
        }.get(user_job, "")
        
        prompt = f"""
        You are Spennies, a smart financial companion.
        
        👤 **USER PROFILE:**
        - Name: {user_context.get('name', 'User')}
        - Job: {user_job}
        
        🎭 **YOUR PERSONA:**
        {tone_instruction}
        {job_instruction}
        
        📊 **USER FINANCIAL DATA:**
        - Income: ₹{user_context.get('monthly_income', 0)}
        - Expenses: ₹{user_context.get('monthly_expense', 0)}
        - Savings: ₹{user_context.get('monthly_savings', 0)}
        - Goal: ₹{user_context.get('savings_target', 0)}
        
        **Budget Limits:**
        {user_context.get('budget_limits', 'No limits set')}

        **Recent Transactions:**
        {user_context.get('recent_transactions', 'N/A')}
        
        **Active Loans:**
        {user_context.get('loans', 'N/A')}
        
        ---
        
        👤 **USER QUESTION:** 
        "{user_message}"
        
        ---
        
        💡 **GUIDELINES:**
        - {lang_instruction}
        - Be concise (max 2-3 sentences).
        - Address user by name if relevant.
        - If asked "Am I over budget?", compare spending to Budget Limits.
        """
        
        response = generate_with_gemini(prompt)
        return response or "I'm having trouble analyzing your data right now."
        
    except Exception as e:
        print(f"❌ AI Chat Error: {e}")
        return "System Error: Unable to generate response."