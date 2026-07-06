// ================= HEADLOCK JAME CONFIG =================
const API_BASE = "https://headlock-jame-production.up.railway.app";
function showMaintenanceScreen(title, message) {
  document.body.innerHTML = `
    <div style="position:fixed;inset:0;z-index:999999;display:flex;justify-content:center;align-items:center;background:#07090f;color:white;font-family:Arial,sans-serif;text-align:center;padding:20px;">
      <div>
        <div style="font-size:54px;font-weight:bold;color:#facc15;margin-bottom:20px;">HEADLOCK</div>
        <h2 style="margin:0 0 15px">${title || "APP ĐANG NÂNG CẤP"}</h2>
        <p style="opacity:.8;line-height:1.6">
          ${message || "Phiên bản mới đang được cập nhật.<br>Vui lòng quay lại sau."}
        </p>
      </div>
    </div>`;
}


function showForceUpdateScreen(title, message, updateUrl) {
  document.body.innerHTML = `
    <div style="position:fixed;inset:0;z-index:999999;display:flex;justify-content:center;align-items:center;background:#07090f;color:white;font-family:Arial,sans-serif;text-align:center;padding:20px;">
      <div style="max-width:360px;width:100%;">
        <div style="font-size:48px;font-weight:bold;color:#facc15;margin-bottom:18px;">HEADLOCK</div>
        <h2 style="margin:0 0 14px;font-size:24px;">${title || "CẦN CẬP NHẬT APP"}</h2>
        <p style="opacity:.86;line-height:1.6;margin-bottom:22px;">
          ${message || "Phiên bản bạn đang dùng đã cũ. Vui lòng tải bản mới để tiếp tục sử dụng."}
        </p>
        <button id="forceUpdateBtn" type="button" style="width:100%;border:0;border-radius:18px;background:linear-gradient(135deg,#22c55e,#16a34a);color:white;font-weight:800;font-size:17px;padding:16px 18px;">
          TẢI BẢN MỚI
        </button>
        <p style="font-size:13px;opacity:.65;margin-top:14px;">Bạn cần cập nhật để tiếp tục dùng app.</p>
      </div>
    </div>`;

  setTimeout(() => {
    const btn = document.getElementById("forceUpdateBtn");
    if (!btn) return;

    btn.addEventListener("click", () => {
      if (hasAndroidBridge() && typeof AndroidBridge.openExternalUrl === "function") {
        AndroidBridge.openExternalUrl(updateUrl);
      } else {
        window.location.href = updateUrl;
      }
    });
  }, 0);
}

function getCurrentAppVersionCode() {
  try {
    if (hasAndroidBridge() && typeof AndroidBridge.getVersionCode === "function") {
      return parseInt(AndroidBridge.getVersionCode(), 10) || 1;
    }
  } catch (error) {
    console.warn("Không lấy được versionCode", error);
  }

  return 1;
}

function shouldForceUpdate(data) {
  // Chỉ Android APK/WebView mới bắt buộc cập nhật.
  // Web, iOS Safari/PWA không cần hiện màn hình cập nhật APK.
  if (!hasAndroidBridge()) return false;

  const currentVersion = getCurrentAppVersionCode();
  const latestVersion = parseInt(data.appLatestVersionCode || data.latestVersionCode || "1", 10) || 1;
  const minVersion = parseInt(data.appMinVersionCode || data.minVersionCode || "1", 10) || 1;
  const forceUpdate = data.forceUpdate === true;
  const updateUrl = data.updateUrl || data.apkUrl || "";

  if (!updateUrl) return false;

  if (currentVersion < minVersion) return true;
  if (forceUpdate && currentVersion < latestVersion) return true;

  return false;
}

let GET_KEY_FREE_URL = "https://link4m.net/lnZEeK4t";
let CONTACT_ZALO = "https://zalo.me/0333635135";

const STORAGE = {
  DEVICE: "headlock_device",
  KEY: "headlock_key",
  SESSION: "headlock_session",
  CROSSHAIR_SIZE: "crosshair_size",
  CROSSHAIR_COLOR: "crosshair_color",
  CROSSHAIR_STYLE: "crosshair_style",
  CROSSHAIR_X: "crosshair_x",
  CROSSHAIR_Y: "crosshair_y",
  SPEED_ENABLED: "headlock_speed_enabled",
  SPEED_LEVEL: "headlock_speed_level",
  SPEED_VALUE: "headlock_speed_value"
};


async function loadRemoteSettings() {
  try {
    const res = await fetch(API_BASE + "/settings");
    if (!res.ok) throw new Error("Settings API lỗi");

    const data = await res.json();

    if (data.success) {
      GET_KEY_FREE_URL = data.freeKeyUrl || GET_KEY_FREE_URL;
      CONTACT_ZALO = data.contactUrl || CONTACT_ZALO;

      if (shouldForceUpdate(data)) {
        showForceUpdateScreen(
          data.updateTitle || "CẦN CẬP NHẬT APP",
          data.updateMessage || "Phiên bản bạn đang dùng đã cũ. Vui lòng tải bản mới để tiếp tục sử dụng.",
          data.updateUrl || data.apkUrl
        );

        return false;
      }

      if (data.maintenanceMode === true) {
        showMaintenanceScreen(
          data.maintenanceTitle || "APP ĐANG NÂNG CẤP",
          data.maintenanceMessage || "Phiên bản mới đang được cập nhật.<br>Vui lòng quay lại sau."
        );

        return false;
      }
    }

    return true;
  } catch (e) {
    console.warn("Không tải được settings online", e);
    return true;
  }
}

const passwordScreen = document.getElementById("passwordScreen");
const mainApp = document.getElementById("mainApp");
const passwordForm = document.getElementById("passwordForm");
const passwordInput = document.getElementById("passwordInput");
const passwordError = document.getElementById("passwordError");
const togglePassword = document.getElementById("togglePassword");
const logoutBtn = document.getElementById("logoutBtn");
const contactBtn = document.getElementById("contactBtn");
const getKeyBtn = document.getElementById("getKeyBtn");
const infoGetKeyBtn = document.getElementById("infoGetKeyBtn");
const appLogoutBtn = document.getElementById("appLogoutBtn");
const licenseText = document.getElementById("licenseText");

const boostModal = document.getElementById("boostModal");
const crosshairModal = document.getElementById("crosshairModal");
const crosshairDot = document.getElementById("crosshairDot");
const crosshairSize = document.getElementById("crosshairSize");
const crosshairColor = document.getElementById("crosshairColor");
const crosshairOnBtn = document.getElementById("crosshairOnBtn");
const crosshairOffBtn = document.getElementById("crosshairOffBtn");
const logoutModal = document.getElementById("logoutModal");
const logoutConfirm = document.getElementById("logoutConfirm");
const logoutCancel = document.getElementById("logoutCancel");
const logoutClose = document.getElementById("logoutClose");
const sensitivityModal = document.getElementById("sensitivityModal");
const sensitivityClose = document.getElementById("sensitivityClose");
const sensitivityBrandGrid = document.getElementById("sensitivityBrandGrid");
const sensitivityModelList = document.getElementById("sensitivityModelList");
const sensitivitySearch = document.getElementById("sensitivitySearch");
const sensitivityPresetGrid = document.getElementById("sensitivityPresetGrid");
const sensitivityValues = document.getElementById("sensitivityValues");
const sensitivityDeviceName = document.getElementById("sensitivityDeviceName");
const sensitivityDeviceInfo = document.getElementById("sensitivityDeviceInfo");
const sensitivityNote = document.getElementById("sensitivityNote");
const speedModal = document.getElementById("speedModal");
const speedClose = document.getElementById("speedClose");
const speedMenuBtn = document.getElementById("speedMenuBtn");
const speedStatusBox = document.getElementById("speedStatusBox");
const speedStatusText = document.getElementById("speedStatusText");
const speedStatusIcon = document.getElementById("speedStatusIcon");
const speedRange = document.getElementById("speedRange");
const speedMeterFill = document.getElementById("speedMeterFill");
const speedOnBtn = document.getElementById("speedOnBtn");
const speedOffBtn = document.getElementById("speedOffBtn");

// Nút / thanh chỉnh vị trí tâm ảo
const crosshairMoveUp = document.getElementById("crosshairMoveUp");
const crosshairMoveDown = document.getElementById("crosshairMoveDown");
const crosshairMoveLeft = document.getElementById("crosshairMoveLeft");
const crosshairMoveRight = document.getElementById("crosshairMoveRight");
const crosshairResetPos = document.getElementById("crosshairResetPos");
const crosshairPosX = document.getElementById("crosshairPosX");
const crosshairPosY = document.getElementById("crosshairPosY");
const crosshairPosText = document.getElementById("crosshairPosText");

const terminal = document.getElementById("terminal");
const boostDone = document.getElementById("boostDone");
const toast = document.getElementById("toast");
const infoPanel = document.getElementById("infoPanel");
const overlay = document.getElementById("overlay");
const menuBtn = document.getElementById("menuBtn");
const closeInfo = document.getElementById("closeInfo");

const terminalLines = [
  "$ Initializing BOST RAM optimization...",
  "$ Scanning system memory...",
  "$ Clearing cache files...",
  "$ Optimizing RAM allocation...",
  "$ Freeing up memory blocks...",
  "$ Applying performance boost...",
  "$ Finalizing optimization..."
];

function hasAndroidBridge() {
  return typeof AndroidBridge !== "undefined";
}

function getDeviceId() {
  try {
    if (hasAndroidBridge() && typeof AndroidBridge.getAndroidId === "function") {
      const androidId = AndroidBridge.getAndroidId();
      if (androidId && androidId.length > 5) return "ANDROID-" + androidId;
    }
  } catch (error) {
    console.warn("Không lấy được Android ID:", error);
  }

  let deviceId = localStorage.getItem(STORAGE.DEVICE);
  if (!deviceId) {
    deviceId = "WEB-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 10).toUpperCase();
    localStorage.setItem(STORAGE.DEVICE, deviceId);
  }
  return deviceId;
}

function setLoginMessage(type, text) {
  if (!passwordError) return;
  passwordError.className = "message " + (type || "");
  passwordError.textContent = text;
}

function showToast(text) {
  if (!toast) return;
  toast.textContent = text;
  toast.classList.add("active");
  clearTimeout(window.headlockToastTimer);
  window.headlockToastTimer = setTimeout(() => toast.classList.remove("active"), 1800);
}

function formatDate(value) {
  if (!value) return "vĩnh viễn";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("vi-VN");
}

async function checkKeyOnline(key) {
  const res = await fetch(API_BASE + "/check-key", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      key,
      deviceId: getDeviceId(),
      deviceName: navigator.userAgent || "Android Device"
    })
  });

  if (!res.ok) throw new Error("Không kết nối được server.");
  return await res.json();
}

function unlockApp(message = "Đã mở khóa") {
  document.body.classList.add("unlocked");
  if (passwordScreen) passwordScreen.classList.add("hidden");
  if (mainApp) mainApp.classList.remove("locked");
  if (logoutBtn) logoutBtn.classList.remove("hidden");
  if (licenseText) licenseText.textContent = message;

  sessionStorage.setItem(STORAGE.SESSION, "true");
  setLoginMessage("ok", message);
  showToast(message);
}

function lockApp(options = {}) {
  const clearSavedKey = options.clearSavedKey === true;

  document.body.classList.remove("unlocked");
  if (passwordScreen) passwordScreen.classList.remove("hidden");
  if (mainApp) mainApp.classList.add("locked");
  if (logoutBtn) logoutBtn.classList.add("hidden");
  if (passwordInput) passwordInput.value = "";

  sessionStorage.removeItem(STORAGE.SESSION);

  // Không xóa key đã lưu khi app tự khóa do reload/mất mạng.
  // Chỉ xóa khi người dùng bấm Đăng xuất hoặc key thật sự không còn hợp lệ.
  if (clearSavedKey) {
    localStorage.removeItem(STORAGE.KEY);
  }

  setLoginMessage("", "Zalo hỗ trợ: 0333635135");
}

async function loginWithValue(value) {
  setLoginMessage("", "Đang kiểm tra key...");
  const result = await checkKeyOnline(value);

  if (result.success) {
    localStorage.setItem(STORAGE.KEY, value);
    const slotText = result.slotUsed && result.slotMax ? ` | Slot: ${result.slotUsed}/${result.slotMax}` : "";
    unlockApp("Key hết hạn: " + formatDate(result.expiresAt) + slotText);
    return;
  }

  throw new Error(result.message || "Key không hợp lệ.");
}

async function autoLogin() {
  const savedKey = localStorage.getItem(STORAGE.KEY);
  if (!savedKey) return;

  try {
    await loginWithValue(savedKey);
  } catch (error) {
    sessionStorage.removeItem(STORAGE.SESSION);
    setLoginMessage("err", error.message || "Key đã lưu không còn hợp lệ.");
  }
}

function startExpireWatcher() {
  setInterval(async () => {
    const savedKey = localStorage.getItem(STORAGE.KEY);
    if (!savedKey || sessionStorage.getItem(STORAGE.SESSION) !== "true") return;

    try {
      const result = await checkKeyOnline(savedKey);
      if (!result.success) {
        lockApp({ clearSavedKey: true });
        setLoginMessage("err", result.message || "Key không còn hợp lệ.");
      }
    } catch {
      // Mất mạng/server lỗi tạm thời: khóa màn hình nhưng vẫn giữ key để lần sau tự đăng nhập lại.
      lockApp({ clearSavedKey: false });
      setLoginMessage("err", "Không kết nối được server kiểm tra key.");
    }
  }, 60000);
}

if (passwordForm) {
  passwordForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const value = passwordInput.value.trim();

    if (!value) {
      setLoginMessage("err", "Vui lòng nhập mật khẩu hoặc key.");
      return;
    }

    try {
      await loginWithValue(value);
      passwordInput.value = "";
    } catch (error) {
      setLoginMessage("err", error.message || "Đăng nhập thất bại.");
      passwordInput.select();
      passwordForm.animate(
        [{ transform: "translateX(0)" }, { transform: "translateX(-8px)" }, { transform: "translateX(8px)" }, { transform: "translateX(0)" }],
        { duration: 260, iterations: 1 }
      );
    }
  });
}

if (togglePassword && passwordInput) {
  togglePassword.addEventListener("click", () => {
    const isPassword = passwordInput.type === "password";
    passwordInput.type = isPassword ? "text" : "password";
    togglePassword.textContent = isPassword ? "🙈" : "👁";
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    lockApp({ clearSavedKey: true });
  });
}


// ===== Đăng xuất App: popup riêng, không dùng confirm() nên không hiện file:// =====
if (appLogoutBtn) {
  appLogoutBtn.addEventListener("click", () => {
    openModal(logoutModal);
  });
}

if (logoutCancel) {
  logoutCancel.addEventListener("click", () => closeModal(logoutModal));
}

if (logoutClose) {
  logoutClose.addEventListener("click", () => closeModal(logoutModal));
}

if (sensitivityClose) {
  sensitivityClose.addEventListener("click", () => closeModal(sensitivityModal));
}

if (logoutConfirm) {
  logoutConfirm.addEventListener("click", () => {
    localStorage.removeItem(STORAGE.KEY);
    sessionStorage.removeItem(STORAGE.SESSION);

    closeModal(logoutModal);
    if (infoPanel) infoPanel.classList.remove("active");
    showToast("Đã đăng xuất");

    setTimeout(() => {
      location.reload();
    }, 500);
  });
}

if (contactBtn) contactBtn.addEventListener("click", () => window.open(CONTACT_ZALO, "_blank"));
if (getKeyBtn) getKeyBtn.addEventListener("click", () => window.open(GET_KEY_FREE_URL, "_blank"));
if (infoGetKeyBtn) infoGetKeyBtn.addEventListener("click", () => window.open(GET_KEY_FREE_URL, "_blank"));

function closeAll() {
  if (infoPanel) infoPanel.classList.remove("active");
  closeModal(boostModal);
  closeModal(speedModal);
  closeModal(crosshairModal);
  closeModal(sensitivityModal);
  closeModal(logoutModal);
  if (overlay) overlay.classList.add("hidden");
}

if (menuBtn) {
  menuBtn.addEventListener("click", () => {
    if (infoPanel) infoPanel.classList.add("active");
    if (overlay) overlay.classList.remove("hidden");
  });
}
if (closeInfo) closeInfo.addEventListener("click", closeAll);
if (overlay) overlay.addEventListener("click", closeAll);

function openModal(modal) {
  if (!modal) return;
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  if (overlay) overlay.classList.remove("hidden");
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");

  const hasOpen =
    (boostModal && !boostModal.classList.contains("hidden")) ||
    (speedModal && !speedModal.classList.contains("hidden")) ||
    (crosshairModal && !crosshairModal.classList.contains("hidden")) ||
    (sensitivityModal && !sensitivityModal.classList.contains("hidden")) ||
    (logoutModal && !logoutModal.classList.contains("hidden")) ||
    (infoPanel && infoPanel.classList.contains("active"));

  if (!hasOpen && overlay) overlay.classList.add("hidden");
}

document.querySelectorAll("[data-close]").forEach((btn) => {
  btn.addEventListener("click", () => {
    closeModal(boostModal);
    closeModal(speedModal);
    closeModal(crosshairModal);
    closeModal(sensitivityModal);
    closeModal(logoutModal);
  });
});

document.querySelectorAll(".modal").forEach((modal) => {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal(modal);
  });
});

function runBoost() {
  if (!terminal || !boostDone) return;
  terminal.textContent = "";
  boostDone.classList.add("hidden");
  openModal(boostModal);

  let index = 0;
  const timer = setInterval(() => {
    terminal.textContent += terminalLines[index] + "\n";
    index++;
    if (index >= terminalLines.length) {
      clearInterval(timer);
      setTimeout(() => boostDone.classList.remove("hidden"), 450);
    }
  }, 380);
}

document.querySelectorAll(".menu-row").forEach((btn) => {
  btn.addEventListener("click", () => {
    const feature = btn.dataset.feature;
    const name = btn.querySelector("b")?.textContent || "Tính năng";

    if (feature === "speed") {
      openModal(speedModal);
      renderSpeedUI();
      showToast("Mở SPEED");
      addHistorySafe("Đã mở SPEED", "speed");
      return;
    }

    if (feature === "crosshair") {
      btn.classList.add("active");
      openModal(crosshairModal);
      showToast("Mở chỉnh tâm ảo");
      addHistorySafe("Đã mở Crosshair", "feature");
      return;
    }

    if (feature === "boost") {
      btn.classList.add("active");
      runBoost();
      showToast("Đã bật Boost RAM");
      addHistorySafe("Đã bật Boost RAM", "boost");
      return;
    }

    if (feature === "sensitivity") {
      openModal(sensitivityModal);
      initSensitivityModule();
      showToast("Mở độ nhạy OB54");
      addHistorySafe("Đã mở Độ nhạy OB54", "feature");
      return;
    }

    if (feature === "info") {
      if (infoPanel) infoPanel.classList.add("active");
      if (overlay) overlay.classList.remove("hidden");
      addHistorySafe("Đã mở Thông Tin", "system");
      return;
    }

    btn.classList.toggle("active");
    const isActive = btn.classList.contains("active");
    showToast(isActive ? "Đã bật " + name : "Đã tắt " + name);
    addHistorySafe(`${isActive ? "Đã bật" : "Đã tắt"} ${name}`, "toggle");
  });
});


// ================= SPEED UI OPTIMIZER =================

function addHistorySafe(text, type = "feature") {
  try {
    if (window.HeadlockHistory && typeof window.HeadlockHistory.add === "function") {
      window.HeadlockHistory.add(text, type);
      return;
    }

    const key = "headlock_history";
    const items = JSON.parse(localStorage.getItem(key)) || [];
    items.unshift({
      text,
      type,
      icon: type,
      time: new Date().toLocaleString("vi-VN"),
      timestamp: Date.now()
    });
    localStorage.setItem(key, JSON.stringify(items.slice(0, 80)));
  } catch (error) {
    console.warn("Không thể lưu lịch sử:", error);
  }
}

function getSpeedEnabled() {
  return localStorage.getItem(STORAGE.SPEED_ENABLED) === "true";
}

function getSpeedLevel() {
  return localStorage.getItem(STORAGE.SPEED_LEVEL) || "smooth";
}

function getSpeedValue() {
  const value = parseInt(localStorage.getItem(STORAGE.SPEED_VALUE) || "60", 10);
  return Number.isFinite(value) ? Math.max(1, Math.min(100, value)) : 60;
}

function setSpeedLevel(level, shouldLog = true) {
  const allowed = ["smooth", "fast", "max"];
  const nextLevel = allowed.includes(level) ? level : "smooth";
  const nextValue = nextLevel === "smooth" ? 45 : nextLevel === "fast" ? 70 : 95;

  localStorage.setItem(STORAGE.SPEED_LEVEL, nextLevel);
  localStorage.setItem(STORAGE.SPEED_VALUE, String(nextValue));

  if (speedRange) speedRange.value = nextValue;
  renderSpeedUI();
  applySpeedMode();

  if (shouldLog) {
    const label = document.querySelector(`.speed-level[data-speed-level="${nextLevel}"] b`)?.textContent || nextLevel;
    addHistorySafe("Đã chọn SPEED: " + label, "⚡");
  }
}

function setSpeedEnabled(enabled, shouldLog = true) {
  localStorage.setItem(STORAGE.SPEED_ENABLED, enabled ? "true" : "false");

  renderSpeedUI();
  applySpeedMode();

  if (shouldLog) addHistorySafe(enabled ? "Đã bật SPEED" : "Đã tắt SPEED", "⚡");
  showToast(enabled ? "Đã bật SPEED" : "Đã tắt SPEED");
}

function applySpeedMode() {
  const enabled = getSpeedEnabled();
  const value = getSpeedValue();
  document.body.classList.toggle("speed-mode", enabled);

  const duration = enabled ? Math.max(0.05, 0.22 - value / 650) : 0.18;
  document.documentElement.style.setProperty("--speed-duration", duration + "s");
}

function renderSpeedUI() {
  const enabled = getSpeedEnabled();
  const level = getSpeedLevel();
  const value = getSpeedValue();

  if (speedMenuBtn) speedMenuBtn.classList.toggle("active", enabled);
  if (speedStatusBox) speedStatusBox.classList.toggle("active", enabled);
  if (speedStatusText) speedStatusText.textContent = enabled ? "Đang bật" : "Đang tắt";
  if (speedStatusIcon) speedStatusIcon.textContent = enabled ? "ON" : "OFF";
  if (speedRange) speedRange.value = value;
  if (speedMeterFill) speedMeterFill.style.width = value + "%";

  document.querySelectorAll(".speed-level").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.speedLevel === level);
  });

  const speedDefaultSetting = document.getElementById("speedDefaultSetting");
  if (speedDefaultSetting) speedDefaultSetting.classList.toggle("active", enabled);
}

document.querySelectorAll(".speed-level").forEach((btn) => {
  btn.addEventListener("click", () => {
    setSpeedLevel(btn.dataset.speedLevel);
    showToast("Đã chọn SPEED: " + (btn.querySelector("b")?.textContent || "SPEED"));
  });
});

if (speedRange) {
  speedRange.addEventListener("input", () => {
    localStorage.setItem(STORAGE.SPEED_VALUE, speedRange.value);
    renderSpeedUI();
    applySpeedMode();
  });

  speedRange.addEventListener("change", () => {
    addHistorySafe("Đã chỉnh cường độ SPEED: " + speedRange.value + "%", "⚡");
  });
}

if (speedOnBtn) speedOnBtn.addEventListener("click", () => setSpeedEnabled(true));
if (speedOffBtn) speedOffBtn.addEventListener("click", () => setSpeedEnabled(false));
if (speedClose) speedClose.addEventListener("click", () => closeModal(speedModal));

renderSpeedUI();
applySpeedMode();

// ================= REAL ANDROID CROSSHAIR =================

let currentCrosshairStyle = localStorage.getItem(STORAGE.CROSSHAIR_STYLE) || "classic";
let currentCrosshairX = parseInt(localStorage.getItem(STORAGE.CROSSHAIR_X) || "0", 10);
let currentCrosshairY = parseInt(localStorage.getItem(STORAGE.CROSSHAIR_Y) || "0", 10);
const CROSSHAIR_MOVE_STEP = 5;

function setPreviewStyle(styleName) {
  currentCrosshairStyle = styleName || "classic";
  localStorage.setItem(STORAGE.CROSSHAIR_STYLE, currentCrosshairStyle);

  document.querySelectorAll(".crosshair-style").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.style === currentCrosshairStyle);
  });

  if (crosshairDot) {
    crosshairDot.className = "crosshair-dot " + currentCrosshairStyle;
  }
}

function safeNumber(value, fallback = 0) {
  const number = parseInt(value, 10);
  return Number.isFinite(number) ? number : fallback;
}

function getInputMin(input, fallback) {
  if (!input || input.min === "") return fallback;
  return safeNumber(input.min, fallback);
}

function getInputMax(input, fallback) {
  if (!input || input.max === "") return fallback;
  return safeNumber(input.max, fallback);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function updateCrosshairPositionText() {
  if (crosshairPosText) {
    crosshairPosText.textContent = `X: ${currentCrosshairX} | Y: ${currentCrosshairY}`;
  }

  // Hiển thị vị trí trong khung preview ở tỉ lệ nhỏ để dễ nhìn, không ảnh hưởng vị trí thật trên Android.
  if (crosshairDot) {
    crosshairDot.style.setProperty("--crosshair-x", Math.round(currentCrosshairX / 3) + "px");
    crosshairDot.style.setProperty("--crosshair-y", Math.round(currentCrosshairY / 3) + "px");
  }
}

function setCrosshairPosition(x, y, shouldUpdateNative = true) {
  const minX = getInputMin(crosshairPosX, -300);
  const maxX = getInputMax(crosshairPosX, 300);
  const minY = getInputMin(crosshairPosY, -300);
  const maxY = getInputMax(crosshairPosY, 300);

  currentCrosshairX = clamp(safeNumber(x, 0), minX, maxX);
  currentCrosshairY = clamp(safeNumber(y, 0), minY, maxY);

  localStorage.setItem(STORAGE.CROSSHAIR_X, currentCrosshairX);
  localStorage.setItem(STORAGE.CROSSHAIR_Y, currentCrosshairY);

  if (crosshairPosX) crosshairPosX.value = currentCrosshairX;
  if (crosshairPosY) crosshairPosY.value = currentCrosshairY;

  updateCrosshairPositionText();

  if (shouldUpdateNative) {
    updateNativeCrosshair();
  }
}

function updateCrosshairPreview() {
  if (!crosshairDot || !crosshairSize || !crosshairColor) return;

  const size = crosshairSize.value + "px";
  const color = crosshairColor.value;

  crosshairDot.style.width = size;
  crosshairDot.style.height = size;
  crosshairDot.style.borderColor = color;
  crosshairDot.style.boxShadow = `0 0 16px ${color}`;

  let style = document.getElementById("crosshairDynamicStyle");
  if (!style) {
    style = document.createElement("style");
    style.id = "crosshairDynamicStyle";
    document.head.appendChild(style);
  }

  style.textContent = `
    .crosshair-dot::before,
    .crosshair-dot::after {
      background: ${color};
      box-shadow: 0 0 12px ${color};
    }
  `;
}

function updateNativeCrosshair() {
  if (!crosshairSize || !crosshairColor) return;

  const size = parseInt(crosshairSize.value, 10);
  const color = crosshairColor.value;

  updateCrosshairPreview();

  localStorage.setItem(STORAGE.CROSSHAIR_SIZE, size);
  localStorage.setItem(STORAGE.CROSSHAIR_COLOR, color);

  // Cập nhật size + màu. Hàm Java hiện tại nhận đúng 2 tham số: size, color.
  if (hasAndroidBridge() && typeof AndroidBridge.updateCrosshair === "function") {
    AndroidBridge.updateCrosshair(size, color);
  }

  // Cập nhật vị trí X/Y riêng để tâm ảo thật di chuyển trên màn hình.
  if (hasAndroidBridge() && typeof AndroidBridge.updateCrosshairPosition === "function") {
    AndroidBridge.updateCrosshairPosition(currentCrosshairX, currentCrosshairY);
  }

  if (hasAndroidBridge() && typeof AndroidBridge.setCrosshairStyle === "function") {
    AndroidBridge.setCrosshairStyle(currentCrosshairStyle);
  }
}

function loadCrosshair() {
  const size = localStorage.getItem(STORAGE.CROSSHAIR_SIZE);
  const color = localStorage.getItem(STORAGE.CROSSHAIR_COLOR);
  const style = localStorage.getItem(STORAGE.CROSSHAIR_STYLE) || "classic";
  const posX = localStorage.getItem(STORAGE.CROSSHAIR_X);
  const posY = localStorage.getItem(STORAGE.CROSSHAIR_Y);

  if (size && crosshairSize) crosshairSize.value = size;
  if (color && crosshairColor) crosshairColor.value = color;

  currentCrosshairX = safeNumber(posX, 0);
  currentCrosshairY = safeNumber(posY, 0);
  if (crosshairPosX) crosshairPosX.value = currentCrosshairX;
  if (crosshairPosY) crosshairPosY.value = currentCrosshairY;
  updateCrosshairPositionText();

  setPreviewStyle(style);
  updateNativeCrosshair();
}

document.querySelectorAll(".crosshair-style").forEach((btn) => {
  btn.addEventListener("click", () => {
    setPreviewStyle(btn.dataset.style);
    updateNativeCrosshair();
  });
});

if (crosshairSize) crosshairSize.addEventListener("input", updateNativeCrosshair);
if (crosshairColor) crosshairColor.addEventListener("input", updateNativeCrosshair);

if (crosshairPosX) {
  crosshairPosX.addEventListener("input", () => {
    setCrosshairPosition(crosshairPosX.value, currentCrosshairY);
  });
}

if (crosshairPosY) {
  crosshairPosY.addEventListener("input", () => {
    setCrosshairPosition(currentCrosshairX, crosshairPosY.value);
  });
}

if (crosshairMoveUp) {
  crosshairMoveUp.addEventListener("click", () => {
    setCrosshairPosition(currentCrosshairX, currentCrosshairY - CROSSHAIR_MOVE_STEP);
  });
}

if (crosshairMoveDown) {
  crosshairMoveDown.addEventListener("click", () => {
    setCrosshairPosition(currentCrosshairX, currentCrosshairY + CROSSHAIR_MOVE_STEP);
  });
}

if (crosshairMoveLeft) {
  crosshairMoveLeft.addEventListener("click", () => {
    setCrosshairPosition(currentCrosshairX - CROSSHAIR_MOVE_STEP, currentCrosshairY);
  });
}

if (crosshairMoveRight) {
  crosshairMoveRight.addEventListener("click", () => {
    setCrosshairPosition(currentCrosshairX + CROSSHAIR_MOVE_STEP, currentCrosshairY);
  });
}

if (crosshairResetPos) {
  crosshairResetPos.addEventListener("click", () => {
    setCrosshairPosition(0, 0);
    showToast("Đã đưa tâm ảo về giữa màn hình");
  });
}

if (crosshairOnBtn) {
  crosshairOnBtn.addEventListener("click", () => {
    updateNativeCrosshair();

    if (hasAndroidBridge() && typeof AndroidBridge.startCrosshair === "function") {
      AndroidBridge.startCrosshair();
      showToast("Đã bật tâm ảo");
    } else {
      showToast("Chỉ hoạt động trong app Android");
    }

    addHistorySafe("Đã bật Crosshair", "toggle");
  });
}

if (crosshairOffBtn) {
  crosshairOffBtn.addEventListener("click", () => {
    if (hasAndroidBridge() && typeof AndroidBridge.stopCrosshair === "function") {
      AndroidBridge.stopCrosshair();
      showToast("Đã tắt tâm ảo");
    } else {
      showToast("Đã tắt tâm ảo");
    }

    addHistorySafe("Đã tắt Crosshair", "toggle");
  });
}


// ================= OB54 FREE FIRE SENSITIVITY =================

const SENSITIVITY_PRESETS = {
  drag: { label: "KÉO TÂM", add: [0, 0, 0, 0, 0, 0] },
  onetap: { label: "ONE TAP", add: [-6, -4, -5, -6, 4, -8] },
  headshot: { label: "HEADSHOT", add: [4, 3, 2, 0, -2, 2] },
  rank: { label: "RANK", add: [-2, -2, -3, -4, 3, -4] },
  lowfps: { label: "FPS THẤP", add: [-10, -8, -9, -10, 6, -8] },
  highfps: { label: "FPS CAO", add: [6, 5, 4, 3, -3, 5] }
};

const SENSITIVITY_LABELS = ["Tổng quan", "Red Dot", "2X Scope", "4X Scope", "AWM Scope", "Free Look"];

const SENSITIVITY_DATA = {
  Samsung: {
    tier: "Android • Samsung",
    models: [
      ["Galaxy A05", [185,178,168,156,42,70], "Phổ thông"], ["Galaxy A05s", [188,180,170,158,42,70], "Phổ thông"],
      ["Galaxy A06", [188,181,171,158,42,70], "Phổ thông"], ["Galaxy A13", [190,182,172,160,40,70], "Phổ biến"],
      ["Galaxy A14", [192,184,174,162,40,72], "Phổ biến"], ["Galaxy A15", [194,185,176,164,39,72], "Phổ biến"],
      ["Galaxy A16", [195,186,176,165,39,72], "Phổ biến"], ["Galaxy A24", [196,187,177,165,38,72], "Tầm trung"],
      ["Galaxy A25 5G", [197,187,178,166,38,72], "Tầm trung"], ["Galaxy A34 5G", [198,188,178,166,38,73], "Tầm trung"],
      ["Galaxy A35 5G", [198,188,179,166,38,73], "Tầm trung"], ["Galaxy A54 5G", [198,187,176,163,38,72], "Khuyên dùng"],
      ["Galaxy A55 5G", [198,187,176,163,38,72], "Khuyên dùng"], ["Galaxy M14", [193,184,174,162,40,71], "Pin trâu"],
      ["Galaxy M34", [196,186,176,164,39,72], "Pin trâu"], ["Galaxy S21 FE", [200,190,181,170,35,74], "Cao cấp"],
      ["Galaxy S22", [200,191,182,171,34,75], "Cao cấp"], ["Galaxy S23", [200,192,184,172,33,76], "Cao cấp"],
      ["Galaxy S24", [200,193,185,174,32,76], "Cao cấp"]
    ]
  },
  Xiaomi: {
    tier: "Android • Xiaomi/Redmi/POCO",
    models: [
      ["Redmi 10", [190,182,172,160,40,70], "Phổ thông"], ["Redmi 12", [192,184,174,162,40,71], "Phổ biến"],
      ["Redmi 13", [193,185,175,163,39,72], "Phổ biến"], ["Redmi Note 10", [195,186,176,164,39,72], "Phổ biến"],
      ["Redmi Note 11", [196,187,177,165,38,72], "Phổ biến"], ["Redmi Note 12", [198,188,178,166,38,73], "Khuyên dùng"],
      ["Redmi Note 13", [198,189,179,167,37,73], "Khuyên dùng"], ["Redmi Note 14", [199,190,180,168,37,74], "Mới"],
      ["POCO X3", [198,188,178,166,38,73], "Gaming"], ["POCO X5", [199,190,181,169,36,74], "Gaming"],
      ["POCO X6", [200,191,182,170,35,75], "Gaming"], ["POCO F3", [200,191,182,171,34,75], "Gaming"],
      ["POCO F4", [200,192,183,171,34,75], "Gaming"], ["POCO F5", [200,193,184,173,33,76], "Gaming"],
      ["POCO F6", [200,194,185,174,32,76], "Gaming"], ["Mi 11", [200,191,182,171,34,75], "Cao cấp"],
      ["Mi 12", [200,192,183,172,34,75], "Cao cấp"], ["Mi 13", [200,193,184,173,33,76], "Cao cấp"],
      ["Xiaomi 14", [200,194,185,175,32,77], "Cao cấp"]
    ]
  },
  OPPO: {
    tier: "Android • OPPO",
    models: [
      ["OPPO A17", [188,180,170,158,42,70], "Phổ thông"], ["OPPO A18", [190,182,172,160,41,70], "Phổ thông"],
      ["OPPO A38", [192,184,174,162,40,71], "Phổ biến"], ["OPPO A58", [194,185,175,163,39,72], "Phổ biến"],
      ["OPPO A60", [195,186,176,164,39,72], "Phổ biến"], ["OPPO A78", [196,187,177,165,38,73], "Tầm trung"],
      ["OPPO A79", [197,188,178,166,38,73], "Tầm trung"], ["Reno 8", [198,189,179,167,37,74], "Reno"],
      ["Reno 9", [198,190,180,168,36,74], "Reno"], ["Reno 10", [199,190,181,169,36,75], "Reno"],
      ["Reno 11", [199,191,182,170,35,75], "Reno"], ["Reno 12", [200,192,183,171,34,75], "Reno"],
      ["Find X5", [200,192,183,172,34,76], "Cao cấp"], ["Find X6", [200,193,184,173,33,76], "Cao cấp"],
      ["Find X7", [200,194,185,174,32,77], "Cao cấp"]
    ]
  },
  Realme: {
    tier: "Android • Realme",
    models: [
      ["Realme C33", [186,178,168,156,43,69], "Phổ thông"], ["Realme C35", [188,180,170,158,42,70], "Phổ thông"],
      ["Realme C51", [190,182,172,160,41,70], "Phổ thông"], ["Realme C53", [192,184,174,162,40,71], "Phổ biến"],
      ["Realme C55", [194,185,175,163,39,72], "Phổ biến"], ["Realme C65", [195,186,176,164,39,72], "Phổ biến"],
      ["Narzo 50", [196,187,177,165,38,73], "Narzo"], ["Narzo 60", [197,188,178,166,38,73], "Narzo"],
      ["Narzo 70", [198,189,179,167,37,74], "Narzo"], ["Realme 9", [196,187,177,165,38,73], "Tầm trung"],
      ["Realme 10", [197,188,178,166,38,73], "Tầm trung"], ["Realme 11", [198,189,179,167,37,74], "Tầm trung"],
      ["Realme 12", [199,190,181,169,36,75], "Tầm trung"], ["GT Neo 3", [200,191,182,170,35,75], "Gaming"],
      ["GT Neo 5", [200,193,184,173,33,76], "Gaming"], ["Realme GT 6", [200,194,185,174,32,77], "Gaming"]
    ]
  },
  Vivo: {
    tier: "Android • Vivo/iQOO",
    models: [
      ["Vivo Y16", [186,178,168,156,43,69], "Phổ thông"], ["Vivo Y17", [188,180,170,158,42,70], "Phổ thông"],
      ["Vivo Y22", [190,182,172,160,41,70], "Phổ biến"], ["Vivo Y27", [192,184,174,162,40,71], "Phổ biến"],
      ["Vivo Y28", [193,185,175,163,40,71], "Phổ biến"], ["Vivo Y36", [195,186,176,164,39,72], "Tầm trung"],
      ["Vivo Y38", [196,187,177,165,38,73], "Tầm trung"], ["Vivo V25", [197,188,178,166,38,73], "V series"],
      ["Vivo V27", [198,189,179,167,37,74], "V series"], ["Vivo V29", [199,190,181,169,36,75], "V series"],
      ["Vivo V30", [199,191,182,170,35,75], "V series"], ["Vivo V40", [200,192,183,171,34,76], "V series"],
      ["iQOO Z7", [198,190,181,169,36,75], "Gaming"], ["iQOO Neo 7", [200,192,183,172,34,76], "Gaming"],
      ["iQOO Neo 9", [200,194,185,174,32,77], "Gaming"]
    ]
  },
  iPhone: {
    tier: "iOS • iPhone",
    models: [
      ["iPhone 8 Plus", [185,178,166,154,43,68], "Cũ"], ["iPhone X", [188,180,168,156,42,69], "Cũ"],
      ["iPhone XR", [190,182,170,158,41,70], "Phổ biến"], ["iPhone XS Max", [191,183,172,160,40,71], "Phổ biến"],
      ["iPhone 11", [193,185,174,162,39,72], "Phổ biến"], ["iPhone 11 Pro Max", [195,187,176,164,38,73], "Phổ biến"],
      ["iPhone 12", [197,188,178,166,37,73], "Khuyên dùng"], ["iPhone 12 Pro Max", [198,189,179,167,36,74], "Khuyên dùng"],
      ["iPhone 13", [199,190,181,169,35,75], "Khuyên dùng"], ["iPhone 13 Pro Max", [200,191,182,170,34,75], "Khuyên dùng"],
      ["iPhone 14", [200,192,183,171,34,76], "Mạnh"], ["iPhone 14 Pro Max", [200,193,184,172,33,76], "Mạnh"],
      ["iPhone 15", [200,193,184,173,33,77], "Mạnh"], ["iPhone 15 Pro Max", [200,194,185,174,32,77], "Mạnh"],
      ["iPhone 16", [200,194,185,174,32,78], "Mới"], ["iPhone 16 Pro Max", [200,195,186,175,31,78], "Mới"]
    ]
  },
  Infinix: {
    tier: "Android • Infinix",
    models: [
      ["Infinix Hot 12", [188,180,170,158,42,70], "Phổ thông"], ["Infinix Hot 20", [190,182,172,160,41,70], "Phổ thông"],
      ["Infinix Hot 30", [192,184,174,162,40,71], "Phổ biến"], ["Infinix Hot 40", [194,185,175,163,39,72], "Phổ biến"],
      ["Infinix Note 12", [193,184,174,162,40,71], "Note"], ["Infinix Note 30", [196,187,177,165,38,73], "Note"],
      ["Infinix GT10 Pro", [199,190,181,169,36,75], "Gaming"], ["Infinix GT20 Pro", [200,192,183,172,34,76], "Gaming"]
    ]
  },
  Tecno: {
    tier: "Android • Tecno",
    models: [
      ["Tecno Spark Go", [186,178,168,156,43,69], "Phổ thông"], ["Tecno Spark 10", [188,180,170,158,42,70], "Phổ thông"],
      ["Tecno Spark 20", [192,184,174,162,40,71], "Phổ biến"], ["Tecno Camon 20", [194,185,175,163,39,72], "Camon"],
      ["Tecno Camon 30", [196,187,177,165,38,73], "Camon"], ["Tecno Pova 5", [198,188,178,166,38,73], "Gaming"],
      ["Tecno Pova 6", [199,190,181,169,36,75], "Gaming"]
    ]
  }
};

let selectedSensitivityBrand = localStorage.getItem("sensitivity_brand") || "Samsung";
let selectedSensitivityModel = localStorage.getItem("sensitivity_model") || "Galaxy A55 5G";
let selectedSensitivityPreset = localStorage.getItem("sensitivity_preset") || "drag";
let sensitivityReady = false;

function getSensitivityModels() {
  return SENSITIVITY_DATA[selectedSensitivityBrand]?.models || [];
}

function getCurrentSensitivityModel() {
  const models = getSensitivityModels();
  return models.find((item) => item[0] === selectedSensitivityModel) || models[0];
}

function clampSensitivity(value) {
  return Math.max(0, Math.min(200, Math.round(value)));
}

function getCurrentSensitivityValues() {
  const model = getCurrentSensitivityModel();
  const base = model ? model[1] : [198, 187, 176, 163, 38, 72];
  const preset = SENSITIVITY_PRESETS[selectedSensitivityPreset] || SENSITIVITY_PRESETS.drag;
  return base.map((value, index) => clampSensitivity(value + (preset.add[index] || 0)));
}

function renderSensitivityBrands() {
  if (!sensitivityBrandGrid) return;
  sensitivityBrandGrid.innerHTML = Object.keys(SENSITIVITY_DATA).map((brand) => `
    <button type="button" class="sensitivity-chip ${brand === selectedSensitivityBrand ? "active" : ""}" data-brand="${brand}">${brand.toUpperCase()}</button>
  `).join("");

  sensitivityBrandGrid.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedSensitivityBrand = btn.dataset.brand;
      const first = SENSITIVITY_DATA[selectedSensitivityBrand].models[0];
      selectedSensitivityModel = first[0];
      if (sensitivitySearch) sensitivitySearch.value = "";
      localStorage.setItem("sensitivity_brand", selectedSensitivityBrand);
      localStorage.setItem("sensitivity_model", selectedSensitivityModel);
      renderSensitivityModule();
    });
  });
}

function renderSensitivityModels() {
  if (!sensitivityModelList) return;
  const keyword = (sensitivitySearch?.value || "").trim().toLowerCase();
  const models = getSensitivityModels().filter((item) => item[0].toLowerCase().includes(keyword));

  sensitivityModelList.innerHTML = models.map((item) => `
    <button type="button" class="sensitivity-model ${item[0] === selectedSensitivityModel ? "active" : ""}" data-model="${item[0]}">
      <span>${item[0]}</span>
      <small>${item[2] || "OB54"}</small>
    </button>
  `).join("") || `<div class="sensitivity-empty">Không tìm thấy model.</div>`;

  sensitivityModelList.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedSensitivityModel = btn.dataset.model;
      localStorage.setItem("sensitivity_model", selectedSensitivityModel);
      renderSensitivityModule();
    });
  });
}

function renderSensitivityPresets() {
  if (!sensitivityPresetGrid) return;
  sensitivityPresetGrid.innerHTML = Object.entries(SENSITIVITY_PRESETS).map(([key, preset]) => `
    <button type="button" class="sensitivity-preset ${key === selectedSensitivityPreset ? "active" : ""}" data-preset="${key}">${preset.label}</button>
  `).join("");

  sensitivityPresetGrid.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedSensitivityPreset = btn.dataset.preset;
      localStorage.setItem("sensitivity_preset", selectedSensitivityPreset);
      renderSensitivityModule();
    });
  });
}

function renderSensitivityValues() {
  if (!sensitivityValues) return;
  const values = getCurrentSensitivityValues();
  sensitivityValues.innerHTML = values.map((value, index) => `
    <div class="sensitivity-value-row">
      <span>${SENSITIVITY_LABELS[index]}</span>
      <b>${value}</b>
      <input type="range" min="0" max="200" value="${value}" disabled>
    </div>
  `).join("");
}

function renderSensitivityHeader() {
  const model = getCurrentSensitivityModel();
  if (!model) return;
  if (sensitivityDeviceName) sensitivityDeviceName.textContent = `${selectedSensitivityBrand} ${model[0]}`;
  if (sensitivityDeviceInfo) sensitivityDeviceInfo.textContent = `${SENSITIVITY_DATA[selectedSensitivityBrand].tier} • ${model[2] || "OB54"}`;
  if (sensitivityNote) sensitivityNote.textContent = `Độ nhạy OB54 tối ưu cho ${selectedSensitivityBrand} ${model[0]}. Có thể chỉnh nhẹ theo DPI và thói quen kéo tâm.`;
}

function renderSensitivityModule() {
  renderSensitivityBrands();
  renderSensitivityModels();
  renderSensitivityPresets();
  renderSensitivityValues();
  renderSensitivityHeader();
}

function initSensitivityModule() {
  if (!SENSITIVITY_DATA[selectedSensitivityBrand]) selectedSensitivityBrand = "Samsung";
  if (!getCurrentSensitivityModel()) selectedSensitivityModel = getSensitivityModels()[0]?.[0] || "Galaxy A55 5G";

  if (!sensitivityReady && sensitivitySearch) {
    sensitivitySearch.addEventListener("input", renderSensitivityModels);
    sensitivityReady = true;
  }

  renderSensitivityModule();
}


// ================= LIVE DASHBOARD STATS =================

const statOnline = document.getElementById("statOnline");
const statActiveKeys = document.getElementById("statActiveKeys");
const statToday = document.getElementById("statToday");
const statServer = document.getElementById("statServer");
const statUpdated = document.getElementById("statUpdated");
const refreshStatsBtn = document.getElementById("refreshStatsBtn");

function setStat(el, value) {
  if (el) el.textContent = value ?? "--";
}

async function loadStats() {
  try {
    setStat(statServer, "...");
    const res = await fetch(API_BASE + "/stats", { method: "GET" });
    if (!res.ok) throw new Error("Stats API lỗi");

    const data = await res.json();

    setStat(statOnline, data.online ?? 0);
    setStat(statActiveKeys, data.activeKeys ?? 0);
    setStat(statToday, data.today ?? 0);
    setStat(statServer, data.server || "Online");

    if (statUpdated) {
      const now = new Date();
      statUpdated.textContent = "Cập nhật: " + now.toLocaleTimeString("vi-VN");
    }
  } catch (error) {
    setStat(statServer, "Offline");
    if (statUpdated) statUpdated.textContent = "Không đồng bộ được thống kê.";
  }
}

if (refreshStatsBtn) {
  refreshStatsBtn.addEventListener("click", () => {
    loadStats();
    showToast("Đang tải thống kê...");
  });
}

setInterval(loadStats, 30000);



async function startHeadlockApp() {
  const canStart = await loadRemoteSettings();

  if (!canStart) return;

  renderSpeedUI();
  applySpeedMode();
  loadCrosshair();
  loadStats();
  startExpireWatcher();
  autoLogin();
}


if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startHeadlockApp);
} else {
  startHeadlockApp();
}

// ================= BOTTOM NAV: HOME / HISTORY / SETTINGS =================
(function initBottomNavigation() {
  const bottomNav = document.getElementById("bottomNav");
  if (!bottomNav) return;

  const navButtons = Array.from(bottomNav.querySelectorAll("button[data-tab]"));
  const historyPage = document.getElementById("historyPage");
  const settingsPage = document.getElementById("settingsPage");
  const historyList = document.getElementById("historyList");
  const clearHistoryBtn = document.getElementById("clearHistoryBtn");
  const refreshHistoryBtn = document.getElementById("refreshHistoryBtn");
  const historyExportBtn = document.getElementById("historyExportBtn");
  const historySearchInput = document.getElementById("historySearchInput");
  const historyTotalCount = document.getElementById("historyTotalCount");
  const historyTodayCount = document.getElementById("historyTodayCount");
  const historyLatestTime = document.getElementById("historyLatestTime");
  const settingsLogoutBtn = document.getElementById("settingsLogoutBtn");

  const homeSections = [
    document.querySelector(".hero-card"),
    document.getElementById("statsCard"),
    document.querySelector(".simple-menu"),
    document.querySelector(".security-box")
  ].filter(Boolean);

  const HISTORY_KEY = "headlock_history";
  const APP_SETTINGS_KEY = "headlock_app_settings";
  const ACTIVE_TAB_KEY = "headlock_active_tab";

  const DEFAULT_SETTINGS = {
    sound: true,
    vibrate: true,
    saveTab: true,
    compactMode: false,
    speedDefault: false
  };

  const validTabs = ["home", "history", "settings"];
  let currentHistoryFilter = "all";

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getAppSettings() {
    try {
      return { ...DEFAULT_SETTINGS, ...(JSON.parse(localStorage.getItem(APP_SETTINGS_KEY)) || {}) };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  function saveAppSettings(settings) {
    localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify({ ...DEFAULT_SETTINGS, ...settings }));
  }

  function normalizeHistoryItem(item) {
    const raw = item && typeof item === "object" ? item : {};
    const text = String(raw.text || raw.title || "Hoạt động");
    const time = String(raw.time || new Date(raw.timestamp || Date.now()).toLocaleString("vi-VN"));
    const timestamp = Number(raw.timestamp) || Date.parse(time) || Date.now();
    const type = normalizeHistoryType(raw.type || raw.icon || text);

    return {
      text,
      time,
      timestamp,
      type,
      icon: getIconByType(type, raw.icon)
    };
  }

  function normalizeHistoryType(value) {
    const raw = String(value || "").toLowerCase();
    if (raw.includes("speed")) return "speed";
    if (raw.includes("boost") || raw.includes("🚀")) return "boost";
    if (raw.includes("bật") || raw.includes("tắt") || raw.includes("toggle")) return "toggle";
    if (raw.includes("cài") || raw.includes("setting") || raw.includes("⚙")) return "settings";
    if (raw.includes("trang chủ") || raw.includes("lịch sử") || raw.includes("thông tin") || raw.includes("system") || raw.includes("⌂") || raw.includes("◴")) return "system";
    return "feature";
  }

  function getIconByType(type, fallback) {
    const fallbackText = String(fallback || "");
    if (["⚡", "🚀", "◎", "⚙", "⌂", "◴", "🚪"].includes(fallbackText)) return fallbackText;
    if (type === "speed") return "⚡";
    if (type === "boost") return "🚀";
    if (type === "toggle") return "⚡";
    if (type === "settings") return "⚙";
    if (type === "system") return "⌂";
    return "◷";
  }

  function getTagByType(type) {
    if (type === "speed") return "SPEED";
    if (type === "boost") return "BOOST";
    if (type === "toggle") return "BẬT/TẮT";
    if (type === "settings") return "CÀI ĐẶT";
    if (type === "system") return "HỆ THỐNG";
    return "TÍNH NĂNG";
  }

  function getHistoryItems() {
    try {
      const items = JSON.parse(localStorage.getItem(HISTORY_KEY));
      return Array.isArray(items) ? items.map(normalizeHistoryItem) : [];
    } catch {
      return [];
    }
  }

  function saveHistoryItems(items) {
    const normalized = items.map(normalizeHistoryItem).slice(0, 80);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(normalized));
  }

  function sameVietnamDay(timestamp) {
    const date = new Date(timestamp || Date.now());
    const now = new Date();
    return date.toLocaleDateString("vi-VN") === now.toLocaleDateString("vi-VN");
  }

  function getFilteredHistoryItems() {
    const keyword = (historySearchInput?.value || "").trim().toLowerCase();
    return getHistoryItems().filter((item) => {
      const matchFilter =
        currentHistoryFilter === "all" ||
        item.type === currentHistoryFilter ||
        (currentHistoryFilter === "feature" && ["speed", "boost"].includes(item.type));

      const matchSearch =
        !keyword ||
        item.text.toLowerCase().includes(keyword) ||
        item.time.toLowerCase().includes(keyword) ||
        getTagByType(item.type).toLowerCase().includes(keyword);

      return matchFilter && matchSearch;
    });
  }

  function updateHistoryStats(items) {
    const total = items.length;
    const today = items.filter((item) => sameVietnamDay(item.timestamp)).length;
    const latest = items[0] || null;

    if (historyTotalCount) historyTotalCount.textContent = String(total);
    if (historyTodayCount) historyTodayCount.textContent = String(today);
    if (historyLatestTime) historyLatestTime.textContent = latest ? latest.text : "Chưa có";
  }

  function addHistory(text, type = "feature") {
    const items = getHistoryItems();
    items.unshift({
      text,
      type: normalizeHistoryType(type || text),
      time: new Date().toLocaleTimeString("vi-VN") + " " + new Date().toLocaleDateString("vi-VN"),
      timestamp: Date.now()
    });
    saveHistoryItems(items);
    renderHistory();
  }

  window.HeadlockHistory = {
    add: addHistory,
    render: renderHistory,
    get: getHistoryItems
  };

  function renderHistory() {
    if (!historyList) return;

    const allItems = getHistoryItems();
    const items = getFilteredHistoryItems();
    updateHistoryStats(allItems);

    if (!items.length) {
      historyList.innerHTML = `
        <div class="history-empty">
          <strong>Chưa có lịch sử phù hợp.</strong>
          <span>Hãy thử đổi bộ lọc hoặc tìm từ khóa khác.</span>
        </div>`;
      return;
    }

    historyList.innerHTML = items.map((item) => `
      <div class="history-item" data-type="${escapeHTML(item.type)}">
        <div class="history-dot">${escapeHTML(item.icon)}</div>
        <div class="history-info">
          <b>${escapeHTML(item.text)}</b>
          <div class="history-meta">
            <small>${escapeHTML(item.time)}</small>
            <span class="history-tag">${escapeHTML(getTagByType(item.type))}</span>
          </div>
        </div>
      </div>
    `).join("");
  }

  function applyCompactMode() {
    const settings = getAppSettings();
    document.body.classList.toggle("compact-mode", !!settings.compactMode);
  }

  function renderSettings() {
    const settings = getAppSettings();
    document.querySelectorAll(".setting-row[data-setting]").forEach((row) => {
      const key = row.dataset.setting;
      if (key === "speedDefault" && typeof getSpeedEnabled === "function") {
        row.classList.toggle("active", getSpeedEnabled());
      } else {
        row.classList.toggle("active", !!settings[key]);
      }
    });
    applyCompactMode();
  }

  function playTapSound() {
    const settings = getAppSettings();
    if (!settings.sound) return;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = 720;
      gain.gain.setValueAtTime(0.035, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.08);
    } catch {
      // Bỏ qua nếu WebView chặn audio.
    }
  }

  function vibrateTap() {
    const settings = getAppSettings();
    if (settings.vibrate && navigator.vibrate) navigator.vibrate(25);
  }

  function openTab(tab, shouldLog = true) {
    const targetTab = validTabs.includes(tab) ? tab : "home";

    homeSections.forEach((section) => {
      section.style.display = targetTab === "home" ? "" : "none";
    });

    if (historyPage) historyPage.classList.toggle("hidden", targetTab !== "history");
    if (settingsPage) settingsPage.classList.toggle("hidden", targetTab !== "settings");

    navButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.tab === targetTab);
    });

    const settings = getAppSettings();
    if (settings.saveTab) localStorage.setItem(ACTIVE_TAB_KEY, targetTab);

    if (targetTab === "history") renderHistory();
    if (targetTab === "settings") renderSettings();

    if (shouldLog) {
      if (targetTab === "history") addHistory("Đã mở mục Lịch sử", "system");
      if (targetTab === "settings") addHistory("Đã mở mục Cài đặt", "settings");
      if (targetTab === "home") addHistory("Đã quay về Trang chủ", "system");
    }
  }

  navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      playTapSound();
      vibrateTap();
      openTab(button.dataset.tab);
    });
  });

  document.querySelectorAll(".setting-row[data-setting]").forEach((row) => {
    row.addEventListener("click", () => {
      const key = row.dataset.setting;
      const label = row.querySelector("b")?.textContent || "Cài đặt";
      const settings = getAppSettings();

      if (key === "speedDefault" && typeof getSpeedEnabled === "function") {
        settings[key] = !getSpeedEnabled();
      } else {
        settings[key] = !settings[key];
      }
      saveAppSettings(settings);

      if (key === "speedDefault" && typeof setSpeedEnabled === "function") {
        setSpeedEnabled(settings[key], false);
      }

      if (key === "saveTab" && !settings[key]) localStorage.removeItem(ACTIVE_TAB_KEY);

      renderSettings();
      playTapSound();
      vibrateTap();
      addHistory(`Đã ${settings[key] ? "bật" : "tắt"} ${label}`, "settings");
      if (typeof showToast === "function") showToast(`${settings[key] ? "Đã bật" : "Đã tắt"} ${label}`);
    });
  });

  document.querySelectorAll("[data-history-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      currentHistoryFilter = button.dataset.historyFilter || "all";
      document.querySelectorAll("[data-history-filter]").forEach((item) => {
        item.classList.toggle("active", item === button);
      });
      playTapSound();
      vibrateTap();
      renderHistory();
    });
  });

  if (historySearchInput) {
    historySearchInput.addEventListener("input", renderHistory);
  }

  if (historyExportBtn) {
    historyExportBtn.addEventListener("click", async () => {
      const items = getHistoryItems();
      if (!items.length) {
        if (typeof showToast === "function") showToast("Chưa có lịch sử để sao chép");
        return;
      }

      const text = items.map((item) => `[${item.time}] ${item.text}`).join("\n");
      try {
        await navigator.clipboard.writeText(text);
        if (typeof showToast === "function") showToast("Đã sao chép lịch sử");
      } catch {
        if (typeof showToast === "function") showToast("Không thể sao chép trên thiết bị này");
      }
      playTapSound();
      vibrateTap();
    });
  }

  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener("click", () => {
      localStorage.removeItem(HISTORY_KEY);
      renderHistory();
      playTapSound();
      vibrateTap();
      if (typeof showToast === "function") showToast("Đã xóa lịch sử");
    });
  }

  if (refreshHistoryBtn) {
    refreshHistoryBtn.addEventListener("click", () => {
      renderHistory();
      playTapSound();
      vibrateTap();
      if (typeof showToast === "function") showToast("Đã làm mới lịch sử");
    });
  }

  if (settingsLogoutBtn) {
    settingsLogoutBtn.addEventListener("click", () => {
      playTapSound();
      vibrateTap();
      addHistory("Đã bấm Đăng xuất trong Cài đặt", "settings");

      const appLogoutButton = document.getElementById("appLogoutBtn");
      if (appLogoutButton) {
        appLogoutButton.click();
        return;
      }

      const logoutModalEl = document.getElementById("logoutModal");
      const overlayEl = document.getElementById("overlay");
      if (logoutModalEl) logoutModalEl.classList.remove("hidden");
      if (overlayEl) overlayEl.classList.remove("hidden");
    });
  }

  renderHistory();
  renderSettings();

  const savedTab = localStorage.getItem(ACTIVE_TAB_KEY);
  openTab(savedTab || "home", false);
})();
