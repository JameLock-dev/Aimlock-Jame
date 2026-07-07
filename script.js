const API_BASE = "";
// Nếu frontend KHÔNG chạy cùng domain Railway backend thì sửa thành:
// const API_BASE = "https://ten-app-cua-ban.up.railway.app";

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
    year: "numeric",
  });
}

function apiUrl(path) {
  return `${API_BASE}${path}`;
}

async function apiFetch(path, options = {}) {
  const res = await fetch(apiUrl(path), {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.headers || {}),
    },
    cache: "no-store",
  });

  const text = await res.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    console.error("API returned non-JSON:", text);

    throw new Error(
      "API đang trả về HTML, không phải JSON. Hãy kiểm tra đúng link Railway backend hoặc sửa API_BASE trong file JS."
    );
  }

  if (!res.ok || data.ok === false) {
    throw new Error(data.message || "Request thất bại.");
  }

  return data;
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
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key,
        deviceId: deviceId(),
      }),
    });

    localStorage.setItem("jameLoginUnlocked", "true");
    localStorage.setItem("jameKeyInfo", JSON.stringify(data.key));

    keyExpireText.textContent = formatExpire(data.key.expire);
    keySlotText.textContent = `${data.key.slotUsed}/${data.key.slotLimit}`;

    loginStatus.textContent = "Key hợp lệ. Đang vào app...";
    loginStatus.className = "login-status success";

    showToast("Đăng nhập thành công");

    setTimeout(() => lockApp(false), 650);

    updateStats();
  } catch (err) {
    loginStatus.textContent =
      err.message || "Key không hợp lệ. Vui lòng thử lại.";
    loginStatus.className = "login-status error";
    showToast("Key không hợp lệ");
  } finally {
    activateBtn.disabled = false;
    activateBtn.textContent = "⚡ Kích Hoạt Jame";
  }
}

if (toggleKeyBtn) {
  toggleKeyBtn.addEventListener("click", () => {
    const isPass = loginKeyInput.type === "password";
    loginKeyInput.type = isPass ? "text" : "password";
    toggleKeyBtn.textContent = isPass ? "🙈" : "👁";
  });
}

if (activateBtn) {
  activateBtn.addEventListener("click", verifyKey);
}

if (loginKeyInput) {
  loginKeyInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") verifyKey();
  });
}

if (freeKeyBtn) {
  freeKeyBtn.addEventListener("click", () => {
    window.open("https://www.tiktok.com/@jame.ff.11", "_blank", "noopener");
  });
}

if (contactKeyBtn) {
  contactKeyBtn.addEventListener("click", () => {
    showToast("Liên hệ Zalo: 0333635135");
  });
}

async function updateStats() {
  try {
    const d = await apiFetch("/api/stats");

    onlineCount.textContent = d.online ?? 0;
    keyActive.textContent = d.activeKeys ?? 0;
    todayCount.textContent = d.today ?? 0;
    railwayStatus.textContent = d.railway || "Online";
  } catch (err) {
    console.warn("Stats error:", err.message);
    railwayStatus.textContent = "OFFLINE";
  }

  updateTime.textContent = nowTime();
}

try {
  const savedInfo = JSON.parse(localStorage.getItem("jameKeyInfo") || "null");

  if (localStorage.getItem("jameLoginUnlocked") === "true" && savedInfo) {
    keyExpireText.textContent = formatExpire(savedInfo.expire);
    keySlotText.textContent = `${savedInfo.slotUsed}/${savedInfo.slotLimit}`;
    lockApp(false);
  } else {
    lockApp(true);
  }
} catch {
  localStorage.removeItem("jameLoginUnlocked");
  localStorage.removeItem("jameKeyInfo");
  lockApp(true);
}

updateStats();
setInterval(updateStats, 4000);
