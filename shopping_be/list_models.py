#!/usr/bin/env python3
"""List available Gemini models."""
import os
import sys
from dotenv import load_dotenv

load_dotenv()
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

import google.generativeai as genai
from database import settings

genai.configure(api_key=settings.gemini_api_key)

print("=" * 60)
print("LISTING AVAILABLE GEMINI MODELS")
print("=" * 60)

try:
    models = genai.list_models()
    print("\nAvailable models for your API key:\n")
    for model in models:
        print(f"  - {model.name}")
        print(f"    Supported generation: {model.supported_generation_methods}")
        print()
except Exception as e:
    print(f"\nError: {e}")
