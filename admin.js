const API_BASE_URL = String(window.AIMLOCK_API_BASE_URL || "").trim().replace(/\/+$/, "");
const IS_GITHUB_PAGES = /github\.io$/i.test(location.hostname);
const STATIC_PREVIEW_MODE = IS_GITHUB_PAGES && !API_BASE_URL;
const MAX_SETTINGS_PAYLOAD_BYTES = 900 * 1024; // 900 KB, thấp hơn giới hạn server để tránh lỗi 413.

const loginBox = document.getElementById("loginBox");
const adminContent = document.getElementById("adminContent");
const adminPassword = document.getElementById("adminPassword");
const adminLoginBtn = document.getElementById("adminLoginBtn");
const loginStatus = document.getElementById("loginStatus");

const statOnline = document.getElementById("statOnline");
const statActive = document.getElementById("statActive");
const statToday = document.getElementById("statToday");
const statRailway = document.getElementById("statRailway");

const adminLogoutTop = document.getElementById("adminLogoutTop");

const settingsFields = {
  freeKeyUrl: document.getElementById("settingFreeKeyUrl"),
  zaloUrl: document.getElementById("settingZaloUrl"),
  boostLinkUrl: document.getElementById("settingBoostUrl"),
  currentVersion: document.getElementById("settingCurrentVersion"),
  latestVersion: document.getElementById("settingLatestVersion"),
  minVersion: document.getElementById("settingMinVersion"),
  forceUpdate: document.getElementById("settingForceUpdate"),
  maintenance: document.getElementById("settingMaintenance"),
  forceTitle: document.getElementById("settingForceTitle"),
  forceMessage: document.getElementById("settingForceMessage"),
  maintenanceTitle: document.getElementById("settingMaintenanceTitle"),
  maintenanceMessage: document.getElementById("settingMaintenanceMessage"),
  updateVersion: document.getElementById("settingUpdateVersion"),
  updateTitle: document.getElementById("settingUpdateTitle"),
  updateLabel: document.getElementById("settingUpdateLabel"),
  updateHeadline: document.getElementById("settingUpdateHeadline"),
  updateSummary: document.getElementById("settingUpdateSummary"),
  updateTimeLabel: document.getElementById("settingUpdateTimeLabel"),
  updateItemsJson: document.getElementById("settingUpdateItemsJson")
};
const saveSettingsBtn = document.getElementById("saveSettingsBtn");
const loadSettingsBtn = document.getElementById("loadSettingsBtn");
const previewSettingsBtn = document.getElementById("previewSettingsBtn");
const settingsStatus = document.getElementById("settingsStatus");

let adminPass = localStorage.getItem("aimlockAdminPassword") || "";
let selectedDeviceKey = "";
let editingKeyStatus = "active";

function apiUrl(path) {
  const cleanPath = String(path || "").startsWith("/") ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${cleanPath}` : cleanPath;
}

function headers() {
  return {
    "Content-Type": "application/json",
    "x-admin-password": adminPass
  };
}

async function fetchJson(path, options = {}) {
  const response = await fetch(apiUrl(path), options);
  const text = await response.text();
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    const shortText = text.replace(/\s+/g, " ").slice(0, 160);
    throw new Error(`API chưa chạy đúng hoặc sai domain. ${apiUrl(path)} trả HTML/Text thay vì JSON. Nội dung: ${shortText}`);
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch (_) {
    throw new Error("API trả dữ liệu lỗi, không đọc được JSON.");
  }

  if (!response.ok) {
    if (response.status === 413) {
      throw new Error(
        data?.message ||
        "Dữ liệu gửi lên quá lớn (HTTP 413). Hãy kiểm tra phần JSON cập nhật."
      );
    }

    throw new Error(
      data?.message || `API lỗi HTTP ${response.status}: ${response.statusText || "Không xác định"}`
    );
  }

  return data;
}





function defaultSettings() {
  return {
    freeKeyUrl: "https://link4m.net/GhYJFCIl",
    zaloUrl: "https://zalo.me/0333635135",
    boostLinkUrl: "https://boostylink.com/Kt8rStah",
    currentVersion: "1",
    latestVersion: "1",
    minVersion: "1",
    forceUpdate: false,
    maintenance: false,
    forceTitle: "CẦN CẬP NHẬT APP V1",
    forceMessage: "Phiên bản bạn đang dùng đã cũ. Vui lòng tải bản mới để tiếp tục.",
    maintenanceTitle: "APP ĐANG NÂNG CẤP",
    maintenanceMessage: "20h00 SẼ CẬP NHẬT XONG ANH EM NHÉ<br>Vui lòng quay lại sau.",
    updateVersion: "V1",
    updateTitle: "AIMLOCK JAME",
    updateLabel: "BẢN CẬP NHẬT",
    updateHeadline: "Phiên bản 1 chính thức",
    updateSummary: "Admin có thể sửa nội dung cập nhật trực tiếp trong Settings.",
    updateTimeLabel: "Vừa cập nhật",
    updateItemsJson: JSON.stringify([
      { badge: "NEW", title: "NEW AIMLOCK MỚI", description: "Thêm tính năng AIMLOCK mới cho anh em." },
      { badge: "01", title: "Admin Settings", description: "Có thể sửa update/link/trạng thái app trực tiếp trên admin." }
    ], null, 2)
  };
}

function normalizeSettings(data) {
  const raw = data?.raw || data?.settings || data || {};
  const update = data?.update || {};
  const defaults = defaultSettings();

  let items = raw.updateItems ?? raw.update_items ?? update.items;

  if (!items && raw.updateItemsJson) {
    try {
      const parsed = JSON.parse(raw.updateItemsJson);
      if (Array.isArray(parsed)) items = parsed;
    } catch (_) {}
  }

  if (!Array.isArray(items)) {
    items = JSON.parse(defaults.updateItemsJson);
  }

  return {
    ...defaults,
    ...raw,
    boostLinkUrl: raw.boostLinkUrl || raw.updateUrl || defaults.boostLinkUrl,
    currentVersion: String(raw.currentVersion ?? raw.latestVersion ?? defaults.currentVersion),
    latestVersion: String(raw.latestVersion ?? raw.currentVersion ?? defaults.latestVersion),
    minVersion: String(raw.minVersion ?? defaults.minVersion),
    updateVersion: raw.updateVersion || update.version || defaults.updateVersion,
    updateTitle: raw.updateTitle || update.title || defaults.updateTitle,
    updateLabel: raw.updateLabel || update.label || defaults.updateLabel,
    updateHeadline: raw.updateHeadline || update.headline || defaults.updateHeadline,
    updateSummary: raw.updateSummary || update.summary || defaults.updateSummary,
    updateTimeLabel: raw.updateTimeLabel || update.time_label || defaults.updateTimeLabel,
    forceUpdate: raw.forceUpdate === true || raw.forceUpdate === "true" || raw.forceUpdate === "1",
    maintenance: raw.maintenance === true || raw.maintenance === "true" || raw.maintenance === "1",
    updateItemsJson: JSON.stringify(items, null, 2)
  };
}

function fillSettings(data) {
  const settings = normalizeSettings(data);
  for (const [key, input] of Object.entries(settingsFields)) {
    if (!input) continue;
    if (input.type === "checkbox") input.checked = Boolean(settings[key]);
    else input.value = settings[key] ?? "";
  }
}

function collectSettings() {
  let updateItemsJson = settingsFields.updateItemsJson?.value || "[]";
  let updateItems = [];

  try {
    updateItems = JSON.parse(updateItemsJson);
    if (!Array.isArray(updateItems)) {
      throw new Error("Update items phải là mảng JSON.");
    }

    updateItemsJson = JSON.stringify(updateItems, null, 2);
    settingsFields.updateItemsJson.value = updateItemsJson;
  } catch (error) {
    throw new Error(`JSON cập nhật bị lỗi: ${error.message}`);
  }

  const boostLinkUrl = settingsFields.boostLinkUrl?.value.trim() || "";

  return {
    freeKeyUrl: settingsFields.freeKeyUrl?.value.trim() || "",
    zaloUrl: settingsFields.zaloUrl?.value.trim() || "",
    boostLinkUrl,
    updateUrl: boostLinkUrl,
    currentVersion: settingsFields.currentVersion?.value.trim() || "1",
    latestVersion: settingsFields.latestVersion?.value.trim() || "1",
    minVersion: settingsFields.minVersion?.value.trim() || "1",
    forceUpdate: settingsFields.forceUpdate?.checked ? "1" : "0",
    maintenance: settingsFields.maintenance?.checked ? "1" : "0",
    forceTitle: settingsFields.forceTitle?.value.trim() || "",
    forceMessage: settingsFields.forceMessage?.value.trim() || "",
    maintenanceTitle: settingsFields.maintenanceTitle?.value.trim() || "",
    maintenanceMessage: settingsFields.maintenanceMessage?.value.trim() || "",
    updateVersion: settingsFields.updateVersion?.value.trim() || "V1",
    updateTitle: settingsFields.updateTitle?.value.trim() || "AIMLOCK JAME",
    updateLabel: settingsFields.updateLabel?.value.trim() || "BẢN CẬP NHẬT",
    updateHeadline: settingsFields.updateHeadline?.value.trim() || "Cập nhật mới",
    updateSummary: settingsFields.updateSummary?.value.trim() || "",
    updateTimeLabel: settingsFields.updateTimeLabel?.value.trim() || "Vừa cập nhật",
    updateItems,
    updateItemsJson
  };
}

async function loadSettings() {
  try {
    if (STATIC_PREVIEW_MODE) {
      const saved = JSON.parse(localStorage.getItem("aimlockAdminSettingsDemo") || "null");
      fillSettings(saved || defaultSettings());
      settingsStatus.textContent = "Đang ở GitHub Pages: settings lưu demo trong trình duyệt.";
      settingsStatus.style.color = "#ffd000";
      return;
    }

    const data = await fetchJson("/api/app-settings", { headers: headers() });
    fillSettings(data);
    settingsStatus.textContent = "Đã tải settings từ server.";
    settingsStatus.style.color = "#22e06e";
  } catch (error) {
    fillSettings(defaultSettings());
    settingsStatus.textContent = error.message || "Không tải được settings.";
    settingsStatus.style.color = "#ef4444";
  }
}

async function saveSettings() {
  const originalButtonText = saveSettingsBtn?.textContent || "Lưu settings";

  try {
    const payload = collectSettings();
    const body = JSON.stringify(payload);
    const payloadBytes = new TextEncoder().encode(body).length;

    console.log(`[ADMIN] Settings payload: ${payloadBytes} bytes`);

    if (payloadBytes > MAX_SETTINGS_PAYLOAD_BYTES) {
      throw new Error(
        `Settings quá lớn: ${(payloadBytes / 1024).toFixed(1)} KB. ` +
        `Giới hạn phía Admin là ${(MAX_SETTINGS_PAYLOAD_BYTES / 1024).toFixed(0)} KB.`
      );
    }

    if (STATIC_PREVIEW_MODE) {
      localStorage.setItem("aimlockAdminSettingsDemo", body);
      settingsStatus.textContent = "Đã lưu settings demo trong trình duyệt.";
      settingsStatus.style.color = "#22e06e";
      return;
    }

    if (saveSettingsBtn) {
      saveSettingsBtn.disabled = true;
      saveSettingsBtn.textContent = "Đang lưu...";
    }

    settingsStatus.textContent = `Đang gửi ${payloadBytes} bytes lên Railway...`;
    settingsStatus.style.color = "#ffd000";

    const data = await fetchJson("/api/app-settings", {
      method: "POST",
      headers: headers(),
      body
    });

    if (!data?.ok) {
      throw new Error(data?.message || "Server không xác nhận đã lưu settings.");
    }

    fillSettings(data);
    settingsStatus.textContent = `${data.message || "Đã lưu settings."} (${payloadBytes} bytes)`;
    settingsStatus.style.color = "#22e06e";
  } catch (error) {
    settingsStatus.textContent = error.message || "Lỗi lưu settings.";
    settingsStatus.style.color = "#ef4444";
  } finally {
    if (saveSettingsBtn) {
      saveSettingsBtn.disabled = false;
      saveSettingsBtn.textContent = originalButtonText;
    }
  }
}

async function loadStats() {
  if (STATIC_PREVIEW_MODE) {
    statOnline.textContent = "1";
    statActive.textContent = "2";
    statToday.textContent = "1";
    statRailway.textContent = "Static";
    return;
  }

  try {
    const data = await fetchJson("/api/stats");
    statOnline.textContent = data.online ?? 0;
    statActive.textContent = data.activeKeys ?? 0;
    statToday.textContent = data.today ?? 0;
    statRailway.textContent = data.railway || "Online";
  } catch (_) {
    statRailway.textContent = "Offline";
  }
}



async function loginAdmin() {
  adminPass = adminPassword?.value.trim() || "";

  if (!adminPass) {
    if (loginStatus) loginStatus.textContent = "Vui lòng nhập mật khẩu admin.";
    return;
  }

  try {
    // Xác thực thật với backend trước khi mở Admin.
    // Không dùng /api/admin/keys để đăng nhập và không chấp nhận Admin11 làm key.
    await fetchJson("/api/admin/auth", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ adminPassword: adminPass })
    });

    await loadSettings();
    localStorage.setItem("aimlockAdminPassword", adminPass);

    loginBox?.classList.add("hidden");
    adminContent?.classList.remove("hidden");
    if (loginStatus) loginStatus.textContent = "";
  } catch (error) {
    if (loginStatus) {
      loginStatus.textContent = error.message || "Sai mật khẩu admin.";
      loginStatus.style.color = "#ef4444";
    }
  }
}

adminLoginBtn?.addEventListener("click", loginAdmin);

adminPassword?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") loginAdmin();
});

saveSettingsBtn?.addEventListener("click", saveSettings);
loadSettingsBtn?.addEventListener("click", loadSettings);
previewSettingsBtn?.addEventListener(
  "click",
  () => window.open("index.html", "_blank")
);

adminLogoutTop?.addEventListener("click", () => {
  localStorage.removeItem("aimlockAdminPassword");
  adminPass = "";
  adminContent?.classList.add("hidden");
  loginBox?.classList.remove("hidden");
  if (adminPassword) adminPassword.value = "";
  if (loginStatus) loginStatus.textContent = "";
});

if (adminPass) {
  if (adminPassword) adminPassword.value = adminPass;
  loginAdmin();
}

loadStats();
setInterval(loadStats, 4000);
