const screens = document.querySelectorAll(".screen");
const toast = document.getElementById("toast");
const keyInput = document.getElementById("keyInput");
const activateBtn = document.getElementById("activateBtn");
const eyeBtn = document.querySelector(".eye-btn");

function showScreen(name) {
  screens.forEach((screen) => {
    screen.classList.toggle("active", screen.dataset.screen === name);
  });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2400);
}

activateBtn.addEventListener("click", () => {
  const value = keyInput.value.trim();
  if (!value) {
    showToast("Vui lòng nhập key demo để xem giao diện.");
    return;
  }

  showToast("Đã mở giao diện demo. Không có chức năng can thiệp game.");
  window.setTimeout(() => showScreen("home"), 650);
});

eyeBtn.addEventListener("click", () => {
  keyInput.type = keyInput.type === "password" ? "text" : "password";
});

document.querySelectorAll(".switch input").forEach((toggle) => {
  toggle.addEventListener("change", () => {
    showToast("Đây chỉ là công tắc giao diện demo.");
  });
});

document.querySelectorAll("a[href='#'], button").forEach((el) => {
  if (el.id === "activateBtn" || el.classList.contains("eye-btn")) return;
  el.addEventListener("click", (event) => {
    event.preventDefault();
    showToast("Chức năng mẫu cho giao diện GitHub.");
  });
});
