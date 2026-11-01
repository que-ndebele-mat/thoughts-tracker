# Thoughts Tracker

A small mindfulness app: start a window, get notified once at a random point
within it, and capture whatever thought was actually in your head — with a
category — before it slips away. Then do it again.

The randomness is the point: you can't anticipate the prompt, so it catches
what's really there instead of something performed for the occasion.

Live: https://que-ndebele-mat.github.io/thoughts-tracker/

## Quick start

```sh
make serve   # run locally at http://localhost:8000
make open    # open it in your browser
```

No build step, no dependencies — it's a static site (plain HTML/CSS/JS, ES
modules), so `make serve` is just a local file server.

## Deploying

```sh
make deploy
```

This is idempotent and safe to re-run:

- `make init`  — `git init` + first commit, if this isn't a repo yet
- `make repo`  — creates the public GitHub repo `que-ndebele-mat/thoughts-tracker`
  if it doesn't exist, then commits and pushes
- `make pages` — enables GitHub Pages (serving from `main`/root) if not
  already enabled
- `make deploy` runs all of the above and prints the live URL

Run `make url` any time to just print the URL, or `make help` for the full
list of targets.

## How it works

**Cadence modes** (Settings → Cadence mode):

- **Manual per session** — you tap Start, get notified once within the
  window, capture it, and it stops. Tap Start again whenever you want the
  next one.
- **Repeating all day** — as soon as one window is captured (or skipped), the
  next one starts automatically, for as long as the app is running, within
  your configured active hours.
- **Fixed count per day** — set a target number of check-ins; the app splits
  your active hours into that many slots and picks one random moment inside
  each.

**Settings** (window length, variation, cadence mode, active hours, fixed
count, categories, sound) all live in one settings object in `localStorage`
and are fully editable from the Settings screen — nothing about the timing is
hardcoded.

**Sound**: a short two-tone chime, synthesized in the browser with the Web
Audio API (no audio file to load or license). It plays on every real
notification, and there's a **Test Sound** button in Settings that plays the
exact same chime on demand. Browsers require a user gesture before audio can
play — tapping Start or Test Sound both satisfy that.

**Browser notifications**: on top of the sound, the app also asks for
permission to show a native browser notification when a window fires. If you
decline (or your browser doesn't support it), the sound and in-app capture
screen still work — notification permission is a nice-to-have, not a
dependency.

## Known limitations (it's a POC)

- **The tab has to stay open.** This is a static site with no backend and no
  service worker, so scheduling lives in plain JavaScript timers in the page.
  That's a non-issue for Manual mode (the window is short and you're actively
  there), but for All-day / Fixed-count mode it means keeping the tab open
  (e.g. pinned) for the whole stretch you want it covering.
- **Nothing survives a page reload or browser restart.** A running all-day or
  fixed-count schedule is in-memory only; reloading the page returns you to
  idle and you'd need to tap Start again.
- **No accounts, no sync.** Entries live in this browser's `localStorage`
  only. Use the **Export JSON** button in History to get your data out.
- If a new window fires while you still have an uncaptured one open (only
  possible in all-day/fixed-count modes), the overlapping one is silently
  dropped rather than stacking screens.

## File layout

```
index.html
css/style.css
js/storage.js        — localStorage read/write for settings + entries
js/sound.js           — synthesized chime (playChime) + AudioContext unlock
js/notifications.js   — browser Notification permission + display
js/scheduler.js       — manual / all-day / fixed-count timing logic
js/app.js             — view wiring and all UI event handling
Makefile              — local serve + full deploy pipeline
```

## What's next

- Export is JSON-only today; CSV would be easy to add alongside it.
- A real "survives reload / tab closed" experience would need a service
  worker plus a push backend — a deliberately separate, bigger step from this
  POC.
- The `variation` setting currently only supports `'uniform'` (even
  randomness across the window); it's structured as its own setting so other
  distributions (e.g. biased toward the middle, or a minimum gap between
  notifications) can be added without touching the rest of the scheduler.
