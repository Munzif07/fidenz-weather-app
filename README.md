# Comfort Index — Weather Analytics Dashboard

A full-stack weather analytics app built with **Next.js 16 (App Router, TypeScript)**.
It fetches live weather for a set of cities, computes a custom **Comfort Index Score**
on the backend, ranks cities from most to least comfortable, and displays them in a
responsive, authenticated dashboard.

---

## 1. Setup Instructions

### Prerequisites
- Node.js 20+
- An [OpenWeatherMap](https://openweathermap.org/api) account + API key
- An [Auth0](https://auth0.com) account (free tier is fine)

### 1.1 Install dependencies
```bash
npm install
```

### 1.2 Environment variables
Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `OPENWEATHER_API_KEY` | Your OpenWeatherMap API key |
| `CACHE_TTL_SECONDS` | How long raw weather responses are cached (default `300` = 5 min) |
| `AUTH0_SECRET` | Random 32+ character string, e.g. `openssl rand -hex 32` |
| `APP_BASE_URL` | `http://localhost:3000` for local dev |
| `AUTH0_DOMAIN` | Your Auth0 domain, e.g. `your-tenant.us.auth0.com` (no `https://` prefix) |
| `AUTH0_CLIENT_ID` / `AUTH0_CLIENT_SECRET` | From your Auth0 Application settings |

### 1.3 Configure Auth0 (Part 2 requirements)

1. **Create an Application** in the Auth0 Dashboard → type **Regular Web Application**.
2. Under **Application → Settings**, set:
   - Allowed Callback URLs: `http://localhost:3000/auth/callback`
   - Allowed Logout URLs: `http://localhost:3000`
   - Allowed Web Origins: `http://localhost:3000`
3. **Disable public signups** (only whitelisted users can log in):
   - Go to **Authentication → Database** → open your connection → toggle
     **"Disable Sign Ups"** ON.
4. **Enable MFA via email**:
   - Go to **Security → Multi-factor Auth** → enable **Email** as a factor,
     set policy to "Always" (or "Only for risky requests" if preferred).
5. **Create the whitelisted test user** manually (since signups are disabled):
   - **User Management → Users → Create User**
   - Email: `careers@fidenz.com`
   - Password: `Pass#fidenz`
   - Connection: your database connection

### 1.4 Run the app
```bash
npm run dev
```
Visit `http://localhost:3000` — you'll be redirected to log in before seeing the dashboard.

### 1.5 Run tests
```bash
npm run test
```

### 1.6 Build for production
```bash
npm run build
npm start
```

---

## 2. Comfort Index Formula

### Parameters used
Temperature, Humidity, Wind Speed, and Cloudiness (4 parameters — more than the
minimum of 3 required).

### How it works
Each parameter is converted into an independent **0–100 sub-score** based on how
close it is to a comfortable range for the average person, then combined into a
**weighted average**:

| Parameter | Weight | Ideal range | Penalty outside range |
|---|---|---|---|
| Temperature | **40%** | 20–25°C | −4 pts per °C outside range |
| Humidity | **30%** | 40–60% | −1.5 pts per % outside range |
| Wind Speed | **20%** | ≤ 3 m/s | −6 pts per m/s above 3 |
| Cloudiness | **10%** | 20–50% | −0.8 pts per % outside range |

```
comfortScore = 0.4 × tempScore
             + 0.3 × humidityScore
             + 0.2 × windScore
             + 0.1 × cloudinessScore
```

All sub-scores are clamped to `[0, 100]` before combining, so the final score is
always in `[0, 100]`.

### Why these weights?
- **Temperature (40%)** dominates because it's the single biggest driver of how
  comfortable a person *feels* outdoors — a hot or cold extreme overrides almost
  everything else.
- **Humidity (30%)** is a close second: high humidity makes heat feel worse
  (reduces evaporative cooling), and very low humidity feels dry/uncomfortable.
- **Wind speed (20%)**: a light breeze is pleasant, but strong wind quickly
  becomes unpleasant (and can amplify perceived cold). It matters less than
  temperature/humidity on an average day, so it's weighted lower.
- **Cloudiness (10%)**: mostly affects visual/mood comfort rather than physical
  comfort, and moderate cloud cover (which softens direct sun without full
  overcast gloom) is treated as mildly ideal. Given the least weight since its
  effect on physiological comfort is the smallest of the four.

### Trade-offs considered
- **Fixed ideal ranges vs. seasonal/regional baselines**: A single global "ideal"
  temperature range is simple and explainable, but doesn't account for
  acclimatization (25°C feels different in Colombo vs. London in December). A
  location-aware baseline would be more accurate but adds significant complexity
  and needs historical climate data — out of scope for this assignment.
- **Linear penalty vs. more realistic curves**: Linear penalties per unit of
  deviation are easy to reason about and tune, but real human comfort perception
  is closer to a sigmoid/exponential curve near extremes. Linear was chosen for
  transparency and testability.
- **Not using "feels like" temperature directly**: OpenWeatherMap's `feels_like`
  already blends temp/humidity/wind, but the assignment specifically asks for a
  score built from at least 3 *raw* parameters with visible reasoning, so raw
  values were used and combined explicitly instead of relying on a black-box
  pre-blended figure.
- **Dew point omitted**: listed as an optional parameter in the brief but isn't
  directly returned by the current weather endpoint (would require an extra
  calculation from temp + humidity via the Magnus formula). Skipped in favor of
  keeping the 4 chosen parameters directly traceable to the API response.

---

## 3. Cache Design

- **What's cached**: raw OpenWeatherMap responses per city (`weather:{cityCode}`),
  in a server-side in-memory `Map` (`lib/cache.ts`).
- **TTL**: 5 minutes (`CACHE_TTL_SECONDS`), matching the assignment's requirement.
- **Why raw responses, not just the processed score**: caching the raw API
  response means the Comfort Index formula can be tweaked (e.g. during the
  live-coding part of the screen recording) and re-computed instantly from
  cached data, without waiting on a fresh API call or hitting OpenWeatherMap's
  rate limits.
- **Debug endpoint**: `GET /api/cache-status` (auth-protected) reports per-city
  HIT/MISS/EXPIRED status and TTL, for verifying cache behavior.
- **Singleton pattern**: the cache is attached to `globalThis` so it survives
  Next.js dev-mode hot reloads and isn't recreated per request/module reload.

### Known limitation
This is an **in-memory** cache — it resets on server restart and does **not**
share state across multiple server instances (e.g. in a horizontally-scaled
deployment). For production/multi-instance use, this should be swapped for a
shared store like Redis, keeping the same `get/set` interface in `lib/cache.ts`.

---

## 4. Authentication & Authorization

- **Auth0** (`@auth0/nextjs-auth0` v4) protects both the dashboard page and the
  underlying API routes (`/api/weather`, `/api/cache-status` return `401` without
  a valid session).
- **Login/logout**: `/auth/login` and `/auth/logout` routes are provided
  automatically by the SDK's middleware.
- **MFA (email)** and **signup restriction** are configured at the Auth0 tenant
  level (see Setup §1.3) rather than in application code, since Auth0 owns and
  enforces these as part of the authentication flow itself — this is the
  standard, recommended integration pattern rather than reimplementing MFA logic
  in the app.

---

## 5. Other Known Limitations

- Only the current snapshot weather is shown — no historical trend graph yet
  (listed as a bonus in the brief).
- City list (`data/cities.json`) is static; adding a city requires a code
  change/redeploy rather than a UI-driven add flow.
- OpenWeatherMap's free tier has a rate limit; the 5-minute cache keeps this app
  well within it for the 15 cities configured, but adding many more cities
  without raising the cache TTL could approach the limit.
"# fidenz-weather-app" 
"# fidenz-weather-app" 
"# fidenz-weather-app" 
