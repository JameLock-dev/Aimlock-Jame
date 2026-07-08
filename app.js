const VALID_KEYS = ["Admin11", "JAME-FREE-KEY"];
const toastEl = document.getElementById('toast');

function showToast(message){
  if(!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toastEl.classList.remove('show'), 2200);
}

function setStoredFeature(key, value){
  localStorage.setItem(`aimlock_feature_${key}`, value ? '1' : '0');
}
function getStoredFeature(key){
  const saved = localStorage.getItem(`aimlock_feature_${key}`);
  if(saved !== null) return saved === '1';
  return ['aimbody'].includes(key);
}

if(document.body.classList.contains('page-login')){
  const keyInput = document.getElementById('keyInput');
  const togglePassword = document.getElementById('togglePassword');
  const activateBtn = document.getElementById('activateBtn');
  const pasteKeyBtn = document.getElementById('pasteKeyBtn');
  const loginStatus = document.getElementById('loginStatus');

  togglePassword?.addEventListener('click', () => {
    keyInput.type = keyInput.type === 'password' ? 'text' : 'password';
  });

  pasteKeyBtn?.addEventListener('click', async () => {
    try{
      const text = await navigator.clipboard.readText();
      if(text){
        keyInput.value = text.trim();
        showToast('Đã dán key từ clipboard.');
      } else {
        showToast('Clipboard đang trống.');
      }
    }catch(err){
      showToast('Trình duyệt không cho phép đọc clipboard.');
    }
  });

  activateBtn?.addEventListener('click', () => {
    const value = keyInput.value.trim();
    if(!value){
      showToast('Vui lòng nhập key trước khi kích hoạt.');
      keyInput.focus();
      return;
    }

    activateBtn.classList.add('loading');
    activateBtn.querySelector('span').textContent = 'ĐANG KIỂM TRA...';
    loginStatus.innerHTML = '<span class="dot"></span>Đang xác minh key';

    setTimeout(() => {
      if(VALID_KEYS.includes(value)){
        localStorage.setItem('aimlock_auth', '1');
        localStorage.setItem('aimlock_user', 'JAME FF');
        loginStatus.innerHTML = '<span class="dot"></span>Kích hoạt thành công';
        showToast('Kích hoạt thành công. Đang vào dashboard...');
        setTimeout(() => location.href = 'dashboard.html', 700);
      }else{
        activateBtn.classList.remove('loading');
        activateBtn.querySelector('span').textContent = 'KÍCH HOẠT JAME';
        loginStatus.textContent = 'Key không hợp lệ. Hãy thử lại.';
        loginStatus.style.color = '#ff6e7f';
        showToast('Key không hợp lệ. Demo nhận: Admin11 hoặc JAME-FREE-KEY');
      }
    }, 900);
  });
}

if(document.body.classList.contains('page-dashboard')){
  if(localStorage.getItem('aimlock_auth') !== '1'){
    location.href = 'index.html';
  }
  const helloName = document.getElementById('helloName');
  if(helloName){
    helloName.textContent = localStorage.getItem('aimlock_user') || 'JAME FF';
  }

  document.querySelectorAll('.toggle').forEach(toggle => {
    const feature = toggle.dataset.feature;
    const initial = getStoredFeature(feature);
    updateToggle(toggle, initial);
    toggle.addEventListener('click', () => {
      const next = !toggle.classList.contains('is-on');
      updateToggle(toggle, next);
      setStoredFeature(feature, next);
      showToast(`${feature.toUpperCase()} đã ${next ? 'bật' : 'tắt'}.`);
    });
  });

  document.querySelectorAll('.interactive[data-toast]').forEach(el => {
    el.addEventListener('click', e => {
      if(el.classList.contains('toggle')) return;
      const msg = el.dataset.toast;
      if(msg) showToast(msg);
    });
  });

  const menuBtn = document.getElementById('menuBtn');
  const sideDrawer = document.getElementById('sideDrawer');
  const closeDrawer = document.getElementById('closeDrawer');
  const logoutBtn = document.getElementById('logoutBtn');
  const notifyBtn = document.getElementById('notifyBtn');
  const accountBtn = document.getElementById('accountBtn');

  menuBtn?.addEventListener('click', () => sideDrawer.classList.add('show'));
  closeDrawer?.addEventListener('click', () => sideDrawer.classList.remove('show'));
  sideDrawer?.addEventListener('click', e => { if(e.target === sideDrawer) sideDrawer.classList.remove('show'); });
  notifyBtn?.addEventListener('click', () => showToast('Bạn có 1 thông báo mới.'));
  accountBtn?.addEventListener('click', () => showToast('Tài khoản đang hoạt động bình thường.'));
  logoutBtn?.addEventListener('click', () => {
    localStorage.removeItem('aimlock_auth');
    showToast('Đã đăng xuất.');
    setTimeout(() => location.href = 'index.html', 500);
  });
}

function updateToggle(toggle, on){
  toggle.classList.toggle('is-on', on);
  toggle.setAttribute('aria-pressed', on ? 'true' : 'false');
  const label = toggle.querySelector('.label');
  if(label) label.textContent = on ? 'ON' : 'OFF';
}
