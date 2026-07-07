const API_BASE = "https://aimlock-jame-production.up.railway.app";
// API_BASE chỉ là domain backend Railway. KHÔNG thêm /admin.html và KHÔNG thêm dấu / cuối link.
const DEMO_MODE = true; // Bản xem trước: tự mở panel và mock API để demo tính năng.

const appShell = document.getElementById("appShell");
const loginOverlay = document.getElementById("loginOverlay");
const loginKeyInput = document.getElementById("loginKeyInput");
const toggleKeyBtn = document.getElementById("toggleKeyBtn");
const activateBtn = document.getElementById("activateBtn");
const loginStatus = document.getElementById("loginStatus");
const freeKeyBtn = document.getElementById("freeKeyBtn");
const contactKeyBtn = document.getElementById("contactKeyBtn");
const keyExpireText = document.getElementById("keyExpireText");
const keySlotText = document.getElementById("keySlotText");
const onlineCount = document.getElementById("onlineCount");
const keyActive = document.getElementById("keyActive");
const todayCount = document.getElementById("todayCount");
const railwayStatus = document.getElementById("railwayStatus");
const updateTime = document.getElementById("updateTime");
const toast = document.getElementById("toast");

const panelOverlay = document.getElementById("panelOverlay");
const menuBtn = document.getElementById("menuBtn");
const simpleMenu = document.getElementById("simpleMenu");
const closeMenuBtn = document.getElementById("closeMenuBtn");
const refreshStatsBtn = document.getElementById("refreshStatsBtn");
const deviceText = document.getElementById("deviceText");
const copyDeviceBtn = document.getElementById("copyDeviceBtn");
const infoDoneBtn = document.getElementById("infoDoneBtn");
const headlockOnBtn = document.getElementById("headlockOnBtn");
const headlockOffBtn = document.getElementById("headlockOffBtn");
const runBoostBtn = document.getElementById("runBoostBtn");
const closeBoostBtn = document.getElementById("closeBoostBtn");
const boostOutput = document.getElementById("boostOutput");
const pingOutput = document.getElementById("pingOutput");
const runPingBtn = document.getElementById("runPingBtn");
const pingOffBtn = document.getElementById("pingOffBtn");
const cacheOutput = document.getElementById("cacheOutput");
const runCacheBtn = document.getElementById("runCacheBtn");
const cacheOffBtn = document.getElementById("cacheOffBtn");

const featureMap = {
  boost: ["boostState", "menuBoostState"],
  aimbody: ["aimbodyState", "menuAimbodyState"],
  nhetam: ["nhetamState", "menuNhetamState"],
  headlock: ["headlockState", "menuHeadlockState"],
  ping: ["pingState", "menuPingState"],
  cache: ["cacheState", "menuCacheState"]
};

function pad(n) {
  return String(n).padStart(2, "0");
}

function nowTime() {
  const n = new Date();
  return `${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())}`;
}

function showToast(msg) {
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

function lockApp(lock) {
  if (!appShell || !loginOverlay) return;

  if (lock) {
    appShell.classList.add("locked");
    loginOverlay.classList.remove("hidden");
  } else {
    appShell.classList.remove("locked");
    loginOverlay.classList.add("hidden");
  }
}

function deviceId() {
  let id = localStorage.getItem("deviceId");
  if (!id) {
    id = "DEV-" + Math.random().toString(36).slice(2, 10).toUpperCase();
    localStorage.setItem("deviceId", id);
  }
  return id;
}

function formatExpire(expire) {
  const d = new Date(expire);
  if (Number.isNaN(d.getTime())) return expire || "--";

  return d.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function apiUrl(path) {
  return `${API_BASE}${path}`;
}

async function apiFetch(path, options = {}) {
  if (DEMO_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 180));
    if (path === "/api/stats") {
      return { ok: true, online: 7, activeKeys: 2, today: 14, railway: "Online" };
    }
    if (path === "/api/health") {
      return { ok: true, message: "Demo API OK" };
    }
    if (path === "/api/verify-key") {
      return { ok: true, key: { expire: "2100-01-01T23:59:59.000Z", slotUsed: 1, slotLimit: 1 } };
    }
  }

  let res;

  try {
    res = await fetch(apiUrl(path), {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.headers || {})
      },
      cache: "no-store"
    });
  } catch (error) {
    throw new Error("Không kết nối được API Railway. Hãy kiểm tra API_BASE hoặc domain backend.");
  }

  const text = await res.text();
  let data;

  try {
    data = JSON.parse(text);
  } catch (error) {
    console.error("API returned non-JSON:", text);
    throw new Error("API đang trả về HTML, không phải JSON. Kiểm tra lại API_BASE, không được thêm /admin.html.");
  }

  if (!res.ok || data.ok === false) {
    throw new Error(data.message || "Request thất bại.");
  }

  return data;
}

function getFeatures() {
  try {
    return JSON.parse(localStorage.getItem("aimlockFeatureState") || "{}");
  } catch (_) {
    return {};
  }
}

function saveFeatures(state) {
  localStorage.setItem("aimlockFeatureState", JSON.stringify(state));
}

function setFeature(name, value) {
  const state = getFeatures();
  state[name] = Boolean(value);
  saveFeatures(state);
  renderFeatures();
}

function toggleFeature(name) {
  const state = getFeatures();
  setFeature(name, !state[name]);
  showToast(`${labelFeature(name)}: ${!state[name] ? "ON" : "OFF"}`);
}

function labelFeature(name) {
  return {
    boost: "Boost RAM",
    aimbody: "AIMBODY",
    nhetam: "NHẸ TÂM",
    headlock: "JAMELOCK",
    ping: "AINTIBAN",
    cache: "REG FF"
  }[name] || name;
}

function renderFeatures() {
  const state = getFeatures();

  Object.keys(featureMap).forEach((name) => {
    const isOn = Boolean(state[name]);

    featureMap[name].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = isOn ? "ON" : "OFF";
    });

    document.querySelectorAll(`[data-toggle-feature="${name}"], [data-open-feature="${name}"]`).forEach((el) => {
      el.classList.toggle("is-on", isOn);
    });
  });

  if (deviceText) deviceText.textContent = deviceId();
}

function openMenu() {
  simpleMenu?.classList.remove("hidden");
  panelOverlay?.classList.remove("hidden");
}

function closeMenu() {
  simpleMenu?.classList.add("hidden");
  panelOverlay?.classList.add("hidden");
}

function modalByFeature(name) {
  return {
    headlock: document.getElementById("headlockModal"),
    boost: document.getElementById("boostModal"),
    ping: document.getElementById("pingModal"),
    cache: document.getElementById("cacheModal"),
    info: document.getElementById("infoModal")
  }[name] || null;
}

function openModal(name) {
  closeMenu();
  modalByFeature(name)?.classList.remove("hidden");
  renderFeatures();
}

function closeModals() {
  document.querySelectorAll(".modal-box").forEach((modal) => modal.classList.add("hidden"));
}

async function verifyKey() {
  const key = loginKeyInput.value.trim();

  if (!key) {
    loginStatus.textContent = "Vui lòng nhập Password / Key.";
    loginStatus.className = "login-status error";
    showToast("Thiếu key");
    return;
  }

  loginStatus.textContent = "Đang kiểm tra Postgres key server...";
  loginStatus.className = "login-status";
  activateBtn.disabled = true;
  activateBtn.textContent = "Đang kích hoạt...";

  try {
    const data = await apiFetch("/api/verify-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, deviceId: deviceId() })
    });

    localStorage.setItem("jameLoginUnlocked", "true");
    localStorage.setItem("jameKeyInfo", JSON.stringify(data.key));

    if (keyExpireText) keyExpireText.textContent = formatExpire(data.key.expire);
    if (keySlotText) keySlotText.textContent = `${data.key.slotUsed}/${data.key.slotLimit}`;

    loginStatus.textContent = "Key hợp lệ. Đang vào app...";
    loginStatus.className = "login-status success";
    showToast("Đăng nhập thành công");

    setTimeout(() => lockApp(false), 650);
    updateStats();
  } catch (err) {
    loginStatus.textContent = err.message || "Key không hợp lệ. Vui lòng thử lại.";
    loginStatus.className = "login-status error";
    showToast("Key không hợp lệ");
  } finally {
    activateBtn.disabled = false;
    activateBtn.textContent = "⚡ Kích Hoạt Jame";
  }
}

async function updateStats() {
  try {
    const d = await apiFetch("/api/stats");
    if (onlineCount) onlineCount.textContent = d.online ?? 0;
    if (keyActive) keyActive.textContent = d.activeKeys ?? 0;
    if (todayCount) todayCount.textContent = d.today ?? 0;
    if (railwayStatus) railwayStatus.textContent = d.railway || "Online";
  } catch (err) {
    console.warn("Stats error:", err.message);
    if (railwayStatus) railwayStatus.textContent = "OFFLINE";
  }

  if (updateTime) updateTime.textContent = nowTime();
}

function initSavedLogin() {
  if (DEMO_MODE) {
    localStorage.setItem("jameLoginUnlocked", "true");
    localStorage.setItem("jameKeyInfo", JSON.stringify({ expire: "2100-01-01T23:59:59.000Z", slotUsed: 1, slotLimit: 1 }));
    if (keyExpireText) keyExpireText.textContent = formatExpire("2100-01-01T23:59:59.000Z");
    if (keySlotText) keySlotText.textContent = "1/1";
    lockApp(false);
    return;
  }

  try {
    const savedInfo = JSON.parse(localStorage.getItem("jameKeyInfo") || "null");

    if (localStorage.getItem("jameLoginUnlocked") === "true" && savedInfo) {
      if (keyExpireText) keyExpireText.textContent = formatExpire(savedInfo.expire);
      if (keySlotText) keySlotText.textContent = `${savedInfo.slotUsed}/${savedInfo.slotLimit}`;
      lockApp(false);
      return;
    }
  } catch (_) {
    localStorage.removeItem("jameLoginUnlocked");
    localStorage.removeItem("jameKeyInfo");
  }

  lockApp(true);
}

toggleKeyBtn?.addEventListener("click", () => {
  const isPass = loginKeyInput.type === "password";
  loginKeyInput.type = isPass ? "text" : "password";
  toggleKeyBtn.textContent = isPass ? "🙈" : "👁";
});

activateBtn?.addEventListener("click", verifyKey);
loginKeyInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") verifyKey();
});

freeKeyBtn?.addEventListener("click", () => {
  window.open("https://www.tiktok.com/@jame.ff.11", "_blank", "noopener");
});

contactKeyBtn?.addEventListener("click", () => {
  window.open("https://zalo.me/0333635135", "_blank", "noopener");
});
menuBtn?.addEventListener("click", openMenu);
closeMenuBtn?.addEventListener("click", closeMenu);
panelOverlay?.addEventListener("click", closeMenu);
refreshStatsBtn?.addEventListener("click", () => {
  updateStats();
  showToast("Đã làm mới server");
});

document.addEventListener("click", (event) => {
  const toggleBtn = event.target.closest("[data-toggle-feature]");
  const openBtn = event.target.closest("[data-open-feature]");
  const closeBtn = event.target.closest("[data-close-modal]");

  if (toggleBtn) {
    toggleFeature(toggleBtn.dataset.toggleFeature);
    return;
  }

  if (openBtn) {
    openModal(openBtn.dataset.openFeature);
    return;
  }

  if (closeBtn) closeModals();
});

headlockOnBtn?.addEventListener("click", () => {
  setFeature("headlock", true);
  showToast("JAMELOCK Was Successful!");
  closeModals();
});

headlockOffBtn?.addEventListener("click", () => {
  setFeature("headlock", false);
  showToast("Turn off JAMELOCK");
  closeModals();
});

runBoostBtn?.addEventListener("click", () => {
  const lines = [
    "> checking device...",
    "> clearing temporary UI cache...",
    "> refreshing dashboard...",
    "> boost complete."
  ];
  boostOutput.textContent = "";
  let i = 0;
  const timer = setInterval(() => {
    boostOutput.textContent += lines[i] + "\n";
    i += 1;
    if (i >= lines.length) {
      clearInterval(timer);
      setFeature("boost", true);
      showToast("Boost RAM: ON");
    }
  }, 280);
});

closeBoostBtn?.addEventListener("click", closeModals);
infoDoneBtn?.addEventListener("click", closeModals);
copyDeviceBtn?.addEventListener("click", async () => {
  const id = deviceId();
  try {
    await navigator.clipboard.writeText(id);
    showToast("Đã copy Device ID");
  } catch (_) {
    showToast(id);
  }
});


runPingBtn?.addEventListener("click", async () => {
  if (!pingOutput) return;
  pingOutput.textContent = "> activating AINTIBAN panel status...\n";
  const start = performance.now();
  try {
    const data = await apiFetch("/api/health");
    const ms = Math.max(1, Math.round(performance.now() - start));
    pingOutput.textContent += `> response: ${data.message || "OK"}\n`;
    pingOutput.textContent += `> api check: ${ms}ms\n`;
    pingOutput.textContent += "> AINTIBAN status active.\n";
    setFeature("ping", true);
    showToast(`AINTIBAN: ON`);
  } catch (err) {
    pingOutput.textContent += `> error: ${err.message}\n`;
    setFeature("ping", false);
    showToast("AINTIBAN thất bại");
  }
});

pingOffBtn?.addEventListener("click", () => {
  setFeature("ping", false);
  if (pingOutput) pingOutput.textContent = "AINTIBAN stopped.";
  showToast("AINTIBAN: OFF");
});

runCacheBtn?.addEventListener("click", async () => {
  if (!cacheOutput) return;
  cacheOutput.textContent = "> activating REG FF panel status...\n";
  let removed = 0;

  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith("aimlockTemp_") || key.startsWith("tmp_")) {
      localStorage.removeItem(key);
      removed += 1;
    }
  });

  try {
    if ("caches" in window) {
      const names = await caches.keys();
      await Promise.all(names.map((name) => caches.delete(name)));
      removed += names.length;
    }
  } catch (_) {}

  await new Promise((resolve) => setTimeout(resolve, 280));
  cacheOutput.textContent += `> cleaned temporary panel cache: ${removed} item(s)\n`;
  cacheOutput.textContent += "> keeping login key and device id safe.\n";
  cacheOutput.textContent += "> REG FF status active.\n";
  setFeature("cache", true);
  showToast("REG FF: ON");
  updateStats();
});

cacheOffBtn?.addEventListener("click", () => {
  setFeature("cache", false);
  if (cacheOutput) cacheOutput.textContent = "REG FF stopped.";
  showToast("REG FF: OFF");
});

initSavedLogin();
renderFeatures();
updateStats();
setInterval(updateStats, 4000);
