import { playChime } from "./sound.js";

export function requestPermission() {
  if (!("Notification" in window)) return Promise.resolve("unsupported");
  if (Notification.permission === "default") {
    return Notification.requestPermission();
  }
  return Promise.resolve(Notification.permission);
}

export function permissionStatus() {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export function notify(settings) {
  if (settings.soundEnabled) {
    playChime();
  }
  if ("Notification" in window && Notification.permission === "granted") {
    const n = new Notification("Thoughts Tracker", {
      body: "Time to capture a thought.",
      tag: "thoughts-tracker-capture",
    });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  }
}
