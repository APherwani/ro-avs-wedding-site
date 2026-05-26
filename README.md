# Ro & Avs Wedding Website

An Indian-style wedding website built with Next.js, TypeScript, and Tailwind CSS.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

For the full RSVP/admin/API flow, use the Cloudflare Pages preview instead:

```bash
npm run db:migrate
npm run preview
```

Open the local Wrangler URL shown in the terminal, usually
[http://localhost:8788](http://localhost:8788).

## Customizing Content

All wedding details live in two config files:

### `src/config/content.ts`

Edit couple names, wedding date, story text, event details (Mehendi, Sangeet, Wedding, Reception), and venue info.

### `src/config/images.ts`

All image paths are centralized here. To swap photos:

1. Add your images to `/public/images/`
2. Update the corresponding path in `src/config/images.ts`

Available image slots:

| Key | Description |
|-----|-------------|
| `hero` | Full-screen hero background |
| `groomPortrait` | Groom's portrait |
| `bridePortrait` | Bride's portrait |
| `coupleStory` | Our Story section photo |
| `mehendiEvent` | Mehendi event card |
| `sangeetEvent` | Sangeet event card |
| `weddingEvent` | Wedding event card |
| `receptionEvent` | Reception event card |
| `gallery` | Array of gallery photos |
| `venue` | Venue photo |

Until real photos are added, the site displays placeholder graphics.

## Site Sections

- **Hero** — Couple names, date, hashtag, and live countdown timer
- **Our Story** — Photo and love story text
- **Events** — Mehendi, Sangeet, Wedding Ceremony, Reception with dates, times, venues, and dress codes
- **Gallery** — Masonry photo grid with hover effects
- **Venue** — Venue details and map link
- **RSVP** — Guest form with name, email, guest count, event selection, dietary needs, and message
- **Footer** — Couple names and hashtag

## Tech Stack

- [Next.js](https://nextjs.org) (App Router)
- TypeScript
- Tailwind CSS
- Playfair Display + Cormorant Garamond fonts

## Deployment

```bash
npm run build
```

Deploy with Cloudflare Pages so the `/functions` API routes, D1 database, and
R2 image bucket are available. A plain static host can render the site, but
RSVPs, admin login, config editing, and image uploads will not work there.

## RSVP Durability

Every RSVP is written to D1 and also backed up as a private JSON object in R2
under `rsvp-backups/submissions/`. The public image proxy only serves the
`gallery`, `events`, and `site` folders, so RSVP backups are not public assets.

If D1 is unavailable during a guest submission, the site accepts the RSVP only
when the R2 backup succeeds. If the admin RSVP list cannot read D1, it falls
back to those private R2 backup records so the guest list remains recoverable.

Organizer notification emails use Resend. Configure these Cloudflare
environment variables/secrets:

```bash
RESEND_API_KEY=...
RSVP_NOTIFY_FROM="Ro & Avs Wedding <rsvp@yourdomain.com>"
RSVP_NOTIFY_TO="planner@example.com,couple@example.com"
RSVP_NOTIFY_SUBJECT_PREFIX="Wedding RSVP" # optional
RSVP_NOTIFY_REPLY_TO="planner@example.com" # optional; defaults to guest email
```

`RSVP_NOTIFY_TO` defaults to `ALLOWED_ADMIN_EMAILS` when set. Email failures are
logged but do not block a guest after the RSVP has been saved to D1 or backed up
to R2.

After setting secrets, test Resend through the deployed Pages Function:

```bash
TOKEN=$(curl -sS https://YOUR_PAGES_DOMAIN/api/admin/auth \
  -H 'content-type: application/json' \
  --data '{"password":"YOUR_ADMIN_PASSWORD"}' \
  | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).token))")

curl -sS -X POST https://YOUR_PAGES_DOMAIN/api/admin/test-email \
  -H "authorization: Bearer $TOKEN"
```

If Resend rejects the email, this endpoint returns the exact Resend status and
error body without exposing the API key.
