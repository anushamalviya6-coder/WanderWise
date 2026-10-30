# WanderWise deployment (Vercel + Render)

## Before deploying
1. Rotate the Groq API key and Supabase secret key because the original uploaded ZIP contained `.env` files.
2. Push this project to a **private GitHub repository**. `.gitignore` excludes `.env`, virtual environments, `node_modules`, and build output. Never commit secrets.
3. Keep the existing Supabase project and tables. In Supabase Authentication settings, add the deployed Vercel URL to the allowed Site URL / redirect URLs if using email authentication.

## 1. Deploy backend on Render
1. In Render, choose **New + → Blueprint** and connect the GitHub repository containing this project. Render reads the root `render.yaml`.
2. Create the service and set these environment variables in Render: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `GROQ_API_KEY`. Set `FRONTEND_URL` temporarily to `https://YOUR-APP.vercel.app` (update it after Vercel deployment).
3. Wait for deployment. Check `https://YOUR-BACKEND.onrender.com/health`; it should return a successful health response.

## 2. Deploy frontend on Vercel
1. Import the same GitHub repository into Vercel.
2. Set **Root Directory** to `frontend`.
3. Framework: Vite. Build command: `npm run build`. Output directory: `dist`.
4. Add environment variables:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = your Supabase publishable/anon key
   - `VITE_API_URL` = `https://YOUR-BACKEND.onrender.com` (no trailing slash)
5. Deploy.

## 3. Finish CORS and Supabase auth
1. Copy the actual Vercel deployment URL.
2. In Render, set `FRONTEND_URL` to that exact URL and redeploy the backend.
3. In Supabase → Authentication → URL Configuration, set Site URL to the Vercel URL and add it to Redirect URLs.
4. Test signup/login, saving a trip, loading My Trips, and generating an itinerary.

## Notes
- The backend uses the Supabase secret key only on Render. Never put it in a `VITE_` variable or frontend code.
- The frontend must use the Supabase publishable/anon key, not the secret key.
- Render free services may sleep when idle, so the first request can take longer.
- The deployment configuration does not change your Supabase schema or guarantee existing RLS policies are correct; test each authenticated database action after deployment.
