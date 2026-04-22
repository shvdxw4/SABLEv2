# SABLE

SABLE is a full-stack music streaming MVP built around a polished listener experience. Users can sign up, browse published tracks, play music through a shared player, save tracks to their library, upgrade to a subscriber plan through Stripe, manage their plan, and cancel their subscription.

This Tier 1 release focuses on the consumer/listener side of the platform and proves the full product loop from account creation to playback and subscription management.

---

## T1 Scope

SABLE T1 includes:

- User signup and login
- Listener-facing Home page
- Listener-facing Library page
- Shared global audio player
- Recently played history
- Save/add to library behavior
- Artwork rendering across listener surfaces
- Stripe-powered subscription checkout
- Billing success flow
- Manage Plan page
- Subscription cancellation flow

T1 does not focus on the creator experience. Creator tooling is reserved for a later phase.

---

## Core Listener Flow

1. A user creates an account or logs in
2. The user enters the listener experience
3. The user browses tracks on Home and Library
4. The user plays tracks through the shared player
5. The user saves tracks to their library
6. The user can upgrade to a subscriber plan through Stripe
7. The user returns to SABLE with updated subscription state
8. The user can manage or cancel the subscription later
9. The listener interface remains usable throughout the full lifecycle

---

## Features

### Authentication
- Email/username login
- JWT-based auth
- Protected listener routes
- Role-aware user model

### Listener Experience
- Home feed with recently played and published content
- Library page for browsing published tracks
- Search filtering across listener surfaces
- Save/add track behavior
- Real artwork rendering with fallback placeholders

### Shared Audio Player
- Global playback state
- Play / pause
- Next / previous
- Queue support
- Seek bar with current time and duration
- Recently played updates
- Right-side now playing panel
- Bottom control bar

### Subscription Flow
- Stripe Checkout integration
- Upgrade page
- Billing success confirmation
- Manage Plan page
- Subscription cancellation
- Listener access based on current subscription state

---

## Tech Stack

### Frontend
- React
- TypeScript
- React Router
- Tailwind CSS
- Context API for player, auth, library, and search state

### Backend
- FastAPI
- Python
- SQLAlchemy
- PostgreSQL
- JWT authentication
- Stripe API

### Storage / Media
- AWS S3
- Presigned upload URLs
- Presigned GET URLs for audio and artwork access

---

## Architecture Notes

SABLE is built around a few core systems:

### 1. Auth System
Handles signup, login, token storage, protected routes, and `/me` user state retrieval.

### 2. Track Retrieval Layer
Listener-facing track endpoints return published tracks only, filtered by access level.

### 3. Shared Player System
A centralized player context controls:
- current track
- playback state
- queue
- recent tracks
- time and duration
- seek behavior

This keeps playback consistent across Home, Library, side panels, and bottom controls.

### 4. Subscription State
Subscription state is tied to the logged-in user and reflected in the UI through the listener flow:
- free/public access
- upgrade path
- active subscriber state
- manage/cancel path

### 5. Artwork Pipeline
Uploaded artwork is stored in S3 and surfaced through signed artwork URLs returned by the backend. Listener surfaces render real cover art when available and fall back to placeholder styling otherwise.

---

## Key Backend Endpoints

### Auth
- `POST /signup`
- `POST /login`
- `GET /me`

### Listener Tracks
- `GET /tracks`
- `GET /tracks/{track_id}`
- `GET /tracks/{track_id}/stream`

### Billing
- `POST /billing/checkout`
- `GET /billing/success`

### Subscription / Plan Management
- Manage plan UI handled on the frontend
- Cancellation updates reflected through subscription state and listener access

---

## Local Development

### Frontend

npm install
npm run dev

### Backend

cd backend
source .venv/Scripts/activate
uvicorn app.main:app --reload

---

## Environment Variables

Example backend environment variables:

DATABASE_URL=your_database_url
SABLE_SECRET_KEY=your_secret_key

STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PRICE_MONTHLY_ID=your_monthly_price_id
STRIPE_PRICE_YEARLY_ID=your_yearly_price_id
STRIPE_SUCCESS_URL=http://127.0.0.1:5173/billing/success?session_id={CHECKOUT_SESSION_ID}
STRIPE_CANCEL_URL=http://127.0.0.1:5173/billing/cancel

FRONTEND_ORIGINS=http://127.0.0.1:5173,http://localhost:5173

Example frontend environment variables:

VITE_API_BASE_URL=http://127.0.0.1:8000

---

## Database Highlights

The database supports:

- users
- creator profiles
- tracks
- track tags
- subscriptions

Important track fields include:

- title
- tier
- state
- audio S3 key
- artwork S3 key
- published_at

Important subscription fields include:

- status
- stripe customer/session/subscription references
- started_at
- expires_at

---

## What This Project Demonstrates

This project demonstrates the ability to build and connect:

- frontend and backend systems end to end
- auth-protected user flows
- a shared media player architecture
- subscription-aware product behavior
- Stripe billing integration
- S3 media handling with signed URLs
- real product state across multiple coordinated UI surfaces

This is not just a static UI project. It is a working product slice with real user flows, media access, and billing logic.

---

## T1 Outcome

By the end of T1, SABLE delivers a clean listener experience that allows a user to:

- sign up
- log in
- browse tracks
- play music
- save tracks
- upgrade to subscriber
- manage their plan
- cancel their subscription
- continue using the app with the correct access state

That is the complete listener-side MVP loop.

---

## Future Work

Planned future improvements include:

- richer creator upload and publishing tools
- playlists, artists, and albums filtering
- offline/downloaded flow
- richer metadata and credits
- improved artwork and player polish
- more advanced recommendation logic
- stronger mobile responsiveness
- deeper analytics and admin tooling

---

## Status

**Tier 1 Listener Experience: Complete**