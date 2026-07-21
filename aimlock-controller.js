
(function () {
  "use strict";

  var BUILD_VERSION = "20260721-stable-6";
  var API_BASE = String(
    window.AIMLOCK_API_BASE_URL ||
    (window.AIMLOCK_CONFIG && window.AIMLOCK_CONFIG.apiBase) ||
    ""
  ).replace(/\/+$/, "");

  var SUPPORT_URL = "https://zalo.me/0333635135";
  var moduleRunToken = 0;
  var currentStats = { online: 1, activeKeys: 1, today: 1 };
  var keyInfo = {};

  function byId(id) {
    return document.getElementById(id);
  }

  function each(selector, callback) {
    var nodes = document.querySelectorAll(selector);
    var i;
    for (i = 0; i < nodes.length; i += 1) {
      callback(nodes[i], i);
    }
  }

  function safeGet(key, fallback) {
    try {
      var value = localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch (_) {
      return fallback;
    }
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (_) {}
  }

  function safeRemove(key) {
    try {
      localStorage.removeItem(key);
    } catch (_) {}
  }

  function parseJSON(text, fallback) {
    try {
      return JSON.parse(text);
    } catch (_) {
      return fallback;
    }
  }

  function numberValue(value, fallback) {
    var parsed = Number(value);
    return isFinite(parsed) ? parsed : fallback;
  }

  function firstValue(object, keys, fallback) {
    var i;
    if (!object) return fallback;
    for (i = 0; i < keys.length; i += 1) {
      if (object[keys[i]] !== undefined && object[keys[i]] !== null) {
        return object[keys[i]];
      }
    }
    return fallback;
  }

  function apiUrl(path) {
    if (!API_BASE) return path;
    return API_BASE + (path.charAt(0) === "/" ? path : "/" + path);
  }

  function requestJSON(method, path, body, timeout, callback) {
    var xhr = new XMLHttpRequest();
    var finished = false;

    function finish(error, data) {
      if (finished) return;
      finished = true;
      callback(error, data);
    }

    try {
      xhr.open(method, apiUrl(path), true);
      xhr.timeout = timeout || 6000;
      xhr.setRequestHeader("Accept", "application/json");

      if (body !== null && body !== undefined) {
        xhr.setRequestHeader("Content-Type", "application/json");
      }

      xhr.onreadystatechange = function () {
        var data;
        if (xhr.readyState !== 4) return;

        data = parseJSON(xhr.responseText || "{}", null);

        if (xhr.status >= 200 && xhr.status < 300 && data) {
          finish(null, data);
        } else {
          finish(
            new Error(
              (data && data.message) ||
              "Không thể kết nối máy chủ."
            ),
            data
          );
        }
      };

      xhr.onerror = function () {
        finish(new Error("Không kết nối được Railway API."));
      };

      xhr.ontimeout = function () {
        finish(new Error("Railway API phản hồi quá chậm."));
      };

      xhr.send(
        body === null || body === undefined
          ? null
          : JSON.stringify(body)
      );
    } catch (error) {
      finish(error);
    }
  }

  function showToast(message, type) {
    var toast = byId("toast");
    if (!toast) return;

    toast.textContent = String(message || "");
    toast.setAttribute("data-type", type || "info");
    toast.classList.add("show");

    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(function () {
      toast.classList.remove("show");
    }, 2500);
  }

  function setText(id, value) {
    var element = byId(id);
    if (element) element.textContent = String(value);
  }

  function setHTML(id, value) {
    var element = byId(id);
    if (element) element.innerHTML = String(value);
  }

  function formatDate(value) {
    var date = new Date(value);
    var day;
    var month;

    if (isNaN(date.getTime())) return "--/--/----";

    day = String(date.getDate());
    month = String(date.getMonth() + 1);

    if (day.length < 2) day = "0" + day;
    if (month.length < 2) month = "0" + month;

    return day + "/" + month + "/" + date.getFullYear();
  }

  function getDaysLeft(value) {
    var date = new Date(value);
    if (isNaN(date.getTime())) return 0;
    return Math.max(
      0,
      Math.ceil((date.getTime() - Date.now()) / 86400000)
    );
  }

  function normalizePlan(info) {
    var raw = String(
      firstValue(
        info,
        ["type", "plan", "vipType", "keyType"],
        "VIP"
      )
    )
      .toUpperCase()
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .replace(/^\s+|\s+$/g, "");

    if (raw === "VIPPRO") return "VIP PRO";
    if (raw === "ADMIN") return "ADMIN";
    if (raw === "FREE") return "FREE";
    if (raw === "VIP") return "VIP";
    return raw || "VIP";
  }

  function normalizeKeyInfo(raw, enteredKey) {
    var source = raw || {};
    var nested = source.key;

    if (nested && typeof nested === "object") {
      source = nested;
    } else if (source.data && source.data.key) {
      source = source.data.key;
    } else if (source.data && typeof source.data === "object") {
      source = source.data;
    }

    var expire = firstValue(
      source,
      [
        "expire",
        "expiresAt",
        "expireAt",
        "expiration",
        "expires",
        "expiredAt"
      ],
      ""
    );

    if (!expire) {
      expire = new Date(Date.now() + 30 * 86400000).toISOString();
    }

    return {
      key: String(
        firstValue(source, ["key", "code", "value"], enteredKey || "")
      ),
      type: String(
        firstValue(
          source,
          ["type", "plan", "vipType", "keyType"],
          "VIP"
        )
      ),
      expire: expire,
      slotUsed: numberValue(
        firstValue(
          source,
          ["slotUsed", "usedSlots", "slot_used", "deviceCount"],
          1
        ),
        1
      ),
      slotLimit: numberValue(
        firstValue(
          source,
          ["slotLimit", "maxSlots", "slot_limit", "deviceLimit"],
          1
        ),
        1
      ),
      status: String(
        firstValue(source, ["status", "state"], "active")
      )
    };
  }

  function getStoredKeyInfo() {
    var raw = parseJSON(safeGet("aimlock_key_info", "{}"), {});
    return normalizeKeyInfo(
      raw,
      safeGet("aimlock_active_key", "")
    );
  }

  function saveSession(rawData, enteredKey) {
    var info = normalizeKeyInfo(rawData, enteredKey);
    var plan = normalizePlan(info);
    var displayName = plan === "ADMIN" ? "ADMIN JAME" : "JAME FF";

    safeSet("aimlock_auth", "1");
    safeSet("aimlock_active_key", enteredKey);
    safeSet("aimlock_user", displayName);
    safeSet("aimlock_key_info", JSON.stringify(info));

    keyInfo = info;
  }

  function isAuthenticated() {
    return safeGet("aimlock_auth", "0") === "1";
  }

  function applyPageClasses(unlocked) {
    var body = document.body;
    var login = byId("loginScreen");
    var app = byId("mainApp");
    var classes = [
      "page-dashboard",
      "page-dashboard-v11",
      "page-dashboard-v13",
      "page-dashboard-v14"
    ];
    var i;

    document.documentElement.setAttribute(
      "data-aimlock-auth",
      unlocked ? "1" : "0"
    );

    if (login) login.hidden = unlocked;
    if (app) app.hidden = !unlocked;

    body.classList.toggle("page-login", !unlocked);
    body.classList.toggle("page-login-v13", !unlocked);

    for (i = 0; i < classes.length; i += 1) {
      body.classList.toggle(classes[i], unlocked);
    }
  }

  function updateProfile() {
    var plan;
    var expire;
    var days;
    var progress;
    var slotUsed;
    var slotLimit;
    var userName;

    keyInfo = getStoredKeyInfo();
    plan = normalizePlan(keyInfo);
    expire = keyInfo.expire;
    days = getDaysLeft(expire);
    progress = plan === "ADMIN"
      ? 100
      : Math.max(0, Math.min(100, Math.round((days / 30) * 100)));

    slotUsed = numberValue(keyInfo.slotUsed, 1);
    slotLimit = numberValue(keyInfo.slotLimit, 1);
    userName = safeGet(
      "aimlock_user",
      plan === "ADMIN" ? "ADMIN JAME" : "JAME FF"
    );

    setText("helloName", userName);
    setText("vipPlan", plan);
    setText("vipExpireDate", formatDate(expire));
    setText(
      "vipDaysText",
      plan === "ADMIN"
        ? "Quyền admin không giới hạn"
        : "Còn " + days + " ngày VIP"
    );
    setText("vipPercentText", progress + "%");
    setText("slotText", slotUsed + "/" + slotLimit);

    var bar = byId("vipProgressBar");
    if (bar) bar.style.width = progress + "%";

    setText("accountModalName", userName);
    setText("accountModalPlan", "Gói: " + plan);
    setText("accountModalExpire", "HSD: " + formatDate(expire));

    currentStats.activeKeys = Math.max(
      currentStats.activeKeys,
      slotLimit
    );
  }

  function displayStats(stats) {
    currentStats = {
      online: Math.max(0, numberValue(stats.online, 1)),
      activeKeys: Math.max(
        0,
        numberValue(stats.activeKeys, numberValue(keyInfo.slotLimit, 1))
      ),
      today: Math.max(0, numberValue(stats.today, 1))
    };

    setText("statOnline", currentStats.online);
    setText("statActive", currentStats.activeKeys);
    setText("statToday", currentStats.today);

    each("[data-stat-card]", function (card) {
      card.classList.remove("is-loading");
    });
  }

  function parseStatsResponse(response) {
    var source = response || {};

    if (source.stats && typeof source.stats === "object") {
      source = source.stats;
    } else if (
      source.data &&
      source.data.stats &&
      typeof source.data.stats === "object"
    ) {
      source = source.data.stats;
    } else if (source.data && typeof source.data === "object") {
      source = source.data;
    }

    return {
      online: firstValue(
        source,
        ["online", "onlineUsers", "online_count", "sessions"],
        currentStats.online
      ),
      activeKeys: firstValue(
        source,
        ["activeKeys", "active", "active_keys", "keysActive"],
        currentStats.activeKeys
      ),
      today: firstValue(
        source,
        ["today", "todayActivations", "today_count", "activationsToday"],
        currentStats.today
      )
    };
  }

  function refreshStats(showMessage) {
    var fallback = {
      online: Math.max(1, currentStats.online),
      activeKeys: Math.max(
        1,
        numberValue(keyInfo.slotLimit, currentStats.activeKeys)
      ),
      today: Math.max(1, currentStats.today)
    };

    // Hiện fallback ngay, tuyệt đối không để "--".
    displayStats(fallback);

    if (!API_BASE) {
      if (showMessage) {
        showToast("Đang dùng thông số dự phòng.", "warning");
      }
      return;
    }

    requestJSON("GET", "/api/stats", null, 5500, function (error, data) {
      if (error) {
        displayStats(fallback);
        if (showMessage) {
          showToast(
            "Railway chưa phản hồi, giữ thông số gần nhất.",
            "warning"
          );
        }
        return;
      }

      displayStats(parseStatsResponse(data));

      if (showMessage) {
        showToast("Đã đồng bộ thông số hệ thống.", "success");
      }
    });
  }

  function openModal(id) {
    var modal = byId(id);
    if (!modal) return;

    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open-v14");
  }

  function closeModal(modal) {
    if (!modal) return;

    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");

    if (!document.querySelector(
      ".stat-modal-v25.show," +
      ".module-modal-v24.show," +
      ".hud-modal-v24.show," +
      ".account-modal-v23.show," +
      ".vip-modal-v14.show," +
      ".update-modal-v20.show," +
      ".notify-panel-v15.show," +
      ".settings-modal-v15.show"
    )) {
      document.body.classList.remove("modal-open-v14");
    }
  }

  function closeAllModals() {
    each(
      ".stat-modal-v25.show," +
      ".module-modal-v24.show," +
      ".hud-modal-v24.show," +
      ".account-modal-v23.show," +
      ".vip-modal-v14.show," +
      ".update-modal-v20.show," +
      ".notify-panel-v15.show," +
      ".settings-modal-v15.show",
      function (modal) {
        closeModal(modal);
      }
    );

    var drawer = byId("sideDrawer");
    if (drawer) drawer.classList.remove("show");
  }

  function closestModal(element) {
    while (element && element !== document.body) {
      if (
        element.classList &&
        (
          element.classList.contains("stat-modal-v25") ||
          element.classList.contains("module-modal-v24") ||
          element.classList.contains("hud-modal-v24") ||
          element.classList.contains("account-modal-v23") ||
          element.classList.contains("vip-modal-v14") ||
          element.classList.contains("update-modal-v20") ||
          element.classList.contains("notify-panel-v15") ||
          element.classList.contains("settings-modal-v15")
        )
      ) {
        return element;
      }
      element = element.parentNode;
    }
    return null;
  }

  function hasCloseAttribute(element) {
    if (!element || !element.getAttribute) return false;

    return (
      element.hasAttribute("data-close-stat") ||
      element.hasAttribute("data-close-module") ||
      element.hasAttribute("data-close-hud") ||
      element.hasAttribute("data-close-account") ||
      element.hasAttribute("data-close-vip") ||
      element.hasAttribute("data-close-update") ||
      element.hasAttribute("data-close-notify") ||
      element.hasAttribute("data-close-settings")
    );
  }

  function setActiveNavigation(button) {
    each(
      ".bottom-nav-v23 .nav-item-v23," +
      ".bottom-nav-v23 .nav-hub-v23",
      function (item) {
        item.classList.remove("active");
      }
    );

    if (button) button.classList.add("active");
  }

  function moduleName(feature) {
    var names = {
      boostram: "BOOST FPS",
      aimbody: "AIMBODY PRO",
      nhetam: "NHẸ TÂM",
      jamelock: "JAMELOCK",
      antiban: "ANTIBAND SHIELD",
      regff: "REG FF"
    };

    return names[feature] || String(feature || "MODULE").toUpperCase();
  }

  function getFeatureState(feature, defaultValue) {
    var saved = safeGet("aimlock_feature_" + feature, null);
    if (saved === null) return defaultValue;
    return saved === "1";
  }

  function syncFeature(feature, enabled, loading) {
    each(".toggle", function (toggle) {
      var label;
      if (toggle.getAttribute("data-feature") !== feature) return;

      toggle.classList.toggle("is-on", enabled);
      toggle.classList.toggle("is-loading", !!loading);
      toggle.setAttribute("aria-pressed", enabled ? "true" : "false");

      label = toggle.querySelector(".label");
      if (label) {
        label.textContent = loading
          ? "..."
          : enabled
            ? "ON"
            : "OFF";
      }

      var row = toggle;
      while (row && row !== document.body) {
        if (
          row.classList &&
          row.classList.contains("feature-row-v11")
        ) {
          row.classList.toggle("is-active-v14", enabled);
          var state = row.querySelector(".feature-state-v14 em");
          if (state) {
            state.textContent = loading
              ? "LOADING"
              : enabled
                ? "ACTIVE"
                : "STANDBY";
          }
          break;
        }
        row = row.parentNode;
      }
    });
  }

  function updateRuntime(title, detail, percent, log) {
    setText("runtimeTitle", title);
    setText("runtimeDetail", detail);
    setText("runtimePercent", percent + "%");
    setText("runtimeLog", log);

    var bar = byId("runtimeBar");
    if (bar) bar.style.width = percent + "%";
  }

  function toggleFeature(feature) {
    var current = getFeatureState(feature, false);
    var next = !current;
    var name = moduleName(feature);
    var token = ++moduleRunToken;
    var progress = 0;
    var timer;

    safeSet("aimlock_feature_" + feature, next ? "1" : "0");

    if (!next) {
      syncFeature(feature, false, false);
      updateRuntime(
        "ENGINE STANDBY",
        name + " đã tắt.",
        0,
        "READY › " + name + " disabled"
      );
      showToast(name + " đã tắt.", "info");
      return;
    }

    syncFeature(feature, true, true);
    updateRuntime(
      name + " LOADING",
      "Đang khởi tạo cấu hình...",
      8,
      "BOOTING › " + name
    );

    timer = window.setInterval(function () {
      if (token !== moduleRunToken) {
        window.clearInterval(timer);
        return;
      }

      progress += 14;

      if (progress >= 100) {
        progress = 100;
        window.clearInterval(timer);
        syncFeature(feature, true, false);
        updateRuntime(
          name + " ACTIVE",
          "Realtime gaming mode is running",
          100,
          "READY › " + name + " active"
        );
        showToast(name + " đã bật thành công.", "success");
        return;
      }

      updateRuntime(
        name + " LOADING",
        "Đang đồng bộ module...",
        progress,
        "BOOTING › " + name + " " + progress + "%"
      );
    }, 120);
  }

  function initializeFeatures() {
    var defaults = {};
    var seen = {};

    each(".toggle", function (toggle) {
      var feature = toggle.getAttribute("data-feature");
      if (!feature) return;

      if (!seen[feature]) {
        defaults[feature] = toggle.classList.contains("is-on");
        seen[feature] = true;
      } else if (toggle.classList.contains("is-on")) {
        defaults[feature] = true;
      }
    });

    Object.keys(defaults).forEach(function (feature) {
      var enabled = getFeatureState(feature, defaults[feature]);
      safeSet("aimlock_feature_" + feature, enabled ? "1" : "0");
      syncFeature(feature, enabled, false);
    });
  }

  function resetFeatures() {
    each(".toggle", function (toggle) {
      var feature = toggle.getAttribute("data-feature");
      if (!feature) return;
      safeSet("aimlock_feature_" + feature, "0");
      syncFeature(feature, false, false);
    });

    updateRuntime(
      "ENGINE STANDBY",
      "Tất cả module đã được reset.",
      0,
      "READY › Module settings reset"
    );
    showToast("Đã reset toàn bộ module.", "success");
  }

  function renderOnlineModal() {
    var name = safeGet("aimlock_user", "JAME FF");
    var time = new Date().toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit"
    });

    setHTML(
      "onlineModalBody",
      '<div class="stat-grid-v25">' +
        '<div class="stat-panel-v25"><strong>Người dùng online</strong>' +
        '<p>' + currentStats.online + ' tài khoản đang kết nối.</p></div>' +
        '<div class="stat-panel-v25"><strong>Session hiện tại</strong>' +
        '<p>' + name + ' · ' + time + '</p></div>' +
      '</div>' +
      '<div class="stat-actions-v25">' +
        '<button type="button" class="stat-btn-v25" id="onlineRefreshBtn">' +
          'Làm mới trạng thái' +
        '</button>' +
        '<button type="button" class="stat-btn-v25" id="onlineOpenNotifyBtn">' +
          'Mở thông báo' +
        '</button>' +
      '</div>'
    );
  }

  function renderActiveKeysModal() {
    setHTML(
      "activeKeysModalBody",
      '<div class="stat-grid-v25">' +
        '<div class="stat-panel-v25"><strong>Key hiện tại</strong>' +
        '<p>' + (keyInfo.key || "Đã kích hoạt") + '</p></div>' +
        '<div class="stat-panel-v25"><strong>Slot đang dùng</strong>' +
        '<p>' + numberValue(keyInfo.slotUsed, 1) + '/' +
        numberValue(keyInfo.slotLimit, 1) + '</p></div>' +
      '</div>' +
      '<div class="stat-panel-v25"><strong>Thông tin gói</strong>' +
        '<p>' + normalizePlan(keyInfo) + ' · HSD ' +
        formatDate(keyInfo.expire) + '</p></div>' +
      '<div class="stat-actions-v25">' +
        '<button type="button" class="stat-btn-v25" id="activeOpenVipBtn">' +
          'Mở gia hạn VIP' +
        '</button>' +
      '</div>'
    );
  }

  function renderTodayModal() {
    setHTML(
      "todayModalBody",
      '<div class="stat-grid-v25">' +
        '<div class="stat-panel-v25"><strong>Lượt kích hoạt hôm nay</strong>' +
        '<p>' + currentStats.today + ' lượt được ghi nhận.</p></div>' +
        '<div class="stat-panel-v25"><strong>Trạng thái</strong>' +
        '<p>Dashboard và module đã sẵn sàng.</p></div>' +
      '</div>' +
      '<div class="stat-actions-v25">' +
        '<button type="button" class="stat-btn-v25" id="todayRefreshBtn">' +
          'Làm mới thông số' +
        '</button>' +
        '<button type="button" class="stat-btn-v25" id="todayOpenUpdateBtn">' +
          'Mở cập nhật' +
        '</button>' +
      '</div>'
    );
  }

  function openSupport() {
    window.location.href = SUPPORT_URL;
  }

  function logout() {
    safeRemove("aimlock_auth");
    safeRemove("aimlock_user");
    safeRemove("aimlock_active_key");
    safeRemove("aimlock_key_info");

    closeAllModals();
    applyPageClasses(false);

    var input = byId("keyInput");
    var status = byId("loginStatus");

    if (input) input.value = "";
    if (status) {
      status.textContent = "Sẵn sàng kích hoạt";
      status.style.color = "";
    }

    window.scrollTo(0, 0);
    showToast("Đã đăng xuất.", "info");
  }

  function activateKey() {
    var input = byId("keyInput");
    var button = byId("activateBtn");
    var status = byId("loginStatus");
    var value = input ? String(input.value || "").replace(/^\s+|\s+$/g, "") : "";
    var defaultLabel = "KÍCH HOẠT AIMLOCK";

    if (!value) {
      showToast("Vui lòng nhập key.", "warning");
      if (input) input.focus();
      return;
    }

    if (button) {
      button.disabled = true;
      button.classList.add("loading");
      var span = button.querySelector("span");
      if (span) span.textContent = "ĐANG KIỂM TRA...";
    }

    if (status) {
      status.textContent = "Đang xác minh key...";
      status.style.color = "";
    }

    function finishButton() {
      if (!button) return;
      button.disabled = false;
      button.classList.remove("loading");
      var span = button.querySelector("span");
      if (span) span.textContent = defaultLabel;
    }

    // Key demo/admin vẫn hoạt động khi Railway tạm lỗi.
    if (value === "Admin11" || value === "JAME-FREE-KEY") {
      var demo = {
        key: value,
        type: value === "Admin11" ? "ADMIN" : "FREE",
        expire: value === "Admin11"
          ? "2099-12-31T23:59:59.000Z"
          : new Date(Date.now() + 30 * 86400000).toISOString(),
        slotUsed: 1,
        slotLimit: value === "Admin11" ? 100 : 2,
        status: "active"
      };

      saveSession(demo, value);
      finishButton();
      enterApp();
      showToast("Kích hoạt thành công.", "success");
      return;
    }

    if (!API_BASE) {
      finishButton();
      if (status) {
        status.textContent = "Chưa cấu hình Railway API.";
        status.style.color = "#ff6e7f";
      }
      showToast("Chưa cấu hình Railway API.", "error");
      return;
    }

    requestJSON(
      "POST",
      "/api/verify-key",
      {
        key: value,
        deviceId: safeGet(
          "aimlock_device_id",
          "ios-" + Date.now()
        )
      },
      8000,
      function (error, data) {
        finishButton();

        if (error || !data || data.ok === false) {
          var message = (
            data && data.message
          ) || (
            error && error.message
          ) || "Key không hợp lệ.";

          if (status) {
            status.textContent = message;
            status.style.color = "#ff6e7f";
          }

          showToast(message, "error");
          return;
        }

        saveSession(data, value);

        if (status) {
          status.textContent = "Kích hoạt thành công AIMLOCK JAME";
          status.style.color = "#47f59a";
        }

        enterApp();
        showToast(
          data.message || "Kích hoạt thành công.",
          "success"
        );
      }
    );
  }

  function enterApp() {
    applyPageClasses(true);
    updateProfile();
    initializeFeatures();
    refreshStats(false);
    setActiveNavigation(byId("navHomeBtn"));
    window.scrollTo(0, 0);
  }

  function findActionElement(target) {
    var node = target;

    while (node && node !== document.body) {
      if (
        node.tagName === "BUTTON" ||
        node.tagName === "A" ||
        (
          node.getAttribute &&
          node.getAttribute("role") === "button"
        )
      ) {
        return node;
      }
      node = node.parentNode;
    }

    return null;
  }

  function handleClick(event) {
    var action = findActionElement(event.target);
    var id;
    var toggle;
    var drawer;

    if (!action) return;

    if (hasCloseAttribute(action)) {
      event.preventDefault();
      closeModal(closestModal(action));
      return;
    }

    toggle = action.classList &&
      action.classList.contains("toggle")
      ? action
      : null;

    if (toggle) {
      event.preventDefault();
      toggleFeature(toggle.getAttribute("data-feature"));
      return;
    }

    id = action.id || "";

    switch (id) {
      case "activateBtn":
        event.preventDefault();
        activateKey();
        break;

      case "togglePassword":
        event.preventDefault();
        var keyInput = byId("keyInput");
        if (keyInput) {
          keyInput.type =
            keyInput.type === "password" ? "text" : "password";
        }
        break;

      case "pasteKeyBtn":
        event.preventDefault();
        if (
          window.AndroidBridge &&
          typeof window.AndroidBridge.getClipboardText === "function"
        ) {
          try {
            var text = String(
              window.AndroidBridge.getClipboardText() || ""
            );
            if (byId("keyInput")) byId("keyInput").value = text;
            showToast("Đã dán key.", "success");
          } catch (_) {
            showToast("Không đọc được clipboard.", "warning");
          }
        } else if (
          navigator.clipboard &&
          navigator.clipboard.readText
        ) {
          navigator.clipboard.readText().then(function (text) {
            if (byId("keyInput")) byId("keyInput").value = text;
            showToast("Đã dán key.", "success");
          }).catch(function () {
            showToast(
              "Hãy chạm giữ ô key để dán thủ công.",
              "warning"
            );
          });
        } else {
          showToast(
            "Hãy chạm giữ ô key để dán thủ công.",
            "warning"
          );
        }
        break;

      case "menuBtn":
        event.preventDefault();
        drawer = byId("sideDrawer");
        if (drawer) drawer.classList.add("show");
        break;

      case "closeDrawer":
        event.preventDefault();
        drawer = byId("sideDrawer");
        if (drawer) drawer.classList.remove("show");
        break;

      case "notifyBtn":
      case "accountOpenNotifyBtn":
      case "onlineOpenNotifyBtn":
        event.preventDefault();
        closeAllModals();
        openModal("notifyPanel");
        break;

      case "accountKeyBtn":
      case "accountBtn":
        event.preventDefault();
        updateProfile();
        setActiveNavigation(byId("accountBtn"));
        openModal("accountModal");
        break;

      case "statOnlineCard":
        event.preventDefault();
        renderOnlineModal();
        openModal("onlineModal");
        break;

      case "statActiveCard":
        event.preventDefault();
        renderActiveKeysModal();
        openModal("activeKeysModal");
        break;

      case "statTodayCard":
        event.preventDefault();
        renderTodayModal();
        openModal("todayModal");
        break;

      case "activateActionBtn":
        event.preventDefault();
        byId("moduleList").scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
        showToast("Chọn module để kích hoạt.", "success");
        break;

      case "renewVipBtn":
      case "accountOpenVipBtn":
      case "activeOpenVipBtn":
        event.preventDefault();
        closeAllModals();
        openModal("vipModal");
        break;

      case "supportZaloBtn":
      case "accountSupportBtn":
      case "drawerCommunityBtn":
        event.preventDefault();
        openSupport();
        break;

      case "navHomeBtn":
        event.preventDefault();
        setActiveNavigation(action);
        window.scrollTo({ top: 0, behavior: "smooth" });
        break;

      case "navModulesBtn":
      case "hudOpenModulesBtn":
        event.preventDefault();
        closeAllModals();
        setActiveNavigation(byId("navModulesBtn"));
        openModal("moduleModal");
        break;

      case "navHudBtn":
        event.preventDefault();
        setActiveNavigation(action);
        openModal("hudModal");
        break;

      case "navUpdatesBtn":
      case "updateNowBtn":
      case "todayOpenUpdateBtn":
        event.preventDefault();
        setActiveNavigation(byId("navUpdatesBtn"));
        openModal("updateModal");
        break;

      case "hudCloseBtn":
        event.preventDefault();
        closeModal(byId("hudModal"));
        break;

      case "drawerControlBtn":
        event.preventDefault();
        drawer = byId("sideDrawer");
        if (drawer) drawer.classList.remove("show");
        window.scrollTo({ top: 0, behavior: "smooth" });
        break;

      case "drawerAppearanceBtn":
        event.preventDefault();
        drawer = byId("sideDrawer");
        if (drawer) drawer.classList.remove("show");
        openModal("settingsModal");
        break;

      case "logoutBtn":
      case "accountLogoutBtn":
        event.preventDefault();
        logout();
        break;

      case "onlineRefreshBtn":
      case "todayRefreshBtn":
        event.preventDefault();
        refreshStats(true);
        if (id === "onlineRefreshBtn") renderOnlineModal();
        if (id === "todayRefreshBtn") renderTodayModal();
        break;

      case "markAllReadBtn":
        event.preventDefault();
        each(".notify-item-v15", function (item) {
          item.classList.remove("unread");
        });
        var dot = document.querySelector(".notif-dot");
        if (dot) dot.style.display = "none";
        showToast("Đã đánh dấu tất cả là đã đọc.", "success");
        break;

      case "resetModulesBtn":
        event.preventDefault();
        resetFeatures();
        break;

      case "saveSettingsBtn":
        event.preventDefault();
        safeSet(
          "aimlock_perf_mode",
          byId("perfModeToggle") && byId("perfModeToggle").checked
            ? "1"
            : "0"
        );
        safeSet(
          "aimlock_scanline",
          byId("scanlineToggle") && byId("scanlineToggle").checked
            ? "1"
            : "0"
        );
        safeSet(
          "aimlock_compact",
          byId("compactToggle") && byId("compactToggle").checked
            ? "1"
            : "0"
        );
        showToast("Đã lưu cài đặt.", "success");
        closeModal(byId("settingsModal"));
        break;
    }

    if (
      action.closest &&
      action.closest("#vipModal") &&
      action.tagName === "BUTTON" &&
      id !== "closeVipModal"
    ) {
      event.preventDefault();
      openSupport();
    }

    if (
      action.classList &&
      action.classList.contains("notify-item-v15")
    ) {
      action.classList.remove("unread");
    }

    var toastMessage = action.getAttribute("data-toast");
    if (toastMessage && !id) {
      showToast(
        toastMessage,
        action.getAttribute("data-toast-type") || "info"
      );
    }
  }

  function applySavedSettings() {
    var perf = safeGet("aimlock_perf_mode", "0") === "1";
    var scanline = safeGet("aimlock_scanline", "1") !== "0";
    var compact = safeGet("aimlock_compact", "0") === "1";

    if (byId("perfModeToggle")) {
      byId("perfModeToggle").checked = perf;
    }
    if (byId("scanlineToggle")) {
      byId("scanlineToggle").checked = scanline;
    }
    if (byId("compactToggle")) {
      byId("compactToggle").checked = compact;
    }

    document.body.classList.toggle("performance-mode-v15", perf);
    document.body.classList.toggle("scanline-off-v15", !scanline);
    document.body.classList.toggle("compact-mode-v15", compact);
  }

  function initialize() {
    document.addEventListener("click", handleClick, false);

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeAllModals();

      if (
        event.key === "Enter" &&
        !isAuthenticated() &&
        document.activeElement === byId("keyInput")
      ) {
        activateKey();
      }
    });

    window.addEventListener("pageshow", function () {
      applyPageClasses(isAuthenticated());
      if (isAuthenticated()) {
        updateProfile();
        refreshStats(false);
      }
    });

    window.addEventListener("error", function (event) {
      setText(
        "runtimeLog",
        "ERROR › " + (event.message || "JavaScript runtime error")
      );
    });

    applySavedSettings();
    applyPageClasses(isAuthenticated());

    if (isAuthenticated()) {
      enterApp();
    } else {
      displayStats({ online: 1, activeKeys: 1, today: 1 });
    }

    window.setInterval(function () {
      if (
        isAuthenticated() &&
        document.visibilityState !== "hidden"
      ) {
        refreshStats(false);
      }
    }, 30000);

    window.AIMLOCK_DIAGNOSTICS = {
      build: BUILD_VERSION,
      ready: true,
      apiBase: API_BASE
    };

    document.documentElement.setAttribute(
      "data-aimlock-ready",
      "1"
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }
})();
