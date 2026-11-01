# Thoughts Tracker

A mindfulness app for catching what's actually going through your head, in the moment.

## Concept

You start a **window**. At some random point within it, the app notifies you.
When it does, you stop and capture: what was the thought, write freely about
it, and tag it with a category. Then another window begins — either because
you start it, or automatically, depending on cadence mode — and the cycle
repeats.

The window length and how windows chain together are both configurable
settings, not fixed behavior — someone might want a quick 10-minute window
started by hand, or random check-ins running continuously across the whole
day.

The randomness matters — you can't anticipate the prompt and perform a thought
for it. It's meant to catch what's really there.

## Core user flow

1. User opens the app and taps **Start Session**.
2. App picks a random moment within the current window length and schedules a
   notification for it.
3. User goes about whatever they were doing.
4. Notification fires → user opens/returns to the app.
5. Capture screen:
   - Free-text field: "What was the thought?"
   - Larger free-text field: write everything about it.
   - Category picker (single-select, preset list, editable).
   - Save.
6. Entry is stored with a timestamp.
7. Depending on cadence mode (see Settings below), either a new window starts
   automatically, or the user taps **Start Session** again.
8. A history/log view lists past entries, filterable by category.

## Settings (must be easy to change, not hardcoded)

All of these are user-editable settings, stored in `localStorage` alongside
entries — not constants buried in code. Changing them should require no code
edits, just a settings screen.

- **Window length** — how long the random window is (default 10 minutes).
  Exposed as a single editable number (minutes).
- **Variation** — how the random point within the window is chosen. Default
  is uniform random across the whole window, but expose this as its own
  setting so it can be swapped later (e.g. biased toward the middle, or a
  min/max gap between notifications) without redesigning the scheduler.
- **Cadence mode** — how windows chain together over time:
  - *Manual per session* (default): user explicitly starts each window; after
    capture, nothing more happens until they start again.
  - *Repeating all day*: as soon as one window closes (captured or expired),
    the next window starts automatically, continuously, during active hours.
  - *Fixed count per day*: user sets a target number of check-ins; app spaces
    windows across active hours and randomizes within each.
- **Active hours** — start/end time of day during which windows are allowed
  to fire (relevant for *repeating all day* and *fixed count* modes; ignored
  for *manual per session*). Default could be e.g. 08:00–22:00.

Implementation note: model this as one `settings` object
(`{ windowMinutes, variation, cadenceMode, activeHours }`) read by the
scheduler, so changing a value anywhere (UI, or directly in storage for
testing) takes effect without touching scheduling logic.

## Categories (default preset, user-editable)

- Work
- Relationships
- Worry
- Idea
- Memory
- Body / Physical
- Other

Editable later: user can rename, add, remove categories. Store as a simple
list in local storage, not hardcoded.

## Platform & hosting (POC)

- **Static site, hosted on GitHub Pages.** No backend, no server, no build
  pipeline required — just HTML/CSS/JS pushed to a repo with Pages enabled on
  `main` (or a `/docs` folder, or `gh-pages` branch).
- Plain HTML/CSS/vanilla JS to start. No framework needed for this scope —
  avoids a build step, keeps deploy = `git push`.
- **Persistence:** `localStorage` in the browser. No accounts, no sync. Data
  lives on whatever device/browser the session ran in.
- **Notifications:** browser [Notification API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API),
  requested on first "Start Session". This only works while the tab/app is
  open (or the browser is running, depending on OS).
  - For *manual per session* this is a non-issue — the window is short and
    the user is actively engaged.
  - For *repeating all day* / *fixed count per day*, this is a real
    limitation worth being upfront about: the tab has to stay open (e.g.
    pinned in the background) all day for notifications to keep firing. Good
    enough for a POC; a real all-day experience would eventually need a
    service worker + push backend (see Open questions).
  - This is *not* a real push-notification system — no service worker /
    server push needed for the POC.
- Random timing: `Math.random() * windowMinutes * 60 * 1000` ms from window
  start, scheduled with `setTimeout`. Driven entirely by the `settings`
  object above — never a hardcoded `10`.

## Data model (per entry)

```json
{
  "id": "uuid",
  "sessionStartedAt": "ISO timestamp",
  "notifiedAt": "ISO timestamp",
  "capturedAt": "ISO timestamp",
  "thought": "short text",
  "details": "long free text",
  "category": "string"
}
```

Stored as an array under one `localStorage` key (e.g. `thoughts-tracker:entries`).

## Non-goals (for this POC)

- No accounts / login / multi-device sync.
- No background push notifications when the browser/tab is closed.
- No native mobile app (iOS/Android) — revisit if the POC proves useful.
- No analytics/insights dashboard yet (could be a nice v2: trends by category,
  time of day, etc.).

## Open questions / future ideas

- What happens if the user misses the notification (doesn't open the app in
  time)? Does the window expire, or stay "pending" until captured?
- Export entries (JSON/CSV download) since there's no backend/sync.
- Eventually: real push notifications via a service worker + something like
  OneSignal, if this moves past POC and needs to nudge users without a tab
  open.
