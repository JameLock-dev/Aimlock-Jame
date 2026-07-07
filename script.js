// ============================
// FF SUPPORT PANEL - UI ONLY
// ============================

const functions = [
    {
        icon: "🌐",
        title: "TỐI ƯU MẠNG",
        desc: "Hiển thị và theo dõi chất lượng kết nối."
    },
    {
        icon: "🛡️",
        title: "ANTIBAN",
        desc: "Chế độ bảo vệ mô phỏng cho tài khoản."
    },
    {
        icon: "🎯",
        title: "REG OB54",
        desc: "Tối ưu cấu hình mô phỏng cho phiên bản OB54."
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
        desc: "Hỗ trợ ngắm chuẩn mục tiêu dạng mô phỏng."
    },
    {
        icon: "💓",
        title: "CHẨN ĐOÁN HỆ THỐNG",
        desc: "Kiểm tra trạng thái hoạt động mô phỏng."
    }
];

const functionList = document.getElementById("functionList");

function createFunctionItem(itemData) {
    const item = document.createElement("article");
    item.className = "item";

    item.innerHTML = `
        <div class="item-left">
            <div class="icon-wrap">
                <div class="icon">${itemData.icon}</div>
            </div>

            <div class="text">
                <h3>${itemData.title}<span class="arrow">›</span></h3>
                <p>${itemData.desc}</p>
            </div>
        </div>

        <div class="state">
            <span class="status-label online">BẬT</span>

            <label class="switch" aria-label="Bật tắt ${itemData.title}">
                <input type="checkbox" checked />
                <span class="slider"></span>
            </label>
        </div>
    `;

    const checkbox = item.querySelector("input");
    const status = item.querySelector(".status-label");

    checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
            status.textContent = "BẬT";
            status.className = "status-label online";
            item.classList.remove("disabled");
        } else {
            status.textContent = "TẮT";
            status.className = "status-label offline";
            item.classList.add("disabled");
        }
    });

    return item;
}

functions.forEach((itemData) => {
    functionList.appendChild(createFunctionItem(itemData));
});

function updateClock() {
    const now = new Date();
    const clock = document.getElementById("clock");

    clock.textContent = now.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });

    document.title = "Hỗ trợ FF • " + clock.textContent;
}

updateClock();
setInterval(updateClock, 1000);
