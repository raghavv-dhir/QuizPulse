# 🚀 Live Deployment Guide: QuizPulse Platform

This guide walks you through deploying the live Quiz Competition platform to **Neon Tech** (PostgreSQL Database), **Render** (Backend Spring Boot API & STOMP WebSockets), and **Vercel** (Frontend React SPA).

---

## 🏗️ Architecture Overview

```
                 +--------------------------+
                 |       Vercel (SPA)       |
                 |  React + Vite + Tailwind |
                 +------------+-------------+
                              |
               HTTPS REST API | WSS STOMP WebSockets
                              v
                 +------------+-------------+
                 |      Render (Backend)    |
                 |   Spring Boot 3 + Java 21|
                 +------------+-------------+
                              |
                     JDBC SSL | Connection
                              v
                 +------------+-------------+
                 |    Neon Tech (Database)  |
                 |   Serverless PostgreSQL  |
                 +--------------------------+
```

---

## Step 1: Set Up Database on Neon Tech

1. Sign up or log in at **[https://neon.tech](https://neon.tech)**.
2. Click **Create Project**:
   - **Project name**: `quizpulse-db` (or any name you prefer)
   - **Postgres version**: 16 (or latest)
   - **Region**: Choose the region closest to your users or Render service (e.g., `US East (Ohio)` or `EU Central`).
3. In your Neon Dashboard, find the **Connection Details** box.
4. Copy the connection string. Neon provides a string formatted like:
   ```text
   postgresql://neondb_owner:npg_AbCdEf123456@ep-cool-fog-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
   > 💡 **Note**: QuizPulse automatically parses either `postgresql://` or `postgres://` connection strings directly into Spring Boot HikariCP format.

---

## Step 2: Push Your Project to GitHub

1. If you haven't already, add and commit all changes to Git:
   ```bash
   git add .
   git commit -m "feat: prepare QuizPulse for live deployment on Vercel, Render, and Neon"
   ```
2. Create a new repository on **GitHub** (e.g., `quizpulse`).
3. Link your remote and push:
   ```bash
   git remote add origin https://github.com/<your-username>/quizpulse.git
   git branch -M main
   git push -u origin main
   ```

---

## Step 3: Deploy Backend on Render

1. Log in to **[https://render.com](https://render.com)**.
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository (`quizpulse`).
4. Configure the Web Service settings:
   - **Name**: `quizpulse-backend`
   - **Region**: Same or nearest to your Neon database region
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: **Docker** (recommended — uses the optimized Java 21 multi-stage Dockerfile)
     *(Alternatively, if choosing native Java: Build Command `mvn clean package -DskipTests` and Start Command `java -jar target/*.jar`)*
   - **Instance Type**: Free or Starter
5. Under **Environment Variables**, add the following:

   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `DATABASE_URL` | *Paste your Neon connection string* | Neon PostgreSQL URI |
   | `DATABASE_DRIVER` | `org.postgresql.Driver` | PostgreSQL JDBC driver |
   | `JWT_SECRET` | *(Click "Generate" or use a secure 256-bit hex/string)* | Secret for signing tokens |
   | `QUIZ_SEED_ENABLED` | `false` | Ensures pure production DB without mock data |
   | `PORT` | `10000` | (Render sets this automatically) |

6. Click **Create Web Service**.
7. Wait for the build to finish. Once live, Render will assign your backend a public URL:
   ```text
   https://quizpulse-backend.onrender.com
   ```
   > 💡 Test it in your browser: `https://quizpulse-backend.onrender.com/swagger-ui.html` or `https://quizpulse-backend.onrender.com/api-docs`.

---

## Step 4: Deploy Frontend on Vercel

1. Log in to **[https://vercel.com](https://vercel.com)**.
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository (`quizpulse`).
4. Configure the Project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select **`frontend`**
   - **Build Command**: `npm run build` (or leave default)
   - **Output Directory**: `dist` (or leave default)
   - **Install Command**: `npm install`
5. Expand **Environment Variables** and add:

   | Key | Value | Example |
   | :--- | :--- | :--- |
   | `VITE_API_URL` | Your Render Backend URL *(no trailing slash)* | `https://quizpulse-backend.onrender.com` |

   > 💡 WebSockets (`/ws`) automatically connect to `VITE_API_URL` with fallback to `https://` / `wss://`.

6. Click **Deploy**.
7. In ~60 seconds, your website is live at:
   ```text
   https://quizpulse-frontend.vercel.app
   ```

---

## Step 5: First-Time Live Admin Setup

QuizPulse features an **automatic first-user owner promotion**:
1. Open your live Vercel website URL.
2. Click **Register** (`/register`).
3. Enter your real Name, Username, Email, and a strong Password.
4. Submit the registration.
5. **Because the Neon database is brand new, the system immediately promotes your account to `ROLE_ADMIN`!**
6. You will instantly see the **Admin Console** button in the navigation bar to create and control your real competitions!

---

## 🔒 Production Security Checklist

- [x] Mock credentials removed from all login views.
- [x] `QUIZ_SEED_ENABLED` defaults to `false` in production.
- [x] Password hashing using BCrypt (10 rounds).
- [x] Stateless JWT with configurable token expiration (`JWT_EXPIRATION_MS`).
- [x] CORS configured for all origins and methods with credentials support.
- [x] STOMP WebSockets configured with CORS origin wildcards for live cross-origin messaging.
- [x] Single-Page Application (SPA) client routing rewrite configured in `vercel.json`.
- [x] Neon SSL Mode enforced (`sslmode=require`).
