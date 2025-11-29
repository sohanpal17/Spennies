from app.services.ai.gemini_client import generate_with_gemini
import json
import re

def parse_sms_transaction(sms_text: str) -> dict:
    try:
        from datetime import date
        today_str = date.today().strftime('%Y-%m-%d')
        
        prompt = f"""
        Parse this Indian bank SMS transaction message:
        "{sms_text}"
        
        Today is: {today_str}
        
        Extract:
        - amount (number)
        - merchant (name)
        - type (debit/credit)
        - category (Food/Transport/Bills/Shopping/Entertainment/Healthcare/Other)
        - date (YYYY-MM-DD). If date is in SMS (e.g. "on 24-Nov"), parse it. If missing, use {today_str}.
        
        Return JSON:
        {{
            "amount": 0.0,
            "merchant": "...",
            "type": "debit",
            "category": "...",
            "date": "YYYY-MM-DD",
            "confidence": 0.0-1.0
        }}
        """
        
        response = generate_with_gemini(prompt)
        
        if not response:
            return {}
            
        # Clean response
        clean_response = response.replace("```json", "").replace("```", "").strip()
        import re
        import json
        match = re.search(r'\{.*\}', clean_response, re.DOTALL)
        if match:
            return json.loads(match.group())
            
        return {}
    except Exception as e:
        print(f"SMS Parse Error: {e}")
        return {}