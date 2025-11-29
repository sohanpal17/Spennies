from app.services.ai.gemini_client import generate_with_gemini
import json
import re

def generate_ai_challenge(user_context: dict, language: str = 'en'):
    """Generate a personalized micro-challenge"""
    try:
        prompt = f"""
        Generate a micro-saving challenge for a gig worker.
        
        User Profile: {user_context.get('job_type', 'Worker')}
        Recent Spending: {user_context.get('recent_transactions', 'N/A')}
        
        Requirements:
        1. Simple, actionable task for TODAY.
        2. Estimated savings amount (₹10-₹200).
        3. Tone: Encouraging.
        4. Language: {language}
        
        Return JSON:
        {{
            "title": "Skip the auto",
            "description": "Walk for short trips today.",
            "reward": 50
        }}
        """
        
        response = generate_with_gemini(prompt)
        
        if not response: return None
        
        clean_response = response.replace("```json", "").replace("```", "").strip()
        return json.loads(clean_response)
        
    except Exception:
        return None