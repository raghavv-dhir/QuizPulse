# QuizPulse - Production Real-Time Quiz Competition Platform

A production-grade, highly-concurrent real-time online quiz competition platform engineered for live showdowns with up to **100 teams (2–3 members per team, ~300 simultaneous participants)** or individual competitors.

The core defining feature is **authoritative server-side speed-based scoring**, where answer speed directly and smoothly determines the points awarded, with strict sub-millisecond precision and anti-cheating enforcement.

---

## 1. Key Capabilities & Architectural Highlights

* **Speed-Based Scoring Engine**: Points decay dynamically as time elapses:
  $$\text{score} = \left\lfloor \frac{\text{maxScore} \times \text{remainingTime}}{\text{questionDuration}} \right\rfloor$$
  Clamped strictly between $0$ and $\text{maxScore}$. Supports both **Linear** and **Fixed-Bucket** strategies via an extensible `ScoringStrategy` pattern.
* **Server-Authoritative Timing**: Timestamps and response times are strictly computed on the server (`serverSubmissionTimestamp - serverQuestionStartTimestamp`). Client clocks or timers are never trusted.
* **Team Mode & First-Answer Policy**:
  * 100 teams $\times$ 2–3 members.
  * In Team mode, the **first valid answer submitted by any team member** locks in the team's official answer and points. Subsequent teammate submissions are recorded as `IGNORED_DUPLICATE` awarding 0 points, preventing duplicate scoring under high concurrency.
* **Deterministic Tie-Breaking**:
  1. `Total Score` (DESC)
  2. `Total Correct Answers` (DESC)
  3. `Total Response Time` (ASC)
  4. `Earlier Submission Timestamp` (ASC)
* **Real-Time WebSocket/STOMP Events**: Live bi-directional broadcasting to `/topic/quiz/{quizId}` and `/topic/quiz/{quizId}/team/{teamId}`.
* **Seamless Reconnection**: Reconnecting users query `/api/quizzes/{id}/state` to restore active question, elapsed/remaining time, answer lock state, and live score without resetting timers.
* **Anti-Cheating Protections**:
  * Correct answers are sanitized and never sent over the wire before a question ends.
  * Browser visibility detection (`visibilitychange`, window blur, fullscreen exit) triggers security audit logs for the Quiz Master.
* **Full Data Export**: Official standings can be exported directly as CSV (`/api/admin/quizzes/{id}/export`).

---

## 2. Technology Stack

### Backend
* **Java 21**
* **Spring Boot 3.3.4**
* **Spring Security & JJWT 0.12.6** (stateless JWT token authentication)
* **Spring Data JPA & Hibernate**
* **PostgreSQL / H2 (dev/test fallback)**
* **Flyway** (database migrations)
* **Spring WebSocket & STOMP** (real-time message broker)
* **Springdoc OpenAPI 2.6.0** (interactive Swagger UI)
* **Maven** & **Lombok**

### Frontend
* **React 18** + **TypeScript**
* **Vite**
* **Tailwind CSS** (curated dark-mode competition theme)
* **React Router v6**
* **TanStack Query (React Query)**
* **STOMP.js & SockJS** (resilient WebSocket reconnects)
* **Lucide React** (icons) & **Canvas Confetti**

---

## 3. Project Structure

```text
quizz app/
├── backend/
│   ├── pom.xml
│   ├── Dockerfile
│   └── src/
│       ├── main/
│       │   ├── java/com/example/quiz/
│       │   │   ├── config/              # Security, WebSocket, OpenAPI, CORS
│       │   │   ├── controller/          # REST endpoints (Auth, Quiz, Admin, Teams, Questions)
│       │   │   ├── dto/                 # Strict DTOs for safe payloads
│       │   │   ├── entity/              # JPA Entities & Enums
│       │   │   ├── exception/           # Global exception handler & error response
│       │   │   ├── repository/          # Spring Data JPA repositories
│       │   │   ├── security/            # JWT filter, UserPrincipal, UserDetailsService
│       │   │   ├── seed/                # DataSeeder with 1 admin, 10 participants, 3 teams
│       │   │   ├── service/             # Business services (Quiz, Team, Engine, Leaderboard)
│       │   │   │   └── scoring/         # ScoringStrategy, Linear, FixedBucket, ScoringEngine
│       │   │   └── websocket/           # QuizWebSocketService & STOMP broadcast
│       │   └── resources/
│       │       ├── application.yml
│       │       └── db/migration/        # Flyway schema V1 & seed V2
│       └── test/                        # Scoring, Tie-Breaking, and Concurrency Tests
│
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── Dockerfile
│   ├── nginx.conf
│   └── src/
│       ├── api/client.ts               # Authenticated API client
│       ├── components/                 # CountdownTimer, SpeedPointsGauge, TeamStatus, Navbar
│       ├── context/AuthContext.tsx     # Session management & user roles
│       ├── hooks/useQuizWebSocket.ts   # STOMP hook with auto-reconnect
│       ├── pages/                      # Login, Register, QuizList, Lobby, LiveRoom, Admin, Results
│       └── types/quiz.ts               # TypeScript interfaces
│
├── docker-compose.yml                  # Full stack (Postgres, Redis, Backend, Frontend)
├── .env.example                        # Environment variables template
└── README.md
```

---

## 4. Live Cloud Deployment & Production Setup

For complete, step-by-step instructions on deploying live to **Neon Tech** (PostgreSQL), **Render** (Backend API & STOMP WebSockets), and **Vercel** (Frontend SPA), refer to:

👉 **[Live Deployment Guide (DEPLOYMENT.md)](DEPLOYMENT.md)**

### Production Highlights
- **Zero Dummy Data**: Production runs with `QUIZ_SEED_ENABLED=false` by default, ensuring a pure, clean database.
- **First-Time Admin Setup**: The very first user to register on a fresh production database is automatically granted `ROLE_ADMIN` permissions.
- **Render Port & Cloud PostgreSQL Support**: The backend automatically resolves Render's dynamic `$PORT` and auto-converts Neon connection URIs (`postgres://` / `postgresql://`) into JDBC format with SSL enabled.
- **Vercel Routing**: The frontend includes SPA rewrite rules (`vercel.json`) and dynamic API / WebSocket discovery (`VITE_API_URL`).

---

## 5. Running Locally (Development Mode)

### Option A: Local Development (Without Docker)

#### 1. Backend
```bash
cd backend
mvn spring-boot:run
```
* Backend runs on: `http://localhost:8080`
* Swagger UI Docs: `http://localhost:8080/swagger-ui.html`
* Automatically uses H2 in PostgreSQL mode if no external PostgreSQL is running.
* To seed demo data locally for testing, launch with `-Dquiz.seed.enabled=true`.

#### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```
* Frontend runs on: `http://localhost:5173`
* Proxies `/api` and `/ws` to `http://localhost:8080`.

---

### Option B: Docker Compose (Full Stack)

Ensure Docker Desktop is running, then run:

```bash
docker compose up --build
```

Services:
* **Frontend**: `http://localhost:3000`
* **Backend**: `http://localhost:8080`
* **PostgreSQL**: `localhost:5432`
* **Redis**: `localhost:6379`

---

## 6. End-to-End Walkthrough

1. **Create an Account**:
   * Open `http://localhost:5173` (or your live Vercel URL).
   * Click **Register**. The first registered user is automatically designated as **Quiz Master / Admin** (`ROLE_ADMIN`).
2. **Admin Control Room**:
   * Click **Admin Console** in the top navigation.
   * Create a new quiz with custom question durations, linear/bucket speed-scoring, and team or individual modes.
   * Enter the **Control Room** for the quiz.
3. **Participants Join**:
   * In separate browser tabs or on mobile devices, participants register or sign in.
   * They enter the lobby, select or form teams, and await start.
4. **Live Competition**:
   * The Quiz Master starts questions from the Control Room.
   * Real-time STOMP WebSockets synchronize timer countdowns, live response speed gauges, and question transitions.
   * Teams submit answers with sub-millisecond authoritative timestamps, locking answers and updating real-time leaderboards.
5. **Answer Submission & First-Answer Rule**:
   * Any team member selects an answer. The server authoritative timestamp calculates exact speed-decayed points.
   * Teammates immediately see the answer status update to `ANSWER LOCKED`.
6. **Next Question & Final Standings**:
   * The Quiz Master clicks **REVEAL ANSWER** or **NEXT QUESTION**.
   * Once all questions conclude, click **FINISH QUIZ**.
   * The podium and full deterministic leaderboard appear with an **Export Official CSV** button.

---

## 7. Automated Testing & Concurrency Verification

Run all unit, tie-breaking, and multi-threaded concurrency tests:

```bash
cd backend
mvn test
```

### Verified Test Suite
1. **`ScoringEngineTest`**:
   * 0s response $\to$ 1000 pts
   * 1s response $\to$ 900 pts
   * 2s response $\to$ 800 pts
   * 5s response $\to$ 500 pts
   * 7s response $\to$ 300 pts
   * 10s response $\to$ 0 pts
   * Millisecond precision (3724ms $\to$ 627 pts)
   * Incorrect answer $\to$ 0 pts (or negative penalty if enabled)
2. **`LeaderboardTieBreakingTest`**:
   * Deterministic sorting: Score DESC $\to$ Correct Count DESC $\to$ Response Time ASC $\to$ Timestamp ASC.
3. **`QuizEngineConcurrencyTest`**:
   * **Acceptance Scenario**: Team A members submit at different intervals; only the first submission determines the team answer and points. Later teammate submissions are marked `IGNORED_DUPLICATE` with 0 points.
   * **High Concurrency**: 30 simultaneous worker threads submitting at the exact same millisecond latch; strictly 1 submission is ACCEPTED as official, and 29 are IGNORED_DUPLICATE with zero database corruption.
