(() => {
  "use strict";

  const CONFIG = window.AIMLOCK_CONFIG || {};
  const API_BASE = String(
    CONFIG.apiBase || "https://aimlock-jame-production.up.railway.app"
  ).trim().replace(/\/+$/, "");

  const APP_PAGE = String(CONFIG.appPage || "app.html").trim() || "app.html";
  const LOGIN_PAGE = String(CONFIG.loginPage || "login.html").trim() || "login.html";

  const isLoginPage = document.body.classList.contains("page-login");
  const isDashboardPage = document.body.classList.contains("page-dashboard");
  const $ = (id) => document.getElementById(id);

  function apiUrl(path) {
    return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  }

  function showToast(message) {
    const toast = $("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
  }

  function deviceId() {
    let id = localStorage.getItem("deviceId");
    if (!id) {
      id = `DEV-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
      localStorage.setItem("deviceId", id);
    }
    return id;
  }

  async function apiFetch(path, options = {}) {
    let response;
    try {
      response = await fetch(apiUrl(path), {
        ...options,
        headers: {
          Accept: "application/json",
          ...(options.headers || {})
        },
        cache: "no-store"
      });
    } catch {
      throw new Error("Không kết nối được API Railway.");
    }

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("API đang trả về HTML/Text thay vì JSON.");
    }

    if (!response.ok || data.ok === false) {
      throw new Error(data.message || "Request thất bại.");
    }

    return data;
  }

  function normalizePlan(info) {
    const plan = String(
      info?.type ??
      info?.plan ??
      info?.vipType ??
      info?.keyType ??
      ""
    ).trim();

    return plan ? plan.toUpperCase() : "CHƯA XÁC ĐỊNH";
  }

  function formatExpire(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value || "--/--/----";
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  }

  function getRemainingDays(expire) {
    const expireDate = new Date(expire);
    if (Number.isNaN(expireDate.getTime())) return 0;
    return Math.max(0, Math.ceil((expireDate.getTime() - Date.now()) / 86400000));
  }

  function getProgressPercent(info, daysLeft) {
    const activatedAt = new Date(
      info?.activatedAt || info?.activated_at || info?.createdAt || info?.created_at || ""
    );
    const expireAt = new Date(info?.expire);

    if (
      !Number.isNaN(activatedAt.getTime()) &&
      !Number.isNaN(expireAt.getTime()) &&
      expireAt > activatedAt
    ) {
      const total = expireAt.getTime() - activatedAt.getTime();
      const remain = Math.max(0, expireAt.getTime() - Date.now());
      return Math.max(0, Math.min(100, Math.round((remain / total) * 100)));
    }

    const durationDays = Number(info?.durationDays || info?.duration_days || 0);
    if (durationDays > 0) {
      return Math.max(0, Math.min(100, Math.round((daysLeft / durationDays) * 100)));
    }

    return daysLeft > 0 ? 100 : 0;
  }

  function saveSession(key, info) {
    const keyInfo = { ...(info || {}), loginKey: key };
    localStorage.setItem("jameLoginUnlocked", "true");
    localStorage.setItem("jameActiveKey", key);
    localStorage.setItem("jameKeyInfo", JSON.stringify(keyInfo));
  }

  function clearSession() {
    localStorage.removeItem("jameLoginUnlocked");
    localStorage.removeItem("jameActiveKey");
    localStorage.removeItem("jameKeyInfo");
  }

  function readSession() {
    try {
      const info = JSON.parse(localStorage.getItem("jameKeyInfo") || "null");
      const unlocked = localStorage.getItem("jameLoginUnlocked") === "true";
      return unlocked && info ? info : null;
    } catch {
      return null;
    }
  }

  function goTo(page) {
    const target = new URL(page, location.href);
    if (target.href !== location.href) {
      location.replace(target.href);
    }
  }

  function initLoginPage() {
    const keyInput = $("keyInput");
    const togglePassword = $("togglePassword");
    const pasteKeyBtn = $("pasteKeyBtn");
    const activateBtn = $("activateBtn");
    const loginStatus = $("loginStatus");

    if (!keyInput || !activateBtn || !loginStatus) return;

    function setStatus(message, state = "") {
      loginStatus.innerHTML = `<span class="dot"></span>${message}`;
      loginStatus.className = `ready-state${state ? ` ${state}` : ""}`;
    }

    const saved = readSession();
    if (saved) {
      setStatus("Đang mở AIMLOCK JAME...", "success");
      setTimeout(() => goTo(APP_PAGE), 80);
      return;
    }

    togglePassword?.addEventListener("click", () => {
      const show = keyInput.type === "password";
      keyInput.type = show ? "text" : "password";
      togglePassword.setAttribute("aria-label", show ? "Ẩn key" : "Hiện key");
      togglePassword.setAttribute("aria-pressed", String(show));
      keyInput.focus();
    });

    pasteKeyBtn?.addEventListener("click", async () => {
      try {
        const text = (await navigator.clipboard.readText()).trim();
        if (!text) {
          showToast("Clipboard đang trống");
          return;
        }
        keyInput.value = text;
        setStatus("Kích Hoạt AIMLOCK JAME", "success");
        showToast("Đã dán key");
      } catch {
        keyInput.focus();
        showToast("Chạm giữ ô nhập để dán key");
      }
    });

    async function verifyKey() {
      const key = keyInput.value.trim();

      if (!key) {
        setStatus("Vui lòng nhập hoặc dán key.", "error");
        keyInput.focus();
        showToast("Thiếu key");
        return;
      }

      const label = activateBtn.querySelector("span");
      activateBtn.disabled = true;
      if (label) label.textContent = "ĐANG KÍCH HOẠT...";
      setStatus("Đang kiểm tra Postgres key server...");

      try {
        const data = await apiFetch("/api/verify-key", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, deviceId: deviceId() })
        });

        saveSession(key, data.key || {});
        setStatus("Kích Hoạt AIMLOCK JAME", "success");
        showToast("Đăng nhập thành công");

        setTimeout(() => goTo(APP_PAGE), 250);
      } catch (error) {
        setStatus(error.message || "Key không hợp lệ.", "error");
        showToast("Kích hoạt thất bại");
      } finally {
        activateBtn.disabled = false;
        if (label) label.textContent = "KÍCH HOẠT AIMLOCK";
      }
    }

    activateBtn.addEventListener("click", verifyKey);
    keyInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        verifyKey();
      }
    });
  }

  async function refreshCurrentKey(savedInfo) {
    const activeKey = localStorage.getItem("jameActiveKey") || savedInfo?.loginKey || "";
    if (!activeKey) return savedInfo;

    try {
      const data = await apiFetch("/api/verify-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: activeKey, deviceId: deviceId() })
      });

      saveSession(activeKey, data.key || {});
      return { ...(data.key || {}), loginKey: activeKey };
    } catch (error) {
      clearSession();
      showToast(error.message || "Key đã hết hạn hoặc không hợp lệ.");
      setTimeout(() => goTo(LOGIN_PAGE), 300);
      return null;
    }
  }

  function renderDashboardKey(info) {
    if (!info) return;

    const plan = normalizePlan(info);
    const daysLeft = getRemainingDays(info.expire);
    const percent = getProgressPercent(info, daysLeft);
    const slotUsed = Number(info.slotUsed ?? info.slot_used ?? 0);
    const slotLimit = Number(info.slotLimit ?? info.slot_limit ?? 1);

    if ($("vipPlan")) $("vipPlan").textContent = plan;
    if ($("vipExpireDate")) $("vipExpireDate").textContent = formatExpire(info.expire);
    if ($("vipDaysText")) {
      $("vipDaysText").textContent = daysLeft > 0
        ? `Còn ${daysLeft} ngày VIP`
        : "Key đã hết hạn";
    }
    if ($("vipPercentText")) $("vipPercentText").textContent = `${percent}%`;
    if ($("vipProgressBar")) $("vipProgressBar").style.width = `${percent}%`;
    if ($("slotText")) $("slotText").textContent = `${slotUsed}/${slotLimit}`;

    if ($("accountModalPlan")) $("accountModalPlan").textContent = `Gói: ${plan}`;
    if ($("accountModalExpire")) {
      $("accountModalExpire").textContent = `HSD: ${formatExpire(info.expire)}`;
    }
  }

  async function loadStats() {
    try {
      const data = await apiFetch("/api/stats");
      if ($("statOnline")) $("statOnline").textContent = Number(data.online ?? 0).toLocaleString("vi-VN");
      if ($("statActive")) $("statActive").textContent = Number(data.activeKeys ?? 0).toLocaleString("vi-VN");
      if ($("statToday")) $("statToday").textContent = Number(data.today ?? 0).toLocaleString("vi-VN");

      document.querySelectorAll("[data-stat-card]").forEach((card) => {
        card.classList.remove("is-loading");
      });
    } catch {
      showToast("Không tải được thống kê server.");
    }
  }

  function initDashboardInteractions() {
    const sideDrawer = $("sideDrawer");
    $("menuBtn")?.addEventListener("click", () => sideDrawer?.classList.add("open"));
    $("closeDrawer")?.addEventListener("click", () => sideDrawer?.classList.remove("open"));

    const logout = () => {
      clearSession();
      goTo(LOGIN_PAGE);
    };

    $("logoutBtn")?.addEventListener("click", logout);
    $("accountLogoutBtn")?.addEventListener("click", logout);

    $("accountBtn")?.addEventListener("click", () => {
      const modal = $("accountModal");
      if (modal) {
        modal.setAttribute("aria-hidden", "false");
        modal.classList.add("open");
      }
    });

    document.querySelectorAll("[data-close-account]").forEach((button) => {
      button.addEventListener("click", () => {
        const modal = $("accountModal");
        modal?.setAttribute("aria-hidden", "true");
        modal?.classList.remove("open");
      });
    });

    const featureState = JSON.parse(localStorage.getItem("aimlockDashboardFeatures") || "{}");

    document.querySelectorAll("[data-feature]").forEach((button) => {
      const name = button.dataset.feature;
      const enabled = Boolean(featureState[name]);
      button.classList.toggle("is-on", enabled);
      button.setAttribute("aria-pressed", String(enabled));
      const label = button.querySelector(".label");
      if (label) label.textContent = enabled ? "ON" : "OFF";

      button.addEventListener("click", () => {
        const next = button.getAttribute("aria-pressed") !== "true";
        featureState[name] = next;
        localStorage.setItem("aimlockDashboardFeatures", JSON.stringify(featureState));

        document.querySelectorAll(`[data-feature="${CSS.escape(name)}"]`).forEach((item) => {
          item.classList.toggle("is-on", next);
          item.setAttribute("aria-pressed", String(next));
          const itemLabel = item.querySelector(".label");
          if (itemLabel) itemLabel.textContent = next ? "ON" : "OFF";
        });

        showToast(`${name.toUpperCase()}: ${next ? "ON" : "OFF"}`);
      });
    });
  }

  async function initDashboardPage() {
    const saved = readSession();
    if (!saved) {
      goTo(LOGIN_PAGE);
      return;
    }

    renderDashboardKey(saved);
    initDashboardInteractions();
    loadStats();

    const fresh = await refreshCurrentKey(saved);
    if (fresh) renderDashboardKey(fresh);

    setInterval(loadStats, 10000);
  }

  if (isLoginPage) {
    initLoginPage();
  } else if (isDashboardPage) {
    initDashboardPage();
  }
})();
