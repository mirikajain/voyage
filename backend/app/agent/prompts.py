import re
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from app.agent.llm import get_gemini_model, is_llm_enabled

VOYAGE_SYSTEM_PROMPT = """You are Voyage, a premium AI travel concierge that helps users plan trips, compare travel options, optimize budgets, and prepare booking recommendations.

Core Guidelines:
1. Prioritize user travel style, interests, and stated budget ceiling.
2. Only recommend and select options from the verified inventory provided by Voyage tools. Never invent option IDs or hotel names.
3. Never invent prices or claim booking confirmations were made unless verified by tools.
4. Distinguish live provider data from estimated/demo data.
5. Provide concise, elegant user-facing reasons without exposing internal chain-of-thought.
6. All financial totals and balances are calculated strictly by Python.
"""

class TravelIntentExtraction(BaseModel):
    destination: str = Field(description="Target destination city/region, e.g. Goa, Paris, Kyoto")
    origin: str = Field(description="Departure city", default="Mumbai")
    duration_days: int = Field(description="Total trip duration in days", default=4)
    budget: float = Field(description="Total requested budget ceiling in numerical value", default=40000.0)
    currency: str = Field(description="Currency code, e.g. INR, USD, EUR", default="INR")
    travel_style: str = Field(description="Style of travel, e.g. romantic, luxury boutique, adventure, relaxing", default="luxury boutique")
    interests: List[str] = Field(description="User interests e.g. beaches, cafés, heritage, nightlife", default_factory=lambda: ["beaches", "cafés"])
    special_requirements: List[str] = Field(description="Special requirements or constraints", default_factory=list)

class OptionComparisonResult(BaseModel):
    recommended_hotel_id: str = Field(description="ID of the recommended hotel from the provided options")
    recommended_flight_id: str = Field(description="ID of the recommended flight from the provided options")
    recommended_activity_ids: List[str] = Field(description="List of selected activity IDs from the provided options")
    reasons: List[str] = Field(description="3 concise, user-facing reasons for why this combination was chosen")

class GeneratedItineraryItem(BaseModel):
    id: str
    time: str
    title: str
    category: str
    location: str
    estimated_cost: float
    booking_required: bool = False

class GeneratedItineraryDay(BaseModel):
    day: int
    day_title: str
    items: List[GeneratedItineraryItem]

class ItineraryGenerationResult(BaseModel):
    itinerary: List[GeneratedItineraryDay]

def parse_request_deterministic(prompt: str) -> Dict[str, Any]:
    """
    Deterministic rule-based parser used when Gemini API key is unavailable or on error.
    """
    lower = prompt.lower()
    
    # Destination parsing
    destination = "Goa"
    if "paris" in lower:
        destination = "Paris"
    elif "kyoto" in lower or "tokyo" in lower or "japan" in lower:
        destination = "Kyoto"
    elif "amalfi" in lower or "italy" in lower:
        destination = "Amalfi Coast"
    elif "goa" in lower:
        destination = "Goa"

    # Duration parsing
    duration = 4
    day_match = re.search(r'(\d+)\s*(-|\s)?(day|night)', lower)
    if day_match:
        duration = int(day_match.group(1))
    elif "four day" in lower or "four night" in lower:
        duration = 4
    elif "three day" in lower or "three night" in lower:
        duration = 3
    elif "five day" in lower or "five night" in lower:
        duration = 5

    # Budget parsing
    budget = 40000.0
    clean = prompt.replace(",", "")
    
    if "10k" in clean.lower() or "10000" in clean or "ten thousand" in clean.lower():
        budget = 10000.0
    elif "40k" in clean.lower() or "40000" in clean or "forty thousand" in clean.lower():
        budget = 40000.0
    elif "50k" in clean.lower() or "50000" in clean or "fifty thousand" in clean.lower():
        budget = 50000.0
    elif "30k" in clean.lower() or "30000" in clean or "thirty thousand" in clean.lower():
        budget = 30000.0
    else:
        num_match = re.search(r'(?:under|budget|of|₹|rs\.?|inr|below|max|within)?\s*₹?\s*(\d{4,7})', clean, re.IGNORECASE)
        if num_match:
            budget = float(num_match.group(1))

    # Travel style & interests
    travel_style = "romantic" if "romantic" in lower else "luxury boutique"
    interests = []
    if "beach" in lower:
        interests.append("beaches")
    if "café" in lower or "cafe" in lower:
        interests.append("cafés")
    if "nightlife" in lower:
        interests.append("nightlife")
    if "heritage" in lower or "culture" in lower:
        interests.append("heritage")
    if not interests:
        interests = ["beaches", "cafés"]

    return {
        "destination": destination,
        "origin": "Mumbai",
        "duration_days": duration,
        "budget": budget,
        "currency": "INR",
        "travel_style": travel_style,
        "interests": interests,
        "special_requirements": []
    }

def try_gemini_extract_intent(prompt: str) -> Optional[Dict[str, Any]]:
    """
    Structured extraction using Gemini when GOOGLE_API_KEY is available.
    Returns None on failure to trigger deterministic fallback.
    """
    if not is_llm_enabled():
        return None

    model = get_gemini_model()
    if not model:
        return None

    try:
        structured_llm = model.with_structured_output(TravelIntentExtraction)
        result: TravelIntentExtraction = structured_llm.invoke([
            ("system", VOYAGE_SYSTEM_PROMPT),
            ("human", f"Extract structured travel intent from this request: '{prompt}'")
        ])
        return result.model_dump()
    except Exception as e:
        print(f"[Voyage Gemini] Structured intent extraction failed: {e}")
        return None

def try_gemini_compare_options(
    destination: str,
    user_style: str,
    interests: List[str],
    budget: float,
    hotel_options: List[Dict[str, Any]],
    flight_options: List[Dict[str, Any]],
    activity_options: Dict[str, Any]
) -> Optional[Dict[str, Any]]:
    """
    Structured option comparison using Gemini.
    """
    if not is_llm_enabled():
        return None

    model = get_gemini_model()
    if not model:
        return None

    try:
        prompt_text = f"""Evaluate these options for a {destination} trip with budget ₹{budget:,.0f}, travel style '{user_style}', and interests {interests}.

Hotel options: {hotel_options}
Flight options: {flight_options}
Activity options: {activity_options.get('items', [])}

Select the best hotel ID, flight ID, and activity IDs. Provide 3 concise reasons why this combination is optimal for the user."""

        structured_llm = model.with_structured_output(OptionComparisonResult)
        result: OptionComparisonResult = structured_llm.invoke([
            ("system", VOYAGE_SYSTEM_PROMPT),
            ("human", prompt_text)
        ])
        return result.model_dump()
    except Exception as e:
        print(f"[Voyage Gemini] Option comparison failed: {e}")
        return None
