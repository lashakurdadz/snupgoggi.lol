## snupgoggi.lol – Gogi's Birthday Party

Mobile-first signup page for Gogi's birthday party, with a simple guest list backend ready for Vercel.

### Project structure

- `public/index.html` – main signup page (name + donation checkbox).
- `public/admin.html` – host-only guest list view.
- `public/styles.css` – shared styling (2016 house party vibe).
- `public/main.js` – frontend logic for signup + donation reveal.
- `api/guests.js` – Vercel serverless function for saving/loading guests using Vercel Postgres.
- `package.json` – dependencies (`@vercel/postgres`) and scripts.

### Run locally (with Vercel dev)

```bash
cd snupgoggi.lol
npm install
npx vercel dev
```

Then open:

- `http://localhost:3000/` – signup
- `http://localhost:3000/admin.html` – guest list

### Deploy to Vercel

1. Create a new GitHub repo and push this folder.
2. In Vercel, import the repo as a new project (Framework: "Other").
3. In the Vercel project, add a **Postgres** database (free tier) under **Storage**.
4. Add your custom domain `snupgoggi.lol` in **Settings → Domains` and follow the DNS instructions from Vercel.

