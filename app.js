const licenseKey = document.querySelector('#licenseKey');
const toggleKey = document.querySelector('#toggleKey');
const activateBtn = document.querySelector('#activateBtn');
const loginStatus = document.querySelector('#loginStatus');
const toggles = document.querySelectorAll('.toggle');

if (toggleKey && licenseKey) {
  toggleKey.addEventListener('click', () => {
    licenseKey.type = licenseKey.type === 'password' ? 'text' : 'password';
  });
}

if (activateBtn && licenseKey && loginStatus) {
  activateBtn.addEventListener('click', () => {
    const value = licenseKey.value.trim();
    if (!value) {
      loginStatus.classList.add('error');
      loginStatus.querySelector('span').textContent = 'Vui lòng nhập mật khẩu hoặc key';
      licenseKey.focus();
      return;
    }

    loginStatus.classList.remove('error');
    loginStatus.querySelector('span').textContent = 'Đang mở bảng điều khiển...';
    activateBtn.disabled = true;

    setTimeout(() => {
      window.location.href = './dashboard.html';
    }, 550);
  });
}

toggles.forEach((toggle) => {
  toggle.addEventListener('click', () => {
    const enabled = toggle.classList.toggle('is-on');
    toggle.querySelector('b').textContent = enabled ? 'ON' : 'OFF';
  });
});
