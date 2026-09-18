// SigmaChiHQ Goal Tracker — standalone server
//
// A small self-contained Express app that serves the tracker page and a
// JSON REST API backed by a single file on disk (data/goals.json). Every
// person who opens the page talks to this one running copy, so everyone
// sees the same shared, live-ish data (the page polls every few seconds).
//
// There is no login here — same as the original prototype, this is a
// convenience layer, not access control. See README.md.

const express = require("express");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "goals.json");
// The seed file lives OUTSIDE data/ on purpose: data/ is where a Render
// persistent disk gets mounted, and a disk mount can shadow/replace
// whatever was checked out from git at that path. Keeping the seed file
// in its own top-level folder means it always survives a fresh disk
// attach or a redeploy, even if the live data file underneath it is
// empty or missing.
const SEED_FILE = path.join(__dirname, "seed-data", "goals.seed.json");

const app = express();
app.use(express.json({ limit: "2mb" }));

// ---------- tiny file-backed store ----------
// Node is single-threaded and every request here is handled synchronously
// with respect to the store (no awaits between read and write), so a plain
// in-memory array + "save after every mutation" is safe without a real
// database or file locking.

function loadInitial() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(DATA_FILE)) {
    try {
      const raw = fs.readFileSync(DATA_FILE, "utf8");
      const parsed = JSON.parse(raw);
      // Treat an empty list the same as "no file yet" and fall through to
      // the seed data below. This is what makes the app self-heal if a
      // persistent disk ever mounts empty over data/ again (as happened
      // once during setup) instead of quietly starting the site at zero
      // objectives.
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
      console.error("data/goals.json exists but is empty — re-seeding from goals.seed.json instead.");
    } catch (e) {
      console.error("Failed to parse data/goals.json — starting from the seed file instead.", e);
    }
  }
  if (fs.existsSync(SEED_FILE)) {
    const raw = fs.readFileSync(SEED_FILE, "utf8");
    return JSON.parse(raw);
  }
  return [];
}

let goals = loadInitial();

function save() {
  // Write to a temp file then rename, so a crash mid-write can't corrupt
  // the real data file.
  const tmp = DATA_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(goals, null, 2));
  fs.renameSync(tmp, DATA_FILE);
}

// Persist the initial load immediately so data/goals.json exists on first
// run (makes it obvious where the live data lives, and means re-seeding
// only happens if that file is deleted on purpose).
save();

function genId() {
  return "g" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ---------- API ----------

app.get("/api/goals", (req, res) => {
  res.json(goals);
});

app.post("/api/goals", (req, res) => {
  const body = req.body || {};
  const now = new Date().toISOString();
  const doc = Object.assign({}, body, {
    id: genId(),
    createdAt: body.createdAt || now,
    updatedAt: now
  });
  goals.push(doc);
  save();
  res.status(201).json(doc);
});

app.patch("/api/goals/:id", (req, res) => {
  const idx = goals.findIndex((g) => g.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "not_found" });
  const patch = Object.assign({}, req.body || {}, { updatedAt: new Date().toISOString() });
  goals[idx] = Object.assign({}, goals[idx], patch);
  save();
  res.json(goals[idx]);
});

app.delete("/api/goals/:id", (req, res) => {
  const idx = goals.findIndex((g) => g.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "not_found" });
  goals.splice(idx, 1);
  save();
  res.status(204).end();
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, goalCount: goals.length });
});

// ---------- static page ----------
app.use(express.static(path.join(__dirname, "public")));

app.listen(PORT, () => {
  console.log("SigmaChiHQ Goal Tracker running at http://localhost:" + PORT);
  console.log("Data file: " + DATA_FILE + " (" + goals.length + " objectives loaded)");
});
