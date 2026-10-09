# Ledgerly AI Expense Tracker

A responsive personal-finance app built with React + Vite, Express, Supabase Auth/Postgres, and Groq. Currency defaults to Bangladeshi taka (BDT).

## Included in this starter

- Email/password signup and login through Supabase Auth
- Add and delete expense/income records
- Monthly overview with income, spending, net cash flow, and category breakdown
- CSV export for the selected month
- Category-based monthly budgets and over-budget warnings
- AI natural-language entry parsing, with a review-and-confirm step before anything is saved
- AI budgeting Q&A based on monthly totals, category aggregates, and budgets
- Responsive desktop and mobile layout
- Supabase row-level security policies for user-owned transactions and budgets

## 1. Requirements

- Node.js 20 or newer
- A Supabase project
- A Groq API key for AI features (the rest of the app can be used without AI after Supabase is configured)

## 2. Set up Supabase

1. Create a project at https://supabase.com/dashboard.
2. Open **SQL Editor** and run the complete `supabase/schema.sql` file.
3. Open **Project Settings → API** and copy the project URL and the `anon` / publishable key.
4. In **Authentication → URL Configuration**, set your local site URL to `http://localhost:5173`. Add your production URL to the allowed redirect URLs when you deploy.
5. For a personal tracker, enable email/password authentication. If email confirmation is enabled, confirm the signup email before signing in.

The server uses the public/anon key together with each signed-in user's access token. Database access is limited by the included RLS policies. Do not replace the anon key with a service-role key in the browser or server.

## 3. Configure environment variables

Create `web/.env` by copying `web/.env.example` and fill in:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
VITE_API_URL=
```

Create `server/.env` by copying `server/.env.example` and fill in:

```env
PORT=3001
NODE_ENV=development
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
GROQ_API_KEY=YOUR_GROQ_API_KEY
GROQ_MODEL=openai/gpt-oss-120b
WEB_ORIGIN=http://localhost:5173
```

Keep `GROQ_API_KEY` only in `server/.env` or your hosting provider's secret environment settings. Never add it to `web/.env`, commit it to Git, or expose it in frontend code. If the selected Groq model is unavailable for your account, set `GROQ_MODEL` to a currently supported model in your Groq console.

## 4. Run locally

From the project root:

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. Vite forwards `/api` requests to Express on port `3001`.

Build the frontend and start the API (the API also serves the built frontend if `web/dist` exists):

```bash
npm run build
npm start
```

## 5. Deploy

You can deploy the frontend separately from the Express API, or host the whole project on a Node.js-capable host.

- **Frontend:** Vercel or another static hosting provider. Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_API_URL` to the deployed API base URL (no trailing slash). Build command: `npm run build --workspace expense-tracker-web`; output directory: `web/dist`.
- **API:** a Node.js host such as Render or a Hostinger plan that explicitly supports running a Node.js application. Set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `GROQ_API_KEY`, `GROQ_MODEL`, `NODE_ENV=production`, and `WEB_ORIGIN` for the deployed frontend origin. Start command: `npm start --workspace expense-tracker-server`.
- **Single deployment:** on a Node.js host, run `npm run build` then `npm start`. The Express app serves `web/dist` and the `/api` routes on the same origin. Confirm that your selected plan supports persistent Node processes before relying on it for an always-on finance app.

If the frontend and API are on different domains, `WEB_ORIGIN` must match the frontend origin exactly. Add your production app URL to Supabase Auth's allowed redirect URLs.

## AI and privacy notes

- Natural-language transaction text is sent to Groq to extract draft records. The app shows the draft and requires your confirmation before saving.
- AI questions use monthly totals, category-level expense sums, and budget summaries. Raw descriptions are not sent for the spending-insight endpoint.
- AI output can be incorrect. Check amounts, dates, categories, and all suggestions before relying on them.
- Do not enter bank passwords, card numbers, national identity numbers, or other secrets into the AI input.
- The AI feature provides general budgeting support, not certified financial, tax, investment, legal, or debt advice.

## First-run checklist

- [ ] Run `supabase/schema.sql`
- [ ] Set both environment files
- [ ] Start the app and create a user
- [ ] Add one expense and one income record
- [ ] Create a monthly budget
- [ ] Test AI parsing and confirm the draft before saving
- [ ] Test CSV export
- [ ] Verify data separation with a second test user before public launch

This is a starter implementation. Add automated tests, rate limiting, monitoring, and a reviewed privacy policy before opening it to the public.
