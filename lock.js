const params = new URLSearchParams(window.location.search);
const targetUrl = params.get("url") || "";
const siteLabel = document.getElementById("site-label");
const passwordInput = document.getElementById("password");
const durationSelect = document.getElementById("duration");
const customWrap = document.getElementById("custom-wrap");
const customInput = document.getElementById("custom-minutes");
const unlockButton = document.getElementById("unlock");
const messageEl = document.getElementById("message");

let host = "";
try {
  host = targetUrl ? new URL(targetUrl).hostname : "";
} catch (err) {
  host = "";
}

siteLabel.textContent = host ? `Locked: ${host}` : "Locked site";

durationSelect.addEventListener("change", () => {
  const isCustom = durationSelect.value === "custom";
  customWrap.classList.toggle("hidden", !isCustom);
  if (!isCustom) customInput.value = "";
});


function showMessage(text) {
  messageEl.textContent = text;
}

unlockButton.addEventListener("click", async () => {
  showMessage("");
  const password = passwordInput.value;
  if (!password) {
    showMessage("Enter your password to continue.");
    return;
  }
  let minutes = durationSelect.value;
  if (minutes === "custom") {
    const value = Number(customInput.value);
    if (!Number.isFinite(value) || value < 1) {
      showMessage("Enter a valid number of minutes.");
      return;
    }
    minutes = value;
  }
  const response = await browser.runtime.sendMessage({
    type: "unlock",
    password,
    url: targetUrl,
    durationMinutes: minutes
  });

  if (!response || !response.ok) {
    if (response && response.error === "no-password") {
      showMessage("No password is set yet. Open options to set one.");
      return;
    }
    showMessage("Incorrect password. Try again.");
    return;
  }

  if (targetUrl) {
    window.location.href = targetUrl;
  }
});

passwordInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    unlockButton.click();
  }
});
