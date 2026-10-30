
const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8001").replace(/\/$/, "");

export async function testBackend() {
  const response = await fetch(`${API_URL}/health`);

  if (!response.ok) {
    throw new Error("Backend health check failed");
  }

  return response.json();
}

export interface TripRequest {
  destination: string;
  travel_date: string | null;
  travelers: number;
  days: number;
  budget: number;
  interests: string[];
  dietary_preference: string;
  travel_pace: string;
  travel_vibe: string;
}

export interface ItineraryDay {
  day: number;
  title: string;
  morning: string;
  afternoon: string;
  evening: string;
}

export interface ItineraryResponse {
  success: boolean;
  destination: string;
  travel_date: string | null;
  travelers: number;
  days: number;
  budget: number;
  interests: string[];
  dietary_preference: string;
  travel_pace: string;
  travel_vibe: string;
  itinerary: ItineraryDay[];
  note: string;
}

export async function generateItinerary(
  trip: TripRequest
): Promise<ItineraryResponse> {
  const response = await fetch(`${API_URL}/generate-itinerary`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(trip),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.detail || "Could not generate itinerary");
  }

  return response.json();
}