# 🚀 Simple Deployment Guide: Vercel + Render

## Quick Setup (5 Minutes)

### 1. Frontend Deployment on Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository: `Error-Enigma`
4. **Important Settings:**
   - Framework Preset: **Create React App**
   - Root Directory: **frontend**
   - Build Command: **npm run build**
   - Output Directory: **build**

5. **Environment Variables** (Add in Vercel Dashboard):
   ```
   REACT_APP_API_URL=https://your-backend-name.onrender.com
   REACT_APP_FIREBASE_PROJECT_ID=error-404-6b343
   REACT_APP_FIREBASE_API_KEY=AIzaSyAz_oD7ZTzoJqsJOc3wWOtzJZ94luR3si4
   ```

6. Click **Deploy**

### 2. Backend Deployment on Render
1. Go to [render.com](https://render.com)
2. Click "New +"
3. Select "Web Service"
4. Connect your GitHub repository: `Error-Enigma`
5. **Important Settings:**
   - Name: **edtech-backend** (or your choice)
   - Root Directory: **backend**
   - Build Command: **npm install**
   - Start Command: **npm start**

6. **Environment Variables** (Add in Render Dashboard):
   ```
   NODE_ENV=production
   CORS_ORIGIN=https://your-frontend-name.vercel.app
   FIREBASE_PROJECT_ID=error-404-6b343
   FIREBASE_API_KEY=AIzaSyAz_oD7ZTzoJqsJOc3wWOtzJZ94luR3si4
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   JWT_SECRET=your-super-secure-jwt-secret-for-production
   SECRET_KEY=your-secret-key-for-production
   DATABASE_URL=postgresql://user:pass@host:port/dbname
   ```

7. Click **Create Web Service**

### 3. After Both Deploy Successfully
1. **Update Frontend Environment**: 
   - Go back to Vercel dashboard
   - Update `REACT_APP_API_URL` with your Render backend URL
   - Redeploy frontend

2. **Update Backend CORS**:
   - Go to Render dashboard  
   - Update `CORS_ORIGIN` with your Vercel frontend URL
   - Backend will auto-redeploy

## 🔧 Fix Common Issues

### Vercel Build Errors
- **Error**: "Could not find required file: index.html"
  - **Fix**: Make sure Root Directory is set to `frontend`

- **Error**: "Module not found" 
  - **Fix**: Run `npm install` locally first, commit changes

### Render Backend Errors  
- **Error**: "Application failed to respond"
  - **Fix**: Check logs, ensure PORT is not hardcoded

- **Error**: "Database connection failed"
  - **Fix**: Add PostgreSQL database service in Render

## 🎯 Final URLs
After successful deployment:
- **Frontend**: https://your-app.vercel.app
- **Backend**: https://your-backend.onrender.com
- **Health Check**: https://your-backend.onrender.com/health

## 📱 Testing Deployment
1. Visit your frontend URL
2. Try the AI chat - it should connect to your backend
3. Check browser console for any errors
4. Test adaptive assessment functionality

## 💡 Pro Tips
- Render free tier sleeps after 15 minutes of inactivity
- First request after sleep takes ~30 seconds to wake up
- Vercel builds are typically faster than Render
- Both services offer excellent logging for debugging
