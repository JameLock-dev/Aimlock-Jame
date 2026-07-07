const functions = [
    {
        icon: "🌐",
        title: "TỐI ƯU MẠNG",
        desc: "Hiển thị và theo dõi chất lượng kết nối."
    },
    {
        icon: "🛡️",
        title: "ANTIBAN",
        desc: "Giảm nguy cơ bị phát hiện và khóa tài khoản."
    },
    {
        icon: "🎯",
        title: "REG OB54",
        desc: "Tối ưu và chỉnh sửa registry cho phiên bản OB54."
    },
    {
        icon: "📊",
        title: "GIÁM SÁT HỆ THỐNG",
        desc: "Theo dõi CPU, RAM và độ trễ theo thời gian."
    },
    {
        icon: "🎮",
        title: "HIỆU ỨNG GIAO DIỆN",
        desc: "Bật hoặc tắt các hiệu ứng hiển thị."
    },
    {
        icon: "🔄",
        title: "AIMDOY",
        desc: "Làm mới dữ liệu mô phỏng của dashboard."
    },
    {
        icon: "📱",
        title: "THÔNG TIN THIẾT BỊ",
        desc: "Hiển thị thông tin mô phỏng về thiết bị."
    },
    {
        icon: "◎",
        title: "AIMLOCK",
        desc: "Hỗ trợ ngắm chuẩn mục tiêu."
    },
    {
        icon: "💓",
        title: "CHẨN ĐOÁN HỆ THỐNG",
        desc: "Kiểm tra trạng thái hoạt động mô phỏng."
    }
];

const functionList = document.getElementById("functionList");

function createItem(data) {
    const item = document.createElement("article");
    item.className = "feature-item";

    item.innerHTML = `
        <div class="item-left">
            <div class="icon-ring">
                <div class="icon">${data.icon}</div>
            </div>

            <div class="item-text">
                <h4>${data.title}<span>›</span></h4>
                <p>${data.desc}</p>
            </div>
        </div>

        <div class="state">
            <span class="status-label online">BẬT</span>

            <label class="switch" aria-label="Bật tắt ${data.title}">
                <input type="checkbox" checked>
                <span class="slider"></span>
            </label>
        </div>
    `;

    const checkbox = item.querySelector("input");
    const label = item.querySelector(".status-label");

    checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
            label.textContent = "BẬT";
            label.className = "status-label online";
            item.classList.remove("off");
        } else {
            label.textContent = "TẮT";
            label.className = "status-label offline";
            item.classList.add("off");
        }
    });

    return item;
}

functions.forEach((item) => {
    functionList.appendChild(createItem(item));
});

const onlineCount = document.getElementById("onlineCount");
const keyActive = document.getElementById("keyActive");
const updateTime = document.getElementById("updateTime");
const refreshBtn = document.getElementById("refreshBtn");

function pad(number) {
    return String(number).padStart(2, "0");
}

function getTime() {
    const now = new Date();
    return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function updateDashboard() {
    onlineCount.textContent = Math.floor(Math.random() * 9);
    keyActive.textContent = 4;
    updateTime.textContent = getTime();
    document.title = `AIMLOCK JAME • ${getTime()}`;
}

refreshBtn.addEventListener("click", updateDashboard);

updateDashboard();
setInterval(updateDashboard, 3000);
