import { notify } from "./notifications.js";

function timeStringToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function isWithinActiveHours(date, activeHours) {
  const minutes = date.getHours() * 60 + date.getMinutes();
  const start = timeStringToMinutes(activeHours.start);
  const end = timeStringToMinutes(activeHours.end);
  if (start === end) return true; // 24h active
  if (start < end) return minutes >= start && minutes < end;
  return minutes >= start || minutes < end; // overnight span, e.g. 22:00-06:00
}

function msUntilActiveStart(date, activeHours) {
  const startMin = timeStringToMinutes(activeHours.start);
  const next = new Date(date);
  next.setHours(Math.floor(startMin / 60), startMin % 60, 0, 0);
  if (next <= date) next.setDate(next.getDate() + 1);
  return next.getTime() - date.getTime();
}

// Random point within a window, picked by `settings.variation`.
// Only 'uniform' is implemented for now; this is the extension point for
// future distributions (e.g. midpoint-biased, min-gap-enforced).
function randomDelayMs(windowMinutes, _variation) {
  return Math.random() * windowMinutes * 60 * 1000;
}

export class Scheduler {
  constructor({ getSettings, onFire }) {
    this.getSettings = getSettings;
    this.onFire = onFire;
    this.timers = [];
    this.mode = null; // 'manual' | 'allDay' | 'fixedCount'
    this.running = false;
  }

  clear() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.running = false;
  }

  stop() {
    this.clear();
    this.mode = null;
  }

  fireNow() {
    const settings = this.getSettings();
    notify(settings);
    this.onFire();
  }

  startManual() {
    this.clear();
    this.mode = "manual";
    this.running = true;
    const settings = this.getSettings();
    const delay = randomDelayMs(settings.windowMinutes, settings.variation);
    this.timers.push(setTimeout(() => this.fireNow(), delay));
  }

  scheduleNextAllDay() {
    const settings = this.getSettings();
    const now = new Date();
    if (!isWithinActiveHours(now, settings.activeHours)) {
      const wait = msUntilActiveStart(now, settings.activeHours);
      this.timers.push(setTimeout(() => this.scheduleNextAllDay(), wait));
      return;
    }
    const delay = randomDelayMs(settings.windowMinutes, settings.variation);
    this.timers.push(setTimeout(() => this.fireNow(), delay));
  }

  startAllDay() {
    this.clear();
    this.mode = "allDay";
    this.running = true;
    this.scheduleNextAllDay();
  }

  // Called after a capture/skip while in allDay mode, to chain the next window.
  continueAllDay() {
    if (this.mode !== "allDay" || !this.running) return;
    this.scheduleNextAllDay();
  }

  startFixedCount() {
    this.clear();
    this.mode = "fixedCount";
    this.running = true;
    const settings = this.getSettings();
    const now = new Date();

    const startMin = timeStringToMinutes(settings.activeHours.start);
    let endMin = timeStringToMinutes(settings.activeHours.end);
    if (endMin <= startMin) endMin += 24 * 60; // overnight span
    const spanMin = endMin - startMin;
    const n = Math.max(1, settings.fixedCountPerDay);
    const slotMin = spanMin / n;

    const dayBase = new Date(now);
    dayBase.setHours(0, 0, 0, 0);

    for (let i = 0; i < n; i++) {
      const slotStartMin = startMin + i * slotMin;
      const randomMin = slotStartMin + Math.random() * slotMin;
      const fireAt = new Date(dayBase.getTime() + randomMin * 60 * 1000);
      const delay = fireAt.getTime() - now.getTime();
      if (delay > 0) {
        this.timers.push(setTimeout(() => this.fireNow(), delay));
      }
    }
  }

  start() {
    const settings = this.getSettings();
    if (settings.cadenceMode === "allDay") this.startAllDay();
    else if (settings.cadenceMode === "fixedCount") this.startFixedCount();
    else this.startManual();
  }
}
