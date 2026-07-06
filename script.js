// ====== Lấy phần tử ======
const canvas = document.getElementById("chart");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = 220;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// ====== Dữ liệu mô phỏng ======
let cpu = [];
let ram = [];
let ping = [];

for (let i = 0; i < 60; i++) {
    cpu.push(40 + Math.random() * 20);
    ram.push(35 + Math.random() * 20);
    ping.push(10 + Math.random() * 15);
}

// ====== Vẽ đường ======
function veDuong(data, color) {

    ctx.beginPath();

    ctx.strokeStyle = color;

    ctx.lineWidth = 3;

    data.forEach((value, index) => {

        const x = index * (canvas.width / (data.length - 1));

        const y = canvas.height - value * 3;

        if (index === 0)
            ctx.moveTo(x, y);
        else
            ctx.lineTo(x, y);

    });

    ctx.stroke();

}

// ====== Vẽ biểu đồ ======
function veBieuDo() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    veDuong(cpu, "#00d4ff");

    veDuong(ram, "#ffae00");

    veDuong(ping, "#00ff88");

}

// ====== Cập nhật dữ liệu ======
function capNhat() {

    cpu.shift();
    ram.shift();
    ping.shift();

    cpu.push(35 + Math.random() * 30);

    ram.push(30 + Math.random() * 35);

    ping.push(8 + Math.random() * 18);

    veBieuDo();

    const cpuValue = Math.round(cpu[cpu.length - 1]);
    const ramValue = Math.round(ram[ram.length - 1]);
    const pingValue = Math.round(ping[ping.length - 1]);

    document.getElementById("cpu").innerText = cpuValue + "%";
    document.getElementById("ram").innerText = ramValue + "%";
    document.getElementById("ping").innerText = pingValue + " ms";

    document.getElementById("cpuTop").innerText = cpuValue + "%";
    document.getElementById("ramTop").innerText = ramValue + "%";
    document.getElementById("pingTop").innerText = pingValue + " ms";

}

veBieuDo();

setInterval(capNhat, 1000);

// ====== Danh sách chức năng ======
const danhSach = [

    "Chế độ hiệu năng",

    "Tối ưu mạng",

    "Tiết kiệm pin",

    "Dọn dẹp bộ nhớ",

    "Giám sát hệ thống",

    "Hiệu ứng giao diện",

    "Làm mới dữ liệu",

    "Thông tin thiết bị",

    "Chế độ ban đêm",

    "Chẩn đoán"

];

const functionList = document.getElementById("functionList");

danhSach.forEach((ten) => {

    const item = document.createElement("div");

    item.className = "item";

    item.innerHTML = `

        <span>${ten}</span>

        <label class="switch">

            <input type="checkbox">

            <span class="slider"></span>

        </label>

    `;

    functionList.appendChild(item);

});

// ====== Hiệu ứng khi bật/tắt ======
document.addEventListener("change", (e) => {

    if (e.target.type === "checkbox") {

        if (e.target.checked) {
            console.log("Đã bật");
        } else {
            console.log("Đã tắt");
        }

    }

});
