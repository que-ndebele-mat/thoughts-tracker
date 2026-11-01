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

Open the app, hit **Start** — that's the default experience, no setup
required. A 10-minute window starts; sometime within it you get a chime and a
capture screen.

Two settings control everything:

- **Window length** (minutes) — how long each window is. Default 10.
- **Repeat** (Settings → "Automatically start the next window after each
  capture") — off by default (one window per Start tap). Turn it on to keep
  going all day: as soon as you save or skip a capture, the next window
  starts right away, automatically, for as long as you leave the app open.
  There's no time-of-day concept anywhere — it's purely "keep chaining
  sessions back to back."

Window length, repeat, categories, and sound all live in one settings object
in `localStorage`, fully editable from the Settings screen.

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
  That's a non-issue with a single window, but with repeat on for a whole day
  it means keeping the tab open (e.g. pinned) the whole time.
- **Nothing survives a page reload or browser restart.** A running repeat
  chain is in-memory only; reloading the page returns you to idle and you'd
  need to tap Start again.
- **No accounts, no sync.** Entries live in this browser's `localStorage`
  only. Use the **Export JSON** button in History to get your data out.

## File layout

```
index.html
css/style.css
js/storage.js        — localStorage read/write for settings + entries
js/sound.js           — synthesized chime (playChime) + AudioContext unlock
js/notifications.js   — browser Notification permission + display
js/scheduler.js       — window timing + repeat chaining logic
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
