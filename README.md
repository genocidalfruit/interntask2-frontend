# Assets Client

Next.js frontend for the Assets & Service Ticket Management app.

## Tech Stack

- Next.js 14 App Router
- React 18
- Tailwind CSS
- Radix UI primitives
- Chart.js / react-chartjs-2
- Cookie-based authentication against the Express API

## Local Setup

Install dependencies:

```bash
npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Start the development server:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

## Scripts

```bash
npm run dev      # Start local Next.js dev server
npm run build    # Build production app
npm run start    # Start production build
npm run lint     # Run Next lint
```

## Environment Variables

| Variable | Required | Description |
|---|---:|---|
| `NEXT_PUBLIC_API_URL` | Yes | Public URL of the backend API, without trailing slash. |

Examples:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=https://your-render-api.onrender.com
```

## Deployment: Netlify

Recommended Netlify settings:

```txt
Base directory: assets-client
Build command: npm run build
Publish directory: .next
```

Set this Netlify environment variable:

```env
NEXT_PUBLIC_API_URL=https://your-render-api.onrender.com
```

After changing `NEXT_PUBLIC_API_URL`, trigger a new Netlify deploy because this value is baked into the frontend build.

## Authentication Notes

The client sends requests with `credentials: "include"` so the browser includes the backend's HTTP-only auth cookies. The backend must allow the deployed Netlify origin through CORS.

For separate Netlify and Render domains, the backend cookie settings must use:

```txt
SameSite=None
Secure=true
```

