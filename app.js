const toastEl = document.getElementById("toast");

const API_BASE_URL = String(window.AIMLOCK_API_BASE_URL || "").replace(/\/+$/, "");

function apiUrl(path) {
  const cleanPath = String(path || "").startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}

function showToast(message) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toastEl.classList.remove("show"), 2200);
}

function getDeviceId() {
  let id = localStorage.getItem("aimlock_device_id");

  if (!id) {
    const randomPart = globalThis.crypto?.randomUUID
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    id = `web-${randomPart}`;
    localStorage.setItem("aimlock_device_id", id);
  }

  return id;
}

async function fetchJson(url, options = {}) {
  const finalUrl = apiUrl(url);
  let response;

  try {
    response = await fetch(finalUrl, options);
  } catch (_) {
    throw new Error(
      API_BASE_URL
        ? "Không kết nối được API. Hãy kiểm tra URL Railway backend trong api-config.js."
        : "Không kết nối được API. Hãy mở web bằng domain Railway chạy server.js, không mở bằng file local/GitHub Pages."
    );
  }

  const text = await response.text();
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    throw new Error(
      API_BASE_URL
        ? "API URL trong api-config.js chưa đúng hoặc backend chưa deploy server.js."
        : "Bạn đang mở frontend không cùng server API. Hãy mở domain Railway chạy server.js hoặc cấu hình AIMLOCK_API_BASE_URL trong api-config.js."
    );
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch (_) {
    throw new Error("API trả dữ liệu lỗi, không đọc được JSON.");
  }

  if (!response.ok) {
    throw new Error(data.message || "Yêu cầu thất bại.");
  }

  return data;
}

function setStoredFeature(key, value) {
  localStorage.setItem(`aimlock_feature_${key}`, value ? "1" : "0");
}

function getStoredFeature(key) {
  const saved = localStorage.getItem(`aimlock_feature_${key}`);
  if (saved !== null) return saved === "1";
  return false;
}

function updateToggle(toggle, on) {
  toggle.classList.toggle("is-on", on);
  toggle.setAttribute("aria-pressed", on ? "true" : "false");

  const label = toggle.querySelector(".label");
  if (label) label.textContent = on ? "ON" : "OFF";
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
        showToast("Đã dán key từ clipboard.");
      } else {
        showToast("Clipboard đang trống.");
      }
    } catch (_) {
      showToast("Trình duyệt không cho phép đọc clipboard.");
    }
  });

  activateBtn?.addEventListener("click", async () => {
    const value = keyInput.value.trim();

    if (!value) {
      showToast("Vui lòng nhập key trước khi kích hoạt.");
      keyInput.focus();
      return;
    }

    activateBtn.disabled = true;
    activateBtn.classList.add("loading");
    activateBtn.querySelector("span").textContent = "ĐANG KIỂM TRA...";
    loginStatus.innerHTML = '<span class="dot"></span>Đang xác minh key...';
    loginStatus.style.color = "";

    try {
      const data = await fetchJson("/api/verify-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          key: value,
          deviceId: getDeviceId()
        })
      });

      localStorage.setItem("aimlock_auth", "1");
      localStorage.setItem("aimlock_user", "JAME FF");
      localStorage.setItem("aimlock_key_info", JSON.stringify(data.key || {}));

      loginStatus.innerHTML = '<span class="dot"></span>Kích hoạt thành công';
      showToast(data.message || "Kích hoạt thành công. Đang vào dashboard...");

      setTimeout(() => {
        location.href = "dashboard.html";
      }, 700);
    } catch (error) {
      activateBtn.disabled = false;
      activateBtn.classList.remove("loading");
      activateBtn.querySelector("span").textContent = "KÍCH HOẠT KEY";
      loginStatus.textContent = error.message || "Key không hợp lệ.";
      loginStatus.style.color = "#ff6e7f";
      showToast(error.message || "Key không hợp lệ.");
    }
  });
}

if (document.body.classList.contains("page-dashboard")) {
  if (localStorage.getItem("aimlock_auth") !== "1") {
    location.href = "index.html";
  }

  const helloName = document.getElementById("helloName");
  if (helloName) {
    helloName.textContent = localStorage.getItem("aimlock_user") || "JAME FF";
  }

  async function loadDashboardStats() {
    try {
      const data = await fetchJson("/api/stats");
      const statValues = document.querySelectorAll(".stat-card-v10 .stat-value");

      if (statValues[0]) statValues[0].textContent = data.online ?? 0;
      if (statValues[1]) statValues[1].textContent = data.activeKeys ?? 0;
      if (statValues[2]) statValues[2].textContent = data.today ?? 0;

      const statCards = document.querySelectorAll(".stat-card-v10");
      if (statCards[0]) statCards[0].dataset.toast = `Hiện tại có ${data.online ?? 0} người dùng online.`;
      if (statCards[1]) statCards[1].dataset.toast = `Có ${data.activeKeys ?? 0} key đang hoạt động.`;
      if (statCards[2]) statCards[2].dataset.toast = `Hôm nay có ${data.today ?? 0} lượt kích hoạt.`;
    } catch (_) {
      showToast("Không tải được thống kê server.");
    }
  }

  loadDashboardStats();
  setInterval(loadDashboardStats, 10000);

  document.querySelectorAll(".toggle").forEach((toggle) => {
    const feature = toggle.dataset.feature;
    const initial = getStoredFeature(feature);

    updateToggle(toggle, initial);

    toggle.addEventListener("click", () => {
      const next = !toggle.classList.contains("is-on");
      updateToggle(toggle, next);
      setStoredFeature(feature, next);
      showToast(`${feature.toUpperCase()} đã ${next ? "bật" : "tắt"}.`);
    });
  });

  document.querySelectorAll(".interactive[data-toast]").forEach((el) => {
    el.addEventListener("click", () => {
      if (el.classList.contains("toggle")) return;
      const msg = el.dataset.toast;
      if (msg) showToast(msg);
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

  sideDrawer?.addEventListener("click", (e) => {
    if (e.target === sideDrawer) sideDrawer.classList.remove("show");
  });

  notifyBtn?.addEventListener("click", () => showToast("Bạn có 1 thông báo mới."));
  accountBtn?.addEventListener("click", () => showToast("Tài khoản đang hoạt động bình thường."));

  logoutBtn?.addEventListener("click", () => {
    localStorage.removeItem("aimlock_auth");
    localStorage.removeItem("aimlock_key_info");
    showToast("Đã đăng xuất.");

    setTimeout(() => {
      location.href = "index.html";
    }, 500);
  });
}
