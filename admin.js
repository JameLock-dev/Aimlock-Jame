const API_BASE_URL = String(window.AIMLOCK_API_BASE_URL || "").trim().replace(/\/+$/, "");
const IS_GITHUB_PAGES = /github\.io$/i.test(location.hostname);
const STATIC_PREVIEW_MODE = IS_GITHUB_PAGES && !API_BASE_URL;

const loginBox = document.getElementById("loginBox");
const adminContent = document.getElementById("adminContent");
const adminPassword = document.getElementById("adminPassword");
const adminLoginBtn = document.getElementById("adminLoginBtn");
const loginStatus = document.getElementById("loginStatus");

const statOnline = document.getElementById("statOnline");
const statActive = document.getElementById("statActive");
const statToday = document.getElementById("statToday");
const statRailway = document.getElementById("statRailway");

const keyInput = document.getElementById("keyInput");
const typeInput = document.getElementById("typeInput");
const expireInput = document.getElementById("expireInput");
const slotLimitInput = document.getElementById("slotLimitInput");
const saveKeyBtn = document.getElementById("saveKeyBtn");
const saveStatus = document.getElementById("saveStatus");
const keyTable = document.getElementById("keyTable");
const reloadBtn = document.getElementById("reloadBtn");
const deviceTable = document.getElementById("deviceTable");
const deviceHelp = document.getElementById("deviceHelp");
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

  if (!response.ok && data?.message) {
    throw new Error(data.message);
  }

  return data;
}

function formatExpire(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "--";

  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function toInputDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function demoKeys() {
  return [
    {
      key: "Admin11",
      type: "admin",
      expire: "2099-12-31T23:59:59.000Z",
      slotUsed: 1,
      slotLimit: 1,
      status: "active"
    },
    {
      key: "JAME-FREE-KEY",
      type: "vip",
      expire: new Date(Date.now() + 30 * 86400000).toISOString(),
      slotUsed: 1,
      slotLimit: 2,
      status: "active"
    }
  ];
}

function demoDevices(key) {
  return [
    {
      deviceId: `browser-${String(key || "demo").toLowerCase()}-01`,
      deviceName: "Chrome / Windows",
      firstSeen: new Date(Date.now() - 86400000).toISOString(),
      lastSeen: new Date().toISOString()
    },
    {
      deviceId: `mobile-${String(key || "demo").toLowerCase()}-02`,
      deviceName: "Mobile WebView",
      firstSeen: new Date(Date.now() - 3600000).toISOString(),
      lastSeen: new Date(Date.now() - 300000).toISOString()
    }
  ];
}

function defaultSettings() {
  return {
    freeKeyUrl: "https://link4m.net/GhYJFCll",
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
  const itemsJson = raw.updateItemsJson || JSON.stringify(update.items || JSON.parse(defaults.updateItemsJson), null, 2);
  return {
    ...defaults,
    ...raw,
    updateVersion: raw.updateVersion || update.version || defaults.updateVersion,
    updateTitle: raw.updateTitle || update.title || defaults.updateTitle,
    updateLabel: raw.updateLabel || update.label || defaults.updateLabel,
    updateHeadline: raw.updateHeadline || update.headline || defaults.updateHeadline,
    updateSummary: raw.updateSummary || update.summary || defaults.updateSummary,
    updateTimeLabel: raw.updateTimeLabel || update.time_label || defaults.updateTimeLabel,
    forceUpdate: raw.forceUpdate === true || raw.forceUpdate === "true" || raw.forceUpdate === "1",
    maintenance: raw.maintenance === true || raw.maintenance === "true" || raw.maintenance === "1",
    updateItemsJson: typeof itemsJson === "string" ? itemsJson : JSON.stringify(itemsJson, null, 2)
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
  try {
    const parsed = JSON.parse(updateItemsJson);
    if (!Array.isArray(parsed)) throw new Error("Update items phải là mảng JSON.");
    updateItemsJson = JSON.stringify(parsed, null, 2);
    settingsFields.updateItemsJson.value = updateItemsJson;
  } catch (error) {
    throw new Error(`JSON cập nhật bị lỗi: ${error.message}`);
  }

  return {
    freeKeyUrl: settingsFields.freeKeyUrl?.value.trim() || "",
    zaloUrl: settingsFields.zaloUrl?.value.trim() || "",
    boostLinkUrl: settingsFields.boostLinkUrl?.value.trim() || "",
    currentVersion: settingsFields.currentVersion?.value.trim() || "1",
    latestVersion: settingsFields.latestVersion?.value.trim() || "1",
    minVersion: settingsFields.minVersion?.value.trim() || "1",
    forceUpdate: settingsFields.forceUpdate?.checked ? "true" : "false",
    maintenance: settingsFields.maintenance?.checked ? "true" : "false",
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

    const data = await fetchJson("/api/admin/settings", { headers: headers() });
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
  try {
    const payload = collectSettings();
    if (STATIC_PREVIEW_MODE) {
      localStorage.setItem("aimlockAdminSettingsDemo", JSON.stringify(payload));
      settingsStatus.textContent = "Đã lưu settings demo trong trình duyệt.";
      settingsStatus.style.color = "#22e06e";
      return;
    }

    const data = await fetchJson("/api/admin/settings", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(payload)
    });

    settingsStatus.textContent = data.message || "Đã lưu settings.";
    settingsStatus.style.color = data.ok ? "#22e06e" : "#ef4444";
    if (data.ok) fillSettings(data);
  } catch (error) {
    settingsStatus.textContent = error.message || "Lỗi lưu settings.";
    settingsStatus.style.color = "#ef4444";
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

function renderKeys(keys) {
  keyTable.innerHTML = "";

  keys.forEach((item) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.key}</td>
      <td>${item.type}</td>
      <td>${formatExpire(item.expire)}</td>
      <td>${item.slotUsed || 0}/${item.slotLimit || 1}</td>
      <td><span class="key-status">${item.status === "active" ? "Hoạt động" : item.status}</span></td>
      <td>
        <div class="action-group">
          <button class="action-btn edit" data-key="${item.key}">Sửa</button>
          <button class="action-btn devices" data-key="${item.key}">Thiết bị</button>
          <button class="action-btn reset" data-key="${item.key}">Reset máy</button>
          <button class="action-btn delete" data-key="${item.key}">Xóa</button>
        </div>
      </td>
    `;

    tr.dataset.payload = JSON.stringify(item);
    keyTable.appendChild(tr);
  });
}

function renderDevices(key, devices) {
  if (!deviceTable) return;
  selectedDeviceKey = key || selectedDeviceKey;
  deviceTable.innerHTML = "";

  if (deviceHelp) {
    deviceHelp.textContent = key
      ? `Đang xem thiết bị của key: ${key}`
      : "Chọn “Thiết bị” ở một key để xem danh sách máy đang gắn.";
  }

  if (!devices || !devices.length) {
    deviceTable.innerHTML = '<tr><td colspan="5">Chưa có thiết bị nào đang gắn với key này.</td></tr>';
    return;
  }

  devices.forEach((device, index) => {
    const deviceId = device.deviceId || device.device_id || "--";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${deviceId}</td>
      <td>${device.deviceName || device.device_name || `Máy ${index + 1}`}</td>
      <td>${formatExpire(device.firstSeen || device.created_at || device.createdAt)}</td>
      <td>${formatExpire(device.lastSeen || device.last_seen || device.lastSeenAt)}</td>
      <td><button class="action-btn delete delete-device" data-key="${key}" data-device="${deviceId}">Gỡ máy</button></td>
    `;
    deviceTable.appendChild(tr);
  });
}

async function loadDevices(key) {
  if (!key) return;

  if (STATIC_PREVIEW_MODE) {
    renderDevices(key, demoDevices(key));
    saveStatus.textContent = `Đang xem demo thiết bị của key: ${key}`;
    saveStatus.style.color = "#ffd000";
    return;
  }

  try {
    const data = await fetchJson(`/api/admin/keys/${encodeURIComponent(key)}/devices`, { headers: headers() });
    renderDevices(key, data.devices || []);
    saveStatus.textContent = data.message || `Đã tải thiết bị của key ${key}.`;
    saveStatus.style.color = "#22e06e";
  } catch (error) {
    saveStatus.textContent = error.message || "Không tải được thiết bị.";
    saveStatus.style.color = "#ef4444";
  }
}

async function resetDevices(key) {
  if (!key) return;
  if (!confirm(`Reset toàn bộ máy của key ${key}?`)) return;

  if (STATIC_PREVIEW_MODE) {
    renderDevices(key, []);
    saveStatus.textContent = `Demo: đã reset máy cho key ${key}.`;
    saveStatus.style.color = "#ffd000";
    return;
  }

  try {
    const data = await fetchJson(`/api/admin/keys/${encodeURIComponent(key)}/reset-devices`, {
      method: "POST",
      headers: headers()
    });
    saveStatus.textContent = data.message || "Đã reset máy.";
    saveStatus.style.color = data.ok ? "#22e06e" : "#ef4444";
    await loadKeys();
    await loadDevices(key);
  } catch (error) {
    saveStatus.textContent = error.message || "Lỗi reset máy.";
    saveStatus.style.color = "#ef4444";
  }
}

async function deleteDevice(key, deviceId) {
  if (!key || !deviceId) return;
  if (!confirm(`Gỡ thiết bị này khỏi key ${key}?`)) return;

  if (STATIC_PREVIEW_MODE) {
    const devices = demoDevices(key).filter(item => item.deviceId !== deviceId);
    renderDevices(key, devices);
    saveStatus.textContent = "Demo: đã gỡ thiết bị.";
    saveStatus.style.color = "#ffd000";
    return;
  }

  try {
    const data = await fetchJson(`/api/admin/keys/${encodeURIComponent(key)}/devices/${encodeURIComponent(deviceId)}`, {
      method: "DELETE",
      headers: headers()
    });
    saveStatus.textContent = data.message || "Đã gỡ thiết bị.";
    saveStatus.style.color = data.ok ? "#22e06e" : "#ef4444";
    await loadKeys();
    await loadDevices(key);
  } catch (error) {
    saveStatus.textContent = error.message || "Lỗi gỡ thiết bị.";
    saveStatus.style.color = "#ef4444";
  }
}

async function loadKeys() {
  if (STATIC_PREVIEW_MODE) {
    renderKeys(demoKeys());
    loadStats();
    if (saveStatus) {
      saveStatus.textContent = "Đang ở GitHub Pages: chỉ xem demo. Muốn thêm/xóa key thật, hãy cấu hình AIMLOCK_API_BASE_URL tới Railway.";
      saveStatus.style.color = "#ffd000";
    }
    return;
  }

  const data = await fetchJson("/api/admin/keys", { headers: headers() });

  if (!data.ok) {
    throw new Error(data.message || "Không tải được danh sách key.");
  }

  renderKeys(data.keys);
  loadStats();
}

async function loginAdmin() {
  adminPass = adminPassword.value.trim();

  if (!adminPass) {
    loginStatus.textContent = "Vui lòng nhập mật khẩu admin.";
    return;
  }

  try {
    await loadKeys();
    await loadSettings();
    localStorage.setItem("aimlockAdminPassword", adminPass);
    loginBox.classList.add("hidden");
    adminContent.classList.remove("hidden");
  } catch (error) {
    loginStatus.textContent = error.message || "Sai mật khẩu admin.";
  }
}

async function saveKey() {
  const key = keyInput.value.trim();

  if (!key) {
    saveStatus.textContent = "Vui lòng nhập key.";
    saveStatus.style.color = "#ef4444";
    return;
  }

  if (STATIC_PREVIEW_MODE) {
    saveStatus.textContent = "GitHub Pages không có API để lưu key thật. Hãy deploy server.js lên Railway rồi cấu hình api-config.js.";
    saveStatus.style.color = "#ffd000";
    return;
  }

  const expire = expireInput.value
    ? new Date(expireInput.value).toISOString()
    : new Date(Date.now() + 7 * 86400000).toISOString();

  const payload = {
    key,
    type: typeInput.value.trim() || "custom",
    expire,
    slotLimit: Number(slotLimitInput.value || 1),
    slotUsed: 0,
    status: "active"
  };

  try {
    const data = await fetchJson("/api/admin/keys", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(payload)
    });

    saveStatus.textContent = data.message || "Đã lưu key";
    saveStatus.style.color = data.ok ? "#22e06e" : "#ef4444";

    if (data.ok) {
      keyInput.value = "";
      typeInput.value = "";
      expireInput.value = "";
      slotLimitInput.value = "100";
      loadKeys();
    }
  } catch (error) {
    saveStatus.textContent = error.message || "Lỗi lưu key.";
    saveStatus.style.color = "#ef4444";
  }
}

async function deleteKey(key) {
  if (STATIC_PREVIEW_MODE) {
    saveStatus.textContent = "Không thể xóa key thật khi đang chạy trên GitHub Pages static.";
    saveStatus.style.color = "#ffd000";
    return;
  }

  if (!confirm(`Xóa key ${key}?`)) return;

  try {
    const data = await fetchJson(`/api/admin/keys/${encodeURIComponent(key)}`, {
      method: "DELETE",
      headers: headers()
    });

    saveStatus.textContent = data.message || "Đã xóa key";
    saveStatus.style.color = data.ok ? "#22e06e" : "#ef4444";
    loadKeys();
  } catch (error) {
    saveStatus.textContent = error.message || "Lỗi xóa key.";
    saveStatus.style.color = "#ef4444";
  }
}

function editKey(row) {
  const item = JSON.parse(row.dataset.payload || "{}");

  keyInput.value = item.key || "";
  typeInput.value = item.type || "custom";
  expireInput.value = toInputDateTime(item.expire);
  slotLimitInput.value = item.slotLimit || 1;

  window.scrollTo({ top: 0, behavior: "smooth" });
  saveStatus.textContent = STATIC_PREVIEW_MODE
    ? `Đang xem demo key: ${item.key}`
    : `Đang sửa key: ${item.key}`;
  saveStatus.style.color = "#ffd000";
}

adminLoginBtn.addEventListener("click", loginAdmin);
adminPassword.addEventListener("keydown", (event) => {
  if (event.key === "Enter") loginAdmin();
});

saveKeyBtn.addEventListener("click", saveKey);
reloadBtn.addEventListener("click", loadKeys);
saveSettingsBtn?.addEventListener("click", saveSettings);
loadSettingsBtn?.addEventListener("click", loadSettings);
previewSettingsBtn?.addEventListener("click", () => window.open("index.html", "_blank"));

keyTable.addEventListener("click", (event) => {
  const editBtn = event.target.closest(".edit");
  const devicesBtn = event.target.closest(".devices");
  const resetBtn = event.target.closest(".reset");
  const deleteBtn = event.target.closest(".delete");

  if (editBtn) {
    editKey(editBtn.closest("tr"));
    return;
  }

  if (devicesBtn) {
    loadDevices(devicesBtn.dataset.key);
    document.querySelector(".devices-card-admin")?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  if (resetBtn) {
    resetDevices(resetBtn.dataset.key);
    return;
  }

  if (deleteBtn) {
    deleteKey(deleteBtn.dataset.key);
  }
});

deviceTable?.addEventListener("click", (event) => {
  const deleteDeviceBtn = event.target.closest(".delete-device");
  if (deleteDeviceBtn) {
    deleteDevice(deleteDeviceBtn.dataset.key, deleteDeviceBtn.dataset.device);
  }
});

adminLogoutTop?.addEventListener("click", () => {
  localStorage.removeItem("aimlockAdminPassword");
  adminPass = "";
  adminContent.classList.add("hidden");
  loginBox.classList.remove("hidden");
  adminPassword.value = "";
});

if (adminPass) {
  adminPassword.value = adminPass;
  loginAdmin();
}

loadStats();
setInterval(loadStats, 4000);
