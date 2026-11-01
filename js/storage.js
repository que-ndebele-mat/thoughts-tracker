const SETTINGS_KEY = "thoughts-tracker:settings";
const ENTRIES_KEY = "thoughts-tracker:entries";

export const DEFAULT_SETTINGS = {
  windowMinutes: 10,
  variation: "uniform",
  repeat: false,
  soundEnabled: true,
  categories: [
    "Work",
    "Relationships",
    "Worry",
    "Idea",
    "Memory",
    "Body / Physical",
    "Other",
  ],
};

export function loadSettings() {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) return structuredClone(DEFAULT_SETTINGS);
  try {
    const parsed = JSON.parse(raw);
    return { ...structuredClone(DEFAULT_SETTINGS), ...parsed };
  } catch {
    return structuredClone(DEFAULT_SETTINGS);
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadEntries() {
  const raw = localStorage.getItem(ENTRIES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveEntries(entries) {
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
}

export function addEntry(entry) {
  const entries = loadEntries();
  entries.unshift(entry);
  saveEntries(entries);
  return entries;
}

export function deleteEntry(id) {
  const entries = loadEntries().filter((e) => e.id !== id);
  saveEntries(entries);
  return entries;
}
