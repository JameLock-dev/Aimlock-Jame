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

function headers() {
  return {
    "Content-Type": "application/json",
    "x-admin-password": adminPass
  };
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

async function loadStats() {
  try {
    const response = await fetch("/api/stats");
    const data = await response.json();

    statOnline.textContent = data.online ?? 0;
    statActive.textContent = data.activeKeys ?? 0;
    statToday.textContent = data.today ?? 0;
    statRailway.textContent = data.railway || "Online";
  } catch {
    statRailway.textContent = "Offline";
  }
}

async function loadKeys() {
  const response = await fetch("/api/admin/keys", { headers: headers() });
  const data = await response.json();

  if (!data.ok) {
    throw new Error(data.message || "Không tải được danh sách key.");
  }

  keyTable.innerHTML = "";

  data.keys.forEach((item) => {
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

  const response = await fetch("/api/admin/keys", {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  saveStatus.textContent = data.message || "Đã lưu key";
  saveStatus.style.color = data.ok ? "#22e06e" : "#ef4444";

  if (data.ok) {
    keyInput.value = "";
    typeInput.value = "";
    expireInput.value = "";
    slotLimitInput.value = "100";
    loadKeys();
  }
}

async function deleteKey(key) {
  if (!confirm(`Xóa key ${key}?`)) return;

  const response = await fetch(`/api/admin/keys/${encodeURIComponent(key)}`, {
    method: "DELETE",
    headers: headers()
  });

  const data = await response.json();
  saveStatus.textContent = data.message || "Đã xóa key";
  saveStatus.style.color = data.ok ? "#22e06e" : "#ef4444";

  loadKeys();
}

function editKey(row) {
  const item = JSON.parse(row.dataset.payload || "{}");

  keyInput.value = item.key || "";
  typeInput.value = item.type || "custom";
  expireInput.value = toInputDateTime(item.expire);
  slotLimitInput.value = item.slotLimit || 1;

  window.scrollTo({ top: 0, behavior: "smooth" });
  saveStatus.textContent = `Đang sửa key: ${item.key}`;
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
