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

let adminPass = localStorage.getItem("aimlockAdminPassword") || "";

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
          <button class="action-btn delete" data-key="${item.key}">Xóa</button>
        </div>
      </td>
    `;

    tr.dataset.payload = JSON.stringify(item);
    keyTable.appendChild(tr);
  });
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

keyTable.addEventListener("click", (event) => {
  const editBtn = event.target.closest(".edit");
  const deleteBtn = event.target.closest(".delete");

  if (editBtn) {
    editKey(editBtn.closest("tr"));
    return;
  }

  if (deleteBtn) {
    deleteKey(deleteBtn.dataset.key);
  }
});

if (adminPass) {
  adminPassword.value = adminPass;
  loginAdmin();
}

loadStats();
setInterval(loadStats, 4000);
