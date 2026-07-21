# AuraFashion 🌟

AuraFashion is an AI-powered, full-stack virtual try-on and fashion design platform. By combining **React 19 (Vite)** on the frontend, a robust **Express/Node.js** server on the backend, and **Google Gemini 3.1 Flash-Lite** image generation models, AuraFashion lets users visualize outfits, generate designs from sketch outlines, and browse and interact with a premium shopping catalog.

---

## ✨ Features

- **🛍️ Intelligent Shopping Catalog**: Explore premium fashion collections with dynamic product filters, detail views, and interactive carts.
- **👕 Virtual AI Try-On**: Upload a user photo and a dress image to generate a realistic representation of the user wearing that exact outfit. Includes a server-side image proxy to bypass client-side CORS issues safely.
- **🎨 Sketch-to-Design Studio**: Hand-draw or upload a fashion sketch, add design instructions, and watch Gemini render it into a photorealistic, high-quality garment. You can even visualize the finished design on an uploaded model photo!
- **👤 User Profiles & Subscription**: Secure authentication with **Firebase Auth** and real-time state synchronization using **Firestore**. Includes interactive subscription plans and user settings.
- **🛡️ Secure API Layer**: All Gemini API integrations and key handshakes happen securely server-side, protecting sensitive API keys from browser exposure.

---

## 🛠️ Tech Stack

### Frontend
- **React 19** & **Vite** — High-performance frontend rendering and asset compilation.
- **Tailwind CSS v4** — Clean, responsive, and utility-driven styling.
- **Motion** (`motion/react`) — Smooth transition animations, micro-interactions, and visual cue states.
- **Lucide React** — Crisp, modern vector iconography.

### Backend
- **Express.js** & **Node.js** — Fast REST API router and static file hosting.
- **@google/genai SDK** — Official SDK for executing high-fidelity Gemini models server-side.
- **Esbuild** — Super-fast bundling to compile TypeScript into production-ready CommonJS (`.cjs`).

### Infrastructure & Services
- **Google Gemini 3.1 Flash-Lite (Image)** — Advanced computer vision and image generation model.
- **Firebase Auth** — Clean user login, registration, and session management.
- **Firebase Firestore** — Flexible, secure, real-time cloud database.

---

## 🚀 Quick Start & Installation

### Prerequisites
Make sure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/AuraFashion.git
cd AuraFashion
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables Setup
Create a `.env` file in the root directory and add your Gemini API Key. Refer to `.env.example` for details:

```env
# Your server-side secret API keys (NEVER expose to the browser!)
GEMINI_API_KEY=your_google_gemini_api_key_here
PORT=3000
NODE_ENV=development
```

> **How to get a Gemini API Key**: Visit the [Google AI Studio](https://aistudio.google.com/) to provision an API key for free.

### 4. Configure Firebase
AuraFashion utilizes Firebase for Authentication and Firestore. To connect your database:
1. Set up a Firebase project on the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Firestore Database** and **Authentication** (Email/Password provider).
3. Obtain your Firebase web configuration object.
4. Place this config inside a file named `firebase-applet-config.json` in the root of the project:

```json
{
  "apiKey": "your-api-key",
  "authDomain": "your-project-id.firebaseapp.com",
  "projectId": "your-project-id",
  "storageBucket": "your-project-id.firebasestorage.app",
  "messagingSenderId": "your-messaging-sender-id",
  "appId": "your-app-id",
  "firestoreDatabaseId": "(default)"
}
```

### 5. Run the Application in Development Mode
```bash
npm run dev
```
Once started, the development server will be running on **`http://localhost:3000`** with live hot reloading.

---

## 📦 Production Bundling & Build Pipeline

AuraFashion employs a specialized hybrid build pipeline to ensure seamless runtime execution and high performance under server environments (like Docker containers, Render, Railway, etc.):

```bash
npm run build
```

This script triggers two parallel operations:
1. **Frontend Compilation**: `vite build` translates and minifies client-side React code, bundling assets into static files inside the `dist/` directory.
2. **Backend Compilation**: `esbuild` compiles and bundles the Express `server.ts` into a single, high-performance CommonJS file at `dist/server.cjs`.

### Running in Production
Once compiled, you can spin up the unified full-stack server using:

```bash
npm run start
```
The server will boot from `dist/server.cjs` and automatically serve the built React files located in `dist/` while exposing all API endpoints.

---

## 🌐 Deployment to Production

Since the application uses a unified backend (serving both the APIs and the compiled React SPA), you can deploy it to any cloud host that supports Node.js.

### 🚄 Deployment via Render / Railway / Fly.io
1. Connect your GitHub repository to your hosting provider.
2. Configure the following build settings:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run start`
3. Add your Environment Variables in the provider's dashboard:
   - Set `GEMINI_API_KEY` to your live API Key.
   - Set `NODE_ENV` to `production`.
   - Set `PORT` to `3000` (or leave it to be automatically injected).

### 🐳 Deployment with Docker
For containerized setups (such as GCP Cloud Run or AWS ECS), you can use a standard Node.js Dockerfile:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["npm", "run", "start"]
```

---

## 🔒 Security Best Practices for GitHub

When preparing to publish your repository to GitHub, ensure that you never leak credentials:
- Ensure `.env` is listed in your `.gitignore` so your actual Gemini API key is never pushed.
- Avoid committing actual `firebase-applet-config.json` files containing production secrets. Include a mock template config file or supply keys securely.

---

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
