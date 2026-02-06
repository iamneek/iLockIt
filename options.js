const siteInput = document.getElementById("site-input");
const addButton = document.getElementById("add-site");
const siteList = document.getElementById("site-list");
const saveButton = document.getElementById("save");
const statusEl = document.getElementById("status");
const currentWrap = document.getElementById("current-wrap");
const currentPasswordInput = document.getElementById("current-password");
const passwordInput = document.getElementById("password");
const confirmInput = document.getElementById("confirm");
const maskEnabledInput = document.getElementById("mask-enabled");
const maskTitleInput = document.getElementById("mask-title");
const maskIconSelect = document.getElementById("mask-icon");

let lockedSites = [];
let cooldowns = {};

function normalizeSite(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function normalizeEntry(entry) {
  if (!entry) return "";
  let item = String(entry).trim().toLowerCase();
  if (!item) return "";
  if (item.startsWith("http://") || item.startsWith("https://")) {
    try {
      item = new URL(item).hostname.toLowerCase();
    } catch (err) {
      return "";
    }
  }
  return item;
}

function matchesEntry(host, entry) {
  const target = host.toLowerCase();
  const item = normalizeEntry(entry);
  if (!item) return false;
  if (item.startsWith("*.") && item.length > 2) {
    const base = item.slice(2);
    return target === base || target.endsWith("." + base);
  }
  return target === item || target.endsWith("." + item);
}

function normalizeCooldownEntry(entry) {
  if (!entry) return null;
  if (typeof entry === "number") {
    return { expiresAt: entry };
  }
  if (typeof entry === "object" && entry.expiresAt) {
    return entry;
  }
  return null;
}

function formatDuration(minutes) {
  if (!minutes || !Number.isFinite(minutes)) return "";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (remainder === 0) return `${hours} hr`;
  return `${hours} hr ${remainder} min`;
}

function formatTimeLeft(ms) {
  if (ms <= 0) return "0 min";
  const minutes = Math.ceil(ms / 60000);
  return formatDuration(minutes);
}

function renderSites() {
  siteList.innerHTML = "";
  const now = Date.now();
  lockedSites.forEach((site) => {
    const key = normalizeSite(site);
    const li = document.createElement("li");
    const meta = document.createElement("div");
    meta.className = "site-meta";
    const title = document.createElement("span");
    title.textContent = site;
    const status = document.createElement("div");
    status.className = "site-status";
    const dot = document.createElement("span");
    dot.className = "status-dot";
    const label = document.createElement("span");
    const detail = document.createElement("div");
    detail.className = "site-detail";

    let statusText = "Locked";
    let detailText = "No suspension active";
    const matched = Object.entries(cooldowns)
      .map(([host, entry]) => ({ host, entry: normalizeCooldownEntry(entry) }))
      .filter(({ host, entry }) => entry && entry.expiresAt > now && matchesEntry(host, key));

    if (matched.length > 0) {
      statusText = "Unlocked";
      const sortedByStart = matched
        .map((item) => ({ ...item, startedAt: item.entry.startedAt || 0 }))
        .sort((a, b) => b.startedAt - a.startedAt);
      const latest = sortedByStart[0].entry;
      const timeLeft = formatTimeLeft(latest.expiresAt - now);
      const elapsed = latest.startedAt ? formatTimeLeft(now - latest.startedAt) : "";
      const total = latest.durationMinutes ? formatDuration(latest.durationMinutes) : "";
      const parts = [];
      if (matched.length > 1) {
        parts.push(`Active for ${matched.length} hosts`);
      }
      if (total) parts.push(`Suspended for ${total}`);
      parts.push(`Time left ${timeLeft}`);
      if (elapsed) parts.push(`Elapsed ${elapsed}`);
      detailText = parts.join(" · ");
      dot.style.background = "#8bd5a8";
      dot.style.boxShadow = "0 0 10px rgba(139, 213, 168, 0.7)";
    } else {
      dot.style.background = "#9aa7c7";
      dot.style.boxShadow = "0 0 8px rgba(154, 167, 199, 0.6)";
    }
    label.textContent = statusText;
    status.append(dot, label);
    detail.textContent = detailText;
    meta.append(title, status, detail);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Remove";
    remove.addEventListener("click", () => {
      lockedSites = lockedSites.filter((item) => item !== site);
      renderSites();
    });
    li.append(meta, remove);
    siteList.appendChild(li);
  });
}

function showStatus(text, isError) {
  statusEl.textContent = text;
  statusEl.style.color = isError ? "#b33131" : "#1b3a57";
  if (text) {
    setTimeout(() => {
      statusEl.textContent = "";
    }, 3000);
  }
}

async function hashPassword(password, salt) {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateSalt() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

addButton.addEventListener("click", () => {
  const value = normalizeSite(siteInput.value);
  if (!value) return;
  if (!lockedSites.includes(value)) {
    lockedSites.push(value);
    lockedSites.sort();
  }
  siteInput.value = "";
  renderSites();
});

siteInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addButton.click();
  }
});

saveButton.addEventListener("click", async () => {
  const stored = await browser.storage.local.get({ passwordHash: null, passwordSalt: null });
  const hasPassword = Boolean(stored.passwordHash && stored.passwordSalt);
  const currentPassword = currentPasswordInput.value;
  const password = passwordInput.value;
  const confirm = confirmInput.value;

  const update = {
    lockedSites,
    maskEnabled: maskEnabledInput.checked,
    maskTitle: maskTitleInput.value.trim() || "Site Locker",
    maskIcon: maskIconSelect.value || "lock"
  };

  if (password || confirm) {
    if (hasPassword) {
      if (!currentPassword) {
        showStatus("Enter your current password to change it.", true);
        return;
      }
      const currentHash = await hashPassword(currentPassword, stored.passwordSalt);
      if (currentHash !== stored.passwordHash) {
        showStatus("Current password is incorrect.", true);
        return;
      }
    }
    if (password.length < 4) {
      showStatus("Password must be at least 4 characters.", true);
      return;
    }
    if (password !== confirm) {
      showStatus("Passwords do not match.", true);
      return;
    }
    const salt = generateSalt();
    const hash = await hashPassword(password, salt);
    update.passwordSalt = salt;
    update.passwordHash = hash;
  }

  await browser.storage.local.set(update);
  currentPasswordInput.value = "";
  passwordInput.value = "";
  confirmInput.value = "";
  showStatus("Settings saved.");
});

async function init() {
  const data = await browser.storage.local.get({
    lockedSites: [],
    passwordHash: null,
    passwordSalt: null,
    cooldowns: {},
    maskEnabled: false,
    maskTitle: "Site Locker",
    maskIcon: "lock"
  });
  lockedSites = Array.isArray(data.lockedSites) ? data.lockedSites : [];
  cooldowns = data.cooldowns && typeof data.cooldowns === "object" ? data.cooldowns : {};
  const hasPassword = Boolean(data.passwordHash && data.passwordSalt);
  currentWrap.classList.toggle("hidden", !hasPassword);
  maskEnabledInput.checked = Boolean(data.maskEnabled);
  maskTitleInput.value = data.maskTitle || "Site Locker";
  maskIconSelect.value = data.maskIcon || "lock";
  renderSites();
  setInterval(renderSites, 30000);
}

init();

browser.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes.lockedSites) {
    lockedSites = Array.isArray(changes.lockedSites.newValue) ? changes.lockedSites.newValue : [];
  }
  if (changes.cooldowns) {
    cooldowns = changes.cooldowns.newValue && typeof changes.cooldowns.newValue === "object" ? changes.cooldowns.newValue : {};
  }
  if (changes.maskEnabled) {
    maskEnabledInput.checked = Boolean(changes.maskEnabled.newValue);
  }
  if (changes.maskTitle) {
    maskTitleInput.value = changes.maskTitle.newValue || "iLockIt";
  }
  if (changes.maskIcon) {
    maskIconSelect.value = changes.maskIcon.newValue || "lock";
  }
  renderSites();
});
