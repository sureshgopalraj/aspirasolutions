# How to Push Your Code to GitHub

I have already initialized the git repository and saved your files locally. Now you need to send them to the cloud.

### 1. Create a Repository on GitHub.com
1.  Go to [github.com/new](https://github.com/new) (Log in if needed).
2.  **Repository Name**: `claims-app` (or whatever you like).
3.  **Public/Private**: Private is better for security (since you have keys, though we kept them out of git, it's good practice).
4.  **Do NOT check** "Add a README file" or .gitignore (we already have them).
5.  Click **Create repository**.

### 2. Connect and Push
Once created, GitHub will show you a page with commands. Look for the section **"…or push an existing repository from the command line"**.

Copy those 3 lines of code. They will look like this (but with your username):

```bash
git remote add origin https://github.com/YOUR-USERNAME/claims-app.git
git branch -M main
git push -u origin main
```

### 3. Run them here
Paste those 3 lines into your terminal here and press Enter.
(You might be asked to sign in to GitHub in a browser window).

**Done!** Your code is now creating a backup on GitHub.
