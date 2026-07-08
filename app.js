const VALID_KEYS = ["Admin11", "JAME-FREE-KEY"];
const DEMO_KEYS = {
  "Admin11": {
    key: "ADMIN",
    type: "admin",
    expire: "2099-12-31T23:59:59.000Z",
    slotUsed: 1,
    slotLimit: 1,
    status: "active"
  },
  "JAME-FREE-KEY": {
    key: "JAME-FREE-KEY",
    type: "vip",
    expire: new Date(Date.now() + 30 * 86400000).toISOString(),
    slotUsed: 1,
    slotLimit: 2,
    status: "active"
  }
};

const toastEl = document.getElementById("toast");

function showToast(message, type = "info") {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.dataset.type = type;
  toastEl.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toastEl.classList.remove("show"), 2400);
}

function setStoredFeature(key, value) {
  localStorage.setItem(`aimlock_feature_${key}`, value ? "1" : "0");
}

function getStoredFeature(key) {
  const saved = localStorage.getItem(`aimlock_feature_${key}`);
  if (saved !== null) return saved === "1";
  return false;
}

function getDeviceId() {
  let deviceId = localStorage.getItem("aimlock_device_id");
  if (!deviceId) {
    deviceId = `browser-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
    localStorage.setItem("aimlock_device_id", deviceId);
  }
  return deviceId;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    throw new Error("API chưa sẵn sàng hoặc đang trả HTML/Text.");
  }

  const data = JSON.parse(text);
  if (!response.ok || data?.ok === false) {
    throw new Error(data?.message || "Không thể kết nối API.");
  }

  return data;
}

function saveSessionFromKey(data, inputValue) {
  const keyInfo = data?.key || DEMO_KEYS[inputValue] || DEMO_KEYS["JAME-FREE-KEY"];
  const displayName = keyInfo.type === "admin" ? "ADMIN JAME" : "JAME FF";

  localStorage.setItem("aimlock_auth", "1");
  localStorage.setItem("aimlock_user", displayName);
  localStorage.setItem("aimlock_key_info", JSON.stringify(keyInfo));
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--/--/----";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function getDaysLeft(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 0;
  return Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86400000));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getKeyInfo() {
  try {
    return JSON.parse(localStorage.getItem("aimlock_key_info") || "{}");
  } catch (_) {
    return {};
  }
}

if (document.body.classList.contains("page-login")) {
  const keyInput = document.getElementById("keyInput");
  const togglePassword = document.getElementById("togglePassword");
  const activateBtn = document.getElementById("activateBtn");
  const pasteKeyBtn = document.getElementById("pasteKeyBtn");
  const loginStatus = document.getElementById("loginStatus");

  togglePassword?.addEventListener("click", () => {
    keyInput.type = keyInput.type === "password" ? "text" : "password";
  });

  pasteKeyBtn?.addEventListener("click", async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        keyInput.value = text.trim();
        showToast("Đã dán key từ clipboard.", "success");
      } else {
        showToast("Clipboard đang trống.", "warning");
      }
    } catch (err) {
      showToast("Trình duyệt không cho phép đọc clipboard.", "error");
    }
  });

  activateBtn?.addEventListener("click", async () => {
    const value = keyInput.value.trim();
    if (!value) {
      showToast("Vui lòng nhập key trước khi kích hoạt.", "warning");
      keyInput.focus();
      return;
    }

    activateBtn.classList.add("loading");
    activateBtn.querySelector("span").textContent = "ĐANG KIỂM TRA...";
    loginStatus.innerHTML = '<span class="dot"></span>Đang xác minh key';
    loginStatus.style.color = "";

    try {
      let data;
      try {
        data = await fetchJson("/api/verify-key", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: value, deviceId: getDeviceId() })
        });
      } catch (apiError) {
        if (!VALID_KEYS.includes(value)) throw apiError;
        data = { ok: true, message: "Key demo hợp lệ.", key: DEMO_KEYS[value] };
      }

      saveSessionFromKey(data, value);
      loginStatus.innerHTML = '<span class="dot"></span>Kích hoạt thành công';
      showToast(data.message || "Kích hoạt thành công. Đang vào dashboard...", "success");
      setTimeout(() => location.href = "dashboard.html", 650);
    } catch (error) {
      activateBtn.classList.remove("loading");
      activateBtn.querySelector("span").textContent = "KÍCH HOẠT JAME";
      loginStatus.textContent = error.message || "Key không hợp lệ. Hãy thử lại.";
      loginStatus.style.color = "#ff6e7f";
      showToast(error.message || "Key không hợp lệ.", "error");
    }
  });
}

if (document.body.classList.contains("page-dashboard")) {
  if (localStorage.getItem("aimlock_auth") !== "1") {
    location.href = "index.html";
  }

  const helloName = document.getElementById("helloName");
  const vipPlan = document.getElementById("vipPlan");
  const vipExpireDate = document.getElementById("vipExpireDate");
  const vipDaysText = document.getElementById("vipDaysText");
  const vipPercentText = document.getElementById("vipPercentText");
  const vipProgressBar = document.getElementById("vipProgressBar");
  const slotText = document.getElementById("slotText");
  const statOnline = document.getElementById("statOnline");
  const statActive = document.getElementById("statActive");
  const statToday = document.getElementById("statToday");

  const keyInfo = getKeyInfo();
  const daysLeft = getDaysLeft(keyInfo.expire || new Date(Date.now() + 30 * 86400000).toISOString());
  const progress = keyInfo.type === "admin" ? 100 : clamp(Math.round((daysLeft / 30) * 100), 0, 100);

  if (helloName) helloName.textContent = localStorage.getItem("aimlock_user") || "JAME FF";
  if (vipPlan) vipPlan.textContent = keyInfo.type === "admin" ? "ADMIN" : "VIP PRO";
  if (vipExpireDate) vipExpireDate.textContent = formatDate(keyInfo.expire || new Date(Date.now() + 30 * 86400000).toISOString());
  if (vipDaysText) vipDaysText.textContent = keyInfo.type === "admin" ? "Quyền admin không giới hạn" : `Còn ${daysLeft} ngày VIP`;
  if (vipPercentText) vipPercentText.textContent = `${progress}%`;
  if (vipProgressBar) requestAnimationFrame(() => { vipProgressBar.style.width = `${progress}%`; });
  if (slotText) slotText.textContent = `${Number(keyInfo.slotUsed || 1)}/${Number(keyInfo.slotLimit || 2)}`;

  async function loadDashboardStats() {
    const cards = document.querySelectorAll("[data-stat-card]");
    cards.forEach(card => card.classList.add("is-loading"));

    let stats = {
      online: 0,
      activeKeys: Number(keyInfo.slotLimit || 2),
      today: 1
    };

    try {
      const data = await fetchJson("/api/stats");
      stats = {
        online: Number(data.online ?? 0),
        activeKeys: Number(data.activeKeys ?? stats.activeKeys),
        today: Number(data.today ?? 0)
      };
    } catch (_) {
      // Giữ số fallback để bản static vẫn hoạt động khi chưa cấu hình Railway/Postgres.
    }

    if (statOnline) statOnline.textContent = stats.online;
    if (statActive) statActive.textContent = stats.activeKeys;
    if (statToday) statToday.textContent = stats.today;
    cards.forEach(card => card.classList.remove("is-loading"));
  }

  loadDashboardStats();

  document.querySelectorAll(".toggle").forEach(toggle => {
    const feature = toggle.dataset.feature;
    const hasDefaultOn = toggle.classList.contains("is-on");
    const saved = localStorage.getItem(`aimlock_feature_${feature}`);
    const initial = saved === null ? hasDefaultOn : getStoredFeature(feature);
    updateToggle(toggle, initial);

    toggle.addEventListener("click", () => {
      const next = !toggle.classList.contains("is-on");
      updateToggle(toggle, next);
      setStoredFeature(feature, next);
      showToast(`${feature.toUpperCase()} đã ${next ? "bật" : "tắt"}.`, next ? "success" : "warning");
    });
  });

  document.querySelectorAll(".interactive[data-toast]").forEach(el => {
    el.addEventListener("click", () => {
      if (el.classList.contains("toggle")) return;
      const msg = el.dataset.toast;
      const type = el.dataset.toastType || "info";
      if (msg) showToast(msg, type);
    });
  });

  const menuBtn = document.getElementById("menuBtn");
  const sideDrawer = document.getElementById("sideDrawer");
  const closeDrawer = document.getElementById("closeDrawer");
  const logoutBtn = document.getElementById("logoutBtn");
  const notifyBtn = document.getElementById("notifyBtn");
  const accountBtn = document.getElementById("accountBtn");

  menuBtn?.addEventListener("click", () => sideDrawer.classList.add("show"));
  closeDrawer?.addEventListener("click", () => sideDrawer.classList.remove("show"));
  sideDrawer?.addEventListener("click", event => {
    if (event.target === sideDrawer) sideDrawer.classList.remove("show");
  });
  notifyBtn?.addEventListener("click", () => showToast("Bạn có 1 thông báo cập nhật giao diện.", "info"));
  accountBtn?.addEventListener("click", () => showToast("Tài khoản đang hoạt động bình thường.", "success"));
  logoutBtn?.addEventListener("click", () => {
    localStorage.removeItem("aimlock_auth");
    showToast("Đã đăng xuất.", "warning");
    setTimeout(() => location.href = "index.html", 500);
  });
}

function updateToggle(toggle, on) {
  toggle.classList.toggle("is-on", on);
  toggle.setAttribute("aria-pressed", on ? "true" : "false");
  const label = toggle.querySelector(".label");
  if (label) label.textContent = on ? "ON" : "OFF";
}
