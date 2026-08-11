# QuickAI Keyboard — Backend

A small Express server that sits between the iPhone keyboard and OpenAI.
The OpenAI API key lives **only** here, as an environment variable — it is
never sent to, or stored on, the phone.

## 1. Requirements

- Node.js **18 or newer** (check with `node -v`)
- An OpenAI API key from https://platform.openai.com/api-keys

## 2. Install

```bash
cd backend
npm install
```

## 3. Configure your secret key

```bash
cp .env.example .env
```

Open the new `.env` file in any text editor and replace the placeholder:

```
OPENAI_API_KEY=sk-your-real-key-here
PORT=3000
ALLOWED_ORIGINS=*
```

`.env` is already listed in `.gitignore` — it will never be committed to git.

## 4. Run it locally

```bash
npm start
```

You should see:

```
QuickAI Keyboard backend listening on port 3000
```

Leave this running in its own terminal window while you test.

## 5. Test it with curl

Health check:

```bash
curl http://localhost:3000/health
```

Expected: `{"status":"ok"}`

Real AI request:

```bash
curl -X POST http://localhost:3000/api/ai \
  -H "Content-Type: application/json" \
  -d '{"text":"bhai kal meeting ke liye jaldi aa jana","action":"Translate","language":"English"}'
```

Expected (wording will vary):

```json
{"success":true,"result":"Please arrive a little early for tomorrow's meeting."}
```

If you get `{"success":false,"error":"..."}`, read the error message — it will
tell you what's wrong (bad action, empty text, etc). Server-side details are
printed in your terminal, not sent to the client.

## 6. Deploy it (Railway — beginner friendly)

Railway gives you a free HTTPS URL with almost no configuration.

1. Go to https://railway.app and sign up (GitHub login is easiest)
2. Push this `backend/` folder to a **new GitHub repository** (it can be
   private). Make sure `.env` is NOT included — check that `.gitignore` is
   present so it's excluded automatically.
3. In Railway: **New Project → Deploy from GitHub repo** → select your repo
4. Railway detects Node.js automatically. Set the **Root Directory** to
   `backend` if your repo contains other folders (like the iOS project) too
5. Go to your new service → **Variables** tab → add:
   - `OPENAI_API_KEY` = your real key
   - (Railway sets `PORT` automatically — you don't need to add it)
6. Deploy. Once it's live, go to **Settings → Networking → Generate Domain**
   to get a public HTTPS URL like `https://quickai-backend-production.up.railway.app`
7. Test it the same way as step 5, but with your Railway URL instead of
   `localhost:3000`

### Alternative: Vercel

Vercel works too but is built around serverless functions rather than a
long-running Express server. If you'd rather use Vercel, the simplest path
is wrapping `app` from `server.js` as a serverless function — ask if you'd
like that version; Railway is recommended here because this Express app
runs on it with zero changes.

## 7. Put the URL into the iPhone app

Once deployed, copy the HTTPS URL (no trailing slash), e.g.:

```
https://quickai-backend-production.up.railway.app
```

Open the QuickAI Keyboard app on your iPhone → **Settings tab → Backend URL**
→ paste it → **Save**. The keyboard extension reads this value through the
shared App Group — no rebuild needed when you change it.

## 8. Local development against the iPhone (optional)

To test against your Mac's local server from a real iPhone before deploying:

- Your Mac and iPhone must be on the same Wi-Fi network
- Find your Mac's local IP (System Settings → Wi-Fi → Details → IP address),
  e.g. `192.168.1.23`
- In the app's Backend URL field, enter `http://192.168.1.23:3000`
- **Important:** this is `http://`, not `https://`. iOS blocks plain HTTP by
  default (App Transport Security). This is a deliberate iOS security
  feature — don't disable it globally. Instead, only allow this one
  local-network exception, and only in your local development build:
  in the KeyboardExtension's `Info.plist`, add an
  `NSAppTransportSecurity` → `NSExceptionDomains` entry scoped to your
  Mac's specific local IP, or simpler: just switch to your deployed HTTPS
  Railway URL for any testing beyond your own Mac — this avoids ATS
  configuration entirely and matches production. Ask if you want the exact
  ATS plist snippet for local-IP testing.

## 9. What this backend does NOT do

- Does not store your messages or AI results anywhere
- Does not log the text you send — only a short error code on failure
- Does not require you (the end user of the iPhone app) to have an OpenAI
  account or API key
- Does not authenticate requests beyond rate-limiting by IP — acceptable for
  a personal single-user app; see the tradeoff note below

## 10. Security tradeoff note

This backend has no login system. Anyone who discovers your backend URL
could send it requests (subject to the rate limit) and consume your OpenAI
credits. For a personal project this is a reasonable tradeoff for simplicity.
If you ever share this app with other people, add a shared-secret header
(e.g. a random string the app sends as `X-App-Secret` and the server checks)
before making the URL public — ask if you'd like that added.
