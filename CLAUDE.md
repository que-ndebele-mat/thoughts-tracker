# Thoughts Tracker

A mindfulness app for catching what's actually going through your head, in the moment.

## Concept

You open the app and hit **Start** — no setup, no decisions. A 10-minute
window begins. At some random point within it, the app notifies you. When it
does, you stop and capture: what was the thought, write freely about it, and
tag it with a category. Then the window ends.

If you want to keep going (e.g. across a whole day), flip on **repeat** in
Settings: once that's on, finishing a capture immediately starts the next
window, back to back, for as long as you keep the app open. This is purely
session-chaining — there's no clock-time scheduling involved (no "active
hours," no fixed slots per day). It's just: window → capture → (if repeat is
on) next window.

The window length is the one thing worth changing per person, so it's a
single editable setting (default 10 minutes) — everything else about cadence
is just the one on/off repeat toggle.

The randomness matters — you can't anticipate the prompt and perform a thought
for it. It's meant to catch what's really there.

## Core user flow

1. User opens the app — Home shows the window length and a **Start** button,
   nothing else to decide.
2. User taps **Start**. App picks a random moment within the window length
   and schedules a notification for it.
3. User goes about whatever they were doing.
4. Notification fires → user opens/returns to the app.
5. Capture screen:
   - Free-text field: "What was the thought?"
   - Larger free-text field: write everything about it.
   - Category picker (single-select, preset list, editable).
   - Save (or Skip).
6. Entry is stored with a timestamp.
7. If **repeat** is on (Settings), the next window starts immediately. If
   not, the user is back at Home and taps **Start** again whenever they want.
8. A history/log view lists past entries, filterable by category.

## Settings (must be easy to change, not hardcoded)

Kept deliberately minimal — the whole point is that someone should be able to
walk in and use the default without reading anything. All of these live in
one `settings` object in `localStorage`, editable from a Settings screen:

- **Window length** — how long the random window is (default 10 minutes). A
  single editable number (minutes). This is the one setting most people will
  actually want to change.
- **Repeat** — on/off. Off (default): one window per Start tap. On: the next
  window starts automatically right after each capture, so someone can run
  this continuously across a whole day just by leaving it on — purely
  session-chained, no time-of-day concept involved anywhere.
- **Variation** — how the random point within the window is chosen. Default
  (and only implementation so far) is uniform random across the whole window;
  kept as its own setting so it can be swapped later (e.g. biased toward the
  middle) without redesigning the scheduler.

Implementation note: model this as one `settings` object
(`{ windowMinutes, variation, repeat }`) read by the scheduler, so changing a
value anywhere (UI, or directly in storage for testing) takes effect without
touching scheduling logic. Earlier drafts had a clock-time "active hours" /
"fixed count per day" model — deliberately dropped because it was confusing
and solved "I want this running all day" the wrong way; the `repeat` toggle
solves it with zero added concepts.

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
  requested on first **Start**, plus a synthesized sound (Web Audio API, no
  asset needed) that plays regardless of notification permission. Both only
  work while the tab/app is open (or the browser is running, depending on
  OS).
  - With repeat off, this is a non-issue — the window is short and the user
    is actively engaged.
  - With repeat on (running continuously, e.g. across a day), this is a real
    limitation worth being upfront about: the tab has to stay open (e.g.
    pinned in the background) for notifications to keep firing. Good enough
    for a POC; a real always-on experience would eventually need a service
    worker + push backend (see Open questions).
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
