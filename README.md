# Ro & Avs Wedding Website

An Indian-style wedding website built with Next.js, TypeScript, and Tailwind CSS.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

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

Deploy the output to Vercel, Netlify, or any static hosting provider.
