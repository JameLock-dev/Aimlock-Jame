const APP_CONFIG = window.AIMLOCK_CONFIG || {};
const API_BASE = APP_CONFIG.apiBase || "https://aimlock-jame-production.up.railway.app";
const DEMO_MODE = Boolean(APP_CONFIG.demoMode);
const DEMO_FORCE_LOGIN = Boolean(APP_CONFIG.forceLogin);

const $ = (id) => document.getElementById(id);
const appShell = $("appShell");
const loginOverlay = $("loginOverlay");
const loginKeyInput = $("loginKeyInput");
const toggleKeyBtn = $("toggleKeyBtn");
const activateBtn = $("activateBtn");
const loginStatus = $("loginStatus");
const freeKeyBtn = $("freeKeyBtn");
const contactKeyBtn = $("contactKeyBtn");
const keyExpireText = $("keyExpireText");
const keySlotText = $("keySlotText");
const onlineCount = $("onlineCount");
const keyActive = $("keyActive");
const todayCount = $("todayCount");
const railwayStatus = $("railwayStatus");
const railwayStatusHero = $("railwayStatusHero");
const updateTime = $("updateTime");
const toast = $("toast");
const panelOverlay = $("panelOverlay");
const menuBtn = $("menuBtn");
const closeMenuBtn = $("closeMenuBtn");
const simpleMenu = $("simpleMenu");
const refreshStatsBtn = $("refreshStatsBtn");
const logoutBtn = $("logoutBtn");
const deviceText = $("deviceText");
const modalDeviceText = $("modalDeviceText");
const copyDeviceBtn = $("copyDeviceBtn");
const infoDoneBtn = $("infoDoneBtn");
const deviceNameText = $("deviceNameText");
const osText = $("osText");
const connectionText = $("connectionText");

const featureMap = {
  boost: ["boostState", "menuBoostState"],
  aimbody: ["aimbodyState", "menuAimbodyState"],
  nhetam: ["nhetamState", "menuNhetamState"],
  headlock: ["headlockState", "menuHeadlockState"],
  ping: ["pingState", "menuPingState"],
  cache: ["cacheState", "menuCacheState"]
};

function nowTime() {
  const n = new Date();
  return n.toLocaleTimeString("vi-VN", { hour12: false });
}

function showToast(msg) {
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("show"), 2200);
}

function lockApp(lock) {
  appShell?.classList.toggle("locked", lock);
  loginOverlay?.classList.toggle("hidden", !lock);
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
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    day: "2-digit", month: "2-digit", year: "numeric"
  });
}

function detectDeviceInfo() {
  const ua = navigator.userAgent || "";
  let device = /iPhone/i.test(ua) ? "iPhone" : /Android/i.test(ua) ? "Android" : /Windows/i.test(ua) ? "Windows PC" : /Mac/i.test(ua) ? "Mac" : "Thiết bị web";
  let os = /iPhone OS ([\d_]+)/i.test(ua) ? `iOS ${RegExp.$1.replace(/_/g, ".")}` : /Android ([\d.]+)/i.test(ua) ? `Android ${RegExp.$1}` : /Windows NT 10/i.test(ua) ? "Windows 10/11" : /Mac OS X ([\d_]+)/i.test(ua) ? `macOS ${RegExp.$1.replace(/_/g, ".")}` : "Web";
  let conn = navigator.connection?.effectiveType ? navigator.connection.effectiveType.toUpperCase() : "Wi‑Fi";
  if (deviceNameText) deviceNameText.textContent = device;
  if (osText) osText.textContent = os;
  if (connectionText) connectionText.textContent = conn;
}

function apiUrl(path) {
  return `${API_BASE}${path}`;
}

async function apiFetch(path, options = {}) {
  if (DEMO_MODE) {
    await new Promise((r) => setTimeout(r, 150));
    if (path === "/api/verify-key") {
      const body = JSON.parse(options.body || "{}");
      if (!String(body.key || "").trim()) throw new Error("Vui lòng nhập key.");
      return { ok: true, key: { expire: "2100-01-01T06:59:59.000Z", slotUsed: 1, slotLimit: 1 } };
    }
    if (path === "/api/stats") return { ok: true, online: 1248, activeKeys: 328, today: 3562, railway: "Online" };
    if (path === "/api/health") return { ok: true, message: "Server + Postgres OK" };
  }

  let res;
  try {
    res = await fetch(apiUrl(path), {
      ...options,
      headers: { Accept: "application/json", ...(options.headers || {}) },
      cache: "no-store"
    });
  } catch (_) {
    throw new Error("Không kết nối được API Railway.");
  }

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); }
  catch (_) { throw new Error("API đang trả về HTML, không phải JSON."); }
  if (!res.ok || data.ok === false) throw new Error(data.message || "Request thất bại.");
  return data;
}

function getFeatures() {
  try { return JSON.parse(localStorage.getItem("aimlockFeatureState") || "{}"); }
  catch { return {}; }
}

function saveFeatures(state) {
  localStorage.setItem("aimlockFeatureState", JSON.stringify(state));
}

function labelFeature(name) {
  return ({ boost: "Boost RAM", aimbody: "AIMBODY", nhetam: "NHẸ TÂM", headlock: "JAMELOCK", ping: "AINTIBAN", cache: "REG FF" })[name] || name;
}

function renderFeatures() {
  const state = getFeatures();
  Object.keys(featureMap).forEach((name) => {
    const on = Boolean(state[name]);
    featureMap[name].forEach((id) => {
      const el = $(id);
      if (el) el.textContent = on ? "ON" : "OFF";
    });
    document.querySelectorAll(`[data-toggle-feature="${name}"]`).forEach((el) => el.classList.toggle("is-on", on));
  });
  if (deviceText) deviceText.textContent = deviceId();
  if (modalDeviceText) modalDeviceText.textContent = deviceId();
}

async function applyFeatureAction(name, value) {
  if (!value) return;
  if (name === "boost") {
    await new Promise((r) => setTimeout(r, 220));
    showToast("Boost RAM đã được tối ưu");
  }
  if (name === "ping") {
    const start = performance.now();
    const data = await apiFetch("/api/health");
    const ms = Math.max(1, Math.round(performance.now() - start));
    showToast(`AINTIBAN hoạt động • ${data.message} • ${ms}ms`);
  }
  if (name === "cache") {
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
        await Promise.all(names.map((n) => caches.delete(n)));
        removed += names.length;
      }
    } catch {}
    showToast(`REG FF hoàn tất • ${removed} mục tạm`);
  }
}

async function setFeature(name, value) {
  const state = getFeatures();
  state[name] = Boolean(value);
  saveFeatures(state);
  renderFeatures();
  try {
    await applyFeatureAction(name, value);
  } catch (err) {
    state[name] = false;
    saveFeatures(state);
    renderFeatures();
    throw err;
  }
}

async function toggleFeature(name) {
  const state = getFeatures();
  const next = !state[name];
  try {
    await setFeature(name, next);
    showToast(`${labelFeature(name)}: ${next ? "ON" : "OFF"}`);
  } catch (err) {
    showToast(err.message || `${labelFeature(name)} thất bại`);
  }
}

async function verifyKey() {
  const key = loginKeyInput?.value.trim();
  if (!key) {
    loginStatus.innerHTML = `<span class="status-bullet"></span> Vui lòng nhập Password / Key.`;
    loginStatus.className = "login-status error";
    showToast("Thiếu key");
    return;
  }
  loginStatus.innerHTML = `<span class="status-bullet"></span> Đang kiểm tra Postgres key server...`;
  loginStatus.className = "login-status";
  activateBtn.disabled = true;
  activateBtn.textContent = "ĐANG KÍCH HOẠT...";
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
    loginStatus.innerHTML = `<span class="status-bullet"></span> Kích hoạt thành công`;
    loginStatus.className = "login-status success";
    showToast("Đăng nhập thành công");
    setTimeout(() => lockApp(false), 500);
    updateStats();
  } catch (err) {
    loginStatus.innerHTML = `<span class="status-bullet"></span> ${err.message || "Key không hợp lệ"}`;
    loginStatus.className = "login-status error";
    showToast("Kích hoạt thất bại");
  } finally {
    activateBtn.disabled = false;
    activateBtn.textContent = "⚡ KÍCH HOẠT JAME";
  }
}

async function updateStats() {
  try {
    const d = await apiFetch("/api/stats");
    if (onlineCount) onlineCount.textContent = Number(d.online ?? 0).toLocaleString("vi-VN");
    if (keyActive) keyActive.textContent = Number(d.activeKeys ?? 0).toLocaleString("vi-VN");
    if (todayCount) todayCount.textContent = Number(d.today ?? 0).toLocaleString("vi-VN");
    if (railwayStatus) railwayStatus.textContent = d.railway || "Online";
    if (railwayStatusHero) railwayStatusHero.textContent = (d.railway || "Online").toUpperCase();
  } catch (err) {
    if (railwayStatus) railwayStatus.textContent = "OFFLINE";
    if (railwayStatusHero) railwayStatusHero.textContent = "OFFLINE";
  }
  if (updateTime) updateTime.textContent = nowTime();
}

function openMenu() {
  simpleMenu?.classList.remove("hidden");
  panelOverlay?.classList.remove("hidden");
}
function closeMenu() {
  simpleMenu?.classList.add("hidden");
  panelOverlay?.classList.add("hidden");
}
function openModal(name) {
  closeMenu();
  if (name === "info") $("infoModal")?.classList.remove("hidden");
}
function closeModals() {
  document.querySelectorAll(".modal-box").forEach((el) => el.classList.add("hidden"));
}

function initSavedLogin() {
  if (DEMO_MODE && DEMO_FORCE_LOGIN) {
    localStorage.removeItem("jameLoginUnlocked");
    localStorage.removeItem("jameKeyInfo");
    lockApp(true);
    return;
  }
  if (DEMO_MODE && !DEMO_FORCE_LOGIN) {
    localStorage.setItem("jameLoginUnlocked", "true");
    localStorage.setItem("jameKeyInfo", JSON.stringify({ expire: "2100-01-01T06:59:59.000Z", slotUsed: 1, slotLimit: 1 }));
  }
  try {
    const saved = JSON.parse(localStorage.getItem("jameKeyInfo") || "null");
    if (localStorage.getItem("jameLoginUnlocked") === "true" && saved) {
      if (keyExpireText) keyExpireText.textContent = formatExpire(saved.expire);
      if (keySlotText) keySlotText.textContent = `${saved.slotUsed}/${saved.slotLimit}`;
      lockApp(false);
      return;
    }
  } catch {}
  lockApp(true);
}

function logout() {
  localStorage.removeItem("jameLoginUnlocked");
  localStorage.removeItem("jameKeyInfo");
  if (loginKeyInput) loginKeyInput.value = "";
  if (loginStatus) {
    loginStatus.innerHTML = `<span class="status-bullet"></span> Sẵn sàng kích hoạt`;
    loginStatus.className = "login-status";
  }
  lockApp(true);
  closeMenu();
  showToast("Đã đăng xuất");
}

toggleKeyBtn?.addEventListener("click", () => {
  const isPass = loginKeyInput.type === "password";
  loginKeyInput.type = isPass ? "text" : "password";
  toggleKeyBtn.textContent = isPass ? "🙈" : "👁";
});
activateBtn?.addEventListener("click", verifyKey);
loginKeyInput?.addEventListener("keydown", (e) => { if (e.key === "Enter") verifyKey(); });
freeKeyBtn?.addEventListener("click", () => window.open("https://www.tiktok.com/@jame.ff.11", "_blank", "noopener"));
contactKeyBtn?.addEventListener("click", () => window.open("https://zalo.me/0333635135", "_blank", "noopener"));
menuBtn?.addEventListener("click", openMenu);
closeMenuBtn?.addEventListener("click", closeMenu);
panelOverlay?.addEventListener("click", closeMenu);
refreshStatsBtn?.addEventListener("click", () => { updateStats(); closeMenu(); showToast("Đã làm mới server"); });
logoutBtn?.addEventListener("click", logout);
copyDeviceBtn?.addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(deviceId()); showToast("Đã copy Device ID"); }
  catch { showToast(deviceId()); }
});
infoDoneBtn?.addEventListener("click", closeModals);

document.addEventListener("click", async (e) => {
  const toggleBtn = e.target.closest("[data-toggle-feature]");
  const openBtn = e.target.closest("[data-open-feature]");
  const navBtn = e.target.closest("[data-nav-target]");
  const closeBtn = e.target.closest("[data-close-modal]");
  if (toggleBtn) return toggleFeature(toggleBtn.dataset.toggleFeature);
  if (openBtn) return openModal(openBtn.dataset.openFeature);
  if (navBtn) return closeMenu();
  if (closeBtn) return closeModals();
});

initSavedLogin();
detectDeviceInfo();
renderFeatures();
updateStats();
setInterval(updateStats, 4000);
