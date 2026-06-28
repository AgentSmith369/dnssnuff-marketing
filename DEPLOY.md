# DNSSnuff Astro — Deployment Guide

## Architecture

```
dnssnuff.com/pricing, /features, /use-cases/*, /about, /blog/*, 
/alternatives/*, /docs, /privacy-policy, /terms-of-service, /cookie-policy
  → Cloudflare Pages (this Astro project)

dnssnuff.com/ (homepage with domain checker)
dnssnuff.com/auth/*, /dashboard/*, /report/*, /contact
  → Vercel (MakerKit/Next.js)
```

---

## Step 1 — Deploy Astro to Cloudflare Pages

### Option A: Connect GitHub repo (recommended)

1. Push this project to a GitHub repo (e.g. `dnssnuff/marketing`)
2. Go to Cloudflare Dashboard → Pages → Create a project
3. Connect your GitHub repo
4. Build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Node.js version: 20
5. Deploy

### Option B: Direct upload (quick test)

```bash
cd dnssnuff-astro
npm install
npm run build
npx wrangler pages deploy dist --project-name=dnssnuff-marketing
```

---

## Step 2 — Add custom domain to Pages

1. In Cloudflare Pages → your project → Custom domains
2. Add `dnssnuff.com`
3. Cloudflare will automatically handle DNS routing

**Important:** This will conflict with the existing Worker route `*dnssnuff.com/*`. See Step 4 for how to handle this.

---

## Step 3 — Update the Cloudflare Worker

The Worker (`dnssnuff-legal`) currently serves all content pages. Once Astro is deployed, slim the Worker down to only:

1. Pass-through GA4 injection + security headers (for MakerKit pages)
2. Route `/auth/*`, `/dashboard/*`, `/report/*`, `/contact` → Vercel (pass-through)
3. Remove all the PRICING_BODY, FEATURES_BODY, etc. variables — Pages handles those now

Updated Worker routing logic:
```javascript
// Marketing paths → let Pages handle (no Worker action needed)
// These are served by Cloudflare Pages directly

// App paths → pass through to Vercel
const APP_PATHS = ['/', '/auth/', '/dashboard/', '/report/', '/contact'];
// For these: fetch from origin + inject GA4 + add security headers
```

---

## Step 4 — Routing conflict resolution

Cloudflare Pages and Workers can coexist on the same domain. The Worker route `*dnssnuff.com/*` currently intercepts everything.

**Recommended approach:**
- Keep the Worker for app paths (`/`, `/auth/*`, `/dashboard/*`, `/report/*`, `/contact`)
- Change the Worker to NOT intercept marketing paths (just let Pages serve them)
- Update the Worker route to be path-specific rather than wildcard

Or more simply: **delete the Worker route** and handle app-path proxying differently.

The cleanest final architecture once both are deployed:

```
Cloudflare Pages serves: all marketing pages (static HTML — fastest possible)
MakerKit/Vercel serves: /, /auth/*, /dashboard/*, /report/*, /contact
Cloudflare Worker: optional thin wrapper for GA4 injection on Vercel-served pages
```

---

## Pages built

| Route | File |
|---|---|
| `/pricing` | `src/pages/pricing.astro` |
| `/features` | `src/pages/features.astro` |
| `/about` | `src/pages/about.astro` |
| `/docs` | `src/pages/docs.astro` |
| `/use-cases/developers` | `src/pages/use-cases/developers.astro` |
| `/use-cases/msp` | `src/pages/use-cases/msp.astro` |
| `/use-cases/it-teams` | `src/pages/use-cases/it-teams.astro` |
| `/blog` | `src/pages/blog/index.astro` |
| `/blog/what-is-dmarc` | `src/pages/blog/what-is-dmarc.astro` |
| `/blog/spf-dkim-dmarc-guide` | `src/pages/blog/spf-dkim-dmarc-guide.astro` |
| `/alternatives/mxtoolbox` | `src/pages/alternatives/mxtoolbox.astro` |
| `/alternatives/dnschecker` | `src/pages/alternatives/dnschecker.astro` |
| `/privacy-policy` | `src/pages/privacy-policy.astro` |
| `/terms-of-service` | `src/pages/terms-of-service.astro` |
| `/cookie-policy` | `src/pages/cookie-policy.astro` |

## Redirects (in `public/_redirects`)

- `/legal/*` → `/*` (legacy)
- `/use-cases` → `/features`

## Pricing (confirmed — 3-tier)

| Plan | Monthly | Annual |
|---|---|---|
| Free | $0 | — |
| Pro | $19/month | $190/year ($15.83/mo) |
| Agency | $49/month | $490/year ($40.83/mo) |

Annual saves 17%. All currency: USD.
