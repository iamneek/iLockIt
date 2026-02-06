const DEFAULTS = {
  lockedSites: [],
  passwordHash: null,
  passwordSalt: null,
  cooldowns: {},
  maskEnabled: false,
  maskIcon: "lock",
  maskTitle: "Site Locker"
};

const allowOnce = new Map();

async function loadSettings() {
  const data = await browser.storage.local.get(DEFAULTS);
  data.lockedSites = Array.isArray(data.lockedSites) ? data.lockedSites : [];
  data.cooldowns = data.cooldowns && typeof data.cooldowns === "object" ? data.cooldowns : {};
  return data;
}

const ICONS = {
  lock: "icons/lock.svg",
  orbit: "icons/orbit.svg",
  leaf: "icons/leaf.svg",
  paper: "icons/paper.svg"
};

function applyMaskSettings(settings) {
  const enabled = Boolean(settings.maskEnabled);
  const iconKey = settings.maskIcon && ICONS[settings.maskIcon] ? settings.maskIcon : "lock";
  const title = settings.maskTitle ? String(settings.maskTitle) : "Site Locker";
  const iconPath = enabled ? ICONS[iconKey] : "icons/lock.svg";
  const label = enabled ? title : "Site Locker";

  browser.browserAction.setIcon({ path: iconPath });
  browser.browserAction.setTitle({ title: label });
}

function getCooldownEntry(cooldowns, host) {
  const entry = cooldowns[host];
  if (!entry) return null;
  if (typeof entry === "number") {
    return { expiresAt: entry };
  }
  if (typeof entry === "object" && entry.expiresAt) {
    return entry;
  }
  return null;
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

function isHostLocked(host, lockedSites) {
  const target = host.toLowerCase();
  return lockedSites.some((entry) => {
    const item = normalizeEntry(entry);
    if (!item) return false;
    if (item.startsWith("*.") && item.length > 2) {
      const base = item.slice(2);
      return target === base || target.endsWith("." + base);
    }
    return target === item || target.endsWith("." + item);
  });
}

async function hashPassword(password, salt) {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function isAllowOnce(url, now) {
  const entry = allowOnce.get(url);
  if (!entry) return false;
  if (entry <= now) {
    allowOnce.delete(url);
    return false;
  }
  allowOnce.delete(url);
  return true;
}

browser.webRequest.onBeforeRequest.addListener(
  async (details) => {
    if (!details.url.startsWith("http")) return {};
    const lockPageUrl = browser.runtime.getURL("lock.html");
    if (details.url.startsWith(lockPageUrl)) return {};

    const now = Date.now();
    if (isAllowOnce(details.url, now)) return {};

    const data = await loadSettings();
    let host = "";
    try {
      host = new URL(details.url).hostname.toLowerCase();
    } catch (err) {
      return {};
    }

    const cooldownEntry = getCooldownEntry(data.cooldowns, host);
    const expiry = cooldownEntry ? cooldownEntry.expiresAt : 0;
    if (expiry && expiry <= now) {
      delete data.cooldowns[host];
      browser.storage.local.set({ cooldowns: data.cooldowns });
    }

    if (!isHostLocked(host, data.lockedSites)) return {};
    if (expiry && expiry > now) return {};

    return {
      redirectUrl: `${lockPageUrl}?url=${encodeURIComponent(details.url)}`
    };
  },
  { urls: ["<all_urls>"], types: ["main_frame"] },
  ["blocking"]
);

browser.runtime.onMessage.addListener(async (message) => {
  if (!message || !message.type) return;

  if (message.type === "unlock") {
    const { password, url, durationMinutes } = message;
    const data = await loadSettings();
    if (!data.passwordHash || !data.passwordSalt) {
      return { ok: false, error: "no-password" };
    }
    const computed = await hashPassword(password || "", data.passwordSalt);
    if (computed !== data.passwordHash) {
      return { ok: false, error: "invalid" };
    }

    if (url) {
      allowOnce.set(url, Date.now() + 15000);
      try {
        const host = new URL(url).hostname.toLowerCase();
        const minutes = Number(durationMinutes || 0);
        if (minutes > 0) {
          const startedAt = Date.now();
          data.cooldowns[host] = {
            startedAt,
            durationMinutes: minutes,
            expiresAt: startedAt + minutes * 60000
          };
          await browser.storage.local.set({ cooldowns: data.cooldowns });
        }
      } catch (err) {
        return { ok: true };
      }
    }
    return { ok: true };
  }
});

browser.runtime.onInstalled.addListener(async () => {
  const settings = await loadSettings();
  applyMaskSettings(settings);
});

browser.runtime.onStartup.addListener(async () => {
  const settings = await loadSettings();
  applyMaskSettings(settings);
});

browser.storage.onChanged.addListener(async (changes, area) => {
  if (area !== "local") return;
  if (changes.maskEnabled || changes.maskIcon || changes.maskTitle) {
    const settings = await loadSettings();
    applyMaskSettings(settings);
  }
});
