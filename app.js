const APP_CONFIG = window.AIMLOCK_CONFIG || {};
const API_BASE = APP_CONFIG.apiBase || "https://aimlock-jame-production.up.railway.app";
const DEMO_MODE = Boolean(APP_CONFIG.demoMode);
const DEMO_FORCE_LOGIN = Boolean(APP_CONFIG.forceLogin);
const CURRENT_PAGE = (location.pathname.split("/").pop() || "index.html").toLowerCase();
const IS_LOGIN_PAGE = document.body.classList.contains("page-login");
const APP_PAGE = String(
  APP_CONFIG.appPage ||
  (CURRENT_PAGE === "index.html" ? "app.html" : "index.html")
).trim() || "index.html";
const $ = (id) => document.getElementById(id);

const KEY_INPUT_SELECTORS = [
  "#loginKeyInput",
  "#keyInput",
  "#passwordInput",
  "#licenseKeyInput",
  "input[name='key']",
  "input[name='licenseKey']",
  "[data-key-input]",
  ".login-key-input",
  ".key-input-v2",
  "#loginOverlay input[type='password']",
  "#loginOverlay input[type='text']"
];

const TOGGLE_KEY_SELECTORS = [
  "#toggleKeyBtn",
  "#showKeyBtn",
  "#eyeKeyBtn",
  "#passwordToggle",
  "#togglePassword",
  "[data-toggle-key]",
  "[data-show-key]",
  ".toggle-key-btn",
  ".password-toggle",
  ".key-eye-btn"
].join(",");

const PASTE_KEY_SELECTORS = [
  "#pasteKeyBtn",
  "#pasteBtn",
  "[data-paste-key]",
  ".paste-key-btn"
].join(",");

function findButtonByText(pattern) {
  return Array.from(document.querySelectorAll("button"))
    .find((button) => pattern.test((button.textContent || "").trim()));
}

function resolveLoginKeyInput() {
  for (const selector of KEY_INPUT_SELECTORS) {
    const element = document.querySelector(selector);
    if (element instanceof HTMLInputElement) return element;
  }
  return null;
}

function resolveToggleKeyBtn(input) {
  const knownButton = document.querySelector(TOGGLE_KEY_SELECTORS);
  if (knownButton) return knownButton;

  const wrapper = input?.closest(
    ".key-input-wrap, .login-key-wrap, .password-field, .input-shell, .login-input-v2"
  ) || input?.parentElement;

  if (!wrapper) return null;

  return Array.from(wrapper.querySelectorAll("button")).find((button) => {
    const text = (button.textContent || "").trim();
    return !/KÍCH\s*HOẠT|DÁN\s*KEY|NHẬN\s*KEY/i.test(text);
  }) || null;
}

function resolvePasteKeyBtn() {
  return document.querySelector(PASTE_KEY_SELECTORS)
    || findButtonByText(/DÁN\s*KEY/i);
}

let loginKeyInput = resolveLoginKeyInput();
let toggleKeyBtn = resolveToggleKeyBtn(loginKeyInput);
let pasteKeyBtn = resolvePasteKeyBtn();

function getLoginKeyInput() {
  if (loginKeyInput && document.body.contains(loginKeyInput)) {
    return loginKeyInput;
  }
  loginKeyInput = resolveLoginKeyInput();
  return loginKeyInput;
}

function getToggleKeyBtn() {
  const input = getLoginKeyInput();
  if (toggleKeyBtn && document.body.contains(toggleKeyBtn)) {
    return toggleKeyBtn;
  }
  toggleKeyBtn = resolveToggleKeyBtn(input);
  return toggleKeyBtn;
}

function getPasteKeyBtn() {
  if (pasteKeyBtn && document.body.contains(pasteKeyBtn)) {
    return pasteKeyBtn;
  }
  pasteKeyBtn = resolvePasteKeyBtn();
  return pasteKeyBtn;
}

const APP_SHELL_SELECTORS = [
  "#appShell",
  "#mainApp",
  "#app",
  "[data-app-shell]",
  "[data-protected-app]",
  ".app-shell",
  ".main-app",
  ".protected-app",
  ".app-content"
];

const LOGIN_OVERLAY_SELECTORS = [
  "#loginOverlay",
  "#loginScreen",
  "#activationScreen",
  "[data-login-overlay]",
  "[data-activation-screen]",
  ".login-overlay",
  ".login-screen",
  ".activation-screen",
  ".auth-overlay",
  ".auth-screen",
  ".login-gate"
];

let appShell = $("appShell");
let loginOverlay = $("loginOverlay");

function firstMatch(selectors) {
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) return element;
  }
  return null;
}

function resolveAppShell() {
  if (appShell && document.body.contains(appShell)) return appShell;

  appShell = firstMatch(APP_SHELL_SELECTORS);

  if (!appShell) {
    appShell = Array.from(document.querySelectorAll("main, section, div"))
      .find((element) =>
        element.classList.contains("locked") ||
        element.classList.contains("app-locked") ||
        element.hasAttribute("data-protected-app")
      ) || null;
  }

  return appShell;
}

function resolveLoginOverlay() {
  if (loginOverlay && document.body.contains(loginOverlay)) return loginOverlay;

  loginOverlay = firstMatch(LOGIN_OVERLAY_SELECTORS);

  if (!loginOverlay) {
    const input = getLoginKeyInput();
    loginOverlay = input?.closest(
      "#loginOverlay, #loginScreen, #activationScreen, " +
      "[data-login-overlay], [data-activation-screen], " +
      ".login-overlay, .login-screen, .activation-screen, " +
      ".auth-overlay, .auth-screen, .login-gate"
    ) || null;
  }

  return loginOverlay;
}

const activateBtn = $("activateBtn");
const loginStatus = $("loginStatus");
const freeKeyBtn = $("freeKeyBtn");
const contactKeyBtn = $("contactKeyBtn");
const keyExpireText = $("keyExpireText");
const keySlotText = $("keySlotText");
let vipPlanText = $("vipPlanText") || $("vipPlan");
const onlineCount = $("onlineCount");
const keyActive = $("keyActive");
const todayCount = $("todayCount");
const railwayStatus = $("railwayStatus");
const railwayStatusHero = $("railwayStatusHero");
const modalRailwayText = $("modalRailwayText");
const updateTime = $("updateTime");
const toast = $("toast");
const panelOverlay = $("panelOverlay");
const menuBtn = $("menuBtn");
const sideMenu = $("sideMenu");
const closeMenuBtn = $("closeMenuBtn");
const refreshStatsBtn = $("refreshStatsBtn");
const logoutBtn = $("logoutBtn");
const infoDoneBtn = $("infoDoneBtn");
const copyDeviceBtn = $("copyDeviceBtn");
const deviceText = $("deviceText");
const modalDeviceText = $("modalDeviceText");
const deviceNameText = $("deviceNameText");
const osText = $("osText");
const connectionText = $("connectionText");

const featureMap = {
  boost:["boostState"],
  aimbody:["aimbodyState"],
  nhetam:["nhetamState"],
  headlock:["headlockState"],
  ping:["pingState"],
  cache:["cacheState"]
};

function showToast(msg){
  if(!toast) return;
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=>toast.classList.remove("show"),2200);
}

function setActivationStatus(message = "Kích Hoạt AIMLOCK JAME", state = ""){
  if(!loginStatus) return;

  loginStatus.innerHTML = `<span class="dot"></span>${message}`;
  loginStatus.className = `ready-state${state ? ` ${state}` : ""}`;
}
function nowTime(){return new Date().toLocaleTimeString("vi-VN",{hour12:false});}
function lockApp(lock){
  const shell = resolveAppShell();
  const overlay = resolveLoginOverlay();

  document.documentElement.classList.toggle("aimlock-locked", lock);
  document.body.classList.toggle("aimlock-locked", lock);
  document.body.classList.toggle("app-unlocked", !lock);

  if(shell){
    ["locked", "app-locked", "is-locked", "blurred", "disabled"]
      .forEach(className => shell.classList.toggle(className, lock));

    shell.setAttribute("aria-hidden", String(lock));

    if(lock){
      shell.style.removeProperty("display");
      shell.style.removeProperty("visibility");
      shell.style.removeProperty("opacity");
      shell.style.removeProperty("pointer-events");
    }else{
      shell.hidden = false;
      shell.style.setProperty("display", "", "");
      shell.style.setProperty("visibility", "visible", "important");
      shell.style.setProperty("opacity", "1", "important");
      shell.style.setProperty("pointer-events", "auto", "important");
    }
  }

  if(overlay){
    overlay.classList.toggle("hidden", !lock);
    overlay.classList.toggle("is-hidden", !lock);
    overlay.classList.toggle("active", lock);
    overlay.setAttribute("aria-hidden", String(!lock));

    if(lock){
      overlay.hidden = false;
      overlay.style.removeProperty("display");
      overlay.style.removeProperty("visibility");
      overlay.style.removeProperty("opacity");
      overlay.style.removeProperty("pointer-events");
    }else{
      overlay.hidden = true;
      overlay.style.setProperty("display", "none", "important");
      overlay.style.setProperty("visibility", "hidden", "important");
      overlay.style.setProperty("opacity", "0", "important");
      overlay.style.setProperty("pointer-events", "none", "important");
    }
  }

  if(!lock){
    document.querySelectorAll(
      "[data-show-after-login], .show-after-login, .app-after-login, " +
      ".protected-content, #dashboard, #homeScreen"
    ).forEach((element) => {
      element.hidden = false;
      element.classList.remove("hidden", "is-hidden", "locked", "app-locked");
      element.setAttribute("aria-hidden", "false");
      element.style.removeProperty("display");
      element.style.setProperty("visibility", "visible", "important");
      element.style.setProperty("opacity", "1", "important");
      element.style.setProperty("pointer-events", "auto", "important");
    });

    window.dispatchEvent(new CustomEvent("aimlock:unlocked"));
  }
}
function deviceId(){let id=localStorage.getItem("deviceId"); if(!id){id="DEV-"+Math.random().toString(36).slice(2,10).toUpperCase(); localStorage.setItem("deviceId",id)} return id;}
function formatExpire(expire){const d=new Date(expire); if(Number.isNaN(d.getTime())) return expire||"--"; return d.toLocaleString("vi-VN",{hour:"2-digit",minute:"2-digit",second:"2-digit",day:"2-digit",month:"2-digit",year:"numeric"});}

function normalizeVipPlan(info){
  const raw = String(
    info?.type ??
    info?.plan ??
    info?.vipType ??
    info?.keyType ??
    ""
  ).trim();

  return raw ? raw.toUpperCase() : "CHƯA XÁC ĐỊNH";
}

function ensureVipPlanText(){
  // Chỉ hiển thị gói VIP ở trang app có sẵn vị trí vipPlan/vipPlanText.
  // Không tự chèn badge nổi vào trang đăng nhập.
  vipPlanText = $("vipPlanText") || $("vipPlan") || vipPlanText;

  if(vipPlanText && document.body.contains(vipPlanText)) {
    return vipPlanText;
  }

  if(IS_LOGIN_PAGE || (!keyExpireText && !keySlotText)) {
    return null;
  }

  vipPlanText = document.createElement("strong");
  vipPlanText.id = "vipPlanText";
  vipPlanText.textContent = "CHƯA XÁC ĐỊNH";
  vipPlanText.setAttribute("aria-label", "Gói VIP đang sử dụng");

  Object.assign(vipPlanText.style, {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "28px",
    padding: "4px 12px",
    margin: "6px 0",
    borderRadius: "999px",
    border: "1px solid rgba(255, 208, 0, .55)",
    background: "linear-gradient(135deg, rgba(255,208,0,.18), rgba(255,159,0,.08))",
    color: "#ffd000",
    fontSize: "12px",
    fontWeight: "900",
    letterSpacing: ".7px",
    boxShadow: "0 0 18px rgba(255,208,0,.12)"
  });

  const anchorEl = keyExpireText?.parentElement || keySlotText?.parentElement;
  if(anchorEl){
    anchorEl.insertBefore(vipPlanText, anchorEl.firstChild);
  }else{
    document.body.appendChild(vipPlanText);
  }

  return vipPlanText;
}

function renderKeyInfo(info){
  const keyInfo = info || {};
  const planEl = ensureVipPlanText();

  if(planEl) planEl.textContent = normalizeVipPlan(keyInfo);
  if(keyExpireText) keyExpireText.textContent = formatExpire(keyInfo.expire);
  if(keySlotText) keySlotText.textContent = `${Number(keyInfo.slotUsed || 0)}/${Number(keyInfo.slotLimit || 1)}`;
}

function openActivatedApp(){
  if(IS_LOGIN_PAGE){
    const target = new URL(APP_PAGE, location.href);

    // Chặn vòng lặp nếu cấu hình nhầm trang app trùng trang đăng nhập.
    if(target.href === location.href){
      throw new Error(
        `Trang app đang trùng trang đăng nhập (${APP_PAGE}). ` +
        "Hãy đặt AIMLOCK_CONFIG.appPage thành tên file trang app, ví dụ app.html."
      );
    }

    window.location.replace(target.href);
    return;
  }

  lockApp(false);
}
function detectDevice(){
  const ua=navigator.userAgent||"";
  const device=/iPhone/i.test(ua)?"iPhone 14 Pro":/Android/i.test(ua)?"Android":/Windows/i.test(ua)?"Windows PC":/Mac/i.test(ua)?"Mac":"Thiết bị web";
  const os=/iPhone OS ([\d_]+)/i.test(ua)?`iOS ${RegExp.$1.replace(/_/g,'.')}`:/Android ([\d.]+)/i.test(ua)?`Android ${RegExp.$1}`:/Windows NT 10/i.test(ua)?"Windows 10/11":/Mac OS X ([\d_]+)/i.test(ua)?`macOS ${RegExp.$1.replace(/_/g,'.')}`:"Web";
  const conn=navigator.connection?.effectiveType?navigator.connection.effectiveType.toUpperCase():"Wi‑Fi";
  if(deviceNameText) deviceNameText.textContent=device;
  if(osText) osText.textContent=os;
  if(connectionText) connectionText.textContent=conn;
}
function apiUrl(path){return `${API_BASE}${path}`;}
async function apiFetch(path, options={}){
  if(DEMO_MODE){
    await new Promise(r=>setTimeout(r,160));
    if(path==="/api/verify-key"){
      const body = JSON.parse(options.body||"{}");
      if(!String(body.key||"").trim()) throw new Error("Vui lòng nhập Password / Key.");
      return {ok:true,key:{type:"FREE",expire:"2100-01-01T06:59:59.000Z",slotUsed:1,slotLimit:1}};
    }
    if(path==="/api/stats") return {ok:true,online:1248,activeKeys:328,today:3562,railway:"Online"};
    if(path==="/api/health") return {ok:true,message:"Server + Postgres OK"};
  }
  let res;
  try{
    res = await fetch(apiUrl(path),{...options,headers:{Accept:"application/json",...(options.headers||{})},cache:"no-store"});
  }catch{throw new Error("Không kết nối được API Railway.");}
  const text = await res.text();
  let data;
  try{data=JSON.parse(text);}catch{throw new Error("API đang trả về HTML, không phải JSON.");}
  if(!res.ok || data.ok===false) throw new Error(data.message||"Request thất bại.");
  return data;
}
function getFeatures(){try{return JSON.parse(localStorage.getItem("aimlockFeatureState")||"{}");}catch{return {};}}
function saveFeatures(s){localStorage.setItem("aimlockFeatureState", JSON.stringify(s));}
function labelFeature(name){return ({boost:"Boost RAM",aimbody:"AIMBODY",nhetam:"NHẸ TÂM",headlock:"JAMELOCK",ping:"AINTIBAN",cache:"REG FF"})[name]||name;}
function renderFeatures(){
  const state=getFeatures();
  Object.keys(featureMap).forEach(name=>{
    const on=Boolean(state[name]);
    featureMap[name].forEach(id=>{const el=$(id); if(el) el.textContent=on?"ON":"OFF";});
    document.querySelectorAll(`[data-toggle-feature="${name}"]`).forEach(el=>el.classList.toggle("is-on", on));
  });
  if(deviceText) deviceText.textContent=deviceId();
  if(modalDeviceText) modalDeviceText.textContent=deviceId();
}
async function applyFeatureAction(name, value){
  if(!value) return;
  if(name==="boost") showToast("Boost RAM đã được tối ưu");
  if(name==="ping"){
    const start=performance.now();
    const data=await apiFetch("/api/health");
    const ms=Math.max(1, Math.round(performance.now()-start));
    showToast(`AINTIBAN hoạt động • ${data.message} • ${ms}ms`);
  }
  if(name==="cache"){
    let removed=0;
    Object.keys(localStorage).forEach(k=>{if(k.startsWith("aimlockTemp_")||k.startsWith("tmp_")){localStorage.removeItem(k); removed++;}});
    try{if("caches" in window){const names=await caches.keys(); await Promise.all(names.map(n=>caches.delete(n))); removed+=names.length;}}catch{}
    showToast(`REG FF hoàn tất • ${removed} mục tạm`);
  }
}
async function setFeature(name, value){const s=getFeatures(); s[name]=Boolean(value); saveFeatures(s); renderFeatures(); try{await applyFeatureAction(name,value);}catch(err){s[name]=false; saveFeatures(s); renderFeatures(); throw err;}}
async function toggleFeature(name){const s=getFeatures(); const next=!s[name]; try{await setFeature(name,next); showToast(`${labelFeature(name)}: ${next?"ON":"OFF"}`);}catch(err){showToast(err.message||`${labelFeature(name)} thất bại`);}}
async function verifyKey(){
  const input = getLoginKeyInput();
  const key = input?.value?.trim() || "";

  if(!input){
    setActivationStatus("Không tìm thấy ô nhập key trong giao diện.", "error");
    showToast('Lỗi ô nhập key');
    return;
  }

  if(!key || /^[•●*]+$/.test(key)){
    setActivationStatus("Vui lòng nhập hoặc dán key thật.", "error");
    input.focus();
    showToast('Thiếu key');
    return;
  }
  setActivationStatus("Đang kiểm tra Postgres key server...");
  const activateLabel = activateBtn?.querySelector("span");
  if(activateBtn) activateBtn.disabled = true;
  if(activateLabel) activateLabel.textContent = "ĐANG KÍCH HOẠT...";
  try{
    const data=await apiFetch('/api/verify-key',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key,deviceId:deviceId()})});
    const keyInfo = {...(data.key || {}), loginKey: key};
    localStorage.setItem('jameLoginUnlocked','true');
    localStorage.setItem('jameKeyInfo', JSON.stringify(keyInfo));
    localStorage.setItem('jameActiveKey', key);
    renderKeyInfo(keyInfo);
    setActivationStatus("Kích Hoạt AIMLOCK JAME", "success");
    showToast("Đăng nhập thành công");
    updateStats();

    setTimeout(() => {
      try{
        openActivatedApp();
      }catch(error){
        setActivationStatus(error.message || "Không mở được trang app.", "error");
        showToast("Sai cấu hình trang app");
      }
    }, 250);
  }catch(err){
    setActivationStatus(err.message || "Key không hợp lệ.", "error");
    showToast("Kích hoạt thất bại");
  }finally{
    if(activateBtn) activateBtn.disabled = false;
    if(activateLabel) activateLabel.textContent = "KÍCH HOẠT AIMLOCK";
  }
}
async function updateStats(){
  try{
    const d=await apiFetch('/api/stats');
    if(onlineCount) onlineCount.textContent=Number(d.online??0).toLocaleString('vi-VN');
    if(keyActive) keyActive.textContent=Number(d.activeKeys??0).toLocaleString('vi-VN');
    if(todayCount) todayCount.textContent=Number(d.today??0).toLocaleString('vi-VN');
    if(railwayStatus) railwayStatus.textContent=d.railway||'Online';
    if(railwayStatusHero) railwayStatusHero.textContent=(d.railway||'Online').toUpperCase();
    if(modalRailwayText) modalRailwayText.textContent=d.railway||'Online';
  }catch{
    if(railwayStatus) railwayStatus.textContent='OFFLINE';
    if(railwayStatusHero) railwayStatusHero.textContent='OFFLINE';
    if(modalRailwayText) modalRailwayText.textContent='OFFLINE';
  }
  if(updateTime) updateTime.textContent=nowTime();
}
function openMenu(){sideMenu?.classList.remove('hidden'); panelOverlay?.classList.remove('hidden');}
function closeMenu(){sideMenu?.classList.add('hidden'); panelOverlay?.classList.add('hidden');}
function openModal(name){closeMenu(); if(name==='info') $('infoModal')?.classList.remove('hidden');}
function closeModals(){document.querySelectorAll('.modal-shell').forEach(el=>el.classList.add('hidden'));}
function initSavedLogin(){
  if(DEMO_MODE && DEMO_FORCE_LOGIN){localStorage.removeItem('jameLoginUnlocked'); localStorage.removeItem('jameKeyInfo'); lockApp(true); return;}
  if(DEMO_MODE && !DEMO_FORCE_LOGIN){localStorage.setItem('jameLoginUnlocked','true'); localStorage.setItem('jameKeyInfo', JSON.stringify({type:'FREE',expire:'2100-01-01T06:59:59.000Z',slotUsed:1,slotLimit:1}));}
  try{
    const saved=JSON.parse(localStorage.getItem('jameKeyInfo')||'null');
    if(localStorage.getItem('jameLoginUnlocked')==='true' && saved){
      renderKeyInfo(saved);

      if(IS_LOGIN_PAGE){
        setTimeout(() => {
          try{
            openActivatedApp();
          }catch(error){
            setActivationStatus(error.message || "Không mở được trang app.", "error");
          }
        }, 50);
      }else{
        lockApp(false);
      }
      return;
    }
  }catch{}

  if(!IS_LOGIN_PAGE){
    lockApp(true);
  }
}
function logout(){
  localStorage.removeItem('jameLoginUnlocked');
  localStorage.removeItem('jameKeyInfo');
  localStorage.removeItem('jameActiveKey');

  const input = getLoginKeyInput();
  if(input) input.value='';

  setActivationStatus("Kích Hoạt AIMLOCK JAME");
  lockApp(true);
  closeMenu();
  showToast('Đã đăng xuất');
}

function toggleKeyVisibility(event){
  event?.preventDefault();

  const input = getLoginKeyInput();
  const button = getToggleKeyBtn();

  if(!input){
    showToast('Không tìm thấy ô nhập key');
    return;
  }

  const showKey = input.type === 'password';
  input.type = showKey ? 'text' : 'password';

  if(button){
    button.setAttribute('aria-pressed', String(showKey));
    button.setAttribute('aria-label', showKey ? 'Ẩn key' : 'Hiện key');
    button.classList.toggle('is-key-visible', showKey);

    const iconText = button.querySelector('[data-eye-text], .eye-text');
    if(iconText) iconText.textContent = showKey ? 'Ẩn' : 'Xem';
  }

  input.focus();
}

async function pasteKeyFromClipboard(event){
  event?.preventDefault();

  const input = getLoginKeyInput();
  if(!input){
    showToast('Không tìm thấy ô nhập key');
    return;
  }

  try{
    if(!navigator.clipboard?.readText){
      throw new Error('Clipboard API không khả dụng');
    }

    const text = (await navigator.clipboard.readText()).trim();
    if(!text){
      showToast('Clipboard đang trống');
      input.focus();
      return;
    }

    input.value = text;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    setActivationStatus("Kích Hoạt AIMLOCK JAME", "success");
    showToast('Đã dán key');
  }catch(error){
    input.focus();
    showToast('Chạm giữ ô nhập để dán key');
  }
}

activateBtn?.addEventListener('click', verifyKey);
contactKeyBtn?.addEventListener('click',()=>window.open('https://zalo.me/0333635135','_blank','noopener'));
menuBtn?.addEventListener('click', openMenu);
closeMenuBtn?.addEventListener('click', closeMenu);
panelOverlay?.addEventListener('click', closeMenu);
refreshStatsBtn?.addEventListener('click',()=>{updateStats(); closeMenu(); showToast('Đã làm mới server');});
logoutBtn?.addEventListener('click', logout);
infoDoneBtn?.addEventListener('click', closeModals);
copyDeviceBtn?.addEventListener('click', async()=>{try{await navigator.clipboard.writeText(deviceId()); showToast('Đã copy Device ID');}catch{showToast(deviceId());}});

document.addEventListener('click', async(e)=>{
  const clickedButton = e.target.closest('button');
  const keyToggleButton = getToggleKeyBtn();
  const keyPasteButton = getPasteKeyBtn();

  if(clickedButton && (
    clickedButton === keyToggleButton ||
    clickedButton.matches?.(TOGGLE_KEY_SELECTORS)
  )){
    return toggleKeyVisibility(e);
  }

  if(clickedButton && (
    clickedButton === keyPasteButton ||
    clickedButton.matches?.(PASTE_KEY_SELECTORS) ||
    /DÁN\s*KEY/i.test((clickedButton.textContent || '').trim())
  )){
    return pasteKeyFromClipboard(e);
  }

  const toggleBtn=e.target.closest('[data-toggle-feature]');
  const openBtn=e.target.closest('[data-open-feature]');
  const closeBtn=e.target.closest('[data-close-modal]');
  if(toggleBtn) return toggleFeature(toggleBtn.dataset.toggleFeature);
  if(openBtn) return openModal(openBtn.dataset.openFeature);
  if(closeBtn) return closeModals();
});

document.addEventListener('keydown', (event)=>{
  const input = getLoginKeyInput();
  if(event.key === 'Enter' && input && event.target === input){
    event.preventDefault();
    verifyKey();
  }
});

ensureVipPlanText();
setActivationStatus("Kích Hoạt AIMLOCK JAME");
initSavedLogin();
detectDevice();
renderFeatures();
updateStats();
setInterval(updateStats, 4000);