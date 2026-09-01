import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from app.api.agent import router as agent_router
from app.api.payment import router as payment_router

app = FastAPI(
    title="Voyage AI Concierge & Financial Backend",
    description="LangGraph-powered autonomous travel intelligence and Razorpay financial guardrails API",
    version="1.0.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(agent_router, prefix="/api")
app.include_router(agent_router)
app.include_router(payment_router, prefix="/api")
app.include_router(payment_router)

@app.get("/")
async def root():
    return {
        "service": "Voyage AI Concierge Backend",
        "version": "1.0.0",
        "engine": "LangGraph + FastAPI",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
