# SigmaChiHQ Goal Tracker — standalone prototype

This is the SigmaChiHQ Goal Tracker, packaged as a small self-hosted web app
instead of a Claude Artifact. It's the same page — same 3–5 objectives per
person, quarterly key-result check-ins, department roll-up, and the "Who are
you?" personalized landing view — now running on a tiny server you (or
anyone on your team) can run yourselves, without a Claude account.

It ships pre-loaded with everything currently in the live tracker: all 65
objectives across all 21 people who have goals set, exported on
2026-09-15.

**Read the "No login, and what that means" section below before sharing this
with your team** — it's important and easy to miss.

---

## Run it today (5 minutes)

You need [Node.js](https://nodejs.org) version 18 or later installed. Most
Macs and work laptops either already have it or can install it from that
link in a couple of minutes (the "LTS" download). To check, open a terminal
and run `node --version`.

1. Unzip this folder and open a terminal in it.
2. Install dependencies (one time only):
   ```
   npm install
   ```
3. Start the server:
   ```
   npm start
   ```
4. Open **http://localhost:3000** in your browser. That's the tracker,
   running from your machine.

Leave the terminal window open — closing it stops the server. Every change
anyone makes (a new objective, a check-in, an assignment) is saved to a file
at `data/goals.json` right in this folder, so your data survives restarting
the server. (If you ever want to start over from the original 65 objectives,
just delete `data/goals.json` and restart — it re-seeds automatically from
`data/goals.seed.json`, which is never touched.)

---

## Sharing it with your team today

Running it on your laptop only shows the tracker to *you*, on that machine.
Here are three ways to get your team looking at the same shared copy, in
order of how much setup they take.

### Option A — same office Wi-Fi or VPN (fastest, no new tools)

If everyone is on the same network right now (same office Wi-Fi, or your
company VPN), they can open the tracker directly from your laptop:

1. With the server running, find your computer's local IP address:
   - Mac: System Settings → Wi-Fi → Details (or run `ipconfig getifaddr en0`
     in Terminal)
   - Windows: run `ipconfig` in Command Prompt and look for "IPv4 Address"
2. Teammates open `http://<that IP address>:3000` in their own browser —
   e.g. `http://192.168.1.42:3000`.

Caveats: your laptop has to stay on, awake, and running the server the
whole time; if it sleeps or you close the terminal, the site goes down for
everyone. Some office networks or firewalls block this kind of direct
connection between laptops — if it doesn't load for a teammate, that's
probably why.

### Option B — a temporary public link (good for a same-day pilot)

A tunnel tool gives anyone, anywhere, a real `https://` link straight into
the copy running on your laptop — no deployment, no account required for a
quick trial. [ngrok](https://ngrok.com/download) is the most common one:

1. Install ngrok and create a free account (their site walks you through
   it).
2. With `npm start` already running in one terminal, open a second terminal
   in the same folder and run:
   ```
   ngrok http 3000
   ```
3. ngrok prints a URL like `https://a1b2c3d4.ngrok-free.app` — send that to
   your team. Anyone who opens it reaches the tracker on your laptop.

Caveats: same as Option A, your laptop needs to stay on and running for the
link to work, and a free ngrok link changes each time you restart it.
This is best for "let's try this out together this afternoon," not for a
link you hand out once and expect to keep working next week.

### Option C — a real, persistent link (best if this sticks around)

For a URL that works whether or not your laptop is on — the right move once
your team is actually going to use this day to day — deploy it to a small
hosting service. [Render](https://render.com) and
[Railway](https://railway.app) both have straightforward free/cheap tiers
and don't require you to know much about servers. Render's steps:

1. Put this folder in a GitHub repository (create a new repo on
   [github.com](https://github.com), then follow its instructions to push
   this folder to it — or ask Claude to do this for you if it has access to
   your GitHub).
2. On [render.com](https://render.com), sign up, then **New +** → **Web
   Service**, and connect the repo you just created.
3. Render will detect it's a Node app. Confirm these settings (they should
   be the defaults):
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Click **Create Web Service**. After a couple of minutes you'll get a
   permanent URL like `https://sigmachihq-goal-tracker.onrender.com` —
   that's what you share with your team.

Railway's flow is nearly identical (New Project → Deploy from GitHub repo →
it detects the Node app and deploys automatically).

**One thing to know about the free tiers:** on Render and Railway's free
plans, the app's data file can reset back to the original 65-objective seed
if the service redeploys or its storage resets — the free tier isn't
guaranteed to keep files around indefinitely. For a short pilot this is
usually fine. If your team starts relying on this for real and you want
guaranteed durability, the next step is either a small paid persistent-disk
add-on (both platforms offer one for a few dollars a month) or moving the
data into a proper hosted database — worth asking Claude to help with
either when you're ready.

---

## No login, and what that means

This tracker has never had real access control, in the Claude Artifact
version or here — that was a deliberate, discussed tradeoff, not an
oversight. There's a "Who are you?" picker so each person's view opens
straight to their own objectives and their team's, but picking a name is
just a per-device convenience (like a bookmark), not a login: **everyone who
has this link can see and edit every objective on the page**, the same as
today's Artifact version.

If you need real per-person access control — so a director genuinely cannot
edit another director's objectives — that requires actual authentication
(accounts, passwords, sessions) added to this app, which is a meaningfully
bigger build than this prototype. Worth doing once you know this is the
system your team wants to keep, rather than up front.

---

## What's different from the Claude Artifact version

- **Where it runs:** a small Node.js/Express server you control, instead of
  Claude's Artifact platform. No Claude account needed to use it.
- **How updates sync:** every open browser tab checks the server for
  changes every 4 seconds, so everyone sees everyone else's edits within a
  few seconds — not instantly, but close. (The Artifact version pushed
  changes immediately; this trades a small delay for running anywhere.)
- **Where data lives:** a JSON file (`data/goals.json`) on whatever machine
  runs the server, instead of Claude's hosted database. Back that file up
  the same way you'd back up any other spreadsheet or document that
  matters to you.
- Everything else — the UI, the roster, the department roll-up, the
  personalized dashboard, the quarterly check-ins — is the same code,
  unchanged.

---

## Project structure

```
.
├── server.js              # the whole backend: serves the page + a small JSON API
├── public/index.html       # the tracker page (UI + client logic)
├── data/goals.seed.json   # the original 65 objectives (never modified)
├── data/goals.json         # created on first run — this is your live data
├── package.json
└── README.md                # this file
```
