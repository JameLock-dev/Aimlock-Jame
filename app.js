const API_BASE_URL = String(window.AIMLOCK_API_BASE_URL || "").trim().replace(/\/+$/, "");
const IS_GITHUB_PAGES = /github\.io$/i.test(location.hostname);
const STATIC_PREVIEW_MODE = IS_GITHUB_PAGES && !API_BASE_URL;

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

function apiUrl(path) {
  const cleanPath = String(path || "").startsWith("/") ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${cleanPath}` : cleanPath;
}

function showToast(message, type = "info") {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.dataset.type = type;
  toastEl.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toastEl.classList.remove("show"), 2600);
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

async function fetchJson(path, options = {}) {
  const response = await fetch(apiUrl(path), options);
  const text = await response.text();
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    throw new Error("API chưa sẵn sàng hoặc đang trả HTML/Text.");
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch (_) {
    throw new Error("API trả dữ liệu lỗi, không đọc được JSON.");
  }

  if (!response.ok || data?.ok === false) {
    throw new Error(data?.message || "Không thể kết nối API.");
  }

  return data;
}

function createStaticKey(inputValue) {
  if (DEMO_KEYS[inputValue]) return DEMO_KEYS[inputValue];

  return {
    key: inputValue || "LOCAL-PREVIEW-KEY",
    type: "vip",
    expire: new Date(Date.now() + 30 * 86400000).toISOString(),
    slotUsed: 1,
    slotLimit: 2,
    status: "active"
  };
}

function saveSessionFromKey(data, inputValue) {
  const keyInfo = data?.key || createStaticKey(inputValue);
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
  const defaultButtonLabel = activateBtn?.querySelector("span")?.textContent || "KÍCH HOẠT KEY";

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
    } catch (_) {
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

      if (STATIC_PREVIEW_MODE) {
        data = {
          ok: true,
          message: "Kích hoạt thành công trên GitHub Pages.",
          key: createStaticKey(value)
        };
      } else {
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
      }

      saveSessionFromKey(data, value);
      loginStatus.innerHTML = '<span class="dot"></span>Kích hoạt thành công';
      showToast(data.message || "Kích hoạt thành công. Đang vào dashboard...", "success");
      setTimeout(() => location.href = "dashboard.html", 650);
    } catch (error) {
      activateBtn.classList.remove("loading");
      activateBtn.querySelector("span").textContent = defaultButtonLabel;
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
      online: STATIC_PREVIEW_MODE ? 1 : 0,
      activeKeys: Number(keyInfo.slotLimit || 2),
      today: 1
    };

    try {
      if (!STATIC_PREVIEW_MODE) {
        const data = await fetchJson("/api/stats");
        stats = {
          online: Number(data.online ?? 0),
          activeKeys: Number(data.activeKeys ?? stats.activeKeys),
          today: Number(data.today ?? 0)
        };
      }
    } catch (_) {
      // Giữ fallback để bản static/GitHub Pages không báo lỗi khi chưa có Railway API.
    }

    if (statOnline) statOnline.textContent = stats.online;
    if (statActive) statActive.textContent = stats.activeKeys;
    if (statToday) statToday.textContent = stats.today;
    cards.forEach(card => card.classList.remove("is-loading"));
  }

  loadDashboardStats();

  const runtimeTitle = document.getElementById("runtimeTitle");
  const runtimeDetail = document.getElementById("runtimeDetail");
  const runtimePercent = document.getElementById("runtimePercent");
  const runtimeBar = document.getElementById("runtimeBar");
  const runtimeLog = document.getElementById("runtimeLog");

  const featureLabels = {
    boostram: { name: "BOOST FPS", boot: ["Clearing cache", "Stabilizing FPS", "Boost ready"], off: "FPS boost stopped" },
    aimbody: { name: "AIMBODY PRO", boot: ["Syncing control", "Calibrating response", "Aimbody ready"], off: "Aimbody standby" },
    nhetam: { name: "NHẸ TÂM", boot: ["Reducing input shake", "Optimizing touch", "Smooth mode ready"], off: "Smooth mode stopped" },
    jamelock: { name: "JAMELOCK", boot: ["Locking VIP profile", "Saving secure session", "Jamelock ready"], off: "Jamelock unlocked" },
    antiban: { name: "ANTIBAN SHIELD", boot: ["Checking shield layer", "Securing session", "Shield ready"], off: "Shield standby" },
    regff: { name: "REG FF MAX", boot: ["Cleaning FF temp", "Refreshing config", "Reg FF ready"], off: "Reg FF stopped" }
  };

  function setRuntime(title, detail, percent, log) {
    if (runtimeTitle) runtimeTitle.textContent = title;
    if (runtimeDetail) runtimeDetail.textContent = detail;
    if (runtimePercent) runtimePercent.textContent = `${percent}%`;
    if (runtimeBar) runtimeBar.style.width = `${percent}%`;
    if (runtimeLog) runtimeLog.textContent = log;
  }

  function setFeatureState(toggle, text, active = false, loading = false) {
    const row = toggle.closest(".feature-row-v11");
    const state = row?.querySelector(".feature-state-v14 em");
    if (state) state.textContent = text;
    row?.classList.toggle("is-active-v14", active);
    row?.classList.toggle("is-booting-v14", loading);
  }

  function bootFeature(toggle, next) {
    const feature = toggle.dataset.feature;
    const config = featureLabels[feature] || { name: String(feature || "MODULE").toUpperCase(), boot: ["Loading", "Syncing", "Ready"], off: "Stopped" };

    if (!next) {
      updateToggle(toggle, false);
      setStoredFeature(feature, false);
      setFeatureState(toggle, "STANDBY", false, false);
      setRuntime(`${config.name} OFFLINE`, config.off, 0, `STOP › ${config.off}`);
      showToast(`${config.name} đã tắt.`, "warning");
      return;
    }

    toggle.disabled = true;
    setFeatureState(toggle, "LOADING", false, true);
    updateToggle(toggle, false);
    setRuntime(`${config.name} BOOTING`, config.boot[0], 18, `RUN › ${config.boot[0]}`);
    showToast(`Đang khởi chạy ${config.name}...`, "info");

    const steps = [
      { delay: 420, percent: 42, text: config.boot[1] || "Syncing" },
      { delay: 920, percent: 78, text: "Verifying VIP access" },
      { delay: 1380, percent: 100, text: config.boot[2] || "Ready" }
    ];

    steps.forEach(step => {
      setTimeout(() => {
        setRuntime(`${config.name} BOOTING`, step.text, step.percent, `RUN › ${step.text}`);
      }, step.delay);
    });

    setTimeout(() => {
      toggle.disabled = false;
      updateToggle(toggle, true);
      setStoredFeature(feature, true);
      setFeatureState(toggle, "ACTIVE", true, false);
      setRuntime(`${config.name} ACTIVE`, "Realtime gaming mode is running", 100, `READY › ${config.name} active`);
      showToast(`${config.name} đã bật thành công.`, "success");
    }, 1700);
  }

  document.querySelectorAll(".toggle").forEach(toggle => {
    const feature = toggle.dataset.feature;
    const hasDefaultOn = toggle.classList.contains("is-on");
    const saved = localStorage.getItem(`aimlock_feature_${feature}`);
    const initial = saved === null ? hasDefaultOn : getStoredFeature(feature);
    updateToggle(toggle, initial);
    setFeatureState(toggle, initial ? "ACTIVE" : "STANDBY", initial, false);

    toggle.addEventListener("click", () => {
      if (toggle.disabled) return;
      const next = !toggle.classList.contains("is-on");
      bootFeature(toggle, next);
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

  const zaloSupportUrl = "https://zalo.me/0333635135";
  const vipModal = document.getElementById("vipModal");
  const renewVipBtn = document.getElementById("renewVipBtn");
  const supportZaloBtn = document.getElementById("supportZaloBtn");
  const activateActionBtn = document.getElementById("activateActionBtn");
  const closeVipModal = document.getElementById("closeVipModal");

  function openVipModal() {
    if (!vipModal) return;
    vipModal.classList.add("show");
    vipModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open-v14");
  }

  function closeVip() {
    if (!vipModal) return;
    vipModal.classList.remove("show");
    vipModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open-v14");
  }

  renewVipBtn?.addEventListener("click", openVipModal);
  closeVipModal?.addEventListener("click", closeVip);
  vipModal?.querySelectorAll("[data-close-vip]").forEach(el => el.addEventListener("click", closeVip));
  vipModal?.querySelectorAll("[data-plan]").forEach(btn => {
    btn.addEventListener("click", () => {
      const plan = btn.dataset.plan || "gói VIP";
      showToast(`Đang mở Zalo: ${plan}`, "success");
      window.open(zaloSupportUrl, "_blank", "noopener");
    });
  });
  supportZaloBtn?.addEventListener("click", () => window.open(zaloSupportUrl, "_blank", "noopener"));
  activateActionBtn?.addEventListener("click", () => document.getElementById("moduleList")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeVip();
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
