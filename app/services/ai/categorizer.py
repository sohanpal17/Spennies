from app.services.ai.gemini_client import generate_with_gemini
import json
import re

def categorize_transaction(description: str, amount: float, language: str = 'en') -> dict:
    """Auto-categorize transaction using AI"""
    
    prompt = f"""
    You are a transaction categorizer for Indian users.
    
    Transaction: "{description}"
    Amount: ₹{amount}
    
    Categorize this into ONE of these categories:
    - Food (meals, groceries, restaurants, food delivery)
    - Transport (auto, cab, fuel, metro, bus, bike)
    - Bills (electricity, water, mobile, internet, recharge)
    - Shopping (clothes, electronics, general shopping)
    - Entertainment (movies, games, subscriptions)
    - Healthcare (medicine, doctor, hospital)
    - Other (anything else)
    
    Return ONLY a JSON object with:
    {{
        "category": "category_name",
        "confidence": 0.0-1.0
    }}
    
    No explanation, just the JSON.
    """
    
    response = generate_with_gemini(prompt)
    
    if not response:
        return {"category": "Other", "confidence": 0.5}
    
    try:
        # Extract JSON from response
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_match:
            result = json.loads(json_match.group())
            return result
        else:
            return {"category": "Other", "confidence": 0.5}
    except:
        return {"category": "Other", "confidence": 0.5}