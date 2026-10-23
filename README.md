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
PYTHONPATH=. pytest tests/ -v
```
