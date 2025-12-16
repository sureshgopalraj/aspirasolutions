---
description: How to deploy the Claims Processing Website to a custom server
---

# Deploying to Your Own Server (VPS/Dedicated)

Since this is a Next.js application (Node.js), you cannot just copy files to a standard PHP/HTML hosting (like basic cPanel) unless they support **Node.js**.

## Prerequisites on the Server
1.  **Node.js**: Version 18 or higher.
2.  **PM2**: Process manager to keep the app running (`npm install -g pm2`).
3.  **Nginx/Apache**: To act as a reverse proxy (point yourdomain.com -> localhost:3000).

## Step-by-Step Deployment

### 1. Build locally (Recommended)
This creates the optimized production files.
```powershell
npm run build
```

### 2. Prepare Files for Transfer
You need to move these files/folders to your server:
- `.next/` (The build folder - key!)
- `public/` (Static assets)
- `templates/` (Your Word templates)
- `package.json`
- `package-lock.json`
- `next.config.ts`
- `.env.local` (Your credentials)

**Tip:** Zip these specific files into `deploy.zip` to make it easier.

### 3. Upload to Server
Upload `deploy.zip` to your server folder (e.g., `/var/www/claims-app`).
Unzip it there.

### 4. Install Dependencies (On Server)
Run this command inside the folder on your server:
```bash
npm install --production
```

### 5. Start the App
Use PM2 to run it in the background:
```bash
pm2 start npm --name "claims-app" -- start
```
*Your app is now running on port 3000!*

### 6. Point Your Domain (Nginx Example)
Configure Nginx to proxy requests from your domain to port 3000.
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

# GoDaddy / cPanel / Shared Hosting Users

**STOP & CHECK:** Does your hosting plan support **Node.js**?

Most basic GoDaddy plans ("Linux Hosting", "WordPress Hosting") **DO NOT** support running this application because it needs a persistent backend server. It is NOT a static HTML site.

### How to check:
1.  Log in to your **cPanel**.
2.  Look for a section called **"Software"**.
3.  Do you see an icon **"Setup Node.js App"**?
    *   **YES**: You *might* be able to run it. (Requires uploading files, creating app, handling port mapping).
    *   **NO**: You **CANNOT** host this app on your current plan.

### Recommended Alternative
If your hosting doesn't support Node.js, do not upgrade to an expensive VPS just for this.

**Use Vercel (Free Tier) + Your GoDaddy Domain**:
1.  Deploy your code to **Vercel** (it's built for Next.js).
2.  In Vercel: Settings -> Domains.
3.  Type `yourdomain.com`.
4.  Vercel will give you a **CNAME** or **A Record**.
5.  Go to **GoDaddy DNS Manager** and add those records.
    *   *Result*: Your site loads at `yourdomain.com`, but runs on Vercel's servers.

---

# Alternative: Vercel (Easiest)
If you just want it on your domain without managing a server:
1.  Push your code to **GitHub**.
2.  Go to [Vercel.com](https://vercel.com) -> New Project -> Import from GitHub.
3.  Add your Environment Variables (`GOOGLE_PRIVATE_KEY` etc) in Vercel Settings.
4.  Add your **Custom Domain** in Vercel Settings.
