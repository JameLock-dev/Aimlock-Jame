const API_BASE_URL = String(
  window.AIMLOCK_API_BASE_URL ||
  window.AIMLOCK_CONFIG?.apiBase ||
  ""
).trim().replace(/\/+$/, "");
const IS_GITHUB_PAGES = /github\.io$/i.test(location.hostname);
const STATIC_PREVIEW_MODE = IS_GITHUB_PAGES && !API_BASE_URL;
const AIMLOCK_APP_VERSION = String(window.AIMLOCK_APP_VERSION || "1");


function isAndroidApkRuntime() {
  return !!(
    window.AndroidBridge &&
    (
      typeof window.AndroidBridge.getVersionCode === "function" ||
      typeof window.AndroidBridge.getStableDeviceId === "function" ||
      typeof window.AndroidBridge.getAndroidId === "function"
    )
  );
}

function getRuntimeAppVersion() {
  if (isAndroidApkRuntime() && typeof window.AndroidBridge.getVersionCode === "function") {
    try {
      return String(window.AndroidBridge.getVersionCode() || AIMLOCK_APP_VERSION || "1");
    } catch (_) {}
  }

  return String(AIMLOCK_APP_VERSION || "1");
}



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
  const rawKeyInfo = data?.key || createStaticKey(inputValue);
  const keyInfo = {
    ...rawKeyInfo,
    key: rawKeyInfo?.key || inputValue
  };
  const displayName = String(keyInfo.type || "").toLowerCase() === "admin"
    ? "ADMIN JAME"
    : "JAME FF";

  localStorage.setItem("aimlock_auth", "1");
  localStorage.setItem("aimlock_user", displayName);
  localStorage.setItem("aimlock_active_key", inputValue);
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

function normalizeKeyPlan(keyInfo = {}) {
  const raw = String(
    keyInfo.type ??
    keyInfo.plan ??
    keyInfo.vipType ??
    keyInfo.keyType ??
    ""
  ).trim();

  if (!raw) return "CHƯA XÁC ĐỊNH";
  if (raw.toLowerCase() === "admin") return "ADMIN";
  return raw.toUpperCase();
}


function scrollToSection(target) {
  target?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function normalizeVersion(value) {
  const raw = String(value || "0").trim().toLowerCase().replace(/^v/, "");
  const main = raw.split(/[^0-9.]/)[0] || "0";
  return main.split(".").map(part => Number.parseInt(part, 10) || 0);
}

function compareVersions(a, b) {
  const left = normalizeVersion(a);
  const right = normalizeVersion(b);
  const length = Math.max(left.length, right.length);
  for (let i = 0; i < length; i += 1) {
    const x = left[i] || 0;
    const y = right[i] || 0;
    if (x > y) return 1;
    if (x < y) return -1;
  }
  return 0;
}

function asBool(value) {
  return value === true || value === "true" || value === "1" || value === 1;
}

if (document.body.classList.contains("page-login")) {
  const keyInput = document.getElementById("keyInput");
  const togglePassword = document.getElementById("togglePassword");
  const activateBtn = document.getElementById("activateBtn");
  const pasteKeyBtn = document.getElementById("pasteKeyBtn");
  const loginStatus = document.getElementById("loginStatus");
  const freeKeyBtn = document.getElementById("freeKeyBtn");
  const zaloLinks = document.querySelectorAll('a[href*="zalo.me"]');
  const defaultButtonLabel = activateBtn?.querySelector("span")?.textContent || "KÍCH HOẠT KEY";
  const appGate = { blocked: false, title: "", message: "", actionUrl: "", mode: "" };

  function ensureGateModal() {
    let modal = document.getElementById("appGateModal");
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = "appGateModal";
    modal.className = "app-gate-modal-v26";
    modal.innerHTML = `
      <div class="app-gate-backdrop-v26"></div>
      <section class="app-gate-card-v26" role="dialog" aria-modal="true" aria-labelledby="appGateTitle">
        <div class="app-gate-icon-v26">!</div>
        <h3 id="appGateTitle">Thông báo hệ thống</h3>
        <p id="appGateMessage">App cần cập nhật để tiếp tục.</p>
        <div class="app-gate-actions-v26">
          <button type="button" id="appGateActionBtn">Tải bản mới</button>
          <button type="button" id="appGateCloseBtn">Đã hiểu</button>
        </div>
      </section>
    `;
    document.body.appendChild(modal);
    modal.querySelector("#appGateCloseBtn")?.addEventListener("click", () => {
      modal.classList.remove("show");
    });
    modal.querySelector(".app-gate-backdrop-v26")?.addEventListener("click", () => {
      modal.classList.remove("show");
    });
    modal.querySelector("#appGateActionBtn")?.addEventListener("click", () => {
      if (appGate.actionUrl) window.open(appGate.actionUrl, "_blank", "noopener");
      else showToast("Admin chưa cấu hình link tải bản mới.", "warning");
    });
    return modal;
  }

  function showGateModal() {
    const modal = ensureGateModal();
    const title = modal.querySelector("#appGateTitle");
    const message = modal.querySelector("#appGateMessage");
    const actionBtn = modal.querySelector("#appGateActionBtn");
    if (title) title.textContent = appGate.title || "Thông báo hệ thống";
    if (message) message.innerHTML = appGate.message || "App cần cập nhật để tiếp tục.";
    if (actionBtn) {
      const isMaintenance = appGate.mode === "maintenance";
      actionBtn.style.display = isMaintenance ? "none" : "";
      actionBtn.textContent = isMaintenance ? "" : "Tải bản mới";
    }
    modal.classList.add("show");
  }

  function blockLogin(title, message, actionUrl, mode = "update") {
    appGate.blocked = true;
    appGate.title = title || "CẦN CẬP NHẬT APP";
    appGate.message = message || "Phiên bản bạn đang dùng đã cũ. Vui lòng tải bản mới để tiếp tục.";
    appGate.actionUrl = actionUrl || "";
    appGate.mode = mode;
    if (activateBtn) {
      activateBtn.classList.add("is-disabled-v26");
      activateBtn.querySelector("span").textContent = title?.includes("NÂNG CẤP") ? "APP ĐANG NÂNG CẤP" : "CẦN CẬP NHẬT";
    }
    if (keyInput) keyInput.disabled = true;
    if (pasteKeyBtn) pasteKeyBtn.disabled = true;
    if (loginStatus) {
      loginStatus.innerHTML = `<span class="dot"></span>${appGate.title}`;
      loginStatus.style.color = "#ffd66b";
    }
    showToast(appGate.title, "warning");
    setTimeout(showGateModal, 300);
  }

  function applyPublicAppSettings(data) {
    const settings = data?.settings || {};
    if (settings.freeKeyUrl && freeKeyBtn) freeKeyBtn.href = settings.freeKeyUrl;
    if (settings.zaloUrl) zaloLinks.forEach(link => { link.href = settings.zaloUrl; });

    const actionUrl = settings.updateUrl || settings.downloadUrl || settings.apkUrl || settings.boostLinkUrl || settings.freeKeyUrl || settings.zaloUrl || "";
    const minimumVersion = settings.minVersion || settings.latestVersion || settings.currentVersion || "1";
    const latestVersion = settings.latestVersion || minimumVersion;

    // BẢO TRÌ: hiện cho cả web và APK.
    if (asBool(settings.maintenance)) {
      blockLogin(settings.maintenanceTitle || "APP ĐANG NÂNG CẤP", settings.maintenanceMessage || "Vui lòng quay lại sau.", "", "maintenance");
      return;
    }

    // BẮT CẬP NHẬT: chỉ hiện trong APK Android WebView.
    // Khi mở web bằng Chrome/GitHub/Railway thì bỏ qua forceUpdate, chỉ bảo trì mới hiện.
    const isApk = isAndroidApkRuntime();
    const runtimeVersion = getRuntimeAppVersion();
    const mustUpdate = isApk
      && asBool(settings.forceUpdate)
      && (
        compareVersions(runtimeVersion, minimumVersion) < 0 ||
        compareVersions(runtimeVersion, latestVersion) < 0
      );

    if (mustUpdate) {
      blockLogin(settings.forceTitle || `CẦN CẬP NHẬT APP V${latestVersion}`, settings.forceMessage || "Phiên bản bạn đang dùng đã cũ. Vui lòng tải bản mới để tiếp tục.", actionUrl, "update");
    }
  }

  async function loadPublicAppSettings() {
    const sources = [];

    // Ưu tiên server API. Khi app chạy cùng Railway, đường dẫn này hoạt động ngay.
    sources.push({ type: "api", url: "/api/app-settings" });

    // Khi chạy GitHub Pages mà chưa cấu hình Railway API, dùng fallback tĩnh để vẫn test được popup.
    sources.push({ type: "static", url: "app-settings.json" });

    for (const source of sources) {
      try {
        let data;
        if (source.type === "api") {
          data = await fetchJson(source.url);
        } else {
          const response = await fetch(`${source.url}?t=${Date.now()}`, { cache: "no-store" });
          if (!response.ok) throw new Error("Không tải được app-settings.json");
          data = await response.json();
        }
        applyPublicAppSettings(data);
        return;
      } catch (_) {
        // Thử nguồn tiếp theo.
      }
    }

    // Nếu đang chạy GitHub Pages nhưng chưa nối Railway API, nhắc nhẹ để admin biết nguyên nhân.
    if (STATIC_PREVIEW_MODE) {
      showToast("Chưa nối Railway API nên app dùng cấu hình tĩnh.", "warning");
    }
  }

  loadPublicAppSettings();

  togglePassword?.addEventListener("click", () => {
    keyInput.type = keyInput.type === "password" ? "text" : "password";
  });

  pasteKeyBtn?.addEventListener("click", async () => {
    try {
      let text = "";

      // Trong APK WebView, navigator.clipboard thường bị chặn với file://
      // nên ưu tiên đọc clipboard qua AndroidBridge native.
      if (window.AndroidBridge && typeof window.AndroidBridge.getClipboardText === "function") {
        text = window.AndroidBridge.getClipboardText() || "";
      } else if (navigator.clipboard && typeof navigator.clipboard.readText === "function") {
        text = await navigator.clipboard.readText();
      }

      text = String(text || "").trim();

      if (text) {
        keyInput.value = text;
        keyInput.dispatchEvent(new Event("input", { bubbles: true }));
        showToast("Đã dán key từ clipboard.", "success");
      } else {
        showToast("Clipboard đang trống.", "warning");
      }
    } catch (_) {
      showToast("Không đọc được clipboard. Hãy nhập key thủ công.", "error");
    }
  });

  activateBtn?.addEventListener("click", async () => {
    if (appGate.blocked) {
      showGateModal();
      return;
    }
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
          message: "Kích hoạt Thành công AIMLOCK JAME.",
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
      loginStatus.innerHTML = '<span class="dot"></span>Kích hoạt Thành công AIMLOCK JAME';
      showToast(data.message || "Kích hoạt Thành công AIMLOCK JAME. Đang vào dashboard...", "success");
      setTimeout(() => location.href = "dashboard.html", 650);
    } catch (error) {
      activateBtn.classList.remove("loading");
      activateBtn.querySelector("span").textContent = defaultButtonLabel;
      loginStatus.textContent = error.message || "Key không hợp lệ. Hãy thử lại.";
      loginStatus.style.color = "#ff6e7f";
      showToast(error.message || "Key không hợp lệ.", "error");
    }
  });

  keyInput?.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      activateBtn?.click();
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
  const statOnlineCard = document.getElementById("statOnlineCard");
  const statActiveCard = document.getElementById("statActiveCard");
  const statTodayCard = document.getElementById("statTodayCard");
  const onlineModal = document.getElementById("onlineModal");
  const activeKeysModal = document.getElementById("activeKeysModal");
  const todayModal = document.getElementById("todayModal");
  const onlineModalBody = document.getElementById("onlineModalBody");
  const activeKeysModalBody = document.getElementById("activeKeysModalBody");
  const todayModalBody = document.getElementById("todayModalBody");

  const keyInfo = getKeyInfo();
  const daysLeft = getDaysLeft(keyInfo.expire || new Date(Date.now() + 30 * 86400000).toISOString());
  const progress = keyInfo.type === "admin" ? 100 : clamp(Math.round((daysLeft / 30) * 100), 0, 100);
  let currentStats = {
    online: STATIC_PREVIEW_MODE ? 1 : 0,
    activeKeys: Number(keyInfo.slotLimit || 2),
    today: 1
  };

  if (helloName) helloName.textContent = localStorage.getItem("aimlock_user") || "JAME FF";
  if (vipPlan) vipPlan.textContent = normalizeKeyPlan(keyInfo);
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

    currentStats = stats;
    if (statOnline) statOnline.textContent = stats.online;
    if (statActive) statActive.textContent = stats.activeKeys;
    if (statToday) statToday.textContent = stats.today;
    cards.forEach(card => card.classList.remove("is-loading"));
  }

  loadDashboardStats();

  function openSimpleModal(modal) {
    if (!modal) return;
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open-v14");
  }

  function closeSimpleModal(modal) {
    if (!modal) return;
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open-v14");
  }

  function renderOnlineModal() {
    if (!onlineModalBody) return;
    const userName = localStorage.getItem("aimlock_user") || "AIMLOCK USER";
    const now = new Date();
    onlineModalBody.innerHTML = `
      <div class="stat-grid-v25">
        <div class="stat-panel-v25"><strong>Người dùng online</strong><p>${currentStats.online} tài khoản đang kết nối hệ thống.</p></div>
        <div class="stat-panel-v25"><strong>Thiết bị hiện tại</strong><p>${getDeviceId()}</p></div>
      </div>
      <div class="stat-panel-v25">
        <strong>Session đang hoạt động</strong>
        <div class="stat-list-v25">
          <div class="stat-item-v25"><div class="stat-index-v25">01</div><div><b>${userName}</b><span>Trạng thái: Online · Key ${keyInfo.key || keyInfo.type || "VIP"} · Đồng bộ lúc ${now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</span></div></div>
          <div class="stat-item-v25"><div class="stat-index-v25">02</div><div><b>VIP Session Core</b><span>Runtime service đang chạy ổn định để hỗ trợ dashboard realtime.</span></div></div>
        </div>
      </div>
      <div class="stat-actions-v25">
        <button type="button" class="stat-btn-v25" id="onlineRefreshBtn">Làm mới trạng thái</button>
        <button type="button" class="stat-btn-v25" id="onlineOpenNotifyBtn">Mở thông báo</button>
      </div>
    `;
    document.getElementById("onlineRefreshBtn")?.addEventListener("click", () => {
      loadDashboardStats();
      showToast("Đã làm mới trạng thái online.", "success");
    });
    document.getElementById("onlineOpenNotifyBtn")?.addEventListener("click", () => {
      closeSimpleModal(onlineModal);
      openNotifyPanel();
    });
  }

  function renderActiveKeysModal() {
    if (!activeKeysModalBody) return;
    const planName = normalizeKeyPlan(keyInfo);
    activeKeysModalBody.innerHTML = `
      <div class="stat-grid-v25">
        <div class="stat-panel-v25"><strong>Key hiện tại</strong><p>${keyInfo.key || "LOCAL-PREVIEW-KEY"}</p></div>
        <div class="stat-panel-v25"><strong>Slot đang dùng</strong><p>${Number(keyInfo.slotUsed || 1)}/${Number(keyInfo.slotLimit || 2)}</p></div>
      </div>
      <div class="stat-panel-v25">
        <strong>Tab quản lý key hoạt động</strong>
        <div class="stat-list-v25">
          <div class="stat-item-v25"><div class="stat-index-v25">01</div><div><b>${planName}</b><span>HSD: ${formatDate(keyInfo.expire || new Date(Date.now() + 30 * 86400000).toISOString())} · Trạng thái: ${keyInfo.status || "active"}</span></div></div>
          <div class="stat-item-v25"><div class="stat-index-v25">02</div><div><b>Thiết bị đã gắn</b><span>${getDeviceId()} · Session hiện tại đang hoạt động ổn định.</span></div></div>
        </div>
      </div>
      <div class="stat-actions-v25">
        <button type="button" class="stat-btn-v25" id="activeOpenVipBtn">Mở gia hạn VIP</button>
        <button type="button" class="stat-btn-v25" id="activeCopyKeyBtn">Sao chép key</button>
      </div>
    `;
    document.getElementById("activeOpenVipBtn")?.addEventListener("click", () => {
      closeSimpleModal(activeKeysModal);
      openVipModal();
    });
    document.getElementById("activeCopyKeyBtn")?.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(String(keyInfo.key || "LOCAL-PREVIEW-KEY"));
        showToast("Đã sao chép key hiện tại.", "success");
      } catch (_) {
        showToast("Không thể sao chép key trên trình duyệt này.", "warning");
      }
    });
  }

  function renderTodayModal() {
    if (!todayModalBody) return;
    const todayLabel = new Date().toLocaleDateString("vi-VN");
    const nowLabel = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    todayModalBody.innerHTML = `
      <div class="stat-grid-v25">
        <div class="stat-panel-v25"><strong>Lượt kích hoạt hôm nay</strong><p>${currentStats.today} lượt được ghi nhận trong ngày ${todayLabel}.</p></div>
        <div class="stat-panel-v25"><strong>Phiên gần nhất</strong><p>${nowLabel} · ${localStorage.getItem("aimlock_user") || "AIMLOCK USER"}</p></div>
      </div>
      <div class="stat-panel-v25">
        <strong>Lịch sử kích hoạt trong ngày</strong>
        <div class="stat-list-v25">
          <div class="stat-item-v25"><div class="stat-index-v25">01</div><div><b>Kích hoạt dashboard</b><span>${nowLabel} · Key đã được xác minh thành công trên phiên hiện tại.</span></div></div>
          <div class="stat-item-v25"><div class="stat-index-v25">02</div><div><b>Đồng bộ update center</b><span>Hệ thống cập nhật tự động đã được kiểm tra và sẵn sàng.</span></div></div>
          <div class="stat-item-v25"><div class="stat-index-v25">03</div><div><b>Khởi tạo module runtime</b><span>HUD runtime đã sẵn sàng để nhận thao tác bật/tắt module.</span></div></div>
        </div>
      </div>
      <div class="stat-actions-v25">
        <button type="button" class="stat-btn-v25" id="todayOpenUpdateBtn">Mở cập nhật</button>
        <button type="button" class="stat-btn-v25" id="todayRefreshBtn">Làm mới lịch sử</button>
      </div>
    `;
    document.getElementById("todayOpenUpdateBtn")?.addEventListener("click", () => {
      closeSimpleModal(todayModal);
      openUpdateModal();
    });
    document.getElementById("todayRefreshBtn")?.addEventListener("click", () => {
      renderTodayModal();
      showToast("Đã làm mới lịch sử hôm nay.", "success");
    });
  }

  const runtimeTitle = document.getElementById("runtimeTitle");
  const runtimeDetail = document.getElementById("runtimeDetail");
  const runtimePercent = document.getElementById("runtimePercent");
  const runtimeBar = document.getElementById("runtimeBar");
  const runtimeLog = document.getElementById("runtimeLog");
  const runtimeTitlePopup = document.getElementById("runtimeTitlePopup");
  const runtimeDetailPopup = document.getElementById("runtimeDetailPopup");
  const runtimePercentPopup = document.getElementById("runtimePercentPopup");
  const runtimeBarPopup = document.getElementById("runtimeBarPopup");
  const runtimeLogPopup = document.getElementById("runtimeLogPopup");

  const featureLabels = {
    boostram: { name: "BOOST FPS", boot: ["Clearing cache", "Stabilizing FPS", "Boost ready"], off: "FPS boost stopped" },
    aimbody: { name: "AIMBODY PRO", boot: ["Syncing control", "Calibrating response", "Aimbody ready"], off: "Aimbody standby" },
    nhetam: { name: "NHẸ TÂM", boot: ["Reducing input shake", "Optimizing touch", "Smooth mode ready"], off: "Smooth mode stopped" },
    jamelock: { name: "JAMELOCK", boot: ["Locking VIP profile", "Saving secure session", "Jamelock ready"], off: "Jamelock unlocked" },
    antiban: { name: "ANTIBAN SHIELD", boot: ["Checking shield layer", "Securing session", "Shield ready"], off: "Shield standby" },
    regff: { name: "REG FF MAX", boot: ["Cleaning FF temp", "Refreshing config", "Reg FF ready"], off: "Reg FF stopped" }
  };

  function setRuntime(title, detail, percent, log) {
    [runtimeTitle, runtimeTitlePopup].forEach(el => { if (el) el.textContent = title; });
    [runtimeDetail, runtimeDetailPopup].forEach(el => { if (el) el.textContent = detail; });
    [runtimePercent, runtimePercentPopup].forEach(el => { if (el) el.textContent = `${percent}%`; });
    [runtimeBar, runtimeBarPopup].forEach(el => { if (el) el.style.width = `${percent}%`; });
    [runtimeLog, runtimeLogPopup].forEach(el => { if (el) el.textContent = log; });
  }

  function getFeatureToggles(feature) {
    return Array.from(document.querySelectorAll(`.toggle[data-feature="${feature}"]`));
  }

  function setFeatureState(toggle, text, active = false, loading = false) {
    const feature = toggle.dataset.feature;
    getFeatureToggles(feature).forEach(item => {
      const row = item.closest(".feature-row-v11");
      const state = row?.querySelector(".feature-state-v14 em");
      if (state) state.textContent = text;
      row?.classList.toggle("is-active-v14", active);
      row?.classList.toggle("is-booting-v14", loading);
    });
  }

  function bootFeature(toggle, next) {
    const feature = toggle.dataset.feature;
    const config = featureLabels[feature] || { name: String(feature || "MODULE").toUpperCase(), boot: ["Loading", "Syncing", "Ready"], off: "Stopped" };
    const linkedToggles = getFeatureToggles(feature);

    if (!next) {
      linkedToggles.forEach(item => {
        item.disabled = false;
        updateToggle(item, false);
      });
      setStoredFeature(feature, false);
      setFeatureState(toggle, "STANDBY", false, false);
      setRuntime(`${config.name} OFFLINE`, config.off, 0, `STOP › ${config.off}`);
      showToast(`${config.name} đã tắt.`, "warning");
      return;
    }

    linkedToggles.forEach(item => {
      item.disabled = true;
      updateToggle(item, false);
    });
    setFeatureState(toggle, "LOADING", false, true);
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
      linkedToggles.forEach(item => {
        item.disabled = false;
        updateToggle(item, true);
      });
      setStoredFeature(feature, true);
      setFeatureState(toggle, "ACTIVE", true, false);
      setRuntime(`${config.name} ACTIVE`, "Realtime gaming mode is running", 100, `READY › ${config.name} active`);
      showToast(`${config.name} đã bật thành công.`, "success");
    }, 1700);
  }

  document.querySelectorAll(".toggle").forEach(toggle => {
    const feature = toggle.dataset.feature;
    const hasDefaultOn = document.querySelector(`.toggle[data-feature="${feature}"].is-on`) !== null;
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
  const drawerControlBtn = document.getElementById("drawerControlBtn");
  const drawerAppearanceBtn = document.getElementById("drawerAppearanceBtn");
  const drawerCommunityBtn = document.getElementById("drawerCommunityBtn");
  const updateBanner = document.getElementById("updateBanner");
  const communitySection = document.getElementById("communitySection");
  const runtimeHud = document.getElementById("runtimeHud");

  const notifyPanel = document.getElementById("notifyPanel");
  const markAllReadBtn = document.getElementById("markAllReadBtn");
  const notifDot = document.querySelector(".notif-dot");
  const settingsModal = document.getElementById("settingsModal");
  const perfModeToggle = document.getElementById("perfModeToggle");
  const scanlineToggle = document.getElementById("scanlineToggle");
  const compactToggle = document.getElementById("compactToggle");
  const saveSettingsBtn = document.getElementById("saveSettingsBtn");
  const resetModulesBtn = document.getElementById("resetModulesBtn");
  const updateModal = document.getElementById("updateModal");
  const updateNowBtn = document.getElementById("updateNowBtn");
  const navHomeBtn = document.getElementById("navHomeBtn");
  const navModulesBtn = document.getElementById("navModulesBtn");
  const navHudBtn = document.getElementById("navHudBtn");
  const navUpdatesBtn = document.getElementById("navUpdatesBtn");
  const accountModal = document.getElementById("accountModal");
  const moduleModal = document.getElementById("moduleModal");
  const hudModal = document.getElementById("hudModal");
  const accountOpenVipBtn = document.getElementById("accountOpenVipBtn");
  const accountOpenNotifyBtn = document.getElementById("accountOpenNotifyBtn");
  const accountSupportBtn = document.getElementById("accountSupportBtn");
  const accountLogoutBtn = document.getElementById("accountLogoutBtn");
  const hudOpenModulesBtn = document.getElementById("hudOpenModulesBtn");
  const hudCloseBtn = document.getElementById("hudCloseBtn");
  const accountSection = document.getElementById("accountSection");
  const accountModalName = document.getElementById("accountModalName");
  const accountModalPlan = document.getElementById("accountModalPlan");
  const accountModalExpire = document.getElementById("accountModalExpire");
  const updateList = document.getElementById("updateList");
  const notifyList = document.getElementById("notifyList");
  const updateBannerLabel = document.getElementById("updateBannerLabel");
  const updateBannerTitle = document.getElementById("updateBannerTitle");
  const updateBannerText = document.getElementById("updateBannerText");
  const updateModalTitle = document.getElementById("updateModalTitle");
  const UPDATES_URL = "updates.json";
  const UPDATE_SEEN_KEY = "aimlock_updates_seen_version";
  let latestUpdateData = null;

  function openDrawer() {
    sideDrawer?.classList.add("show");
  }
  function closeDrawerFn() {
    sideDrawer?.classList.remove("show");
  }
  function openNotifyPanel() {
    if (!notifyPanel) return;
    notifyPanel.classList.add("show");
    notifyPanel.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open-v14");
  }
  function closeNotifyPanel() {
    if (!notifyPanel) return;
    notifyPanel.classList.remove("show");
    notifyPanel.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open-v14");
  }
  function openSettingsModal() {
    if (!settingsModal) return;
    settingsModal.classList.add("show");
    settingsModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open-v14");
  }
  function closeSettingsModal() {
    if (!settingsModal) return;
    settingsModal.classList.remove("show");
    settingsModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open-v14");
  }
  function openUpdateModal() {
    if (!updateModal) return;
    updateModal.classList.add("show");
    updateModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open-v14");
  }
  function closeUpdateModal() {
    if (!updateModal) return;
    updateModal.classList.remove("show");
    updateModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open-v14");
  }
  function openAccountModal() {
    if (!accountModal) return;
    accountModalName.textContent = document.getElementById("helloName")?.textContent || "AIMLOCK USER";
    accountModalPlan.textContent = `Gói: ${document.getElementById("vipPlan")?.textContent || "AIMLOCK VIP"}`;
    accountModalExpire.textContent = `HSD: ${document.getElementById("vipExpireDate")?.textContent || "--/--/----"}`;
    accountModal.classList.add("show");
    accountModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open-v14");
  }
  function closeAccountModal() {
    if (!accountModal) return;
    accountModal.classList.remove("show");
    accountModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open-v14");
  }
  function openModuleModal() {
    if (!moduleModal) return;
    moduleModal.classList.add("show");
    moduleModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open-v14");
  }
  function closeModuleModal() {
    if (!moduleModal) return;
    moduleModal.classList.remove("show");
    moduleModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open-v14");
  }
  function openHudModal() {
    if (!hudModal) return;
    hudModal.classList.add("show");
    hudModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open-v14");
  }
  function closeHudModal() {
    if (!hudModal) return;
    hudModal.classList.remove("show");
    hudModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open-v14");
  }
  function setActiveBottomNav(activeEl) {
    document.querySelectorAll(".bottom-nav-v23 .nav-item-v23, .bottom-nav-v23 .nav-hub-v23").forEach(btn => btn.classList.remove("active"));
    activeEl?.classList.add("active");
  }

  function getSeenUpdateVersion() {
    return localStorage.getItem(UPDATE_SEEN_KEY) || "";
  }

  function setSeenUpdateVersion(version) {
    if (!version) return;
    localStorage.setItem(UPDATE_SEEN_KEY, version);
  }

  function refreshNotifDot() {
    const hasUnread = Boolean(notifyList?.querySelector(".notify-item-v15.unread"));
    notifDot?.classList.toggle("hidden", !hasUnread);
  }

  function markLatestUpdateSeen() {
    if (!latestUpdateData?.version) return;
    setSeenUpdateVersion(latestUpdateData.version);
    notifyList?.querySelector('[data-notify-action="update"]')?.classList.remove("unread");
    refreshNotifDot();
  }

  function buildUpdateItemsMarkup(items = []) {
    return items.map((item, index) => `
      <article class="update-item-v20 ${index === 0 ? "latest" : ""}">
        <b>${item.badge || String(index + 1).padStart(2, "0")}</b>
        <div>
          <strong>${item.title || "Cập nhật mới"}</strong>
          <p>${item.description || ""}</p>
        </div>
      </article>
    `).join("");
  }

  function renderNotificationCenter(data, hasUnreadUpdate) {
    if (!notifyList) return;
    const latestTitle = data.headline || `${data.title || "AIMLOCK JAME"} ${data.version || ""}`.trim();
    const latestSummary = data.summary || "Đã có cập nhật mới cho hệ thống.";
    const latestTime = data.time_label || "Vừa xong";
    notifyList.innerHTML = `
      <button class="notify-item-v15 ${hasUnreadUpdate ? "unread" : ""}" type="button" data-notify-action="update">
        <strong>${latestTitle}</strong>
        <p>${latestSummary}</p>
        <small>${latestTime}</small>
      </button>
      <button class="notify-item-v15" type="button" data-notify-action="vip">
        <strong>Bảng giá VIP mới</strong>
        <p>Gói 750K vĩnh viễn đã có antiban, bảo hành và hỗ trợ leo rank.</p>
        <small>Hôm nay</small>
      </button>
      <button class="notify-item-v15" type="button" data-notify-action="support">
        <strong>Hỗ trợ Zalo online</strong>
        <p>Kết nối nhanh qua số 0333 635135 để nhận tư vấn nâng cấp.</p>
        <small>Luôn sẵn sàng</small>
      </button>
    `;
    refreshNotifDot();
  }

  function renderUpdateCenter(data) {
    latestUpdateData = data;
    const hasUnreadUpdate = Boolean(data?.version) && getSeenUpdateVersion() !== data.version;

    if (updateBannerLabel) updateBannerLabel.textContent = data.label || "BẢN CẬP NHẬT";
    if (updateBannerTitle) updateBannerTitle.textContent = data.title || "AIMLOCK JAME";
    if (updateBannerText) updateBannerText.textContent = data.summary || "Đã có cập nhật mới cho hệ thống.";
    if (updateModalTitle) updateModalTitle.textContent = `Cập nhật mới ${data.title || "AIMLOCK JAME"}`;
    if (updateList) updateList.innerHTML = buildUpdateItemsMarkup(data.items || []);
    renderNotificationCenter(data, hasUnreadUpdate);

    if (hasUnreadUpdate) {
      setTimeout(() => {
        showToast(`Có bản cập nhật mới ${data.version || ""}`.trim(), "success");
      }, 600);
    }
  }

  async function loadLatestUpdates() {
    try {
      const response = await fetch(`${UPDATES_URL}?t=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Cannot load updates");
      const data = await response.json();
      if (!data || typeof data !== "object") return;
      renderUpdateCenter(data);
    } catch (_) {
      refreshNotifDot();
    }
  }

  function applyDashboardSettings() {
    const perfMode = localStorage.getItem("aimlock_setting_perf") === "1";
    const scanlineMode = localStorage.getItem("aimlock_setting_scanline") !== "0";
    const compactMode = localStorage.getItem("aimlock_setting_compact") === "1";

    document.body.classList.toggle("mode-performance-v15", perfMode);
    document.body.classList.toggle("scanline-off-v15", !scanlineMode);
    document.body.classList.toggle("compact-dashboard-v15", compactMode);

    if (perfModeToggle) perfModeToggle.checked = perfMode;
    if (scanlineToggle) scanlineToggle.checked = scanlineMode;
    if (compactToggle) compactToggle.checked = compactMode;
  }

  function clearFeatureStorageAndUI() {
    document.querySelectorAll(".toggle").forEach(toggle => {
      const feature = toggle.dataset.feature;
      if (feature) localStorage.removeItem(`aimlock_feature_${feature}`);
      updateToggle(toggle, false);
      setFeatureState(toggle, "STANDBY", false, false);
    });
    setRuntime("ENGINE RESET", "All modules returned to standby", 0, "READY › Modules reset");
  }

  applyDashboardSettings();
  loadLatestUpdates();

  statOnlineCard?.addEventListener("click", () => {
    renderOnlineModal();
    openSimpleModal(onlineModal);
  });
  statActiveCard?.addEventListener("click", () => {
    renderActiveKeysModal();
    openSimpleModal(activeKeysModal);
  });
  statTodayCard?.addEventListener("click", () => {
    renderTodayModal();
    openSimpleModal(todayModal);
  });
  document.querySelectorAll("[data-close-stat]").forEach(el => {
    el.addEventListener("click", () => {
      closeSimpleModal(onlineModal);
      closeSimpleModal(activeKeysModal);
      closeSimpleModal(todayModal);
    });
  });

  navHomeBtn?.addEventListener("click", () => {
    setActiveBottomNav(navHomeBtn);
    scrollToSection(document.getElementById("dashboardTop"));
    showToast("Đã mở Trang chủ.", "info");
  });
  navModulesBtn?.addEventListener("click", () => {
    setActiveBottomNav(navModulesBtn);
    openModuleModal();
    showToast("Đã mở tab Module riêng.", "success");
  });
  navHudBtn?.addEventListener("click", () => {
    setActiveBottomNav(navHudBtn);
    openHudModal();
    showToast("Đã mở popup HUD riêng.", "success");
  });
  navUpdatesBtn?.addEventListener("click", () => {
    setActiveBottomNav(navUpdatesBtn);
    markLatestUpdateSeen();
    openUpdateModal();
    showToast("Đã mở trung tâm cập nhật.", "info");
  });
  accountBtn?.addEventListener("click", () => {
    setActiveBottomNav(accountBtn);
    openAccountModal();
  });

  menuBtn?.addEventListener("click", openDrawer);
  closeDrawer?.addEventListener("click", closeDrawerFn);
  sideDrawer?.addEventListener("click", event => {
    if (event.target === sideDrawer) closeDrawerFn();
  });

  drawerControlBtn?.addEventListener("click", () => {
    closeDrawerFn();
    scrollToSection(runtimeHud);
    showToast("Đã mở Trung tâm điều khiển runtime.", "success");
  });

  drawerAppearanceBtn?.addEventListener("click", () => {
    closeDrawerFn();
    openSettingsModal();
  });

  drawerCommunityBtn?.addEventListener("click", () => {
    closeDrawerFn();
    scrollToSection(communitySection);
    showToast("Đã chuyển đến khu cộng đồng hỗ trợ.", "info");
  });

  notifyBtn?.addEventListener("click", openNotifyPanel);
  notifyPanel?.querySelectorAll("[data-close-notify]").forEach(el => el.addEventListener("click", closeNotifyPanel));
  markAllReadBtn?.addEventListener("click", () => {
    notifyList?.querySelectorAll(".notify-item-v15").forEach(item => item.classList.remove("unread"));
    markLatestUpdateSeen();
    refreshNotifDot();
    showToast("Đã đánh dấu tất cả thông báo là đã đọc.", "success");
  });

  notifyList?.addEventListener("click", event => {
    const item = event.target.closest("[data-notify-action]");
    if (!item) return;
    item.classList.remove("unread");
    const action = item.dataset.notifyAction;
    if (action === "update") markLatestUpdateSeen();
    refreshNotifDot();
    closeNotifyPanel();
    if (action === "vip") {
      openVipModal();
      return;
    }
    if (action === "support") {
      window.open(zaloSupportUrl, "_blank", "noopener");
      return;
    }
    if (action === "update") {
      openUpdateModal();
      showToast("Đã mở trung tâm cập nhật mới.", "info");
    }
  });

  document.querySelectorAll("[data-close-settings]").forEach(el => el.addEventListener("click", closeSettingsModal));
  document.querySelectorAll("[data-close-update]").forEach(el => el.addEventListener("click", closeUpdateModal));
  updateNowBtn?.addEventListener("click", () => {
    markLatestUpdateSeen();
    openUpdateModal();
  });
  saveSettingsBtn?.addEventListener("click", () => {
    localStorage.setItem("aimlock_setting_perf", perfModeToggle?.checked ? "1" : "0");
    localStorage.setItem("aimlock_setting_scanline", scanlineToggle?.checked ? "1" : "0");
    localStorage.setItem("aimlock_setting_compact", compactToggle?.checked ? "1" : "0");
    applyDashboardSettings();
    closeSettingsModal();
    showToast("Đã lưu cài đặt giao diện HUD.", "success");
  });

  resetModulesBtn?.addEventListener("click", () => {
    clearFeatureStorageAndUI();
    showToast("Đã reset toàn bộ module về mặc định.", "warning");
  });

  document.querySelectorAll("[data-close-account]").forEach(el => el.addEventListener("click", closeAccountModal));
  document.querySelectorAll("[data-close-module]").forEach(el => el.addEventListener("click", closeModuleModal));
  document.querySelectorAll("[data-close-hud]").forEach(el => el.addEventListener("click", closeHudModal));
  hudOpenModulesBtn?.addEventListener("click", () => { closeHudModal(); setActiveBottomNav(navModulesBtn); openModuleModal(); });
  hudCloseBtn?.addEventListener("click", closeHudModal);
  accountOpenVipBtn?.addEventListener("click", () => { closeAccountModal(); openVipModal(); });
  accountOpenNotifyBtn?.addEventListener("click", () => { closeAccountModal(); openNotifyPanel(); });
  accountSupportBtn?.addEventListener("click", () => { window.open(zaloSupportUrl, "_blank", "noopener"); });
  accountLogoutBtn?.addEventListener("click", () => {
    closeAccountModal();
    localStorage.removeItem("aimlock_auth");
    localStorage.removeItem("aimlock_user");
    localStorage.removeItem("aimlock_key_info");
    localStorage.removeItem("aimlock_active_key");
    showToast("Đã đăng xuất.", "warning");
    setTimeout(() => location.href = "index.html", 500);
  });
  document.getElementById("accountKeyBtn")?.addEventListener("click", () => {
    setActiveBottomNav(accountBtn);
    openAccountModal();
  });
  logoutBtn?.addEventListener("click", () => {
    localStorage.removeItem("aimlock_auth");
    localStorage.removeItem("aimlock_user");
    localStorage.removeItem("aimlock_key_info");
    localStorage.removeItem("aimlock_active_key");
    showToast("Đã đăng xuất.", "warning");
    setTimeout(() => location.href = "index.html", 500);
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeNotifyPanel();
      closeSettingsModal();
      closeUpdateModal();
      closeAccountModal();
      closeModuleModal();
      closeHudModal();
      closeSimpleModal(onlineModal);
      closeSimpleModal(activeKeysModal);
      closeSimpleModal(todayModal);
    }
  });
}

function updateToggle(toggle, on) {
  toggle.classList.toggle("is-on", on);
  toggle.setAttribute("aria-pressed", on ? "true" : "false");
  const label = toggle.querySelector(".label");
  if (label) label.textContent = on ? "ON" : "OFF";
}
document.addEventListener("DOMContentLoaded", function () {
  const notifyBtn = document.getElementById("notifyBtn");
  const notifyPanel = document.getElementById("notifyPanel");
  const markAllReadBtn = document.getElementById("markAllReadBtn");

  if (!notifyBtn || !notifyPanel) {
    console.error("Không tìm thấy notifyBtn hoặc notifyPanel");
    return;
  }

  function openNotifyPanel() {
    notifyPanel.classList.add("is-open");
    notifyPanel.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }

  function closeNotifyPanel() {
    notifyPanel.classList.remove("is-open");
    notifyPanel.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  notifyBtn.addEventListener("click", function (event) {
    event.preventDefault();
    event.stopPropagation();
    openNotifyPanel();
  });

  notifyPanel
    .querySelectorAll("[data-close-notify]")
    .forEach(function (button) {
      button.addEventListener("click", function (event) {
        event.preventDefault();
        closeNotifyPanel();
      });
    });

  if (markAllReadBtn) {
    markAllReadBtn.addEventListener("click", function () {
      notifyPanel
        .querySelectorAll(".notify-item-v15.unread")
        .forEach(function (item) {
          item.classList.remove("unread");
        });

      const dot = document.querySelector(".notif-dot");
      if (dot) dot.style.display = "none";
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeNotifyPanel();
    }
  });
});
