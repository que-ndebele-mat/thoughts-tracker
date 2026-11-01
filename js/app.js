import {
  loadSettings,
  saveSettings,
  loadEntries,
  addEntry,
  deleteEntry,
} from "./storage.js";
import { playChime, unlockAudio } from "./sound.js";
import { requestPermission, permissionStatus } from "./notifications.js";
import { Scheduler } from "./scheduler.js";

let settings = loadSettings();
let capturePending = false;
let pendingFiredAt = null;

const views = {
  home: document.getElementById("view-home"),
  capture: document.getElementById("view-capture"),
  history: document.getElementById("view-history"),
  settings: document.getElementById("view-settings"),
};

function showView(name) {
  Object.entries(views).forEach(([key, el]) => {
    el.hidden = key !== name;
  });
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === name);
  });
}

const scheduler = new Scheduler({
  getSettings: () => settings,
  onFire: () => {
    // A capture is already in progress — drop this fire rather than stacking views.
    if (capturePending) return;
    capturePending = true;
    pendingFiredAt = new Date().toISOString();
    renderCaptureCategoryOptions();
    showView("capture");
  },
});

// ---------- Home view ----------

const homeIdle = document.getElementById("home-idle");
const homeActive = document.getElementById("home-active");
const homeWindowLabel = document.getElementById("home-window-label");
const homeActiveHint = document.getElementById("home-active-hint");
const btnStart = document.getElementById("btn-start");
const btnStop = document.getElementById("btn-stop");

function renderHome() {
  homeWindowLabel.textContent = `${settings.windowMinutes} min`;
  homeActiveHint.textContent = settings.repeat
    ? "A chime will come sometime soon, then the next window starts automatically. Keep this tab open."
    : "A chime will come sometime soon. Keep this tab open.";
  homeIdle.hidden = scheduler.running;
  homeActive.hidden = !scheduler.running;
}

btnStart.addEventListener("click", async () => {
  unlockAudio();
  await requestPermission();
  renderSettingsForm();
  scheduler.start();
  renderHome();
});

btnStop.addEventListener("click", () => {
  scheduler.stop();
  renderHome();
});

// ---------- Capture view ----------

const captureThought = document.getElementById("capture-thought");
const captureDetails = document.getElementById("capture-details");
const captureCategory = document.getElementById("capture-category");
const btnSave = document.getElementById("btn-save");
const btnSkip = document.getElementById("btn-skip");

function renderCaptureCategoryOptions() {
  captureCategory.innerHTML = "";
  settings.categories.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    captureCategory.appendChild(opt);
  });
}

function resetCaptureForm() {
  captureThought.value = "";
  captureDetails.value = "";
}

function finishCapture() {
  capturePending = false;
  resetCaptureForm();
  scheduler.continueAfterCapture();
  showView("home");
  renderHome();
}

btnSave.addEventListener("click", () => {
  const thought = captureThought.value.trim();
  if (!thought) {
    captureThought.focus();
    return;
  }
  addEntry({
    id: crypto.randomUUID(),
    sessionStartedAt: pendingFiredAt,
    notifiedAt: pendingFiredAt,
    capturedAt: new Date().toISOString(),
    thought,
    details: captureDetails.value.trim(),
    category: captureCategory.value,
  });
  renderHistory();
  finishCapture();
});

btnSkip.addEventListener("click", () => {
  finishCapture();
});

// ---------- History view ----------

const historyFilter = document.getElementById("history-filter");
const historyList = document.getElementById("history-list");
const historyEmpty = document.getElementById("history-empty");
const btnExport = document.getElementById("btn-export");

function renderHistoryFilterOptions() {
  const current = historyFilter.value;
  historyFilter.innerHTML = '<option value="">All categories</option>';
  settings.categories.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    historyFilter.appendChild(opt);
  });
  if (settings.categories.includes(current)) historyFilter.value = current;
}

function renderHistory() {
  const entries = loadEntries();
  const filter = historyFilter.value;
  const filtered = entries.filter((e) => !filter || e.category === filter);

  historyList.innerHTML = "";
  historyEmpty.hidden = filtered.length > 0;

  filtered.forEach((entry) => {
    const li = document.createElement("li");
    li.className = "history-item";
    const when = new Date(entry.capturedAt).toLocaleString();
    const details = entry.details
      ? `<div class="history-details"></div>`
      : "";
    li.innerHTML = `
      <div class="history-item-header">
        <span class="category-badge"></span>
        <span class="history-time"></span>
        <button type="button" class="btn-delete" data-id="${entry.id}">Delete</button>
      </div>
      <div class="history-thought"></div>
      ${details}
    `;
    li.querySelector(".category-badge").textContent = entry.category;
    li.querySelector(".history-time").textContent = when;
    li.querySelector(".history-thought").textContent = entry.thought;
    if (entry.details) {
      li.querySelector(".history-details").textContent = entry.details;
    }
    historyList.appendChild(li);
  });
}

historyFilter.addEventListener("change", renderHistory);

historyList.addEventListener("click", (e) => {
  if (e.target.matches(".btn-delete")) {
    deleteEntry(e.target.dataset.id);
    renderHistory();
  }
});

btnExport.addEventListener("click", () => {
  const entries = loadEntries();
  const blob = new Blob([JSON.stringify(entries, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `thoughts-tracker-export-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

// ---------- Settings view ----------

const settingWindowMinutes = document.getElementById("setting-window-minutes");
const settingRepeat = document.getElementById("setting-repeat");
const settingSoundEnabled = document.getElementById("setting-sound-enabled");
const btnTestSound = document.getElementById("btn-test-sound");
const categoriesList = document.getElementById("categories-list");
const newCategoryInput = document.getElementById("new-category-input");
const btnAddCategory = document.getElementById("btn-add-category");
const notificationPermissionNote = document.getElementById(
  "notification-permission-note",
);

function renderSettingsForm() {
  settingWindowMinutes.value = settings.windowMinutes;
  settingRepeat.checked = settings.repeat;
  settingSoundEnabled.checked = settings.soundEnabled;
  renderCategoriesList();
  notificationPermissionNote.textContent = `Browser notification permission: ${permissionStatus()}. Sound plays regardless, as long as this tab is open.`;
}

function renderCategoriesList() {
  categoriesList.innerHTML = "";
  settings.categories.forEach((cat, idx) => {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent = cat;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn-remove-category";
    btn.dataset.idx = String(idx);
    btn.textContent = "Remove";
    li.append(span, btn);
    categoriesList.appendChild(li);
  });
}

function persistSettings() {
  saveSettings(settings);
  renderHome();
  renderHistoryFilterOptions();
}

settingWindowMinutes.addEventListener("change", () => {
  const val = parseFloat(settingWindowMinutes.value);
  if (val > 0) {
    settings.windowMinutes = val;
    persistSettings();
  }
});

settingRepeat.addEventListener("change", () => {
  settings.repeat = settingRepeat.checked;
  persistSettings();
});

settingSoundEnabled.addEventListener("change", () => {
  settings.soundEnabled = settingSoundEnabled.checked;
  persistSettings();
});

btnTestSound.addEventListener("click", () => {
  unlockAudio();
  playChime();
});

btnAddCategory.addEventListener("click", () => {
  const val = newCategoryInput.value.trim();
  if (val && !settings.categories.includes(val)) {
    settings.categories.push(val);
    newCategoryInput.value = "";
    persistSettings();
  }
});

categoriesList.addEventListener("click", (e) => {
  if (e.target.matches(".btn-remove-category")) {
    const idx = parseInt(e.target.dataset.idx, 10);
    settings.categories.splice(idx, 1);
    persistSettings();
  }
});

// ---------- Nav ----------

document.querySelectorAll(".nav-btn[data-view]").forEach((btn) => {
  btn.addEventListener("click", () => {
    showView(btn.dataset.view);
    if (btn.dataset.view === "history") renderHistory();
  });
});

// ---------- Init ----------

renderHome();
renderHistoryFilterOptions();
renderHistory();
renderSettingsForm();
showView("home");
