# Deployment Guide

Since this is a full-stack application (React Frontend + Express/Node.js Backend), you cannot deploy it to static hosts like GitHub Pages or Netlify directly. You need a host that supports Node.js servers.

## Recommended Option: Render (Free Tier Available)

1. **Export Code**: Download this project's code.
2. **Push to GitHub**: Create a repository on GitHub and push the code there.
3. **Create Web Service on Render**:
   - Go to [dashboard.render.com](https://dashboard.render.com)
   - Click "New +" -> "Web Service"
   - Connect your GitHub repository
4. **Configure Settings**:
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. **Environment Variables**:
   - Add `OPENAI_API_KEY` with your OpenAI key.
   - Add `NODE_ENV` with value `production`.

## Alternative: Railway

1. **Connect GitHub**: Login to [railway.app](https://railway.app) with GitHub.
2. **New Project**: "Deploy from GitHub repo".
3. **Variables**: Add `OPENAI_API_KEY` in the variables tab.
4. Railway usually auto-detects the `start` script (`npm start`) and runs it.

## Local Development

1. Install dependencies: `npm install`
2. Create `.env` file with `OPENAI_API_KEY=your_key_here`
3. Run dev server: `npm run dev`
