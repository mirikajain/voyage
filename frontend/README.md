# Voyage — Frontend Client

This directory contains the standalone React 19 + TypeScript + Vite frontend for **Voyage — Premium AI Travel Concierge**.

---

## 🚀 1-Click Hosting Options

### Option A: Vercel (Fastest & Easiest)
1. Go to [vercel.com](https://vercel.com) and click **Add New...** -> **Project**.
2. Select your repository `sensei-amulya/voyage`.
3. Set **Root Directory** to `frontend`.
4. Leave **Framework Preset** as `Vite` and **Build Command** as `npm run build`.
5. Click **Deploy**. Your site will be live on an SSL `*.vercel.app` domain in ~30 seconds.

---

### Option B: Netlify (Drag & Drop or Git)

#### Method 1: Instant Drag & Drop (Zero Setup)
1. Build the production bundle locally:
   ```bash
   cd frontend
   npm run build
   ```
2. Log into [netlify.com](https://app.netlify.com/drop).
3. Drag the `frontend/dist` folder into the Netlify Drop zone.
4. Your site is live immediately!

#### Method 2: Git Integration
1. Link your repo in Netlify.
2. Set **Base directory** to `frontend`.
3. Set **Publish directory** to `frontend/dist`.
4. Click **Deploy Site**.

---

## 💻 Local Development

```bash
cd frontend
npm install
npm run dev
```

The frontend will run at `http://localhost:5174/`.
