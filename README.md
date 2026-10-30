# 🌍 WanderWise – Personalized Travel Itinerary Planner

**Plan smarter. Travel better. Explore more.**

WanderWise is an AI-powered personalized travel itinerary planner that helps users create customized travel plans based on their preferences, budget, travel dates, interests, and group size.

Instead of spending hours researching destinations and planning activities, users can generate personalized day-by-day itineraries in just a few clicks.

## 🚀 Live Demo

**Try WanderWise here:**  
https://wander-wise-weld.vercel.app/

## ✨ Features

- **Personalized Travel Planning:** Create trips based on destination, travel dates, budget, and group size.
- **AI-Powered Itinerary Generation:** Generate customized day-by-day travel plans.
- **Interest-Based Recommendations:** Personalize trips according to user interests and travel preferences.
- **Flexible Travel Styles:** Support different travel preferences such as budget, adventure, luxury, and relaxed travel.
- **Day-Wise Scheduling:** Organize activities into morning, afternoon, and evening schedules.
- **User Authentication:** Secure user authentication using Supabase.
- **Trip Management:** Save and manage personalized travel plans.
- **Responsive Interface:** Access the application through a user-friendly web interface.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React.js | Frontend development |
| TypeScript | Type-safe JavaScript |
| Vite | Frontend build tool |
| Tailwind CSS | Styling and UI |
| FastAPI | Backend development |
| Python | Backend programming |
| Supabase | Database and authentication |
| Groq API | AI-powered itinerary generation |
| Framer Motion | UI animations |
| Lucide React | Icons |
| Vercel | Frontend deployment |
| Render | Backend deployment |
| GitHub | Version control |

## 📁 Project Structure

```text
WanderWise/
│
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── ...
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
└── README.md
```

*Note: The actual source folders are nested inside the GitHub upload directory.*

## ⚙️ Getting Started

Follow these steps to run WanderWise locally.

### 1. Clone the Repository

```bash
git clone https://github.com/anushamalviya6-coder/WanderWise.git
```

### 2. Navigate to the Project

Open the project folder containing the `backend` and `frontend` directories.

### 3. Backend Setup

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate it on Windows:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Configure the required environment variables in a `.env` file.

Start the backend:

```bash
uvicorn main:app --reload
```

### 4. Frontend Setup

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Configure the required frontend environment variables in `.env`.

Start the development server:

```bash
npm run dev
```

Open the local URL displayed in your terminal.

## 🔐 Environment Variables

The project requires environment variables for Supabase, Groq, and frontend-backend communication.

Examples:

**Backend (`.env`)**

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
GROQ_API_KEY=your_groq_api_key
FRONTEND_URL=http://localhost:5173
```

**Frontend (`.env`)**

```env
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Never commit actual API keys, passwords, or secret environment variables to GitHub.

## 🧠 How It Works

1. The user opens WanderWise and provides travel preferences.
2. The frontend collects destination, dates, budget, interests, and other details.
3. The backend receives the information through FastAPI.
4. The AI service generates a personalized travel itinerary.
5. The generated itinerary is organized into daily activities.
6. Users can view and manage their travel plans.

## 🌐 Deployment

WanderWise is deployed using:

- **Frontend:** Vercel
- **Backend:** Render
- **Database and Authentication:** Supabase

## 🔮 Future Enhancements

- Real-time weather integration.
- Interactive maps and route optimization.
- Hotel and flight recommendations.
- Multi-destination trip planning.
- Collaborative trip planning.
- Export itineraries as PDF.
- Multilingual support.

## 👩‍💻 Developer

**Anusha Malviya**

GitHub: [anushamalviya6-coder](https://github.com/anushamalviya6-coder)

---

⭐ If you like WanderWise, consider giving this repository a star!

**WanderWise – Your journey, your way.**
