import os
from typing import Optional, Any
from dotenv import load_dotenv

load_dotenv()

_llm_instance: Optional[Any] = None
_llm_initialized: bool = False

def get_google_api_key() -> Optional[str]:
    """Retrieves Google Gemini API key from environment."""
    key = os.getenv("GOOGLE_API_KEY")
    return key.strip() if key else None

def is_llm_enabled() -> bool:
    """Returns True only if GOOGLE_API_KEY is configured."""
    key = get_google_api_key()
    return bool(key)

def get_gemini_model() -> Optional[Any]:
    """
    Initializes and returns ChatGoogleGenerativeAI if GOOGLE_API_KEY is present.
    Returns None if missing, preventing any crash.
    """
    global _llm_instance, _llm_initialized
    if _llm_initialized:
        return _llm_instance

    api_key = get_google_api_key()
    if not api_key:
        _llm_initialized = True
        _llm_instance = None
        return None

    try:
        from langchain_google_genai import ChatGoogleGenerativeAI
        model_name = os.getenv("MODEL_NAME", "gemini-2.5-flash").strip() or "gemini-2.5-flash"
        
        _llm_instance = ChatGoogleGenerativeAI(
            model=model_name,
            google_api_key=api_key,
            temperature=0.1
        )
        _llm_initialized = True
        return _llm_instance
    except Exception as e:
        print(f"[Voyage LLM] Warning: Failed to initialize ChatGoogleGenerativeAI: {e}")
        _llm_initialized = True
        _llm_instance = None
        return None
