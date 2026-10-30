
import { useEffect, useState } from "react";
import { testBackend, generateItinerary } from "./api";
import type { ItineraryResponse } from "./api";
import { supabase } from "./supabase";
import { signUp, login, logout } from "./auth";
import type { User } from "@supabase/supabase-js";

import {
  saveTrip,
  getMyTrips,
  getTripItinerary,
  deleteTrip,
  savePlace,
  getSavedPlaces,
  removeSavedPlace,
} from "./tripStorage";

import {
  Compass,
  MapPin,
  Search,
  CalendarDays,
  ArrowRight,
  Menu,
  Sparkles,
  Heart,
  X,
} from "lucide-react";

import "./App.css";

const destinations = [
  {
    name: "Manali",
    country: "Himachal Pradesh, India",
    image:
      "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=900&q=80",
    price: "₹8,000",
    days: "4 days",
  },
  {
    name: "Jaipur",
    country: "Rajasthan, India",
    image:
      "https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=900&q=80",
    price: "₹5,000",
    days: "3 days",
  },
  {
    name: "Goa",
    country: "India",
    image:
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=900&q=80",
    price: "₹7,000",
    days: "4 days",
  },
];

type SavedTrip = {
  id: string;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  budget: number;
  travelers: number;
  created_at: string;
};

type SavedItineraryDay = {
  id: string;
  day_number: number;
  morning: string;
  afternoon: string;
  evening: string;
};

type SavedPlace = {
  id: string;
  user_id: string;
  place_name: string;
  location: string;
  trip_id: string | null;
  notes: string | null;
  created_at: string;
};

function App() {
  const [myTrips, setMyTrips] = useState<SavedTrip[]>([]);
  const [tripsLoading, setTripsLoading] = useState(false);
  const [tripsError, setTripsError] = useState("");

  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [selectedItinerary, setSelectedItinerary] = useState<
    SavedItineraryDay[]
  >([]);
  const [itineraryLoading, setItineraryLoading] = useState(false);

  // Backend status
  const [backendStatus, setBackendStatus] = useState("Connecting...");

  // Save trip states
  const [savingTrip, setSavingTrip] = useState(false);
  const [savedTripId, setSavedTripId] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState("");

  // Trip form states
  const [destination, setDestination] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [travelers, setTravelers] = useState("2");
  const [days, setDays] = useState("3");
  const [budget, setBudget] = useState("10000");
  const [interests, setInterests] = useState<string[]>(["nature", "food"]);

  // Personalization states
  const [dietaryPreference, setDietaryPreference] =
    useState("No restriction");
  const [travelPace, setTravelPace] = useState("Balanced");
  const [travelVibe, setTravelVibe] = useState("Budget");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [trip, setTrip] = useState<ItineraryResponse | null>(null);

  // Authentication states
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Saved Places states
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [savedPlacesLoading, setSavedPlacesLoading] = useState(false);
  const [savedPlacesError, setSavedPlacesError] = useState("");

  // Check backend connection
  useEffect(() => {
    testBackend()
      .then((data) => setBackendStatus(data.status))
      .catch(() => setBackendStatus("Connection failed"));
  }, []);

  // Check existing Supabase session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setAuthLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  // Load Saved Places whenever authentication changes
  useEffect(() => {
    if (user) {
      handleLoadSavedPlaces();
    } else {
      setSavedPlaces([]);
    }
  }, [user]);

  // Open authentication modal
  function openAuth(mode: "login" | "signup") {
    setAuthMode(mode);
    setAuthError("");
    setAuthMessage("");
    setEmail("");
    setPassword("");
    setShowAuth(true);
  }

  // Handle login and signup
  async function handleAuthSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setAuthError("");
    setAuthMessage("");
    setAuthSubmitting(true);

    try {
      if (authMode === "signup") {
        const data = await signUp(email, password);

        if (data.session) {
          setUser(data.session.user);
          setAuthMessage("Account created successfully!");
          setShowAuth(false);
        } else {
          setAuthMessage(
            "Account created! Please check your email to confirm your account before logging in."
          );
        }
      } else {
        const data = await login(email, password);
        setUser(data.user);
        setAuthMessage("Login successful!");
        setShowAuth(false);
      }
    } catch (err) {
      console.error("Authentication error:", err);
      setAuthError(
        err instanceof Error
          ? err.message
          : "Authentication failed. Please try again."
      );
    } finally {
      setAuthSubmitting(false);
    }
  }

  // Handle logout
  async function handleLogout() {
    try {
      await logout();
      setUser(null);
      setAuthMessage("You have been logged out.");
      setMyTrips([]);
      setSavedPlaces([]);
      setSelectedTripId(null);
      setSelectedItinerary([]);
    } catch (err) {
      console.error("Logout error:", err);
      setAuthError("Could not log out. Please try again.");
    }
  }

  // Toggle interests
  function toggleInterest(interest: string) {
    setInterests((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest]
    );
  }

  // Generate itinerary
  async function handleSearch() {
    if (!destination.trim()) {
      setError("Please enter a destination first.");
      return;
    }

    const budgetAmount = Number(budget);
    const dayCount = Number(days);

    if (!Number.isFinite(budgetAmount) || budgetAmount <= 0) {
      setError("Please enter a budget greater than zero.");
      return;
    }

    if (!Number.isInteger(dayCount) || dayCount < 1 || dayCount > 14) {
      setError("Choose between 1 and 14 days.");
      return;
    }

    setLoading(true);
    setError("");
    setTrip(null);
    setSavedTripId(null);
    setSaveMessage("");

    try {
      const result = await generateItinerary({
        destination: destination.trim(),
        travel_date: travelDate || null,
        travelers: travelers === "5+" ? 5 : Number(travelers),
        days: dayCount,
        budget: budgetAmount,
        interests,
        dietary_preference: dietaryPreference,
        travel_pace: travelPace,
        travel_vibe: travelVibe,
      });

      setTrip(result);

      window.setTimeout(() => {
        document.getElementById("generated-itinerary")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } catch (err) {
      console.error("Itinerary generation failed:", err);
      setError(
        "Couldn't generate your trip. Check that the backend is running and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // Save generated trip to Supabase
  async function handleSaveTrip() {
    if (!user) {
      openAuth("login");
      return;
    }

    if (!trip || savedTripId) {
      return;
    }

    setSavingTrip(true);
    setSaveMessage("");

    try {
      const savedTrip = await saveTrip(trip);

      setSavedTripId(savedTrip.id);
      setSaveMessage("Your trip has been saved successfully! 🎉");
    } catch (err) {
      console.error("Trip saving failed:", err);

      setSaveMessage(
        err instanceof Error
          ? err.message
          : "Could not save your trip. Please try again."
      );
    } finally {
      setSavingTrip(false);
    }
  }

  // Load saved trips
  async function handleLoadTrips() {
    if (!user) {
      openAuth("login");
      return;
    }

    setTripsLoading(true);
    setTripsError("");

    try {
      const data = await getMyTrips();
      setMyTrips(data as SavedTrip[]);
    } catch (err) {
      console.error("Loading trips failed:", err);
      setTripsError("Could not load your trips. Please try again.");
    } finally {
      setTripsLoading(false);
    }
  }

  // Open a saved trip
  async function handleViewTrip(tripId: string) {
    setSelectedTripId(tripId);
    setItineraryLoading(true);
    setSelectedItinerary([]);

    try {
      const data = await getTripItinerary(tripId);
      setSelectedItinerary(data as SavedItineraryDay[]);
    } catch (err) {
      console.error("Loading itinerary failed:", err);
      setTripsError("Could not load this itinerary.");
    } finally {
      setItineraryLoading(false);
    }
  }

  // Delete a saved trip
  async function handleDeleteTrip(tripId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this trip?"
    );

    if (!confirmed) return;

    try {
      await deleteTrip(tripId);
      setMyTrips((current) => current.filter((item) => item.id !== tripId));

      if (selectedTripId === tripId) {
        setSelectedTripId(null);
        setSelectedItinerary([]);
      }
    } catch (err) {
      console.error("Deleting trip failed:", err);
      setTripsError(
        "Could not delete this trip. Check your database permissions."
      );
    }
  }

  // Load saved places from Supabase
  async function handleLoadSavedPlaces() {
    if (!user) {
      setSavedPlaces([]);
      return;
    }

    setSavedPlacesLoading(true);
    setSavedPlacesError("");

    try {
      const data = await getSavedPlaces();
      setSavedPlaces(data as SavedPlace[]);
    } catch (err) {
      console.error("Loading saved places failed:", err);
      setSavedPlacesError(
        err instanceof Error
          ? err.message
          : "Could not load saved places. Please try again."
      );
    } finally {
      setSavedPlacesLoading(false);
    }
  }

  // Save or remove a destination using its heart button
  async function handleToggleSavedPlace(
    placeName: string,
    location: string
  ) {
    if (!user) {
      openAuth("login");
      return;
    }

    const existingPlace = savedPlaces.find(
      (place) => place.place_name === placeName
    );

    try {
      setSavedPlacesError("");

      if (existingPlace) {
        await removeSavedPlace(existingPlace.id);

        setSavedPlaces((current) =>
          current.filter((place) => place.id !== existingPlace.id)
        );
      } else {
        const newPlace = await savePlace(placeName, location);

        setSavedPlaces((current) => {
          if (current.some((place) => place.id === newPlace.id)) {
            return current;
          }

          return [newPlace as SavedPlace, ...current];
        });
      }
    } catch (err) {
      console.error("Updating saved place failed:", err);
      setSavedPlacesError(
        err instanceof Error
          ? err.message
          : "Could not update saved places. Please try again."
      );
    }
  }

  // Remove a place from the Saved Places section
  async function handleRemoveSavedPlace(placeId: string) {
    try {
      setSavedPlacesError("");

      await removeSavedPlace(placeId);

      setSavedPlaces((current) =>
        current.filter((place) => place.id !== placeId)
      );
    } catch (err) {
      console.error("Removing saved place failed:", err);
      setSavedPlacesError(
        err instanceof Error
          ? err.message
          : "Could not remove this place. Please try again."
      );
    }
  }

  return (
    <div className="app">
      <p className="backend-status">Backend status: {backendStatus}</p>

      <header className="navbar">
        <a className="brand" href="#home">
          <span className="brand-icon">
            <Compass size={25} />
          </span>
          <span>WanderWise</span>
        </a>

        <nav className="nav-links">
          <a className="active" href="#home">
            Home
          </a>
          <a href="#explore">Explore</a>
          <a href="#how-it-works">How it works</a>

          <button className="login-button" onClick={handleLoadTrips}>
            My Trips
          </button>

          <a href="#saved-places">Saved Places</a>
        </nav>

        <div className="nav-actions">
          {authLoading ? (
            <span>Loading...</span>
          ) : user ? (
            <>
              <span className="user-email">{user.email}</span>

              <button className="login-button" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <button
                className="login-button"
                onClick={() => openAuth("login")}
              >
                Log in
              </button>

              <button
                className="signup-button"
                onClick={() => openAuth("signup")}
              >
                Get started <ArrowRight size={16} />
              </button>
            </>
          )}
        </div>

        <button
          className="mobile-menu"
          aria-label="Open menu"
          onClick={() => openAuth("login")}
        >
          <Menu size={24} />
        </button>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-overlay" />

          <div className="hero-content">
            <div className="eyebrow">
              <Sparkles size={16} />
              YOUR NEXT ADVENTURE STARTS HERE
            </div>

            <h1>
              Travel more.
              <br />
              <span>Worry less.</span>
            </h1>

            <p className="hero-description">
              Tell us what you love, and let AI create a travel plan that feels
              like it was made just for you.
            </p>

            <div className="search-card">
              <div className="search-field destination-field">
                <MapPin size={21} />

                <div>
                  <label htmlFor="destination">Where to?</label>

                  <input
                    id="destination"
                    type="text"
                    placeholder="Enter a destination"
                    value={destination}
                    onChange={(event) => setDestination(event.target.value)}
                  />
                </div>
              </div>

              <div className="search-divider" />

              <div className="search-field">
                <CalendarDays size={21} />

                <div>
                  <label htmlFor="travel-date">When?</label>

                  <input
                    id="travel-date"
                    type="date"
                    value={travelDate}
                    onChange={(event) => setTravelDate(event.target.value)}
                  />
                </div>
              </div>

              <div className="search-divider" />

              <div className="search-field travelers-field">
                <Compass size={21} />

                <div>
                  <label htmlFor="travelers">Travelers</label>

                  <select
                    id="travelers"
                    value={travelers}
                    onChange={(event) => setTravelers(event.target.value)}
                  >
                    <option value="1">1 traveler</option>
                    <option value="2">2 travelers</option>
                    <option value="3">3 travelers</option>
                    <option value="4">4 travelers</option>
                    <option value="5+">5+ travelers</option>
                  </select>
                </div>
              </div>

              <button
                className="search-button"
                onClick={handleSearch}
                disabled={loading}
              >
                <Search size={19} />
                {loading ? "Planning..." : "Find trips"}
              </button>
            </div>

            <div className="trip-extra-fields">
              <label>
                Trip duration

                <select
                  value={days}
                  onChange={(event) => setDays(event.target.value)}
                >
                  <option value="1">1 day</option>
                  <option value="2">2 days</option>
                  <option value="3">3 days</option>
                  <option value="4">4 days</option>
                  <option value="5">5 days</option>
                  <option value="7">7 days</option>
                  <option value="10">10 days</option>
                  <option value="14">14 days</option>
                </select>
              </label>

              <label>
                Total trip budget (₹)

                <input
                  type="number"
                  min="1"
                  value={budget}
                  onChange={(event) => setBudget(event.target.value)}
                  placeholder="e.g. 10000"
                />
              </label>
            </div>

            {/* Personalization fields */}
            <div className="trip-extra-fields">
              <label>
                Dietary Preference

                <select
                  value={dietaryPreference}
                  onChange={(event) =>
                    setDietaryPreference(event.target.value)
                  }
                >
                  <option value="No restriction">No restriction</option>
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Vegan">Vegan</option>
                  <option value="Jain">Jain</option>
                  <option value="Non-vegetarian">Non-vegetarian</option>
                </select>
              </label>

              <label>
                Travel Pace

                <select
                  value={travelPace}
                  onChange={(event) => setTravelPace(event.target.value)}
                >
                  <option value="Relaxed">Relaxed</option>
                  <option value="Balanced">Balanced</option>
                  <option value="Fast-paced">Fast-paced</option>
                </select>
              </label>

              <label>
                Travel Vibe

                <select
                  value={travelVibe}
                  onChange={(event) => setTravelVibe(event.target.value)}
                >
                  <option value="Budget">Budget</option>
                  <option value="Adventure">Adventure</option>
                  <option value="Luxury">Luxury</option>
                  <option value="Relaxation">Relaxation</option>
                  <option value="Cultural">Cultural</option>
                </select>
              </label>
            </div>

            <div className="interest-options">
              <span>Interests:</span>

              {["nature", "food", "culture", "adventure", "shopping"].map(
                (interest) => (
                  <label key={interest}>
                    <input
                      type="checkbox"
                      checked={interests.includes(interest)}
                      onChange={() => toggleInterest(interest)}
                    />

                    {interest.charAt(0).toUpperCase() + interest.slice(1)}
                  </label>
                )
              )}
            </div>

            {error && (
              <p role="alert" className="trip-error">
                {error}
              </p>
            )}

            <p className="hero-note">
              <Sparkles size={14} />
              Personalized plans, powered by AI
            </p>
          </div>

          <div className="hero-bottom">
            <span>FIND YOUR OWN WAY</span>
            <span>Discover places. Create memories.</span>
          </div>
        </section>

        {/* My Trips section */}
        <section className="my-trips-section" id="my-trips">
          <div className="section-heading">
            <div>
              <p className="section-kicker">YOUR JOURNEY</p>
              <h2>My Trips</h2>

              <p className="section-description">
                All your saved travel plans in one place.
              </p>
            </div>

            <button className="signup-button" onClick={handleLoadTrips}>
              Refresh Trips
            </button>
          </div>

          {tripsLoading && <p>Loading your trips...</p>}
          {tripsError && <p role="alert">{tripsError}</p>}

          {!tripsLoading && myTrips.length === 0 && (
            <p>
              You haven't saved any trips yet. Generate and save your first
              trip!
            </p>
          )}

          <div className="my-trips-grid">
            {myTrips.map((savedTrip) => (
              <article className="my-trip-card" key={savedTrip.id}>
                <h3>{savedTrip.destination}</h3>

                <p>
                  Budget: ₹
                  {Number(savedTrip.budget).toLocaleString("en-IN")}
                </p>

                <p>Travelers: {savedTrip.travelers}</p>

                <p>
                  Start date: {savedTrip.start_date || "Not specified"}
                </p>

                <button
                  className="signup-button"
                  onClick={() => handleViewTrip(savedTrip.id)}
                >
                  View Itinerary
                </button>

                <button
                  className="login-button"
                  onClick={() => handleDeleteTrip(savedTrip.id)}
                >
                  Delete
                </button>
              </article>
            ))}
          </div>

          {selectedTripId && (
            <div className="saved-itinerary">
              <h2>Saved Itinerary</h2>

              {itineraryLoading && <p>Loading itinerary...</p>}

              {!itineraryLoading &&
                selectedItinerary.map((day) => (
                  <article className="itinerary-card" key={day.id}>
                    <h3>Day {day.day_number}</h3>

                    <strong>☀️ Morning</strong>
                    <p>{day.morning}</p>

                    <strong>🌤️ Afternoon</strong>
                    <p>{day.afternoon}</p>

                    <strong>🌙 Evening</strong>
                    <p>{day.evening}</p>
                  </article>
                ))}

              <button
                className="login-button"
                onClick={() => setSelectedTripId(null)}
              >
                Close Itinerary
              </button>
            </div>
          )}
        </section>

        {/* Saved Places section */}
        <section className="my-trips-section" id="saved-places">
          <div className="section-heading">
            <div>
              <p className="section-kicker">YOUR FAVORITES</p>
              <h2>Saved Places ❤️</h2>

              <p className="section-description">
                Destinations you've bookmarked for your next adventure.
              </p>
            </div>

            <button
              className="signup-button"
              onClick={handleLoadSavedPlaces}
            >
              Refresh Places
            </button>
          </div>

          {savedPlacesLoading && <p>Loading saved places...</p>}

          {savedPlacesError && (
            <p role="alert">{savedPlacesError}</p>
          )}

          {!user && (
            <p>Log in to view your saved destinations.</p>
          )}

          {user && !savedPlacesLoading && savedPlaces.length === 0 && (
            <p>
              No saved places yet. Click the heart on a destination to save it!
            </p>
          )}

          <div className="my-trips-grid">
            {savedPlaces.map((place) => (
              <article className="my-trip-card" key={place.id}>
                <h3>
                  <Heart size={17} fill="currentColor" />
                  {" "}{place.place_name}
                </h3>

                <p>
                  <MapPin size={15} /> {place.location}
                </p>

                <button
                  className="login-button"
                  onClick={() => handleRemoveSavedPlace(place.id)}
                >
                  Remove
                </button>
              </article>
            ))}
          </div>
        </section>

        {/* Generated itinerary */}
        {trip && (
          <section className="itinerary-section" id="generated-itinerary">
            <p className="section-kicker">YOUR TRIP AT A GLANCE</p>

            <h2>
              Your {trip.days}-day trip to {trip.destination}
            </h2>

            <p>
              {trip.travelers} traveler(s) · Budget: ₹
              {trip.budget.toLocaleString("en-IN")}
              {trip.travel_date ? ` · Starting ${trip.travel_date}` : ""}
            </p>

            <div className="itinerary-grid">
              {trip.itinerary.map((day) => (
                <article className="itinerary-card" key={day.day}>
                  <span className="step-number">
                    DAY {day.day.toString().padStart(2, "0")}
                  </span>

                  <h3>{day.title}</h3>

                  <div>
                    <strong>☀️ Morning</strong>
                    <p>{day.morning}</p>
                  </div>

                  <div>
                    <strong>🌤️ Afternoon</strong>
                    <p>{day.afternoon}</p>
                  </div>

                  <div>
                    <strong>🌙 Evening</strong>
                    <p>{day.evening}</p>
                  </div>
                </article>
              ))}
            </div>

            <p className="itinerary-note">{trip.note}</p>

            <div className="save-trip-container">
              <button
                className="signup-button"
                onClick={handleSaveTrip}
                disabled={savingTrip || savedTripId !== null}
              >
                {savingTrip
                  ? "Saving..."
                  : savedTripId
                    ? "Trip Saved ✓"
                    : "Save This Trip"}
              </button>

              {saveMessage && <p role="status">{saveMessage}</p>}
            </div>
          </section>
        )}

        {/* Explore destinations */}
        <section className="destinations-section" id="explore">
          <div className="section-heading">
            <div>
              <p className="section-kicker">YOUR NEXT ESCAPE</p>
              <h2>Places worth dreaming about.</h2>

              <p className="section-description">
                A little inspiration for wherever life takes you next.
              </p>
            </div>

            <a className="view-all" href="#explore">
              Explore all <ArrowRight size={17} />
            </a>
          </div>

          <div className="destination-grid">
            {destinations.map((place) => {
              const isSaved = savedPlaces.some(
                (item) => item.place_name === place.name
              );

              return (
                <article className="destination-card" key={place.name}>
                  <div className="destination-image">
                    <img src={place.image} alt={place.name} />

                    <button
                      className="favorite-button"
                      aria-label={
                        isSaved
                          ? `Remove ${place.name} from saved places`
                          : `Save ${place.name}`
                      }
                      aria-pressed={isSaved}
                      onClick={() =>
                        handleToggleSavedPlace(place.name, place.country)
                      }
                    >
                      <Heart
                        size={19}
                        fill={isSaved ? "currentColor" : "none"}
                      />
                    </button>

                    <span className="destination-days">{place.days}</span>
                  </div>

                  <div className="destination-info">
                    <div>
                      <h3>{place.name}</h3>

                      <p>
                        <MapPin size={14} />
                        {place.country}
                      </p>
                    </div>

                    <div className="destination-price">
                      <span>From</span>
                      <strong>{place.price}</strong>
                      <span>per person*</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <p className="price-note">
            *Illustrative budget estimates, not live travel prices.
          </p>
        </section>

        {/* How it works */}
        <section className="how-section" id="how-it-works">
          <p className="section-kicker">SIMPLE AS THAT</p>
          <h2>Your trip, three easy steps.</h2>

          <div className="how-grid">
            <article>
              <span className="step-number">01</span>
              <h3>Tell us your vibe</h3>

              <p>
                Share your budget, interests, travel dates, and the kind of
                adventure you want.
              </p>
            </article>

            <article>
              <span className="step-number">02</span>
              <h3>Let AI plan it</h3>

              <p>
                Get a personalized, day-by-day itinerary built around what
                matters to you.
              </p>
            </article>

            <article>
              <span className="step-number">03</span>
              <h3>Make memories</h3>

              <p>
                Save your trips, explore places, and adjust your plan whenever
                inspiration strikes.
              </p>
            </article>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <a className="brand footer-brand" href="#home">
          <span className="brand-icon">
            <Compass size={23} />
          </span>

          <span>WanderWise</span>
        </a>

        <p>Thoughtful trips. Unforgettable memories.</p>
        <span>© 2026 WanderWise</span>
      </footer>

      {/* Login and Signup Modal */}
      {showAuth && (
        <div className="auth-overlay">
          <div className="auth-modal">
            <button
              className="auth-close"
              onClick={() => setShowAuth(false)}
              aria-label="Close authentication form"
            >
              <X size={22} />
            </button>

            <div className="auth-heading">
              <span className="brand-icon">
                <Compass size={25} />
              </span>

              <h2>
                {authMode === "login"
                  ? "Welcome back!"
                  : "Create your account"}
              </h2>

              <p>
                {authMode === "login"
                  ? "Log in to continue your travel journey."
                  : "Join WanderWise and start planning your trips."}
              </p>
            </div>

            <form onSubmit={handleAuthSubmit}>
              <label htmlFor="auth-email">Email address</label>

              <input
                id="auth-email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />

              <label htmlFor="auth-password">Password</label>

              <input
                id="auth-password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={6}
                required
              />

              {authError && (
                <p className="auth-error" role="alert">
                  {authError}
                </p>
              )}

              {authMessage && (
                <p className="auth-message" role="status">
                  {authMessage}
                </p>
              )}

              <button
                type="submit"
                className="signup-button auth-submit"
                disabled={authSubmitting}
              >
                {authSubmitting
                  ? "Please wait..."
                  : authMode === "login"
                    ? "Log in"
                    : "Create account"}
              </button>
            </form>

            <p className="auth-switch">
              {authMode === "login"
                ? "Don't have an account?"
                : "Already have an account?"}

              <button
                type="button"
                onClick={() =>
                  setAuthMode(authMode === "login" ? "signup" : "login")
                }
              >
                {authMode === "login" ? "Sign up" : "Log in"}
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
