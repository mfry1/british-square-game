# Deployment Guide - British Square Game

## Option 1: GitHub Pages (Recommended - Free)

### Step 1: Create GitHub Repository
1. Go to [GitHub.com](https://github.com) and sign in
2. Click "New repository"
3. Name it: `british-square-game`
4. Make it Public
5. Click "Create repository"

### Step 2: Upload Your Files
1. Click "uploading an existing file"
2. Drag and drop all files from your `living room app` folder:
   - `index.html`
   - `styles.css` 
   - `script.js`
   - `README.md`
   - `package.json`
3. Write commit message: "Initial commit - British Square Game"
4. Click "Commit changes"

### Step 3: Enable GitHub Pages
1. Go to your repository Settings
2. Scroll down to "Pages" section
3. Under "Source", select "Deploy from a branch"
4. Select "main" branch and "/ (root)" folder
5. Click "Save"
6. Wait 2-3 minutes for deployment

### Step 4: Access Your Game
Your game will be live at: `https://YOUR-USERNAME.github.io/british-square-game/`

---

## Option 2: Netlify (Alternative - Free)

### Step 1: Prepare Files
1. Create a ZIP file with all your game files
2. Go to [Netlify.com](https://netlify.com)
3. Sign up for free account

### Step 2: Deploy
1. Go to Netlify dashboard
2. Drag your ZIP file to the deploy area
3. Netlify will automatically deploy your site
4. You'll get a URL like: `https://amazing-name-123456.netlify.app`

### Step 3: Custom Domain (Optional)
- You can change the subdomain name in Site Settings

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
