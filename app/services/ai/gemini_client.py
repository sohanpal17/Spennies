import google.generativeai as genai
from app.config import settings
import os

# Configure Gemini
print(f"🔑 Gemini Key loaded: {'Yes' if settings.GEMINI_API_KEY else 'No'}")
genai.configure(api_key=settings.GEMINI_API_KEY)

# ✅ UPDATE: Use models found in your logs
# Using Gemini 2.0 Flash which is available to you
flash_model = genai.GenerativeModel('gemini-2.0-flash')
pro_model = genai.GenerativeModel('gemini-2.0-flash') # Using same model for now to ensure it works

def generate_with_gemini(prompt: str, use_pro: bool = False):
    """Generate content using Gemini"""
    try:
        model = pro_model if use_pro else flash_model
        
        # Generate response
        response = model.generate_content(prompt)
        
        # Check if response is valid
        if response and response.text:
            print(f"✅ AI Response generated ({len(response.text)} chars)")
            return response.text
        else:
            print("⚠ AI returned empty response")
            return None
            
    except Exception as e:
        print(f"❌ Gemini API Error: {e}")
        return None
