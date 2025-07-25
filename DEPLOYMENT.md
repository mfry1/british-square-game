# British Square Game Deployment Guide

## 🚀 Deployment Strategy

This application requires two deployments:
1. **Frontend (Web App)**: GitHub Pages
2. **Backend (WebSocket Server)**: Cloud hosting service

## 📦 Frontend Deployment (GitHub Pages)

1. **Enable GitHub Pages**:
   - Go to your repository: https://github.com/mfry1/british-square-game
   - Click "Settings" tab
   - Scroll to "Pages" section
   - Source: "Deploy from a branch"
   - Branch: "main" 
   - Folder: "/ (root)"
   - Click "Save"

2. **Your game will be available at**: 
   `https://mfry1.github.io/british-square-game/`

## 🌐 Backend Deployment Options

### Option A: Railway (Recommended - Free)

1. **Create Railway Account**: https://railway.app/
2. **Connect GitHub**: Link your repository
3. **Deploy**: 
   - Select your repository
   - Railway will auto-detect Node.js
   - Set start command: `cd server && node server.js`
   - Deploy!

### Option B: Render (Free tier)

1. **Create Render Account**: https://render.com/
2. **New Web Service**:
   - Connect GitHub repository
   - Build Command: `cd server && npm install`
   - Start Command: `cd server && node server.js`
   - Port: `8080` (Render auto-assigns)

## 🔧 Configuration After Deployment

1. **Get your WebSocket server URL** (example: `wss://your-app.railway.app`)

2. **Update `gameonline.js`**:
   ```javascript
   // Replace this line:
   wsUrl = "wss://your-websocket-server.herokuapp.com";
   
   // With your actual server URL:
   wsUrl = "wss://your-actual-server.railway.app";
   ```

3. **Commit and push**:
   ```bash
   git add .
   git commit -m "Update WebSocket URL for production"
   git push origin main
   ```

## 🎮 Testing

1. **Open your GitHub Pages URL**
2. **Click "Online Mode"**
3. **Create a room**
4. **Share room code with friends**
5. **Play together!**

---

## Option 3: Vercel (Alternative - Free)

### Step 1: Upload to GitHub (same as Option 1, steps 1-2)

### Step 2: Deploy with Vercel
1. Go to [Vercel.com](https://vercel.com)
2. Sign up with GitHub account
3. Click "New Project"
4. Import your `british-square-game` repository
5. Click "Deploy"

Your game will be live at: `https://british-square-game.vercel.app`

---

## Testing Your Deployment

After deployment, test these features:
- [ ] Game loads properly
- [ ] Player vs Player mode works
- [ ] Player vs AI mode works
- [ ] All difficulty levels function
- [ ] Mobile responsive design
- [ ] Game rules display correctly

---

## Updating Your Game

To update your hosted game:
1. Make changes to your local files
2. Upload the updated files to GitHub
3. GitHub Pages will automatically redeploy
4. Changes appear within 2-3 minutes

---

## Custom Domain (Optional)

If you want a custom domain like `yourname.com`:
1. Buy a domain from any registrar
2. In GitHub repository settings > Pages
3. Add your custom domain
4. Update your domain's DNS settings

---

**Recommended**: Start with GitHub Pages - it's free, reliable, and perfect for this type of project!
