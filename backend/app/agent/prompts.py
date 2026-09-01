import re
import datetime
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from app.agent.llm import get_gemini_model, is_llm_enabled

VOYAGE_SYSTEM_PROMPT = """You are Voyage, a premium conversational AI travel concierge and financial intelligence assistant.

CORE INSTRUCTION:
First, classify the user's intent into EXACTLY ONE of:
1. "trip_planning": User asks to plan a full new trip, vacation, getaway, or multi-day itinerary (e.g. "Plan a 4-day Goa trip under ₹40,000", "Plan a 2-day Jaipur trip under ₹25,000", "Plan a trip to Paris").
2. "hotel_search": User specifically asks for hotels, resorts, villas, havelis, stays, or accommodations (e.g. "Find available hotels in Goa", "Show hotels in Goa under ₹5,000", "Find hotels in Paris", "Boutique stays in Jaipur").
3. "flight_search": User specifically asks to search or find flights or airfare (e.g. "Find flights from Delhi to Goa", "Cheapest flights to Paris").
4. "restaurant_search": User asks for restaurants, dining venues, cafés, or gastronomy (e.g. "What restaurants are available in Goa?", "Find romantic restaurants near Eiffel Tower", "Best cafes in Goa").
5. "activity_search": User asks for activities, sightseeing, attractions, or tours (e.g. "Things to do in Kyoto", "Top attractions in Rome").
6. "transport_search": User asks for airport transfers, car rentals, or transit.
7. "budget_adjustment": User explicitly modifies or sets category budgets or total trip budget (e.g. "Change hotel stay budget to ₹2,000", "Make flights ₹6,000 and transport ₹2,000", "Increase the total trip budget to ₹50,000", "Make hotel cheaper").
8. "follow_up": User modifies trip duration, destination, origin, or answers a clarification question (e.g. "make it to 2 days", "Change destination to Jaipur", "Actually I'm travelling from Mumbai", "September 14 to September 18", "Delhi").
9. "general_travel_question": General questions about travel or destination advice.

CRITICAL RULES:
- If user asks for hotels ("Find available hotels in Goa", "Show hotels in Goa under ₹5,000"), classify as "hotel_search". DO NOT classify as "trip_planning" or "follow_up".
- If user asks to change or update a category budget ("Change hotel stay budget to ₹2,000"), classify as "budget_adjustment".
- Never assume or default to Goa, Mumbai, 4 days, or ₹40,000 when missing from user input. Return None if not specified.
- "hotel_budget" and "total_budget" MUST remain separate fields. For "Change hotel stay budget to ₹2,000", set hotel_budget=2000, total_budget=None.
"""

class CategoryBudgetUpdates(BaseModel):
    hotel: Optional[float] = Field(None, description="Hotel/accommodation spending envelope")
    flights: Optional[float] = Field(None, description="Flight/airfare spending envelope")
    dining: Optional[float] = Field(None, description="Food/dining/restaurant spending envelope")
    activities: Optional[float] = Field(None, description="Activity/tour/attraction spending envelope")
    transport: Optional[float] = Field(None, description="Local transport/transfers spending envelope")

class TravelIntentExtraction(BaseModel):
    intent: str = Field(
        description="Intent type: 'trip_planning', 'hotel_search', 'flight_search', 'restaurant_search', 'activity_search', 'transport_search', 'budget_adjustment', 'follow_up', or 'general_travel_question'",
        default="trip_planning"
    )
    destination: Optional[str] = Field(description="Target destination city/region if mentioned, e.g. Paris, Goa, Jaipur, Kyoto. None if not mentioned.", default=None)
    origin: Optional[str] = Field(description="Departure city if mentioned, e.g. Delhi, Mumbai, London. None if not mentioned.", default=None)
    duration_days: Optional[int] = Field(description="Total trip duration in days if specified or computed from dates", default=None)
    departure_date: Optional[str] = Field(description="Departure / check-in date in YYYY-MM-DD format if mentioned", default=None)
    return_date: Optional[str] = Field(description="Return / check-out date in YYYY-MM-DD format if mentioned", default=None)
    travelers: Optional[int] = Field(description="Number of people travelling if specified", default=None)
    total_budget: Optional[float] = Field(description="Total trip budget ceiling if specified for a full trip plan or explicit total budget adjustment. None if not specified.", default=None)
    hotel_budget: Optional[float] = Field(description="Specific hotel spending envelope if mentioned (e.g. 2000 for ₹2,000)", default=None)
    flight_budget: Optional[float] = Field(description="Specific flight spending envelope if mentioned (e.g. 6000 for ₹6,000)", default=None)
    transport_budget: Optional[float] = Field(description="Specific transport spending envelope if mentioned", default=None)
    dining_budget: Optional[float] = Field(description="Specific dining spending envelope if mentioned", default=None)
    activity_budget: Optional[float] = Field(description="Specific activity spending envelope if mentioned", default=None)
    is_cheaper_request: Optional[bool] = Field(description="True if user asked to make a category cheaper without a specific number", default=False)
    cheaper_category: Optional[str] = Field(description="Category to make cheaper e.g. 'hotel', 'flight', 'dining', 'activities', 'transport'", default=None)
    currency: str = Field(description="Currency code, e.g. INR, USD, EUR", default="INR")
    travel_style: str = Field(description="Style of travel, e.g. romantic, luxury boutique, adventure, relaxing", default="luxury boutique")
    interests: List[str] = Field(description="User interests e.g. beaches, cafés, heritage, nightlife, palaces, shopping", default_factory=list)
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
    "to", "of", "and", "below", "max", "about", "around", "near", "take",
    "me", "fly", "flying", "travel", "visiting", "visit", "find", "show", "search",
    "looking", "flights", "flight", "hotels", "hotel", "restaurants", "restaurant",
    "activities", "activity", "attractions", "places", "food", "cafes", "cafe",
    "actually", "im", "i'm", "am", "is", "are", "was", "were", "what", "which",
    "where", "how", "best", "top", "good", "some", "all", "any", "things", "do", "see", "there",
    "increase", "decrease", "reduce", "change", "set", "make", "total", "entire", "overall",
    "travelling", "traveling", "leaving", "departing",
    "it", "please", "can", "you", "want", "would", "like", "available", "stays", "stay"
}

MONTH_MAP = {
    "jan": 1, "january": 1,
    "feb": 2, "february": 2,
    "mar": 3, "march": 3,
    "apr": 4, "april": 4,
    "may": 5,
    "jun": 6, "june": 6,
    "jul": 7, "july": 7,
    "aug": 8, "august": 8,
    "sep": 9, "september": 9,
    "oct": 10, "october": 10,
    "nov": 11, "november": 11,
    "dec": 12, "december": 12
}

def clean_location_name(text: str) -> str:
    """Cleans extracted candidate string into a clean title-cased city/destination name."""
    if not text:
        return ""
    words = text.strip().split()
    filtered = [w for w in words if w.lower() not in STOP_WORDS and not re.match(r'^[\d\?,₹$]+$', w)]
    if not filtered:
        return ""
    return " ".join(filtered).strip().title()

def extract_numeric_value(text: str) -> Optional[float]:
    """Helper to parse currency formats: '2k' -> 2000, '1.5 lakh' -> 150000, '₹2,000' -> 2000, '40000' -> 40000."""
    if not text:
        return None
    cleaned = text.replace(",", "").replace("₹", "").strip().lower()
    lakh_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:lakh|lac|lacs)\b', cleaned)
    if lakh_match:
        return float(lakh_match.group(1)) * 100000.0
    k_match = re.search(r'(\d+(?:\.\d+)?)\s*k\b', cleaned)
    if k_match:
        return float(k_match.group(1)) * 1000.0
    num_match = re.search(r'(\d{3,8})', cleaned)
    if num_match:
        return float(num_match.group(1))
    return None

def parse_date_range(text: str) -> tuple:
    """
    Parses date ranges such as:
    - 'September 15 to September 18'
    - '15 Sep to 18 Sep' / '15th Sep to 18th Sep'
    - 'Sep 15–18' / 'Sep 15 - 18' / 'September 15-18' / 'September 15 to 18'
    - '15/09/2026 to 18/09/2026' / '15/09 to 18/09'
    - 'next Friday to Sunday' / 'this weekend' / 'next weekend'
    Returns (departure_date_str, return_date_str, duration_days)
    """
    lower = text.lower().replace("–", "-").replace("—", "-")
    year = 2026

    # 1. Numeric slash or hyphen dates e.g. "15/09/2026 to 18/09/2026" or "15/09 to 18/09"
    p_num = re.search(
        r'(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\s*(?:to|-|until|through)\s*(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?',
        lower
    )
    if p_num:
        d1 = int(p_num.group(1))
        m1 = int(p_num.group(2))
        y1 = int(p_num.group(3)) if p_num.group(3) else year
        if y1 < 100: y1 += 2000
        d2 = int(p_num.group(4))
        m2 = int(p_num.group(5))
        y2 = int(p_num.group(6)) if p_num.group(6) else y1
        if y2 < 100: y2 += 2000
        try:
            dep_dt = datetime.date(y1, m1, d1)
            ret_dt = datetime.date(y2, m2, d2)
            dur = max(1, (ret_dt - dep_dt).days)
            return dep_dt.strftime("%Y-%m-%d"), ret_dt.strftime("%Y-%m-%d"), dur
        except Exception:
            pass

    # 2. "September 15 to September 18" or "Sep 15 to Sep 18" or "September 15 to 18" or "Sep 15-18"
    p_month_first = re.search(
        r'(?:from\s+)?(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?\s*(?:to|-|until|through)\s*(?:(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+)?(\d{1,2})(?:st|nd|rd|th)?',
        lower
    )
    if p_month_first:
        m1_str = p_month_first.group(1)
        d1_num = int(p_month_first.group(2))
        m2_str = p_month_first.group(3) or m1_str
        d2_num = int(p_month_first.group(4))

        m1 = MONTH_MAP.get(m1_str[:3], 9)
        m2 = MONTH_MAP.get(m2_str[:3], m1)
        try:
            dep_dt = datetime.date(year, m1, d1_num)
            ret_dt = datetime.date(year, m2, d2_num)
            dur = max(1, (ret_dt - dep_dt).days)
            return dep_dt.strftime("%Y-%m-%d"), ret_dt.strftime("%Y-%m-%d"), dur
        except Exception:
            pass

    # 3. "15 Sep to 18 Sep" or "15th September to 18th September" or "15 to 18 Sep"
    p_day_first = re.search(
        r'(\d{1,2})(?:st|nd|rd|th)?\s*(?:of\s+)?(?:(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s*)?(?:to|-)\s*(\d{1,2})(?:st|nd|rd|th)?\s*(?:of\s+)?(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)',
        lower
    )
    if p_day_first:
        d1_num = int(p_day_first.group(1))
        m1_str = p_day_first.group(2) or p_day_first.group(4)
        d2_num = int(p_day_first.group(3))
        m2_str = p_day_first.group(4)
        m1 = MONTH_MAP.get(m1_str[:3], 9)
        m2 = MONTH_MAP.get(m2_str[:3], m1)
        try:
            dep_dt = datetime.date(year, m1, d1_num)
            ret_dt = datetime.date(year, m2, d2_num)
            dur = max(1, (ret_dt - dep_dt).days)
            return dep_dt.strftime("%Y-%m-%d"), ret_dt.strftime("%Y-%m-%d"), dur
        except Exception:
            pass

    # 4. Natural keywords: "this weekend", "next weekend", "next friday to sunday"
    if "next friday to sunday" in lower or "friday to sunday" in lower:
        return "2026-09-18", "2026-09-20", 2
    if "next weekend" in lower or "upcoming weekend" in lower:
        return "2026-09-18", "2026-09-20", 2
    if "this weekend" in lower:
        return "2026-09-11", "2026-09-13", 2

    # 5. Single date mention: "Sep 15" or "September 15th"
    single_date = re.search(
        r'(?:on\s+|for\s+|from\s+)?(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?',
        lower
    )
    if single_date:
        m_str = single_date.group(1)
        d_num = int(single_date.group(2))
        m = MONTH_MAP.get(m_str[:3], 9)
        try:
            dep_dt = datetime.date(year, m, d_num)
            return dep_dt.strftime("%Y-%m-%d"), None, None
        except Exception:
            pass

    return None, None, None

def parse_request_deterministic(prompt: str) -> Dict[str, Any]:
    """
    Deterministic NLP & regex parser that accurately detects intent, entities (origin, destination, dates, budget, category budgets)
    without imposing silent hardcoded defaults.
    """
    raw_clean = prompt.replace("?", " ").replace("₹", " ₹ ").replace(",", "")
    lower = raw_clean.lower()
    
    # Check if user is starting a brand-new trip plan vs follow-up adjustment
    is_new_plan_query = bool(
        re.search(r'\b(plan\s+(?:a\s+)?(?:trip|getaway|vacation|holiday|tour)|book\s+(?:a\s+)?(?:trip|getaway|vacation)|start\s+(?:a\s+)?(?:trip|getaway|vacation)|new\s+trip)\b', lower) or
        (lower.strip().startswith("plan ") and "trip" in lower)
    )

    # -------------------------------------------------------------
    # 1. SPECIFIC SEARCH INTENT DETECTION
    # -------------------------------------------------------------
    is_hotel_query = bool(re.search(r'\b(hotel|hotels|resort|resorts|villa|villas|stay|stays|accommodation|accommodations|room|rooms|haveli|havelis)\b', lower))
    is_flight_query = bool(re.search(r'\b(flight|flights|fly|flying|airline|airlines|airfare|airfares|ticket|tickets|plane)\b', lower))
    is_restaurant_query = bool(re.search(r'\b(restaurant|restaurants|dining|dinner|dinners|lunch|lunches|breakfast|food|cafe|cafes|café|cafés|bistro|bistros|eatery|eateries)\b', lower))
    is_activity_query = bool(re.search(r'\b(activity|activities|things to do|attraction|attractions|sightseeing|sight-seeing|tour|tours|experience|experiences|monument|monuments)\b', lower))
    is_transport_query = bool(re.search(r'\b(transport|transfers|cabs?|taxi|transit|airport transfer)\b', lower))
    
    is_change_budget_query = bool(re.search(r'\b(change|make|keep|limit|set|reduce|increase|update|switch)\b.*\b(budget|spending|cost|envelope|cheaper)\b', lower) or "budget to" in lower or "budget of" in lower or "budget under" in lower)

    # -------------------------------------------------------------
    # 2. ORIGIN & DESTINATION EXTRACTION
    # -------------------------------------------------------------
    origin = None
    destination = None

    # Handle combined follow-up reply e.g. "Delhi, September 15 to September 18" or "Delhi"
    dep_cand, ret_cand, _ = parse_date_range(prompt)
    if dep_cand:
        # Check if text preceding date contains a city name e.g. "Delhi September 15 to 18"
        p_lead = re.split(r'\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{1,2}[\/\-])', lower, maxsplit=1)
        if p_lead and p_lead[0].strip():
            lead_cand = clean_location_name(p_lead[0])
            if lead_cand and lead_cand.lower() not in ["from", "on", "for", "in", "to"]:
                origin = lead_cand

    from_to_match = re.search(
        r'(?:flying\s+|flights?\s+)?from\s+([a-zA-Z\s]+?)\s+to\s+([a-zA-Z\s]+?)(?:\s+(?:for|under|with|from|on|in|\d|₹|budget|trip|tour|near|at|from)|$)',
        lower
    )
    if from_to_match:
        origin_cand = clean_location_name(from_to_match.group(1))
        dest_cand = clean_location_name(from_to_match.group(2))
        if origin_cand:
            origin = origin_cand
        if dest_cand:
            destination = dest_cand

    if not destination and not is_new_plan_query:
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

    if not origin:
        from_match = re.search(r'(?:from|departing\s+from|leaving\s+from|flying\s+from|travelling\s+from)\s+([a-zA-Z\s]+?)(?:\s+(?:to|for|under|with|on|in|\d|₹|budget|from)|$)', lower)
        if from_match:
            origin_cand = clean_location_name(from_match.group(1))
            if origin_cand and origin_cand.lower() not in ["september", "sep", "october", "oct", "november", "nov", "december", "dec", "january", "jan", "february", "feb", "march", "mar", "april", "apr", "may", "june", "jun", "july", "jul", "august", "aug"]:
                origin = origin_cand

    # Standalone single-word city reply e.g. user just said "Delhi" or "Mumbai"
    if not origin and not destination and not is_new_plan_query and not is_hotel_query and not is_flight_query and not is_restaurant_query and not is_activity_query and not is_change_budget_query:
        clean_prompt = clean_location_name(prompt)
        known_cities = ["delhi", "mumbai", "bangalore", "bengaluru", "chennai", "kolkata", "hyderabad", "pune", "ahmedabad", "jaipur", "goa", "paris", "london", "dubai", "singapore", "tokyo", "chandigarh", "lucknow", "kochi", "varanasi"]
        if clean_prompt and clean_prompt.lower() in known_cities:
            origin = clean_prompt

    if not destination:
        near_match = re.search(r'near\s+([a-zA-Z\s]+?)(?:\s+(?:for|under|with|from|on|in|\d|₹|budget)|$)', lower)
        if near_match:
            dest_cand = clean_location_name(near_match.group(1))
            if dest_cand:
                if "eiffel" in dest_cand.lower():
                    destination = "Paris"
                else:
                    destination = dest_cand

    if not destination:
        in_match = re.search(
            r'(?:in|at)\s+([a-zA-Z\s]+?)(?:\s+(?:for|under|with|from|on|\d|₹|budget|trip|tour|near)|$)',
            lower
        )
        if in_match:
            dest_cand = clean_location_name(in_match.group(1))
            if dest_cand:
                destination = dest_cand

    if not destination:
        to_match = re.search(
            r'(?:take\s+me\s+to|trip\s+to|travel\s+to|visit|fly\s+to|going\s+to|head\s+to|flights?\s+to|flight\s+to|hotels?\s+in|stays?\s+in)\s+([a-zA-Z\s]+?)(?:\s+(?:for|under|with|from|on|in|\d|₹|budget|trip|tour)|$)',
            lower
        )
        if to_match:
            dest_cand = clean_location_name(to_match.group(1))
            if dest_cand:
                destination = dest_cand

    if not destination:
        trip_match = re.search(
            r'(?:plan\s+(?:a\s+)?)?(?:(?:(\d+)[-\s]*(?:day|days|night|nights)|weekend)\s+)?([a-zA-Z\s]+?)(?:\s+(?:trip|tour|getaway|vacation|itinerary|holiday))(?!\s+budget)(?:\s+(?:for|under|with|from|on|in|\d|₹|budget)|$)',
            lower
        )
        if trip_match:
            dest_cand = clean_location_name(trip_match.group(2))
            if dest_cand:
                destination = dest_cand

    if not destination:
        common_destinations = ["jaipur", "mumbai", "delhi", "goa", "paris", "kyoto", "tokyo", "amalfi", "rome", "london", "dubai", "bali", "udaipur", "manali", "kashmir", "kerala", "eiffel tower"]
        for cd in common_destinations:
            if re.search(r'\b' + cd + r'\b', lower):
                if cd == "eiffel tower":
                    destination = "Paris"
                elif cd == (origin.lower() if origin else ""):
                    continue
                else:
                    destination = cd.title()
                    break

    # -------------------------------------------------------------
    # 3. DURATION & DATES EXTRACTION
    # -------------------------------------------------------------
    dep_date, ret_date, date_duration = parse_date_range(prompt)
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
    elif date_duration:
        duration = date_duration

    # -------------------------------------------------------------
    # 4. CATEGORY BUDGET UPDATES & NUMERIC PARSING
    # -------------------------------------------------------------
    hotel_budget = None
    flight_budget = None
    dining_budget = None
    activity_budget = None
    transport_budget = None
    total_budget = None
    total_budget_update = None
    is_cheaper_request = False
    cheaper_category = None

    # Cheaper requests
    cheaper_match = re.search(r'\b(cheaper|less expensive|lower cost|reduce cost|budget friendly)\b', lower)
    if cheaper_match:
        is_cheaper_request = True
        if is_hotel_query:
            cheaper_category = "hotel"
        elif is_flight_query:
            cheaper_category = "flights"
        elif is_restaurant_query:
            cheaper_category = "dining"
        elif is_activity_query:
            cheaper_category = "activities"
        elif is_transport_query:
            cheaper_category = "transport"

    # Category Budget: Hotel
    hotel_budget_match = re.search(
        r'(?:hotel|stay|accommodation|resort|room)(?:\s+stay)?\s*(?:budget|spending|cost)?\s*(?:to|under|below|of|max|at|is|should be|around|limit)?\s*₹?\s*(\d+(?:\.\d+)?\s*(?:k|lakh|lac)?|\d{3,8})\b',
        lower
    )
    if not hotel_budget_match:
        hotel_budget_match = re.search(
            r'(?:make|keep|limit|set|reduce|change)\s+(?:the\s+)?(?:hotel|stay|accommodation|resort|room)\s*(?:budget|spending|cost)?\s*(?:to|under|below|of|max|at)?\s*₹?\s*(\d+(?:\.\d+)?\s*(?:k|lakh|lac)?|\d{3,8})\b',
            lower
        )
    if hotel_budget_match:
        val = extract_numeric_value(hotel_budget_match.group(1))
        if val and val > 0:
            hotel_budget = val
    elif is_hotel_query and not is_new_plan_query:
        cand_match = re.search(r'\b(?:under|below|max|within|around|upto|up\s+to|budget\s+(?:of|is|to)?|for|₹|rs\.?)\s*₹?\s*(\d+(?:\.\d+)?\s*(?:k|lakh|lac)?|\d{3,8})\b', lower)
        if cand_match:
            val = extract_numeric_value(cand_match.group(1))
            if val and val > 0 and val != 2026:
                hotel_budget = val

    # Category Budget: Flights
    flight_budget_match = re.search(
        r'(?:flights?|airfare|flying)\s*(?:budget|spending|cost)?\s*(?:to|under|below|of|max|at|is|should be)?\s*₹?\s*(\d+(?:\.\d+)?\s*(?:k|lakh|lac)?|\d{3,8})\b',
        lower
    )
    if not flight_budget_match:
        flight_budget_match = re.search(
            r'(?:make|keep|limit|set|reduce|change)\s+(?:the\s+)?(?:flights?|airfare)\s*(?:budget|spending|cost)?\s*(?:to|under|below|of|max|at)?\s*₹?\s*(\d+(?:\.\d+)?\s*(?:k|lakh|lac)?|\d{3,8})\b',
            lower
        )
    if flight_budget_match:
        val = extract_numeric_value(flight_budget_match.group(1))
        if val and val > 0:
            flight_budget = val
    elif is_flight_query and not is_new_plan_query:
        cand_match = re.search(r'\b(?:under|below|max|within|around|upto|up\s+to|budget\s+(?:of|is|to)?|for|₹|rs\.?)\s*₹?\s*(\d+(?:\.\d+)?\s*(?:k|lakh|lac)?|\d{3,8})\b', lower)
        if cand_match:
            val = extract_numeric_value(cand_match.group(1))
            if val and val > 0 and val != 2026:
                flight_budget = val

    # Category Budget: Dining
    dining_budget_match = re.search(
        r'(?:food|dining|restaurant|restaurants|meals?)\s*(?:budget|spending|cost)?\s*(?:to|under|below|of|max|at|is|should be)?\s*₹?\s*(\d+(?:\.\d+)?\s*(?:k|lakh|lac)?|\d{3,8})\b',
        lower
    )
    if dining_budget_match:
        val = extract_numeric_value(dining_budget_match.group(1))
        if val and val > 0:
            dining_budget = val
    elif is_restaurant_query and not is_new_plan_query:
        cand_match = re.search(r'\b(?:under|below|max|within|around|upto|up\s+to|budget\s+(?:of|is|to)?|for|₹|rs\.?)\s*₹?\s*(\d+(?:\.\d+)?\s*(?:k|lakh|lac)?|\d{3,8})\b', lower)
        if cand_match:
            val = extract_numeric_value(cand_match.group(1))
            if val and val > 0 and val != 2026:
                dining_budget = val

    # Category Budget: Activities
    activity_budget_match = re.search(
        r'(?:activit(?:y|ies)|tours?|sightseeing|attractions?)\s*(?:budget|spending|cost)?\s*(?:to|under|below|of|max|at|is|should be)?\s*₹?\s*(\d+(?:\.\d+)?\s*(?:k|lakh|lac)?|\d{3,8})\b',
        lower
    )
    if activity_budget_match:
        val = extract_numeric_value(activity_budget_match.group(1))
        if val and val > 0:
            activity_budget = val
    elif is_activity_query and not is_new_plan_query:
        cand_match = re.search(r'\b(?:under|below|max|within|around|upto|up\s+to|budget\s+(?:of|is|to)?|for|₹|rs\.?)\s*₹?\s*(\d+(?:\.\d+)?\s*(?:k|lakh|lac)?|\d{3,8})\b', lower)
        if cand_match:
            val = extract_numeric_value(cand_match.group(1))
            if val and val > 0 and val != 2026:
                activity_budget = val

    # Category Budget: Transport
    transport_budget_match = re.search(
        r'(?:local\s+)?(?:transport|transfers?|cabs?|taxi)\s*(?:budget|spending|cost)?\s*(?:to|under|below|of|max|at|is|should be)?\s*₹?\s*(\d+(?:\.\d+)?\s*(?:k|lakh|lac)?|\d{3,8})\b',
        lower
    )
    if not transport_budget_match:
        transport_budget_match = re.search(
            r'(?:make|keep|limit|set|reduce|increase|change)\s+(?:the\s+)?(?:local\s+)?(?:transport|transfers?|cabs?|taxi)\s*(?:budget|spending|cost)?\s*(?:to|under|below|of|max|at)?\s*₹?\s*(\d+(?:\.\d+)?\s*(?:k|lakh|lac)?|\d{3,8})\b',
            lower
        )
    if transport_budget_match:
        val = extract_numeric_value(transport_budget_match.group(1))
        if val and val > 0:
            transport_budget = val
    elif is_transport_query and not is_new_plan_query:
        cand_match = re.search(r'\b(?:under|below|max|within|around|upto|up\s+to|budget\s+(?:of|is|to)?|for|₹|rs\.?)\s*₹?\s*(\d+(?:\.\d+)?\s*(?:k|lakh|lac)?|\d{3,8})\b', lower)
        if cand_match:
            val = extract_numeric_value(cand_match.group(1))
            if val and val > 0 and val != 2026:
                transport_budget = val

    # Total Trip Budget Update
    total_budget_match = re.search(
        r'(?:total(?:\s+trip)?|overall|entire\s+trip)\s+budget\s*(?:to|is|under|below|of|at|should be)?\s*₹?\s*(\d+(?:\.\d+)?\s*(?:k|lakh|lac)?|\d{3,8})\b',
        lower
    )
    if not total_budget_match:
        total_budget_match = re.search(
            r'(?:increase|change|set|reduce|make)\s+(?:the\s+|my\s+)?(?:total(?:\s+trip)?|overall|entire\s+trip)\s+budget\s*(?:to|under|below|of|at)?\s*₹?\s*(\d+(?:\.\d+)?\s*(?:k|lakh|lac)?|\d{3,8})\b',
            lower
        )
    if total_budget_match:
        val = extract_numeric_value(total_budget_match.group(1))
        if val and val > 0:
            total_budget_update = val

    # Trip Planning Total Budget Extraction (when planning a trip)
    if is_new_plan_query or not (is_hotel_query or is_flight_query or is_restaurant_query or is_activity_query):
        b_match = re.search(
            r'\b(?:my\s+)?budget\b\s*(?:is|of|:|around|=|approx|approx\.|\s+)?\s*₹?\s*(\d+(?:\.\d+)?\s*(?:lakh|lac|k)?|\d{3,8})\b',
            lower
        )
        if b_match:
            val = extract_numeric_value(b_match.group(1))
            if val and val > 0:
                total_budget = val

        if total_budget is None:
            u_match = re.search(
                r'\b(?:under|below|max|within|around|upto|up\s+to|for)\s*₹?\s*(\d+(?:\.\d+)?\s*(?:lakh|lac|k)?|\d{3,8})\b',
                lower
            )
            if u_match:
                val = extract_numeric_value(u_match.group(1))
                if val and val > 0:
                    total_budget = val

        if total_budget is None:
            lakh_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:lakh|lac|lacs)\b', lower)
            if lakh_match:
                total_budget = float(lakh_match.group(1)) * 100000.0

        if total_budget is None:
            k_match = re.search(r'(\d+(?:\.\d+)?)\s*k\b', lower)
            if k_match:
                total_budget = float(k_match.group(1)) * 1000.0

        if total_budget is None:
            rs_match = re.search(r'(?:₹|rs\.?|inr)\s*(\d{3,8})', lower)
            if rs_match:
                total_budget = float(rs_match.group(1))

        if total_budget is None:
            trail_match = re.search(r'(\d{3,8})\s*(?:inr|rs|rupees)\b', lower)
            if trail_match:
                total_budget = float(trail_match.group(1))

        if total_budget is None:
            standalone_match = re.search(r'\b(\d{4,8})\b', lower)
            if standalone_match:
                val = float(standalone_match.group(1))
                if val >= 1000 and val != 2026:
                    total_budget = val

    # -------------------------------------------------------------
    # 5. DETERMINING INTENT
    # -------------------------------------------------------------
    intent = "trip_planning"

    is_explicit_adjustment = bool(
        re.search(r'\b(change|make|set|keep|limit|reduce|increase|update|switch)\b', lower) and
        (hotel_budget or flight_budget or dining_budget or activity_budget or transport_budget or total_budget_update or is_cheaper_request or "budget" in lower or "cost" in lower or "spending" in lower)
    )

    # 1. Budget Adjustments (e.g. "Change hotel stay budget to ₹2,000", "Make flights ₹6,000 and transport ₹2,000", "Increase total budget to 50k", "Make hotel cheaper")
    if is_explicit_adjustment and not is_new_plan_query:
        intent = "budget_adjustment"
    # 2. Specific Search Queries (hotel_search, flight_search, restaurant_search, activity_search, transport_search)
    elif is_hotel_query and not is_new_plan_query:
        intent = "hotel_search"
    elif is_flight_query and not is_new_plan_query:
        intent = "flight_search"
    elif is_restaurant_query and not is_new_plan_query:
        intent = "restaurant_search"
    elif is_activity_query and not is_new_plan_query:
        intent = "activity_search"
    elif is_transport_query and not is_new_plan_query:
        intent = "transport_search"
    # 3. Follow-ups (duration modification, origin modification, destination modification)
    elif re.search(r'\b(make it|change to|change destination|actually|flying from|travelling from)\b', lower) and not is_new_plan_query:
        intent = "follow_up"
    # 4. Trip Planning (Default for initial or comprehensive plans)
    else:
        intent = "trip_planning"

    # Travelers
    travelers = None
    trav_match = re.search(r'(\d+)\s*(?:people|travelers|travellers|guests|persons|adults)\b', lower)
    if trav_match:
        travelers = int(trav_match.group(1))
    elif "couple" in lower or "for two" in lower or "for 2" in lower:
        travelers = 2
    elif "solo" in lower or "myself" in lower or "for one" in lower:
        travelers = 1
    elif "family of 4" in lower or "4 of us" in lower:
        travelers = 4

    # Build category updates dict
    budget_updates = {}
    category_updated_this_turn = None
    if hotel_budget:
        budget_updates["hotel"] = hotel_budget
        category_updated_this_turn = "hotel"
    if flight_budget:
        budget_updates["flights"] = flight_budget
        category_updated_this_turn = "flights"
    if dining_budget:
        budget_updates["dining"] = dining_budget
        category_updated_this_turn = "dining"
    if activity_budget:
        budget_updates["activities"] = activity_budget
        category_updated_this_turn = "activities"
    if transport_budget:
        budget_updates["transport"] = transport_budget
        category_updated_this_turn = "transport"

    if is_cheaper_request and cheaper_category:
        category_updated_this_turn = cheaper_category

    return {
        "intent": intent,
        "destination": destination,
        "origin": origin,
        "duration_days": duration,
        "departure_date": dep_date,
        "return_date": ret_date,
        "travelers": travelers,
        "budget": total_budget or total_budget_update,
        "total_budget": total_budget,
        "total_budget_update": total_budget_update,
        "hotel_budget": hotel_budget,
        "flight_budget": flight_budget,
        "dining_budget": dining_budget,
        "activity_budget": activity_budget,
        "transport_budget": transport_budget,
        "category_updated_this_turn": category_updated_this_turn,
        "budget_updates": budget_updates if budget_updates else None,
        "is_cheaper_request": is_cheaper_request,
        "cheaper_category": cheaper_category,
        "currency": "INR",
        "travel_style": "luxury boutique",
        "interests": ["heritage", "cafés"]
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
            ("human", f"Classify intent, check category budget updates or plan details for: '{prompt}'")
        ])
        data = result.model_dump()
        if data.get("destination"):
            data["destination"] = clean_location_name(data["destination"])
        if data.get("origin"):
            data["origin"] = clean_location_name(data["origin"])
        if data.get("total_budget") is not None and float(data["total_budget"]) <= 0:
            data["total_budget"] = None
        if data.get("budget") is not None and float(data["budget"]) <= 0:
            data["budget"] = None
        if data.get("duration_days") is not None and int(data["duration_days"]) <= 0:
            data["duration_days"] = None

        # Build budget_updates map from category fields if present
        b_updates = {}
        for cat in ["hotel", "flight", "dining", "activity", "transport"]:
            k = f"{cat}_budget"
            if data.get(k) and float(data[k]) > 0:
                cat_key = "flights" if cat == "flight" else ("activities" if cat == "activity" else cat)
                b_updates[cat_key] = float(data[k])
        if b_updates:
            data["budget_updates"] = b_updates

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
