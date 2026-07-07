const loginScreen = document.querySelector('#loginScreen');
const dashboardScreen = document.querySelector('#dashboardScreen');
const keyInput = document.querySelector('#keyInput');
const activateBtn = document.querySelector('#activateBtn');
const loginStatus = document.querySelector('#loginStatus');
const togglePassword = document.querySelector('#togglePassword');
const goActivation = document.querySelector('#goActivation');
const switches = document.querySelectorAll('.switch');

function showLogin() {
  dashboardScreen.classList.remove('active');
  loginScreen.classList.add('active');
}

function showDashboard() {
  loginScreen.classList.remove('active');
  dashboardScreen.classList.add('active');
}

togglePassword.addEventListener('click', () => {
  keyInput.type = keyInput.type === 'password' ? 'text' : 'password';
});

activateBtn.addEventListener('click', () => {
  const key = keyInput.value.trim();
  if (!key) {
    loginStatus.classList.add('error');
    loginStatus.innerHTML = '<span></span>Vui lòng nhập mật khẩu hoặc key';
    keyInput.focus();
    return;
  }

  loginStatus.classList.remove('error');
  loginStatus.innerHTML = '<span></span>Đang xác thực giao diện...';
  activateBtn.disabled = true;

  setTimeout(() => {
    activateBtn.disabled = false;
    showDashboard();
  }, 650);
});

goActivation.addEventListener('click', showLogin);

switches.forEach((button) => {
  button.addEventListener('click', () => {
    button.classList.toggle('on');
  });
});
