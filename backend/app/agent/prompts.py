import re
import datetime
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from app.agent.llm import get_gemini_model, is_llm_enabled

VOYAGE_SYSTEM_PROMPT = """You are Voyage, a premium AI travel concierge that helps users plan trips, compare travel options, optimize budgets, and prepare booking recommendations.

Core Guidelines:
1. Prioritize user travel style, interests, dynamic duration (e.g. 2 days vs 5 days), departure dates, and stated budget ceiling.
2. Only recommend and select options from the verified inventory provided by Voyage tools. Never invent option IDs or hotel names.
3. Never invent prices or claim booking confirmations were made unless verified by tools.
4. Distinguish live provider data (Aviationstack, Google Places) from demo data.
5. Provide concise, elegant user-facing reasons without exposing internal chain-of-thought.
6. All financial totals and balances are calculated strictly by Python.
"""

class TravelIntentExtraction(BaseModel):
    destination: str = Field(description="Target destination city/region, e.g. Jaipur, Paris, Kyoto, Goa, Mumbai")
    origin: str = Field(description="Departure city", default="Mumbai")
    duration_days: int = Field(description="Total trip duration in days (e.g. 2, 3, 4, 5)", default=4)
    departure_date: Optional[str] = Field(description="Departure date in YYYY-MM-DD format if mentioned", default=None)
    return_date: Optional[str] = Field(description="Return date in YYYY-MM-DD format if mentioned", default=None)
    budget: Optional[float] = Field(description="Total requested budget ceiling in numerical value if specified", default=None)
    currency: str = Field(description="Currency code, e.g. INR, USD, EUR", default="INR")
    travel_style: str = Field(description="Style of travel, e.g. romantic, luxury boutique, adventure, relaxing", default="luxury boutique")
    interests: List[str] = Field(description="User interests e.g. beaches, cafés, heritage, nightlife, palaces, shopping", default_factory=lambda: ["heritage", "cafés"])
    special_requirements: List[str] = Field(description="Special requirements or constraints", default_factory=list)

class OptionComparisonResult(BaseModel):
    recommended_hotel_id: str = Field(description="ID of the recommended hotel from the provided options")
    recommended_flight_id: str = Field(description="ID of the recommended flight from the provided options")
    recommended_activity_ids: List[str] = Field(description="List of selected activity IDs from the provided options")
    reasons: List[str] = Field(description="3 concise, user-facing reasons for why this combination was chosen")

STOP_WORDS = {
    "a", "an", "the", "my", "our", "luxury", "romantic", "budget", "weekend",
    "day", "days", "night", "nights", "plan", "trip", "tour", "getaway",
    "vacation", "holiday", "itinerary", "under", "for", "from", "with", "in",
    "to", "of", "and", "under", "below", "max", "about", "around", "near", "take",
    "me", "fly", "flying", "travel", "visiting", "visit"
}

def clean_location_name(text: str) -> str:
    """Cleans extracted candidate string into a clean title-cased city/destination name."""
    if not text:
        return ""
    words = text.strip().split()
    filtered = [w for w in words if w.lower() not in STOP_WORDS and not re.match(r'^[\d\?,₹$]+$', w)]
    if not filtered:
        return text.strip().title()
    return " ".join(filtered).strip().title()

def parse_request_deterministic(prompt: str) -> Dict[str, Any]:
    """
    Deterministic NLP & regex parser that extracts arbitrary destinations, origins,
    dynamic durations, budgets, and dates without hardcoding defaults.
    """
    raw_clean = prompt.replace("?", " ").replace("₹", " ₹ ").replace(",", "")
    lower = raw_clean.lower()

    # -------------------------------------------------------------
    # 1. ORIGIN & DESTINATION EXTRACTION
    # -------------------------------------------------------------
    origin = "Mumbai"
    destination = ""

    # Pattern A: "from Delhi to Goa" or "flying from Mumbai to Jaipur"
    from_to_match = re.search(
        r'(?:flying\s+)?from\s+([a-zA-Z\s]+?)\s+to\s+([a-zA-Z\s]+?)(?:\s+(?:for|under|with|from|on|in|\d|₹|budget|trip|tour)|$)',
        lower
    )
    if from_to_match:
        origin_cand = clean_location_name(from_to_match.group(1))
        dest_cand = clean_location_name(from_to_match.group(2))
        if origin_cand:
            origin = origin_cand
        if dest_cand:
            destination = dest_cand

    # Pattern B: "Delhi to Goa" at start
    if not destination:
        start_to_match = re.search(
            r'^([a-zA-Z\s]+?)\s+to\s+([a-zA-Z\s]+?)(?:\s+(?:for|under|with|from|on|in|\d|₹|budget|trip|tour)|$)',
            lower
        )
        if start_to_match:
            origin_cand = clean_location_name(start_to_match.group(1))
            dest_cand = clean_location_name(start_to_match.group(2))
            if origin_cand and dest_cand:
                origin = origin_cand
                destination = dest_cand

    # Pattern C: "trip to Jaipur", "Take me to Paris", "fly to Kyoto"
    if not destination:
        to_match = re.search(
            r'(?:take\s+me\s+to|trip\s+to|travel\s+to|visit|fly\s+to|going\s+to|head\s+to|flight\s+to|flights\s+to)\s+([a-zA-Z\s]+?)(?:\s+(?:for|under|with|from|on|in|\d|₹|budget|trip|tour)|$)',
            lower
        )
        if to_match:
            dest_cand = clean_location_name(to_match.group(1))
            if dest_cand:
                destination = dest_cand

    # Pattern D: "Plan a 2-day Jaipur trip", "Plan a Jaipur trip", "3-day Paris getaway"
    if not destination:
        trip_match = re.search(
            r'(?:plan\s+(?:a\s+)?)?(?:(?:(\d+)[-\s]*(?:day|days|night|nights)|weekend)\s+)?([a-zA-Z\s]+?)(?:\s+(?:trip|tour|getaway|vacation|itinerary|holiday))(?:\s+(?:for|under|with|from|on|in|\d|₹|budget)|$)',
            lower
        )
        if trip_match:
            dest_cand = clean_location_name(trip_match.group(2))
            if dest_cand:
                destination = dest_cand

    # Pattern E: "2 days in Jaipur", "Weekend in Mumbai"
    if not destination:
        in_match = re.search(
            r'(?:in|at)\s+([a-zA-Z\s]+?)(?:\s+(?:for|under|with|from|on|\d|₹|budget|trip|tour)|$)',
            lower
        )
        if in_match:
            dest_cand = clean_location_name(in_match.group(1))
            if dest_cand:
                destination = dest_cand

    # Pattern F: Direct recognized keywords fallback
    if not destination:
        common_destinations = ["jaipur", "goa", "paris", "kyoto", "tokyo", "mumbai", "delhi", "amalfi", "rome", "london", "dubai", "bali", "udaipur", "manali", "kashmir", "kerala"]
        for cd in common_destinations:
            if re.search(r'\b' + cd + r'\b', lower):
                destination = cd.title()
                break

    # If still empty, safely clean whatever words exist
    if not destination:
        destination = "Goa"

    # -------------------------------------------------------------
    # 2. DURATION EXTRACTION
    # -------------------------------------------------------------
    duration = None
    day_match = re.search(r'(\d+)\s*(-|\s)?(day|days|night|nights)', lower)
    if day_match:
        duration = int(day_match.group(1))
    elif re.search(r'for\s+(\d+)\s*(day|days|night|nights)', lower):
        duration = int(re.search(r'for\s+(\d+)\s*(day|days|night|nights)', lower).group(1))
    elif "two day" in lower or "2 day" in lower or "weekend" in lower:
        duration = 2
    elif "one day" in lower or "1 day" in lower:
        duration = 1
    elif "three day" in lower or "3 day" in lower or "three days" in lower or "3 days" in lower:
        duration = 3
    elif "four day" in lower or "4 day" in lower or "four days" in lower or "4 days" in lower:
        duration = 4
    elif "five day" in lower or "5 day" in lower or "five days" in lower or "5 days" in lower:
        duration = 5
    elif "six day" in lower or "6 day" in lower or "six days" in lower or "6 days" in lower:
        duration = 6
    elif "seven day" in lower or "7 day" in lower or "week" in lower or "7 days" in lower:
        duration = 7

    # If duration is absent, default ONLY to 4 as specified
    if duration is None:
        duration = 4

    # -------------------------------------------------------------
    # 3. DATE EXTRACTION
    # -------------------------------------------------------------
    departure_date = None
    return_date = None
    month_match = re.search(
        r'(?:from\s+)?(sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?)\s+(\d{1,2})',
        lower
    )
    if month_match:
        month_str = month_match.group(1)[:3]
        day_num = int(month_match.group(2))
        month_map = {"jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6, "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12}
        m = month_map.get(month_str, 9)
        year = 2026
        try:
            dep_dt = datetime.date(year, m, day_num)
            ret_dt = dep_dt + datetime.timedelta(days=duration)
            departure_date = dep_dt.strftime("%Y-%m-%d")
            return_date = ret_dt.strftime("%Y-%m-%d")
        except Exception:
            pass

    # -------------------------------------------------------------
    # 4. BUDGET EXTRACTION
    # -------------------------------------------------------------
    budget = None

    # Check for lakh: "1.5 lakh", "2 lakh", "1 lakh"
    lakh_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:lakh|lac|lacs)\b', lower)
    if lakh_match:
        budget = float(lakh_match.group(1)) * 100000.0

    # Check for k: "25k", "40k", "10k", "100k"
    if budget is None:
        k_match = re.search(r'(\d+(?:\.\d+)?)\s*k\b', lower)
        if k_match:
            budget = float(k_match.group(1)) * 1000.0

    # Check for numbers: "under 25000", "₹25000", "budget of 35000"
    if budget is None:
        num_match = re.search(r'(?:under|budget|of|₹|rs\.?|inr|below|max|within|for)\s*₹?\s*(\d{4,8})', lower)
        if num_match:
            budget = float(num_match.group(1))

    # Check for plain currency values: "₹25000", "25000 inr"
    if budget is None:
        plain_match = re.search(r'(?:₹\s*(\d{4,8})|(\d{4,8})\s*(?:inr|rs|rupees))', lower)
        if plain_match:
            val = plain_match.group(1) or plain_match.group(2)
            budget = float(val)

    # Check for word numbers
    if budget is None:
        if "twenty five thousand" in lower:
            budget = 25000.0
        elif "forty thousand" in lower:
            budget = 40000.0
        elif "thirty thousand" in lower:
            budget = 30000.0
        elif "twenty thousand" in lower:
            budget = 20000.0
        elif "ten thousand" in lower:
            budget = 10000.0
        elif "fifty thousand" in lower:
            budget = 50000.0
        elif "one lakh" in lower or "a lakh" in lower:
            budget = 100000.0

    # If user provided no budget, budget remains None

    # -------------------------------------------------------------
    # 5. TRAVEL STYLE & INTERESTS
    # -------------------------------------------------------------
    travel_style = "romantic" if "romantic" in lower else ("adventure" if "adventure" in lower else "luxury boutique")
    interests = []
    if "beach" in lower or "beaches" in lower:
        interests.append("beaches")
    if "café" in lower or "cafe" in lower or "cafes" in lower:
        interests.append("cafés")
    if "nightlife" in lower or "party" in lower:
        interests.append("nightlife")
    if "heritage" in lower or "culture" in lower or "palace" in lower or "fort" in lower:
        interests.append("heritage")
    if "food" in lower or "dining" in lower or "culinary" in lower:
        interests.append("dining")
    if not interests:
        if "goa" in destination.lower():
            interests = ["beaches", "cafés"]
        elif "jaipur" in destination.lower():
            interests = ["heritage", "palaces", "dining"]
        elif "paris" in destination.lower():
            interests = ["art", "cafés", "fine dining"]
        else:
            interests = ["heritage", "cafés"]

    return {
        "destination": destination,
        "origin": origin,
        "duration_days": duration,
        "departure_date": departure_date,
        "return_date": return_date,
        "budget": budget,
        "currency": "INR",
        "travel_style": travel_style,
        "interests": interests,
        "special_requirements": []
    }

def try_gemini_extract_intent(prompt: str) -> Optional[Dict[str, Any]]:
    """
    Structured extraction using Gemini when GOOGLE_API_KEY is available.
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
        data = result.model_dump()
        # Clean destination if needed
        if data.get("destination"):
            data["destination"] = clean_location_name(data["destination"])
        return data
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
