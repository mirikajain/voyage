"""
Voyage AI Travel Agent - Production Scope Guardrails & Security System
Implements a layered input, execution, and output guardrail architecture ensuring
the agent only handles requests within the travel domain, enforces server-side tool safety,
protects against direct & indirect prompt injection, and prevents fabricated outputs.
"""

from enum import Enum
from typing import Dict, Any, Optional, Tuple, List, Set, Union
import re
import logging

logger = logging.getLogger("voyage.guardrails")

# ==============================================================================
# 1. SCOPE CATEGORIES & DATA CONTRACTS
# ==============================================================================

class ScopeCategory(str, Enum):
    IN_SCOPE = "IN_SCOPE"
    TRAVEL_ADJACENT = "TRAVEL_ADJACENT"
    OUT_OF_SCOPE = "OUT_OF_SCOPE"
    PROMPT_INJECTION = "PROMPT_INJECTION"
    AMBIGUOUS = "AMBIGUOUS"

class GuardrailResult:
    def __init__(
        self,
        category: ScopeCategory,
        is_allowed: bool,
        confidence: float,
        reason: str,
        action: str,  # "allow" | "reject" | "clarify"
        suggested_response: Optional[str] = None
    ):
        self.category = category
        self.is_allowed = is_allowed
        self.confidence = confidence
        self.reason = reason
        self.action = action
        self.suggested_response = suggested_response

    def to_dict(self) -> Dict[str, Any]:
        return {
            "category": self.category.value,
            "is_allowed": self.is_allowed,
            "confidence": self.confidence,
            "reason": self.reason,
            "action": self.action,
            "suggested_response": self.suggested_response
        }

    def __repr__(self) -> str:
        return f"<GuardrailResult category={self.category.value} allowed={self.is_allowed} action={self.action} conf={self.confidence:.2f}>"

# Standard Responses
STANDARD_OUT_OF_SCOPE_RESPONSE = (
    "I'm your travel assistant, so I can help with flights, disruptions, hotels, "
    "itineraries, airport transfers, and related travel arrangements. "
    "I can't help with unrelated requests, but I'd be happy to assist with your travel plans."
)

STANDARD_CLARIFICATION_RESPONSE = (
    "I'd be glad to assist with your travel. Could you share your destination, dates, "
    "or what specific travel arrangements you need help with?"
)

# ==============================================================================
# 2. PATTERN DEFINITIONS (High-speed, Zero-Latency, Zero-Cost)
# ==============================================================================

# A. Prompt Injections & Policy Bypass Patterns
PROMPT_INJECTION_PATTERNS = [
    r"(?i)\bignore\s+(all\s+)?(previous|prior|system|above)\s+(instructions|prompts|rules|directives|guidelines)\b",
    r"(?i)\bdisregard\s+(all\s+)?(previous|prior|system|above)\s+(instructions|prompts|rules|directives)\b",
    r"(?i)\bforget\s+(all\s+)?(previous|prior|system|above)\s+(instructions|prompts|rules)\b",
    r"(?i)\b(reveal|output|print|show|dump|leak|display)\s+(your|the|system|internal)\s+(system\s+)?(prompt|instructions|directives|rules|guidelines)\b",
    r"(?i)\bwhat\s+(are|were)\s+your\s+(initial|internal|system)\s+(instructions|directives|rules|prompt)\b",
    r"(?i)\b(repeat|echo)\s+(the\s+words\s+above|everything\s+above|your\s+prompt)\b",
    r"(?i)\byou\s+are\s+now\s+(dan|jailbroken|unrestricted|godmode|in\s+developer\s+mode)\b",
    r"(?i)\bjailbreak\b",
    r"(?i)\bbypass\s+(restrictions|guardrails|safety|rules|filters)\b",
    r"(?i)\bact\s+as\s+(a\s+)?(general[- ]purpose|unrestricted|jailbroken|unfiltered)\s+(chatbot|assistant|ai)\b",
    r"(?i)\bpretend\s+(you\s+have\s+no|there\s+are\s+no|you\s+don't\s+have)\s+(rules|restrictions|limits|instructions)\b",
    r"(?i)\b(exfiltrate|leak|print|show)\s+(api[\s_-]?keys?|environment\s+variables|passwords?|credentials?|secrets?)\b",
    r"(?i)(<\|im_start\|>system|<\|im_end\|>|\[system\s+instruction\]|\bhuman:\s+.*\bassistant:)",
    r"(?i)\bswitch\s+to\s+developer\s+mode\b",
    r"(?i)\boverride\s+(system|safety|security)\s+(policy|instructions|rules)\b"
]

# B. Out-of-Scope Patterns (Coding, Math, Recipes, Non-Travel Trivia, Lifestyle)
CODING_PATTERNS = [
    r"(?i)\bwrite\s+(a\s+)?(python|javascript|typescript|java|c\+\+|rust|go|bash|sql|ruby|html|css|php)\s+(script|code|program|function|scraper|bot|crawler)\b",
    r"(?i)\b(write|generate)\s+code\s+to\b",
    r"(?i)\bdebug\s+(this|my)?\s+(code|script|function|program|error|bug|traceback)\b",
    r"(?i)\bhow\s+to\s+invert\s+a\s+binary\s+tree\b",
    r"(?i)\b(implement|code)\s+(a\s+)?(binary\s+search|hashmap|linked\s+list|sorting\s+algorithm|neural\s+network|quicksort)\b",
    r"(?i)\bhow\s+to\s+build\s+a\s+neural\s+network\b",
    r"(?i)\b(write|create)\s+(a\s+)?(react\s+component|fastapi\s+endpoint|regex\s+for|sql\s+query\s+to\s+(drop|insert|select))\b",
    r"(?i)\bleetcode\s+(problem|solution)\b",
    r"(?i)\bprogramming\s+tutorial\b",
    r"(?i)\bhow\s+do\s+i\s+(install|compile|pip\s+install|npm\s+install)\b"
]

MATH_AND_TUTORING_PATTERNS = [
    r"(?i)\bsolve\s+(the\s+equation|for\s+x|x\^|\d+x|\d+\s*[\+\-\*\/]\s*\d+)\b",
    r"(?i)\b(derivative|integral|eigenvalue|quadratic\s+formula|pythagorean\s+theorem)\s+of\b",
    r"(?i)\bwrite\s+(an?\s+)?essay\s+(on|about)\s+(the\s+renaissance|shakespeare|world\s+war|global\s+warming|democracy)\b",
    r"(?i)\bhomework\s+(help|assignment|tutoring)\b",
    r"(?i)\bexplain\s+(photosynthesis|mitosis|quantum\s+mechanics|general\s+relativity|string\s+theory)\b",
    r"(?i)\bwho\s+was\s+(napoleon|julius\s+caesar|abraham\s+lincoln|cleopatra|alexander\s+the\s+great)\b",
    r"(?i)\bwho\s+won\s+the\s+(\d{4}\s+)?(world\s+cup|super\s+bowl|nba\s+finals|olympics)\b"
]

RECIPE_AND_LIFESTYLE_PATTERNS = [
    r"(?i)\brecipe\s+for\s+(chocolate\s+cake|brownies|cookies|lasagna|pasta|pizza|soup|bread|curry)\b",
    r"(?i)\bhow\s+to\s+bake\s+(a\s+)?(cake|bread|cookies|pie)\b",
    r"(?i)\bhow\s+to\s+cook\s+(pasta|chicken|steak|rice|eggs)\b",
    r"(?i)\bingredients\s+for\s+(lasagna|brownies|cake|cookies)\b",
    r"(?i)\bworkout\s+(routine|plan|split)\b",
    r"(?i)\bdiagnose\s+my\s+(symptom|fever|cough|headache|rash)\b",
    r"(?i)\bprescribe\s+(medication|antibiotics|pills)\b",
    r"(?i)\bstock\s+market\s+(prediction|tips|analysis|advice)\b",
    r"(?i)\b(crypto|bitcoin|ethereum)\s+(trading|investment)\b",
    r"(?i)\btell\s+me\s+a\s+(bedtime\s+story|fairy\s+tale)\s+about\b",
    r"(?i)\bwrite\s+(a\s+)?poem\s+about\s+(dragons|unicorns|love|cats|dogs)\b",
    r"(?i)\bact\s+as\s+my\s+(therapist|psychologist|girlfriend|boyfriend)\b"
]

# C. Allowed Travel Domain Indicators
TRAVEL_CORE_KEYWORDS = [
    "flight", "flights", "flying", "fly", "airline", "airlines", "airport", "airports",
    "terminal", "layover", "boarding", "aviation", "airplane", "aeroplane", "aircraft",
    "itinerary", "vacation", "trip", "holiday", "tour", "travel", "tourism", "destination",
    "hotel", "hotels", "resort", "resorts", "hostel", "hostels", "stay", "stays",
    "accommodation", "accommodations", "villa", "villas", "room", "rooms", "check-in", "checkout",
    "sightseeing", "excursion", "attraction", "attractions", "guide", "day trip", "things to do",
    "activity", "activities", "experience", "experiences", "monument", "monuments",
    "restaurant", "restaurants", "dining", "dinner", "lunch", "breakfast", "cafe", "cafes", "café", "cafés",
    "bistro", "bistros", "eatery", "eateries", "food", "cuisine", "gastronomy", "local dishes",
    "disruption", "delay", "delays", "delayed", "cancellation", "cancelled", "cancel",
    "reschedule", "rebook", "rebooking", "compensation", "claim", "claims", "refund",
    "baggage", "luggage", "carry-on", "lost baggage", "notam", "aviationstack",
    "transfer", "transfers", "taxi", "taxis", "cab", "cabs", "shuttle", "transport",
    "car rental", "rental car", "train", "metro", "transit", "uber", "driver",
    "travel insurance", "insurance", "policy", "visa", "passport", "consulate", "customs",
    "boarding pass", "gate", "runway", "jet lag", "currency", "forex", "exchange rate",
    "goa", "mumbai", "delhi", "bangalore", "jaipur", "paris", "tokyo", "kyoto", "london", "dubai",
    "rome", "bali", "singapore", "new york", "amalfi", "udaipur", "manali", "kashmir", "kerala", "budget", "per night"
]

TRAVEL_ADJACENT_PATTERNS = [
    r"(?i)\bweather\s+(at|in|for|forecast)\b",
    r"(?i)\b(airport|aviation)\s+(weather|conditions|wind|fog|visibility)\b",
    r"(?i)\bnotam\b",
    r"(?i)\b(jet\s+engine|thrust|aerodynamics|turbulence|de-icing)\b",
    r"(?i)\b(baggage|luggage)\s+(allowance|rules|weight|limit)\b",
    r"(?i)\b(visa|passport)\s+(requirements|process|validity|fees|photo)\b",
    r"(?i)\b(travel|trip)\s+insurance\b",
    r"(?i)\bflight\s+(delay|cancellation|disruption)\s+compensation\b",
    r"(?i)\beu\s*261\b",
    r"(?i)\bhow\s+to\s+use\s+(this\s+)?(app|voyage|travel\s+agent)\b",
    r"(?i)\bwhat\s+(features|options)\s+do\s+you\s+have\b"
]

# Follow-up patterns that are legitimate when an active travel context exists
CONTEXTUAL_FOLLOW_UP_PATTERNS = [
    r"(?i)^\s*what\s+alternatives?\s+(do\s+i\s+have|are\s+there)\??\s*$",
    r"(?i)^\s*which\s+(one\s+)?is\s+(cheaper|cheapest|better|faster)\??\s*$",
    r"(?i)^\s*(what\s+about|show\s+me)\s+(other|cheaper|alternative)\s+(options|flights|hotels)\??\s*$",
    r"(?i)^\s*can\s+we\s+do\s+\d+\s+days?\s+(instead)?\??\s*$",
    r"(?i)^\s*show\s+me\s+more\s+options\??\s*$",
    r"(?i)^\s*(is\s+)?breakfast\s+included\??\s*$",
    r"(?i)^\s*what('s|\s+is)\s+the\s+weather\s+like(\s+there)?\??\s*$",
    r"(?i)^\s*can\s+i\s+cancel\s+(this|it)\??\s*$",
    r"(?i)^\s*(yes|proceed|looks\s+good|book\s+this|confirm|approve)\b",
    r"(?i)^\s*(under|increase\s+to|change\s+budget\s+to)\s*([₹$€£]|inr|rs\.?)?\s*[\d,]+k?\b",
    r"(?i)^\s*what\s+else\s+can\s+we\s+do\??\s*$",
    r"(?i)^\s*any\s+other\s+(flights?|hotels?|activities)\??\s*$"
]

AMBIGUOUS_PATTERNS = [
    r"(?i)^\s*(can\s+you\s+help\s+me|help\s+me|i\s+need\s+help)\??\s*$",
    r"(?i)^\s*(tell\s+me\s+more|more\s+info|more\s+details)\??\s*$",
    r"(?i)^\s*(what\s+do\s+you\s+think|what\s+should\s+i\s+do)\??\s*$",
    r"(?i)^\s*(i\s+have\s+a\s+question|got\s+a\s+question)\??\s*$",
    r"(?i)^\s*(where\s+should\s+i\s+go|any\s+suggestions)\??\s*$",
    r"(?i)^\s*(not\s+sure|maybe|hmm+)\s*$"
]

# ==============================================================================
# 3. INPUT SCOPE CLASSIFIER
# ==============================================================================

def classify_input_scope(
    message: str,
    context: Optional[Dict[str, Any]] = None
) -> GuardrailResult:
    """
    Classifies a user message into one of 5 categories:
    - IN_SCOPE
    - TRAVEL_ADJACENT
    - OUT_OF_SCOPE
    - PROMPT_INJECTION
    - AMBIGUOUS

    Zero-latency, zero-cost, high-precision deterministic engine with context awareness.
    """
    if not message or not isinstance(message, str):
        return GuardrailResult(
            category=ScopeCategory.AMBIGUOUS,
            is_allowed=False,
            confidence=1.0,
            reason="Empty message",
            action="clarify",
            suggested_response=STANDARD_CLARIFICATION_RESPONSE
        )

    clean_msg = message.strip()
    msg_lower = clean_msg.lower()

    # -------------------------------------------------------------
    # Layer 1: Prompt Injection & Instruction Override Detection
    # -------------------------------------------------------------
    for pattern in PROMPT_INJECTION_PATTERNS:
        if re.search(pattern, clean_msg):
            logger.warning(f"[Guardrail] Prompt injection blocked: '{clean_msg[:60]}'")
            return GuardrailResult(
                category=ScopeCategory.PROMPT_INJECTION,
                is_allowed=False,
                confidence=0.99,
                reason="Detected attempt to override system instructions or access internal prompts",
                action="reject",
                suggested_response=STANDARD_OUT_OF_SCOPE_RESPONSE
            )

    # -------------------------------------------------------------
    # Layer 2: Explicit Travel Context Exception Checking
    # (e.g. "Find hotel near my Python conference" has "python" but IS a travel task)
    # -------------------------------------------------------------
    has_explicit_travel_action = any(
        kw in msg_lower for kw in [
            "hotel", "hotels", "flight", "flights", "book", "trip", "itinerary",
            "vacation", "airport", "stay", "accommodation", "transfer",
            "restaurant", "restaurants", "dining", "eatery", "eateries", "cafe", "cafes",
            "activity", "activities", "things to do", "attraction", "attractions", "sightseeing"
        ]
    ) and any(
        kw in msg_lower for kw in [
            "find", "plan", "book", "search", "near", "reserve", "to", "in", "at",
            "top", "best", "recommend", "show", "what", "where"
        ]
    )

    # -------------------------------------------------------------
    # Layer 3: Explicit Out-Of-Scope Detection
    # (Coding, Math/Tutoring, Recipes, Lifestyle)
    # -------------------------------------------------------------
    if not has_explicit_travel_action:
        # Check Coding
        for pattern in CODING_PATTERNS:
            if re.search(pattern, clean_msg):
                logger.info(f"[Guardrail] Out of scope (coding): '{clean_msg[:60]}'")
                return GuardrailResult(
                    category=ScopeCategory.OUT_OF_SCOPE,
                    is_allowed=False,
                    confidence=0.98,
                    reason="Request asks for programming, coding, or technical software development assistance",
                    action="reject",
                    suggested_response=STANDARD_OUT_OF_SCOPE_RESPONSE
                )

        # Check Math & Academic Tutoring
        for pattern in MATH_AND_TUTORING_PATTERNS:
            if re.search(pattern, clean_msg):
                logger.info(f"[Guardrail] Out of scope (math/academic): '{clean_msg[:60]}'")
                return GuardrailResult(
                    category=ScopeCategory.OUT_OF_SCOPE,
                    is_allowed=False,
                    confidence=0.98,
                    reason="Request asks for mathematics, homework tutoring, or academic essays",
                    action="reject",
                    suggested_response=STANDARD_OUT_OF_SCOPE_RESPONSE
                )

        # Check Recipes & Lifestyle
        for pattern in RECIPE_AND_LIFESTYLE_PATTERNS:
            if re.search(pattern, clean_msg):
                logger.info(f"[Guardrail] Out of scope (recipes/lifestyle): '{clean_msg[:60]}'")
                return GuardrailResult(
                    category=ScopeCategory.OUT_OF_SCOPE,
                    is_allowed=False,
                    confidence=0.98,
                    reason="Request asks for recipes, culinary cooking instructions, or unrelated lifestyle advice",
                    action="reject",
                    suggested_response=STANDARD_OUT_OF_SCOPE_RESPONSE
                )

    # -------------------------------------------------------------
    # Layer 4: Conversation Context Awareness for Multi-Turn Follow-ups
    # -------------------------------------------------------------
    has_active_context = False
    if context and isinstance(context, dict):
        has_active_context = bool(
            context.get("destination") or
            context.get("itinerary") or
            context.get("selected_flight") or
            context.get("selected_hotel") or
            context.get("disruption_detected") or
            context.get("recovery_status") or
            context.get("budget") or
            (context.get("agent_events") and len(context.get("agent_events")) > 0)
        )

    if has_active_context:
        for pattern in CONTEXTUAL_FOLLOW_UP_PATTERNS:
            if re.search(pattern, clean_msg):
                logger.info(f"[Guardrail] In-scope contextual follow-up: '{clean_msg[:60]}'")
                return GuardrailResult(
                    category=ScopeCategory.IN_SCOPE,
                    is_allowed=True,
                    confidence=0.96,
                    reason="Legitimate conversational follow-up to ongoing travel task",
                    action="allow"
                )

    # -------------------------------------------------------------
    # Layer 5: Ambiguous Queries (Require Clarification)
    # -------------------------------------------------------------
    # Only flag as ambiguous if not already qualified by strong travel keywords
    has_travel_kw = any(kw in msg_lower for kw in TRAVEL_CORE_KEYWORDS)

    if not has_travel_kw and not has_active_context:
        for pattern in AMBIGUOUS_PATTERNS:
            if re.search(pattern, clean_msg):
                return GuardrailResult(
                    category=ScopeCategory.AMBIGUOUS,
                    is_allowed=False,
                    confidence=0.85,
                    reason="Query lacks sufficient detail to determine travel intent",
                    action="clarify",
                    suggested_response=STANDARD_CLARIFICATION_RESPONSE
                )
        
        # Very short greetings or utterances without any context
        if len(msg_lower.split()) <= 2 and msg_lower in ["hi", "hello", "hey", "hola", "yo", "help"]:
            return GuardrailResult(
                category=ScopeCategory.AMBIGUOUS,
                is_allowed=False,
                confidence=0.90,
                reason="General greeting without specific travel destination or requirements",
                action="clarify",
                suggested_response="Hello! I'm your AI travel concierge. Where would you like to travel, or how can I assist with your flights, hotels, and itinerary?"
            )

    # -------------------------------------------------------------
    # Layer 6: Travel-Adjacent Scope
    # -------------------------------------------------------------
    for pattern in TRAVEL_ADJACENT_PATTERNS:
        if re.search(pattern, clean_msg):
            return GuardrailResult(
                category=ScopeCategory.TRAVEL_ADJACENT,
                is_allowed=True,
                confidence=0.92,
                reason="Directly supports travel decision-making, conditions, policies, or application features",
                action="allow"
            )

    # -------------------------------------------------------------
    # Layer 7: In-Scope Core Travel Domain
    # -------------------------------------------------------------
    if has_travel_kw or has_explicit_travel_action:
        return GuardrailResult(
            category=ScopeCategory.IN_SCOPE,
            is_allowed=True,
            confidence=0.95,
            reason="Directly relates to travel planning, bookings, flights, stays, or disruptions",
            action="allow"
        )

    # -------------------------------------------------------------
    # Layer 8: Fallback - If not travel-related, reject safely
    # -------------------------------------------------------------
    # If the user message had no travel keywords, no travel-adjacent triggers,
    # and no active context, it's out of scope.
    logger.info(f"[Guardrail] Default reject out-of-scope message: '{clean_msg[:60]}'")
    return GuardrailResult(
        category=ScopeCategory.OUT_OF_SCOPE,
        is_allowed=False,
        confidence=0.88,
        reason="Query does not relate to travel planning, flights, hotels, or destination services",
        action="reject",
        suggested_response=STANDARD_OUT_OF_SCOPE_RESPONSE
    )

# ==============================================================================
# 4. TOOL EXECUTION GUARDRAILS (Backend Tool Permission & Safety Enforcement)
# ==============================================================================

ALLOWED_TOOLS: Set[str] = {
    "search_flights",
    "search_hotels",
    "search_restaurants",
    "search_activities",
    "search_transport",
    "calculate_total_cost",
    "evaluate_budget_cushion",
    "generate_optimized_options",
    "spend_guardrail_check",
    "prepare_human_approval_request",
    "create_razorpay_order",
    "confirm_razorpay_payment"
}

DISALLOWED_PATTERNS = [
    r"(?i)\b(eval|exec|system|popen|subprocess|shell|spawn)\b",
    r"(?i)\b(curl|wget|fetch|axios|request)\b",
    r"(?i)\b(rm\s+-rf|drop\s+table|delete\s+from|update\s+users)\b",
    r"(?i)<script\b",
    r"(?i)javascript:"
]

def validate_tool_execution(
    tool_name: str,
    tool_args: Dict[str, Any],
    state: Optional[Dict[str, Any]] = None
) -> Tuple[bool, Optional[str]]:
    """
    Validates whether a tool invocation is authorized, conforms to argument schemas,
    and adheres to consequential action requirements (e.g. human approval for payments).

    Returns:
        (is_valid: bool, error_message: Optional[str])
    """
    # 1. Tool Allowlist Check
    if tool_name not in ALLOWED_TOOLS:
        return False, f"Tool '{tool_name}' is not in the authorized travel tool allowlist."

    # 2. Argument Sanitization & Malicious String Check
    args_str = str(tool_args)
    for pattern in DISALLOWED_PATTERNS:
        if re.search(pattern, args_str):
            return False, f"Unauthorized code execution pattern detected in tool arguments for '{tool_name}'."

    # 3. Argument Schema & Semantic Validation
    if tool_name == "search_flights":
        dest = tool_args.get("destination")
        if not dest or not isinstance(dest, str) or len(dest.strip()) == 0:
            return False, "Tool 'search_flights' requires a non-empty string for 'destination'."

    elif tool_name == "search_hotels":
        dest = tool_args.get("destination")
        duration = tool_args.get("duration_days")
        if not dest or not isinstance(dest, str):
            return False, "Tool 'search_hotels' requires a non-empty string for 'destination'."
        if duration is not None and (not isinstance(duration, (int, float)) or duration <= 0):
            return False, "Tool 'search_hotels' duration_days must be a positive number."

    elif tool_name in ["create_razorpay_order", "confirm_razorpay_payment"]:
        amount = tool_args.get("amount_in_rupees")
        if amount is None or not isinstance(amount, (int, float)) or amount <= 0:
            return False, f"Tool '{tool_name}' requires a positive amount_in_rupees."

        # Consequential Action Check: Irreversible payment/booking operations MUST have approval!
        state_dict = state or {}
        approval_status = state_dict.get("approval_status")
        is_approved = (approval_status == "approved") or (state_dict.get("approved") is True) or (tool_args.get("user_confirmed") is True)

        if tool_name == "confirm_razorpay_payment" and not is_approved:
            return False, (
                "Consequential action blocked: Payment confirmation requires explicit user authorization. "
                "The agent cannot execute financial transactions autonomously."
            )

    return True, None

# ==============================================================================
# 5. UNTRUSTED RETRIEVED CONTENT SANITIZATION (Indirect Prompt Injection)
# ==============================================================================

def sanitize_retrieved_content(content: Any) -> Any:
    """
    Neutralizes prompt injection attempts embedded in external API responses,
    hotel descriptions, partner reviews, or scraped content.
    """
    if isinstance(content, str):
        # Strip system role overrides and command markers
        cleaned = re.sub(r"(?i)\[system\s+instruction:.*?\]", "[Content Redacted]", content)
        cleaned = re.sub(r"(?i)<\|im_start\|>.*?<\|im_end\|>", "[Content Redacted]", cleaned)
        cleaned = re.sub(r"(?i)\bignore\s+(all\s+)?(previous|prior)\s+instructions\b", "[Instruction Override Redacted]", cleaned)
        cleaned = re.sub(r"(?i)\byou\s+are\s+now\s+dan\b", "[Policy Bypass Redacted]", cleaned)
        return cleaned
    elif isinstance(content, list):
        return [sanitize_retrieved_content(item) for item in content]
    elif isinstance(content, dict):
        return {k: sanitize_retrieved_content(v) for k, v in content.items()}
    return content

# ==============================================================================
# 6. SAFE OUTPUT VALIDATION
# ==============================================================================

SENSITIVE_LEAK_PATTERNS = [
    r"(?i)AIza[0-9A-Za-z\-_]{16,40}",                # Google API Key
    r"(?i)rzp_(test|live)_[0-9a-zA-Z]{14}",          # Razorpay Key
    r"(?i)\bBearer\s+[A-Za-z0-9\._\-]{20,}\b",       # Auth Bearer tokens
    r"(?i)\bsk-[a-zA-Z0-9]{20,}\b",                  # OpenAI / standard secret keys
    r"(?i)INTERNAL\s+SYSTEM\s+PROMPT:",              # Prompt leak marker
    r"(?i)You\s+are\s+an\s+autonomous\s+AI\s+agent\s+created\s+by\s+Voyage"  # Raw identity prompt leak
]

FABRICATED_COMPLETION_PATTERNS = [
    r"(?i)\byour\s+booking\s+(is|has\s+been)\s+(confirmed|completed|finalized)\b",
    r"(?i)\bpayment\s+(of\s+[₹$€£\d,]+\s+)?(has\s+been\s+)?(successfully\s+)?processed\b",
    r"(?i)\byour\s+refund\s+(of\s+[₹$€£\d,]+\s+)?has\s+been\s+(credited|processed|sent)\b"
]

def validate_agent_output(
    output_text: str,
    state: Optional[Dict[str, Any]] = None
) -> Tuple[str, bool]:
    """
    Validates and sanitizes agent output before delivering to the user:
    - Redacts sensitive credentials, API keys, and prompt leak markers.
    - Prevents fabricating booking or payment completion unless confirmed in state.
    - Handles tool failure state honestly without hallucination.

    Returns:
        (sanitized_text: str, is_modified: bool)
    """
    if not output_text:
        return output_text, False

    modified = False
    sanitized = output_text
    state_dict = state or {}

    # 1. Redact Secrets & System Prompt Leaks
    for pattern in SENSITIVE_LEAK_PATTERNS:
        if re.search(pattern, sanitized):
            sanitized = re.sub(pattern, "[CONFIDENTIAL]", sanitized)
            modified = True
            logger.warning("[Guardrail] Redacted sensitive credential or prompt fragment from agent output.")

    # 2. Check for Fabricated Booking / Payment Confirmations
    # If the output claims booking/payment is done, but the backend state does NOT confirm it:
    is_actually_paid = state_dict.get("payment_status") == "paid"
    is_actually_confirmed = state_dict.get("booking_status") == "confirmed"

    if not (is_actually_paid or is_actually_confirmed):
        for pattern in FABRICATED_COMPLETION_PATTERNS:
            if re.search(pattern, sanitized):
                sanitized = re.sub(
                    pattern,
                    "your itinerary proposal has been prepared and requires your confirmation before any charge or booking is finalized",
                    sanitized
                )
                modified = True
                logger.warning("[Guardrail] Corrected unverified booking/payment claim in agent output.")

    # 3. Honest Tool Failure Handling
    # If state recorded an active error, ensure the output doesn't pretend everything succeeded
    if state_dict.get("error"):
        error_msg = str(state_dict.get("error"))
        if "temporary issue" not in sanitized.lower() and "unavailable" not in sanitized.lower() and "apologize" not in sanitized.lower():
            sanitized += f"\n\n*Note: An external partner service reported a temporary issue ({error_msg}). Curated fallback recommendations are provided above.*"
            modified = True

    return sanitized, modified
