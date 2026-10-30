
import { supabase } from "./supabase";
import type { ItineraryResponse } from "./api";

// Save a newly generated trip
export async function saveTrip(itineraryData: ItineraryResponse) {
  const { data: userData, error: userError } =
    await supabase.auth.getUser();

  if (userError || !userData.user) {
    throw new Error("Please log in before saving your trip.");
  }

  let endDate: string | null = null;

  if (itineraryData.travel_date) {
    const date = new Date(itineraryData.travel_date + "T00:00:00");
    date.setDate(date.getDate() + itineraryData.days - 1);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    endDate = `${year}-${month}-${day}`;
  }

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .insert({
      user_id: userData.user.id,
      destination: itineraryData.destination,
      start_date: itineraryData.travel_date,
      end_date: endDate,
      budget: itineraryData.budget,
      travelers: itineraryData.travelers,
    })
    .select()
    .single();

  if (tripError) throw tripError;

  const itineraryRows = itineraryData.itinerary.map((day) => ({
    trip_id: trip.id,
    day_number: day.day,
    morning: day.morning,
    afternoon: day.afternoon,
    evening: day.evening,
    estimated_daily_cost: null,
  }));

  if (itineraryRows.length > 0) {
    const { error } = await supabase
      .from("itineraries")
      .insert(itineraryRows);

    if (error) {
      await supabase.from("trips").delete().eq("id", trip.id);
      throw error;
    }
  }

  return trip;
}

// Get all trips belonging to the logged-in user
export async function getMyTrips() {
  const { data: userData, error: userError } =
    await supabase.auth.getUser();

  if (userError || !userData.user) {
    throw new Error("Please log in to view your trips.");
  }

  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data;
}

// Get the daily itinerary for a selected trip
export async function getTripItinerary(tripId: string) {
  const { data, error } = await supabase
    .from("itineraries")
    .select("*")
    .eq("trip_id", tripId)
    .order("day_number", { ascending: true });

  if (error) throw error;

  return data;
}

// Delete a saved trip and its itinerary
export async function deleteTrip(tripId: string) {
  const { error: itineraryError } = await supabase
    .from("itineraries")
    .delete()
    .eq("trip_id", tripId);

  if (itineraryError) throw itineraryError;

  const { error: tripError } = await supabase
    .from("trips")
    .delete()
    .eq("id", tripId);

  if (tripError) throw tripError;
}

// ------------------------------------
// SAVED PLACES FUNCTIONS
// ------------------------------------

// Save a destination to the user's Saved Places
export async function savePlace(
  placeName: string,
  location: string
) {
  const { data: userData, error: userError } =
    await supabase.auth.getUser();

  if (userError || !userData.user) {
    throw new Error("Please log in to save places.");
  }

  // Avoid saving the same place twice for this user
  const { data: existingPlace, error: checkError } = await supabase
    .from("saved_places")
    .select("id")
    .eq("user_id", userData.user.id)
    .eq("place_name", placeName)
    .maybeSingle();

  if (checkError) throw checkError;

  if (existingPlace) {
    return existingPlace;
  }

  const { data, error } = await supabase
    .from("saved_places")
    .insert({
      user_id: userData.user.id,
      place_name: placeName,
      location: location,
      trip_id: null,
      notes: null,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

// Get all saved places for the logged-in user
export async function getSavedPlaces() {
  const { data: userData, error: userError } =
    await supabase.auth.getUser();

  if (userError || !userData.user) {
    throw new Error("Please log in to view saved places.");
  }

  const { data, error } = await supabase
    .from("saved_places")
    .select("*")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data;
}

// Remove a place from Saved Places
export async function removeSavedPlace(placeId: string) {
  const { data: userData, error: userError } =
    await supabase.auth.getUser();

  if (userError || !userData.user) {
    throw new Error("Please log in to manage saved places.");
  }

  const { error } = await supabase
    .from("saved_places")
    .delete()
    .eq("id", placeId)
    .eq("user_id", userData.user.id);

  if (error) throw error;
}
