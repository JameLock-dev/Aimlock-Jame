const functions = [
    { icon: "🌐", title: "TỐI ƯU MẠNG", desc: "Hiển thị và theo dõi chất lượng kết nối." },
    { icon: "🛡️", title: "ANTIBAN", desc: "Giảm nguy cơ bị phát hiện và khóa tài khoản." },
    { icon: "🎯", title: "REG OB54", desc: "Tối ưu và chỉnh sửa registry cho phiên bản OB54." },
    { icon: "📊", title: "GIÁM SÁT HỆ THỐNG", desc: "Theo dõi CPU, RAM và độ trễ theo thời gian." },
    { icon: "🎮", title: "HIỆU ỨNG GIAO DIỆN", desc: "Bật hoặc tắt các hiệu ứng hiển thị." },
    { icon: "🔄", title: "AIMDOY", desc: "Làm mới dữ liệu mô phỏng của dashboard." },
    { icon: "📱", title: "THÔNG TIN THIẾT BỊ", desc: "Hiển thị thông tin mô phỏng về thiết bị." },
    { icon: "◎", title: "AIMLOCK", desc: "Hỗ trợ ngắm chuẩn mục tiêu." },
    { icon: "💓", title: "CHẨN ĐOÁN HỆ THỐNG", desc: "Kiểm tra trạng thái hoạt động mô phỏng." }
];

const functionList = document.getElementById("functionList");

function renderFunctions() {{
    functionList.innerHTML = "";

    functions.forEach((itemData) => {{
        const item = document.createElement("article");
        item.className = "function-item";

        item.innerHTML = `
            <div class="function-left">
                <div class="function-icon-wrap">
                    <div class="function-icon">${{itemData.icon}}</div>
                </div>

                <div class="function-text">
                    <h4>${{itemData.title}} <span class="arrow">›</span></h4>
                    <p>${{itemData.desc}}</p>
                </div>
            </div>

            <div class="function-state">
                <span class="status-label online">BẬT</span>
                <label class="switch" aria-label="Bật tắt ${{itemData.title}}">
                    <input type="checkbox" checked />
                    <span class="slider"></span>
                </label>
            </div>
        `;

        const checkbox = item.querySelector("input");
        const status = item.querySelector(".status-label");

        checkbox.addEventListener("change", () => {{
            if (checkbox.checked) {{
                status.textContent = "BẬT";
                status.className = "status-label online";
                item.classList.remove("disabled");
            }} else {{
                status.textContent = "TẮT";
                status.className = "status-label offline";
                item.classList.add("disabled");
            }}
        }});

        functionList.appendChild(item);
    }});
}}

const onlineCount = document.getElementById("onlineCount");
const keyActive = document.getElementById("keyActive");
const todayCount = document.getElementById("todayCount");
const railwayStatus = document.getElementById("railwayStatus");
const updateTime = document.getElementById("updateTime");
const refreshBtn = document.getElementById("refreshBtn");

function pad(value) {{
    return String(value).padStart(2, "0");
}}

function formatTime(date) {{
    return `${{pad(date.getHours())}}:${{pad(date.getMinutes())}}:${{pad(date.getSeconds())}}`;
}}

function randomBetween(min, max) {{
    return Math.floor(Math.random() * (max - min + 1)) + min;
}}

function updateDashboard() {{
    const now = new Date();
    onlineCount.textContent = randomBetween(0, 8);
    keyActive.textContent = 4;
    todayCount.textContent = randomBetween(0, 9);
    railwayStatus.textContent = "Online";
    updateTime.textContent = formatTime(now);
    document.title = `AIMLOCK JAME • ${{formatTime(now)}}`;
}}

refreshBtn.addEventListener("click", updateDashboard);

renderFunctions();
updateDashboard();
setInterval(updateDashboard, 3000);
