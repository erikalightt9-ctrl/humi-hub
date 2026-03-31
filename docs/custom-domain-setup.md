# Custom Domain Setup Guide

Connect a professional domain name to your VA Training Center website hosted on Vercel.

---

## Prerequisites

- A registered domain name (e.g., `vatrainingcenter.com`)
- Access to your domain registrar's DNS settings (GoDaddy, Namecheap, Google Domains, etc.)
- Vercel project admin access

---

## Step 1: Add Domain in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select the **humi-hub** project
3. Navigate to **Settings** > **Domains**
4. Enter your custom domain (e.g., `vatrainingcenter.com`)
5. Click **Add**
6. Vercel will show you the DNS records you need to configure

---

## Step 2: Configure DNS Records

Go to your domain registrar's DNS management panel and add the records Vercel provides.

### Option A: Apex Domain (vatrainingcenter.com)

| Type | Name     | Value        |
|------|----------|--------------|
| A    | @ (root) | 76.76.21.21  |

### Option B: Subdomain (www.vatrainingcenter.com)

| Type  | Name | Value                |
|-------|------|----------------------|
| CNAME | www  | cname.vercel-dns.com |

### Recommended: Both apex + www

Add **both** records above. Vercel will auto-redirect one to the other (configurable in Vercel Dashboard).

---

## Step 3: Wait for DNS Propagation

- Usually takes **5-30 minutes**, can take up to **48 hours**
- Vercel Dashboard shows a verification status indicator
- Use [dnschecker.org](https://dnschecker.org) to check propagation globally

---

## Step 4: SSL Certificate

- Vercel **automatically** provisions a free SSL certificate via Let's Encrypt
- No manual action needed
- The certificate renews automatically
- You'll see a green lock icon in the browser when it's active

---

## Step 5: Update Environment Variables (CRITICAL)

**This step is critical — authentication will break without it.**

1. Go to **Vercel Dashboard** > **Settings** > **Environment Variables**
2. Find and update `NEXTAUTH_URL`:
   - **Old value:** `https://humi-hub.vercel.app`
   - **New value:** `https://vatrainingcenter.com` (your custom domain)
3. Click **Save**
4. **Redeploy the application** after updating the environment variable

```
vercel --prod --yes
```

If `NEXTAUTH_URL` is not updated, login and authentication callbacks will fail.

---

## Step 6: Update Application References

Check and update any hardcoded URLs:

- Email templates in `src/lib/email/` that reference the old domain
- Any external services pointing to `humi-hub.vercel.app`
- Social media profile links
- Google Business Profile or directory listings

---

## Verification Checklist

- [ ] Domain resolves to Vercel (visit your domain in browser)
- [ ] SSL certificate is active (green lock icon in browser)
- [ ] `NEXTAUTH_URL` updated in Vercel environment variables
- [ ] Application redeployed after environment variable change
- [ ] Admin login works on the new domain
- [ ] Student login works on the new domain
- [ ] Certificate verification page works (`/verify`)
- [ ] Enrollment form submits correctly
- [ ] Email notifications include correct domain links

---

## Troubleshooting

### Domain not resolving
- Wait up to 48 hours for DNS propagation
- Verify DNS records are correct at your registrar
- Check Vercel Dashboard for verification status

### SSL certificate not provisioning
- Ensure DNS records point to Vercel
- Wait for DNS propagation to complete
- Try removing and re-adding the domain in Vercel

### Login not working
- Verify `NEXTAUTH_URL` matches your custom domain exactly
- Include `https://` in the value
- Redeploy after changing the variable
