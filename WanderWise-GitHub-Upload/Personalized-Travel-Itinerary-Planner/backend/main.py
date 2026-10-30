
import os
import json
from pathlib import Path
from datetime import date
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from groq import Groq
from supabase import create_client, Client


# =========================================================
# 1. LOAD ENVIRONMENT VARIABLES
# =========================================================

BASE_DIR = Path(__file__).resolve().parent
ENV_PATH = BASE_DIR / ".env"

load_dotenv(dotenv_path=ENV_PATH, override=True)

SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip()
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY", "").strip()
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()


# =========================================================
# 2. INITIALIZE SUPABASE
# =========================================================

supabase: Optional[Client] = None

if SUPABASE_URL and SUPABASE_SECRET_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)
        print("Supabase client initialized successfully.", flush=True)
    except Exception as e:
        print("Supabase initialization failed:", str(e), flush=True)
else:
    print("Supabase configuration missing.", flush=True)


# =========================================================
# 3. INITIALIZE FASTAPI
# =========================================================

app = FastAPI(
    title="WanderWise API",
    description="Personalized Travel Itinerary Planner API",
    version="1.0.0"
)

# Set FRONTEND_URL on Render to your deployed Vercel URL.
# Multiple origins can be separated with commas.
configured_origins = os.getenv("FRONTEND_URL", "").strip()
allowed_origins = [
    origin.strip().rstrip("/")
    for origin in configured_origins.split(",")
    if origin.strip()
]
allowed_origins.extend([
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
])

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(dict.fromkeys(allowed_origins)),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# 4. BASIC ROUTES
# =========================================================

@app.get("/")
def home():
    return {
        "success": True,
        "message": "Welcome to WanderWise API!"
    }


@app.get("/health")
def health_check():
    return {
        "success": True,
        "status": "Backend is running"
    }


@app.get("/supabase-status")
def supabase_status():
    return {
        "configured": supabase is not None,
        "message": (
            "Supabase connected and initialized"
            if supabase is not None
            else "Supabase configuration is missing"
        )
    }


@app.get("/test-database")
def test_database():
    if supabase is None:
        raise HTTPException(
            status_code=503,
            detail="Supabase is not configured."
        )

    try:
        result = supabase.table("trips").select("id").limit(1).execute()

        return {
            "success": True,
            "message": "Database connection successful",
            "records_found": len(result.data or [])
        }

    except Exception as e:
        print("DATABASE ERROR:", str(e), flush=True)

        raise HTTPException(
            status_code=500,
            detail="Could not connect to the database."
        )


# =========================================================
# 5. TRIP REQUEST MODEL
# =========================================================

class TripRequest(BaseModel):
    destination: str = Field(min_length=1, max_length=100)

    travel_date: Optional[date] = None

    travelers: int = Field(default=2, ge=1, le=20)

    days: int = Field(default=3, ge=1, le=14)

    budget: float = Field(default=10000, gt=0)

    interests: list[str] = Field(default_factory=list)

    dietary_preference: str = "No restriction"

    travel_pace: str = "Balanced"

    travel_vibe: str = "Budget"


# =========================================================
# 6. GENERATE PERSONALIZED ITINERARY
# =========================================================

@app.post("/generate-itinerary")
def generate_itinerary(request: TripRequest):

    # Validate destination
    destination = request.destination.strip()

    if not destination:
        raise HTTPException(
            status_code=400,
            detail="Please provide a destination."
        )

    # Check Groq API key
    groq_api_key = os.getenv("GROQ_API_KEY", "").strip()

    if not groq_api_key:
        raise HTTPException(
            status_code=500,
            detail="Groq API key is missing. Check backend/.env."
        )

    # Initialize Groq client
    try:
        client = Groq(api_key=groq_api_key)
    except Exception as e:
        print("GROQ INITIALIZATION ERROR:", str(e), flush=True)

        raise HTTPException(
            status_code=500,
            detail="Could not initialize the AI service."
        )

    # Default interests
    interests = request.interests or [
        "local attractions",
        "food",
        "sightseeing"
    ]

    # Build AI prompt
    prompt = f"""
You are WanderWise, an expert personalized travel planner.

Create a practical travel itinerary using these details:

Destination: {destination}
Start date: {request.travel_date or "Not specified"}
Number of travelers: {request.travelers}
Trip duration: {request.days} days
Total trip budget: {request.budget} INR
Interests: {", ".join(interests)}

Dietary preference: {request.dietary_preference}
Travel pace: {request.travel_pace}
Travel vibe: {request.travel_vibe}

IMPORTANT REQUIREMENTS:

1. Generate exactly {request.days} days.
2. Every day must have morning, afternoon and evening activities.
3. Personalize the activities to the destination.
4. Respect the user's dietary preference.
5. Follow the requested travel pace:
   - Relaxed: fewer activities and more rest.
   - Balanced: comfortable mix of activities and rest.
   - Fast-paced: more activities.
6. Match the requested travel vibe:
   - Budget: affordable experiences.
   - Adventure: outdoor and adventurous experiences.
   - Luxury: premium experiences.
   - Cultural: historical and cultural experiences.
7. Respect the total budget as reasonably as possible.
8. Consider practical travel distances.
9. Do not invent exact prices, opening hours or confirmed reservations.
10. Return valid JSON only.

Use exactly this JSON structure:

{{
    "itinerary": [
        {{
            "day": 1,
            "title": "Day title",
            "morning": "Morning activity description",
            "afternoon": "Afternoon activity description",
            "evening": "Evening activity description"
        }}
    ],
    "note": "Recommendations should be verified before travel."
}}
"""

    # Call Groq API
    try:
        completion = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are WanderWise, a professional travel planner. "
                        "Generate practical personalized travel itineraries. "
                        "Always return valid JSON."
                    )
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            response_format={"type": "json_object"},
            temperature=0.7
        )

        content = completion.choices[0].message.content

        if not content:
            raise ValueError("Empty response received from Groq.")

        ai_result = json.loads(content)

        itinerary = ai_result.get("itinerary")

        # Validate AI response
        if not isinstance(itinerary, list):
            raise ValueError("Invalid itinerary format.")

        if len(itinerary) != request.days:
            raise ValueError("Incorrect number of itinerary days.")

        for index, day in enumerate(itinerary, start=1):

            if not isinstance(day, dict):
                raise ValueError("Invalid day format.")

            day["day"] = index

            day.setdefault("title", f"Day {index}")

            for period in ("morning", "afternoon", "evening"):

                activity = day.get(period)

                if not isinstance(activity, str) or not activity.strip():
                    raise ValueError(
                        f"Missing {period} activity on day {index}."
                    )

        # Return successful response
        return {
            "success": True,
            "destination": destination,
            "travel_date": (
                request.travel_date.isoformat()
                if request.travel_date
                else None
            ),
            "travelers": request.travelers,
            "days": request.days,
            "budget": request.budget,
            "interests": interests,
            "dietary_preference": request.dietary_preference,
            "travel_pace": request.travel_pace,
            "travel_vibe": request.travel_vibe,
            "itinerary": itinerary,
            "note": ai_result.get(
                "note",
                "Recommendations should be verified before travel."
            )
        }

    except HTTPException:
        raise

    except Exception as e:
        print(
            "GROQ ITINERARY ERROR:",
            type(e).__name__,
            str(e),
            flush=True
        )

        raise HTTPException(
            status_code=502,
            detail="Could not generate itinerary. Check the backend terminal for the error."
        )


# =========================================================
# 7. RUN SERVER
# =========================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8001,
        reload=True
    )