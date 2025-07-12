# Netlify Deployment Guide for Stationery Rubix

This guide will help you deploy your Next.js project to Netlify with SSR/ISR support.

---

## 1. Prerequisites
- You have a Netlify account: https://app.netlify.com/
- Your project is pushed to a Git provider (GitHub, GitLab, Bitbucket)
- Your Google Apps Script is deployed and the URL is ready

---

## 2. Install Netlify Next.js Plugin

In your project root, run:

```bash
npm install --save-dev @netlify/plugin-nextjs
```

---

## 3. Create `netlify.toml`

This file tells Netlify how to build and serve your app. It is already created for you:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

---

## 4. Set Environment Variables

Go to **Site settings > Environment variables** in Netlify and add:

- `APPS_SCRIPT_URL` (your Google Apps Script endpoint)
- Any other secrets or config your app needs

---

## 5. Connect Your Repo to Netlify

1. Go to https://app.netlify.com/
2. Click **Add new site > Import an existing project**
3. Choose your Git provider and repo
4. Set the build command: `npm run build`
5. Set the publish directory: `.next`
6. Click **Deploy site**

---

## 6. (Optional) Custom Domain
- After deploy, go to **Domain settings** to add a custom domain

---

## 7. (Optional) Custom 404 Page
- Add `public/404.html` for a custom not found page

---

## 8. Test Your Deployment
- Visit your Netlify site URL
- Test all user/admin flows
- Check logs in Netlify dashboard for errors

---

## 9. Troubleshooting
- If you see build errors, check your Node version (Netlify uses 18 by default; set in `package.json` or Netlify settings if needed)
- If you see blank pages, check your environment variables
- If SSR/ISR is not working, make sure the Netlify Next.js plugin is installed and in `netlify.toml`

---

## 10. Useful Links
- [Netlify Next.js Plugin Docs](https://github.com/netlify/netlify-plugin-nextjs)
- [Netlify Docs](https://docs.netlify.com/)
- [Next.js Docs](https://nextjs.org/docs)

---

**You are ready to deploy!** 