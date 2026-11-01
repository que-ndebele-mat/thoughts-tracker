import { notify } from "./notifications.js";

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
    this.timer = null;
    this.running = false;
  }

  clear() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.running = false;
  }

  stop() {
    this.clear();
  }

  fireNow() {
    const settings = this.getSettings();
    notify(settings);
    this.onFire();
  }

  start() {
    this.clear();
    this.running = true;
    const settings = this.getSettings();
    const delay = randomDelayMs(settings.windowMinutes, settings.variation);
    this.timer = setTimeout(() => this.fireNow(), delay);
  }

  // Called after a capture/skip. Starts the next window if "repeat" is on,
  // otherwise stops — purely session-chained, no time-of-day involved.
  continueAfterCapture() {
    const settings = this.getSettings();
    if (settings.repeat) {
      this.start();
    } else {
      this.clear();
    }
  }
}
