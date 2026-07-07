const featureSteps = {
  network: ["Kiểm tra độ trễ mạng", "Ổn định luồng kết nối", "Cập nhật trạng thái phản hồi"],
  antiban: ["Kiểm tra phiên bảo vệ", "Đồng bộ trạng thái an toàn", "Ghi nhận báo cáo bảo vệ"],
  reg: ["Nạp cấu hình OB54", "Kiểm tra registry mô phỏng", "Hoàn tất tối ưu phiên bản"],
  monitor: ["Đọc CPU/RAM mô phỏng", "Kiểm tra độ trễ", "Cập nhật dashboard"],
  effects: ["Kích hoạt hiệu ứng panel", "Làm mượt chuyển động", "Áp dụng hiệu ứng hiển thị"],
  aimdoy: ["Làm mới dữ liệu", "Đồng bộ chỉ số", "Tạo báo cáo mới"],
  device: ["Đọc thông tin trình duyệt", "Kiểm tra màn hình", "Cập nhật hồ sơ thiết bị"],
  aimlock: ["Khởi tạo bộ ngắm mô phỏng", "Kiểm tra điểm neo tâm", "Hoàn tất trạng thái hỗ trợ"],
  diagnose: ["Quét trạng thái panel", "Kiểm tra lỗi mô phỏng", "Xuất báo cáo hệ thống"]
};

const featureNames = {
  network: "TỐI ƯU MẠNG",
  antiban: "ANTIBAN",
  reg: "REG OB54",
  monitor: "GIÁM SÁT HỆ THỐNG",
  effects: "HIỆU ỨNG GIAO DIỆN",
  aimdoy: "AIMDOY",
  device: "THÔNG TIN THIẾT BỊ",
  aimlock: "AIMLOCK",
  diagnose: "CHẨN ĐOÁN HỆ THỐNG"
};

const rows = [...document.querySelectorAll(".feature-row")];
const runAllBtn = document.getElementById("runAllBtn");
const refreshBtn = document.getElementById("refreshBtn");
const clearLogBtn = document.getElementById("clearLogBtn");
const onlineCount = document.getElementById("onlineCount");
const keyActive = document.getElementById("keyActive");
const activeCount = document.getElementById("activeCount");
const railwayStatus = document.getElementById("railwayStatus");
const updateTime = document.getElementById("updateTime");
const activityLog = document.getElementById("activityLog");
const activeTask = document.getElementById("activeTask");
const progressPercent = document.getElementById("progressPercent");
const progressFill = document.getElementById("progressFill");
const toast = document.getElementById("toast");
const deviceName = document.getElementById("deviceName");
const networkInfo = document.getElementById("networkInfo");
const batteryInfo = document.getElementById("batteryInfo");

let savedState = JSON.parse(localStorage.getItem("featureState") || "{}");
let runningTimer = null;

function pad(num) {
  return String(num).padStart(2, "0");
}

function nowTime() {
  const now = new Date();
  return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function addLog(type, message) {
  const line = document.createElement("div");
  line.className = `log-line ${type.toLowerCase()}`;
  line.textContent = `[${nowTime()}] [${type}] ${message}`;
  activityLog.prepend(line);

  const lines = activityLog.querySelectorAll(".log-line");
  if (lines.length > 80) lines[lines.length - 1].remove();
}

function setProgress(percent, text) {
  const value = Math.max(0, Math.min(100, percent));
  progressFill.style.width = `${value}%`;
  progressPercent.textContent = `${value}%`;
  activeTask.textContent = text;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  if (navigator.vibrate) {
    navigator.vibrate(35);
  }

  setTimeout(() => toast.classList.remove("show"), 2200);
}

function sendBrowserNotice(title, body) {
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    new Notification(title, { body });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        new Notification(title, { body });
      }
    });
  }
}

function saveState() {
  localStorage.setItem("featureState", JSON.stringify(savedState));
}

function updateDashboard() {
  const enabled = rows.filter((row) => row.querySelector("input").checked).length;
  onlineCount.textContent = Math.floor(Math.random() * 3);
  keyActive.textContent = 4;
  activeCount.textContent = enabled;
  railwayStatus.textContent = "ONLINE";
  updateTime.textContent = nowTime();
  document.title = `AIMLOCK JAME • ${nowTime()}`;
}

function runFeature(row) {
  const key = row.dataset.feature;
  const name = featureNames[key];
  const steps = featureSteps[key] || ["Đang chạy mô phỏng", "Cập nhật trạng thái", "Hoàn tất"];

  clearInterval(runningTimer);
  rows.forEach((item) => item.classList.remove("running"));
  row.classList.remove("done");
  row.classList.add("running");

  let progress = 0;
  let stepIndex = 0;
  const rowProgress = row.querySelector(".row-progress span");
  rowProgress.style.width = "0%";

  setProgress(0, `Đang khởi động ${name}...`);
  addLog("RUN", `${name} bắt đầu chạy.`);
  showToast(`${name} đang chạy...`);

  runningTimer = setInterval(() => {
    progress += Math.floor(Math.random() * 17) + 10;

    if (stepIndex < steps.length) {
      addLog("CHECK", steps[stepIndex]);
      stepIndex++;
    }

    if (progress >= 100) {
      progress = 100;
      clearInterval(runningTimer);

      row.classList.remove("running");
      row.classList.add("done");
      rowProgress.style.width = "100%";
      setProgress(100, `${name} đã hoạt động.`);
      addLog("OK", `${name} đã hoạt động và báo cáo về máy.`);
      showToast(`${name} đã bật thành công`);
      sendBrowserNotice("AIMLOCK JAME", `${name} đã bật thành công.`);
      updateDashboard();
      return;
    }

    rowProgress.style.width = `${progress}%`;
    setProgress(progress, `Đang xử lý ${name}...`);
  }, 480);
}

function setupRows() {
  rows.forEach((row) => {
    const key = row.dataset.feature;
    const checkbox = row.querySelector("input");
    const badge = row.querySelector(".badge-state");
    const goBtn = row.querySelector(".go-btn");
    const rowProgress = row.querySelector(".row-progress span");

    if (savedState[key] === false) {
      checkbox.checked = false;
      badge.textContent = "TẮT";
      row.classList.add("is-off");
      rowProgress.style.width = "0%";
    }

    checkbox.addEventListener("change", () => {
      savedState[key] = checkbox.checked;
      saveState();

      if (checkbox.checked) {
        row.classList.remove("is-off");
        badge.textContent = "BẬT";
        runFeature(row);
      } else {
        row.classList.add("is-off");
        row.classList.remove("running", "done");
        badge.textContent = "TẮT";
        rowProgress.style.width = "0%";
        addLog("WARN", `${featureNames[key]} đã tắt. Trạng thái đã lưu vào máy.`);
        showToast(`${featureNames[key]} đã tắt`);
        updateDashboard();
      }
    });

    goBtn.addEventListener("click", () => {
      if (!checkbox.checked) {
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event("change"));
      } else {
        runFeature(row);
      }
    });
  });
}

function detectDevice() {
  const platform = navigator.platform || "Unknown";
  const width = window.screen?.width || window.innerWidth;
  const height = window.screen?.height || window.innerHeight;
  deviceName.textContent = `${platform} • ${width}x${height}`;

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (connection) {
    const type = connection.effectiveType ? connection.effectiveType.toUpperCase() : "ONLINE";
    const downlink = connection.downlink ? `${connection.downlink} Mbps` : "Đang kết nối";
    networkInfo.textContent = `${type} • ${downlink}`;
  } else {
    networkInfo.textContent = navigator.onLine ? "ONLINE" : "OFFLINE";
  }

  if (navigator.getBattery) {
    navigator.getBattery().then((battery) => {
      const updateBattery = () => {
        batteryInfo.textContent = `${Math.round(battery.level * 100)}%${battery.charging ? " • Sạc" : ""}`;
      };
      updateBattery();
      battery.addEventListener("levelchange", updateBattery);
      battery.addEventListener("chargingchange", updateBattery);
    });
  }
}

runAllBtn.addEventListener("click", () => {
  const enabledRows = rows.filter((row) => row.querySelector("input").checked);
  let index = 0;

  addLog("SYNC", "Bắt đầu chạy tất cả tính năng đang bật.");
  showToast("Đang chạy tất cả tính năng...");

  function runNext() {
    if (index >= enabledRows.length) {
      addLog("OK", "Toàn bộ tính năng đang bật đã chạy xong.");
      return;
    }

    runFeature(enabledRows[index]);
    index++;
    setTimeout(runNext, 1900);
  }

  runNext();
});

refreshBtn.addEventListener("click", () => {
  updateDashboard();
  addLog("SYNC", "Dashboard đã được làm mới thủ công.");
  showToast("Đã làm mới dashboard");
});

clearLogBtn.addEventListener("click", () => {
  activityLog.innerHTML = `<div class="log-line muted">[SYSTEM] Log đã được xóa. Panel sẵn sàng.</div>`;
  setProgress(0, "Chờ bật tính năng...");
  rows.forEach((row) => {
    row.classList.remove("running", "done");
    row.querySelector(".row-progress span").style.width = "0%";
  });
});

window.addEventListener("online", () => {
  networkInfo.textContent = "ONLINE";
  addLog("NET", "Thiết bị đã online.");
});

window.addEventListener("offline", () => {
  networkInfo.textContent = "OFFLINE";
  addLog("NET", "Thiết bị mất kết nối.");
});

setupRows();
detectDevice();
updateDashboard();
setInterval(updateDashboard, 3000);

/* SUPPORT MENU ACTIONS */

const sideMenu = document.getElementById("sideMenu");
const menuBtn = document.querySelector(".menu-btn");
const closeMenuBtn = document.getElementById("closeMenuBtn");
const getKeyBtn = document.getElementById("getKeyBtn");
const logoutBtn = document.getElementById("logoutBtn");

function openSupportMenu() {
  sideMenu.classList.add("open");
  document.body.classList.add("menu-open");
  sideMenu.setAttribute("aria-hidden", "false");
}

function closeSupportMenu() {
  sideMenu.classList.remove("open");
  document.body.classList.remove("menu-open");
  sideMenu.setAttribute("aria-hidden", "true");
}

if (menuBtn) {
  menuBtn.addEventListener("click", openSupportMenu);
}

if (closeMenuBtn) {
  closeMenuBtn.addEventListener("click", closeSupportMenu);
}

if (sideMenu) {
  sideMenu.addEventListener("click", (event) => {
    if (event.target === sideMenu) {
      closeSupportMenu();
    }
  });
}

if (getKeyBtn) {
  getKeyBtn.addEventListener("click", () => {
    addLog("KEY", "Người dùng bấm Get Key Free.");
    showToast("Đang mở Get Key Free...");
    setTimeout(() => {
      window.open("https://www.tiktok.com/@jame.ff.11", "_blank", "noopener");
    }, 350);
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    addLog("WARN", "Người dùng đã chọn đăng xuất app.");
    showToast("Đã đăng xuất App");
    closeSupportMenu();
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeSupportMenu();
  }
});
