//============================
// CYBER DASHBOARD v2
//============================

const canvas = document.getElementById("chart");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = 220;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

//============================
// DỮ LIỆU MÔ PHỎNG
//============================

let cpu = [];
let ram = [];
let ping = [];

for (let i = 0; i < 60; i++) {

    cpu.push(45 + Math.random() * 12);
    ram.push(35 + Math.random() * 15);
    ping.push(8 + Math.random() * 10);

}

//============================
// VẼ BIỂU ĐỒ
//============================

function drawLine(data, color) {

    ctx.beginPath();

    ctx.strokeStyle = color;

    ctx.lineWidth = 3;

    ctx.shadowBlur = 12;

    ctx.shadowColor = color;

    data.forEach((value, index) => {

        let x = index * (canvas.width / (data.length - 1));

        let y = canvas.height - value * 3;

        if (index === 0)
            ctx.moveTo(x, y);
        else
            ctx.lineTo(x, y);

    });

    ctx.stroke();

}

function drawChart() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawLine(cpu, "#00d4ff");

    drawLine(ram, "#ff9800");

    drawLine(ping, "#00ff84");

}

drawChart();

//============================
// CẬP NHẬT MỖI GIÂY
//============================

setInterval(() => {

    cpu.shift();
    ram.shift();
    ping.shift();

    cpu.push(40 + Math.random() * 20);
    ram.push(30 + Math.random() * 20);
    ping.push(8 + Math.random() * 12);

    drawChart();

    let cpuValue = Math.round(cpu[cpu.length - 1]);
    let ramValue = Math.round(ram[ram.length - 1]);
    let pingValue = Math.round(ping[ping.length - 1]);

    document.getElementById("cpu").innerHTML = cpuValue + "%";
    document.getElementById("ram").innerHTML = ramValue + "%";
    document.getElementById("ping").innerHTML = pingValue + " ms";

    document.getElementById("cpuTop").innerHTML = cpuValue + "%";
    document.getElementById("ramTop").innerHTML = ramValue + "%";
    document.getElementById("pingTop").innerHTML = pingValue + " ms";

}, 1000);

//============================
// DANH SÁCH CHỨC NĂNG
//============================

const functions = [

{
icon:"⚡",
title:"Chế độ hiệu năng",
desc:"Theo dõi trạng thái hiệu năng của thiết bị."
},

{
icon:"🌐",
title:"Tối ưu mạng",
desc:"Hiển thị và theo dõi chất lượng kết nối."
},

{
icon:"🔋",
title:"Tiết kiệm pin",
desc:"Mô phỏng trạng thái tiết kiệm năng lượng."
},

{
icon:"💾",
title:"Dọn dẹp bộ nhớ",
desc:"Hiển thị thông tin bộ nhớ đang sử dụng."
},

{
icon:"📊",
title:"Giám sát hệ thống",
desc:"Theo dõi CPU, RAM và độ trễ theo thời gian."
},

{
icon:"🎨",
title:"Hiệu ứng giao diện",
desc:"Bật hoặc tắt các hiệu ứng hiển thị."
},

{
icon:"🔄",
title:"Làm mới dữ liệu",
desc:"Làm mới dữ liệu mô phỏng của dashboard."
},

{
icon:"📱",
title:"Thông tin thiết bị",
desc:"Hiển thị thông tin mô phỏng về thiết bị."
},

{
icon:"🌙",
title:"Chế độ ban đêm",
desc:"Giảm độ sáng giao diện."
},

{
icon:"🛠",
title:"Chẩn đoán hệ thống",
desc:"Kiểm tra trạng thái hoạt động mô phỏng."
}

];

const functionList = document.getElementById("functionList");

functions.forEach(itemData => {

    const item = document.createElement("div");

    item.className = "item";

    item.innerHTML = `

<div class="itemLeft">

<div class="icon">${itemData.icon}</div>

<div class="text">

<h3>${itemData.title}</h3>

<p>${itemData.desc}</p>

</div>

</div>

<div class="state">

<span class="online">BẬT</span>

<label class="switch">

<input type="checkbox" checked>

<span class="slider"></span>

</label>

</div>

`;

    const checkbox = item.querySelector("input");
    const status = item.querySelector(".online");

    checkbox.addEventListener("change", function(){

        if(this.checked){

            status.innerHTML="BẬT";
            status.className="online";

        }else{

            status.innerHTML="TẮT";
            status.className="offline";

        }

    });

    functionList.appendChild(item);

});

//============================
// GIỜ HỆ THỐNG
//============================

setInterval(() => {

    const now = new Date();

    document.title =
        "Bảng Điều Khiển Hiệu Năng • " +
        now.toLocaleTimeString("vi-VN");

},1000);
