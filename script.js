const features = [
  {
    title: "TỐI ƯU MẠNG",
    desc: "Hiển thị và theo dõi chất lượng kết nối.",
    icon: `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="2"/>
        <path d="M3.5 12h17M12 3.5c2.2 2.3 3.4 5.3 3.4 8.5s-1.2 6.2-3.4 8.5M12 3.5c-2.2 2.3-3.4 5.3-3.4 8.5s1.2 6.2 3.4 8.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </svg>`
  },
  {
    title: "ANTIBAN",
    desc: "Giảm nguy cơ bị phát hiện và khóa tài khoản.",
    icon: `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 3l7 3v5c0 4.5-2.8 7.8-7 10c-4.2-2.2-7-5.5-7-10V6l7-3Z" stroke="currentColor" stroke-width="2"/>
        <path d="M12 7v5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M12 15h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>`
  },
  {
    title: "REG OB54",
    desc: "Tối ưu và chỉnh sửa registry cho phiên bản OB54.",
    icon: `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
        <circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="2"/>
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>`
  },
  {
    title: "GIÁM SÁT HỆ THỐNG",
    desc: "Theo dõi CPU, RAM và độ trễ theo thời gian.",
    icon: `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 19V10M10 19V6M15 19v-8M20 19V4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M3 19h18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
      </svg>`
  },
  {
    title: "HIỆU ỨNG GIAO DIỆN",
    desc: "Bật hoặc tắt các hiệu ứng hiển thị.",
    icon: `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M8 9h.01M16 9h.01M8 15h.01M16 15h.01" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M6.5 7.5h11a2.5 2.5 0 0 1 2.5 2.5v4a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 14v-4a2.5 2.5 0 0 1 2.5-2.5Z" stroke="currentColor" stroke-width="2"/>
      </svg>`
  },
  {
    title: "AIMDOY",
    desc: "Làm mới dữ liệu mô phỏng của dashboard.",
    icon: `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M20 7v5h-5M4 17v-5h5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M7 8.5A8 8 0 0 1 20 12M17 15.5A8 8 0 0 1 4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>`
  },
  {
    title: "THÔNG TIN THIẾT BỊ",
    desc: "Hiển thị thông tin mô phỏng về thiết bị.",
    icon: `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="7" y="3.5" width="10" height="17" rx="2" stroke="currentColor" stroke-width="2"/>
        <path d="M10 7h4M10 10h4M10 13h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        <circle cx="12" cy="17.5" r="0.8" fill="currentColor"/>
      </svg>`
  },
  {
    title: "AIMLOCK",
    desc: "Hỗ trợ ngắm chuẩn mục tiêu.",
    icon: `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
        <circle cx="12" cy="12" r="7.5" stroke="currentColor" stroke-width="2"/>
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>`
  },
  {
    title: "CHẨN ĐOÁN HỆ THỐNG",
    desc: "Kiểm tra trạng thái hoạt động mô phỏng.",
    icon: `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 3l7 3v5c0 4.5-2.8 7.8-7 10c-4.2-2.2-7-5.5-7-10V6l7-3Z" stroke="currentColor" stroke-width="2"/>
        <path d="M7.5 13h2l1.2-3l2.2 6l1.5-3H17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`
  }
];

const functionList = document.getElementById("functionList");
const refreshBtn = document.getElementById("refreshBtn");
const onlineCount = document.getElementById("onlineCount");
const keyActive = document.getElementById("keyActive");
const todayCount = document.getElementById("todayCount");
const railwayStatus = document.getElementById("railwayStatus");
const updateTime = document.getElementById("updateTime");

function renderFeatures() {
  functionList.innerHTML = "";

  features.forEach((item) => {
    const row = document.createElement("article");
    row.className = "feature-row";

    row.innerHTML = `
      <div class="feature-left">
        <div class="feature-icon">${item.icon}</div>

        <div class="feature-text">
          <h4>${item.title}</h4>
          <p>${item.desc}</p>
        </div>
      </div>

      <div class="feature-right">
        <span class="badge-state">BẬT</span>

        <label class="switch" aria-label="Bật tắt ${item.title}">
          <input type="checkbox" checked>
          <span class="slider"></span>
        </label>

        <button class="go-btn" type="button" aria-label="Mở ${item.title}">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 6l6 6l-6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    `;

    const checkbox = row.querySelector("input");
    const badge = row.querySelector(".badge-state");

    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        row.classList.remove("is-off");
        badge.textContent = "BẬT";
      } else {
        row.classList.add("is-off");
        badge.textContent = "TẮT";
      }
    });

    functionList.appendChild(row);
  });
}

function pad(num) {
  return String(num).padStart(2, "0");
}

function nowTime() {
  const now = new Date();
  return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function updateDashboard() {
  onlineCount.textContent = Math.floor(Math.random() * 3);
  keyActive.textContent = 4;
  todayCount.textContent = Math.floor(Math.random() * 3);
  railwayStatus.textContent = "ONLINE";
  updateTime.textContent = nowTime();
  document.title = `AIMLOCK JAME • ${nowTime()}`;
}

refreshBtn.addEventListener("click", updateDashboard);

renderFeatures();
updateDashboard();
setInterval(updateDashboard, 3000);
