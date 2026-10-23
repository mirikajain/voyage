# Voyage — Autonomous AI Luxury Travel Concierge & Disruption Agent

> An intelligent, autonomous travel planning and real-time disruption management system powered by Gemini, LangGraph, FastAPI, and modern React.

---

## Key Features

1. **AI-Powered Travel Planning** — Understands user requests, preferences, budget, destination, and trip duration to generate personalized itineraries.
2. **Agentic AI Workflow** — Uses Gemini and LangGraph to process user intent and coordinate tasks instead of relying on a simple chatbot response.
3. **Flight Information** — Integrates Aviationstack to retrieve flight information where supported by the API plan.
4. **Places Discovery** — Uses Google Places to find relevant attractions, restaurants, and destinations.
5. **Personalized Itineraries** — Organizes travel recommendations into a structured, easy-to-follow plan.
6. **Interactive User Interface** — Provides a modern travel dashboard with itinerary options, progress indicators, and an activity audit log.
7. **Error Handling and Fallbacks** — Aims to handle invalid prompts, unavailable APIs, and AI failures gracefully.
8. **Scalable Architecture** — Built with React, Vite, Tailwind CSS, FastAPI, and LangGraph, with deployment options such as Vercel and Render.

### What makes it different?
* **Reduces the need to switch between multiple travel-planning platforms.**
* **Combines AI reasoning with external travel data.**
* **Focuses on actionable travel plans rather than just conversational recommendations.**
* **Can be extended with booking, payment, and further personalization features.**

---

## Scope Guardrails & Security Architecture

Voyage implements a multi-layered production guardrail system that ensures the agent strictly stays within its intended travel domain while maintaining high responsiveness:

1. **Input Scope Classification** (`app/agent/guardrails.py`):
   - Fast deterministic classification with zero latency overhead and zero external token consumption.
   - Categorizes inputs into `IN_SCOPE`, `TRAVEL_ADJACENT`, `OUT_OF_SCOPE`, `PROMPT_INJECTION`, or `AMBIGUOUS`.
   - Rejects out-of-scope requests (coding, math tutoring, recipes, unrelated lifestyle questions) immediately before running expensive LLM calls or external APIs.
   - Detects prompt injection and instruction override attempts, redirecting politely without exposing internal directives.
   - Solicits brief clarifications for ambiguous or under-specified queries.

2. **Conversation Context Awareness**:
   - Preserves state across multi-turn interactions. Contextual follow-ups (e.g., *"What alternatives do I have?"*, *"Which one is cheaper?"*, *"Can we do 3 days instead?"*) remain accepted when continuing an active travel task.
   - Ensures previous travel context does not grant a blanket pass to unrelated topics introduced later.

3. **Tool Execution Protection & Allowlisting**:
   - Backend-enforced tool permission allowlist prevents arbitrary code execution, unauthorized URL fetching, or unsanctioned tool invocations.
   - Validates arguments against strict schemas.
   - Protects consequential actions (e.g. Razorpay order creation and payment confirmation) by strictly requiring human approval.

4. **Indirect Prompt Injection Neutralization**:
   - Automatically sanitizes untrusted retrieved data (partner reviews, airline notices, hotel descriptions) to strip out malicious system commands before model ingestion.

5. **Safe Output Validation**:
   - Automatically redacts API keys, credentials, and internal prompt leak fragments.
   - Prevents the agent from claiming completed bookings or processed payments unless verified by backend transaction state.
   - Ensures transparent, honest explanations when external partner services encounter rate limits or outages.

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **Backend**: FastAPI, Python 3.14+, LangGraph, LangChain, Google Gemini API
- **External Providers**: Aviationstack API (Flights), Google Places API (Accommodations & Dining), Razorpay (Secure checkout)
- **Deployment**: Vercel (Frontend), Render (FastAPI Backend)

---

## Local Development Setup

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env # Configure GOOGLE_API_KEY, AVIATIONSTACK_API_KEY, etc.
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Running Test Suite

```bash
cd backend
source .venv/bin/activate
PYTHONPATH=. pytest tests/test_guardrails.py -v
```
