/* AIMLOCK JAME V4 UI
   - Frontend UI/demo controls only.
   - Change the free key URL below, or edit the href in index.html.
*/
const APP_CONFIG = window.AIMLOCK_CONFIG || {};
const FREE_KEY_URL = APP_CONFIG.freeKeyUrl || "https://link-cua-ban.com/lay-key";
const API_BASE = APP_CONFIG.apiBase || "";
// strictApi=true: bắt buộc dùng server thật. Mặc định false để GitHub Pages/static không bị lỗi HTML thay JSON.
const STRICT_API = Boolean(APP_CONFIG.strictApi);
const DEMO_MODE = APP_CONFIG.demoMode ?? (location.protocol === "file:");
const LOCAL_KEYS = (APP_CONFIG.localKeys || ["Admin11", "JAME-FREE-KEY"]).map(k => String(k).trim().toLowerCase());

const $ = (id) => document.getElementById(id);
const licenseKey = $("licenseKey");
const toggleKey = $("toggleKey");
const pasteKeyBtn = $("pasteKeyBtn");
const activateBtn = $("activateBtn");
const loginStatus = $("loginStatus");
const freeKeyBtn = $("freeKeyBtn");
const toast = $("toast");
const modalOverlay = $("modalOverlay");
const sideDrawer = $("sideDrawer");
const infoModal = $("infoModal");
const accountModal = $("accountModal");
const featureModal = $("featureModal");
const featureModalTitle = $("featureModalTitle");
const featureModalDesc = $("featureModalDesc");
const featureModalToggle = $("featureModalToggle");
let activeFeatureModal = null;

const featureIds = {
  boost: "boostState",
  aimbody: "aimbodyState",
  nhetam: "nhetamState",
  headlock: "headlockState",
  ping: "pingState",
  cache: "cacheState"
};
const featureMeta = {
  boost: {name:"BOOST RAM", desc:"Bật/tắt trạng thái tối ưu bộ nhớ trên giao diện."},
  aimbody: {name:"AIMBODY", desc:"Bật/tắt module giao diện AIMBODY."},
  nhetam: {name:"NHẸ TÂM", desc:"Bật/tắt chế độ nhẹ trong dashboard."},
  headlock: {name:"JAMELOCK", desc:"Bật/tắt lớp khóa bảo vệ giao diện."},
  ping: {name:"AINTIBAN", desc:"Kiểm tra trạng thái kết nối server và hiển thị thông báo."},
  cache: {name:"REG FF", desc:"Dọn cache tạm của giao diện web/localStorage."}
};

function showToast(message){
  if(!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(()=>toast.classList.remove("show"), 2300);
}
function setLoginStatus(message, type="ready"){
  if(!loginStatus) return;
  loginStatus.classList.toggle("error", type === "error");
  loginStatus.classList.toggle("success", type === "success");
  const span = loginStatus.querySelector("span");
  if(span) span.textContent = message;
}
function deviceId(){
  let id = localStorage.getItem("aimlockDeviceId");
  if(!id){
    id = "DEV-" + Math.random().toString(36).slice(2,10).toUpperCase();
    localStorage.setItem("aimlockDeviceId", id);
  }
  return id;
}
function apiUrl(path){ return `${API_BASE}${path}`; }
function readRequestBody(options={}){
  try{return JSON.parse(options.body || "{}");}
  catch{return {}; }
}
async function localApiResponse(path, options={}, reason=""){
  await new Promise(r=>setTimeout(r, 220));

  if(path === "/api/verify-key"){
    const body = readRequestBody(options);
    const input = String(body.key || "").trim();
    const validLocal = DEMO_MODE || LOCAL_KEYS.includes(input.toLowerCase());

    if(!input){
      throw new Error("Vui lòng nhập mật khẩu hoặc key.");
    }
    if(!validLocal){
      throw new Error("Không kết nối được API. Dùng Admin11 hoặc JAME-FREE-KEY để vào bản demo, hoặc chạy npm start để dùng server thật.");
    }

    return {
      ok:true,
      fallback:true,
      message: reason ? "Đăng nhập bằng chế độ local fallback." : "Đăng nhập demo thành công.",
      key:{
        key: input,
        type: input.toLowerCase() === "admin11" ? "admin-local" : "demo",
        expire:"2099-12-31T23:59:59.000Z",
        slotUsed:1,
        slotLimit:1,
        status:"active"
      }
    };
  }

  if(path === "/api/stats") return {ok:true,fallback:true,online:0,activeKeys:2,today:1,railway:"Local UI"};
  if(path === "/api/health") return {ok:true,fallback:true,message:"Local UI mode"};

  throw new Error("API chưa sẵn sàng.");
}
async function apiFetch(path, options={}){
  if(DEMO_MODE){
    return localApiResponse(path, options);
  }

  try{
    const res = await fetch(apiUrl(path), {
      ...options,
      headers:{Accept:"application/json",...(options.headers||{})},
      cache:"no-store"
    });

    const text = await res.text();
    let data;
    try{
      data = JSON.parse(text);
    }catch{
      const error = new Error("API không trả về JSON hợp lệ.");
      error.fallbackable = true;
      throw error;
    }

    if(!res.ok || data.ok === false) throw new Error(data.message || "Request thất bại.");
    return data;
  }catch(error){
    const fallbackable = error?.fallbackable || error?.name === "TypeError" || /Failed to fetch|NetworkError|JSON/i.test(error?.message || "");
    if(!STRICT_API && fallbackable){
      return localApiResponse(path, options, error.message);
    }
    throw error;
  }
}

if(freeKeyBtn){ freeKeyBtn.href = FREE_KEY_URL; }
if(toggleKey && licenseKey){
  toggleKey.addEventListener("click", ()=>{
    licenseKey.type = licenseKey.type === "password" ? "text" : "password";
    showToast(licenseKey.type === "password" ? "Đã ẩn key" : "Đang hiện key");
  });
}
if(pasteKeyBtn && licenseKey){
  pasteKeyBtn.addEventListener("click", async ()=>{
    try{
      const text = await navigator.clipboard.readText();
      licenseKey.value = text.trim();
      licenseKey.focus();
      showToast("Đã dán key từ clipboard");
    }catch{
      licenseKey.focus();
      showToast("Trình duyệt chưa cho phép dán tự động");
    }
  });
}
if(activateBtn && licenseKey){
  activateBtn.addEventListener("click", async ()=>{
    const key = licenseKey.value.trim();
    if(!key){
      setLoginStatus("Vui lòng nhập mật khẩu hoặc key", "error");
      licenseKey.focus();
      showToast("Thiếu key kích hoạt");
      return;
    }
    activateBtn.disabled = true;
    const label = activateBtn.querySelector("span:last-child");
    const oldText = label?.textContent || "KÍCH HOẠT JAME";
    if(label) label.textContent = "ĐANG KIỂM TRA...";
    setLoginStatus("Đang kiểm tra key server...");
    try{
      const data = await apiFetch("/api/verify-key", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({key, deviceId:deviceId()})
      });
      localStorage.setItem("jameLoginUnlocked", "true");
      localStorage.setItem("jameKeyInfo", JSON.stringify(data.key || {}));
      setLoginStatus(data.fallback ? "Kích hoạt local thành công" : "Kích hoạt thành công", "success");
      showToast(data.fallback ? "Đăng nhập local thành công" : "Đăng nhập thành công");
      setTimeout(()=>{ window.location.href = "./dashboard.html"; }, 520);
    }catch(err){
      setLoginStatus(err.message || "Key không hợp lệ", "error");
      showToast("Kích hoạt thất bại");
      activateBtn.disabled = false;
      if(label) label.textContent = oldText;
    }
  });
  licenseKey.addEventListener("keydown", (event)=>{ if(event.key === "Enter") activateBtn.click(); });
}

function getFeatureState(){
  try{return JSON.parse(localStorage.getItem("aimlockFeatureState") || "{}");}
  catch{return {};}
}
function saveFeatureState(state){ localStorage.setItem("aimlockFeatureState", JSON.stringify(state)); }
function countActive(state){ return Object.values(state).filter(Boolean).length; }
function updateCoreHUD(){
  const state = getFeatureState();
  const count = countActive(state);
  const meter = $("coreMeter");
  const status = $("coreStatus");
  const activeModulesText = $("activeModulesText");
  if(meter) meter.style.width = `${Math.min(100, 18 + count * 13)}%`;
  if(status) status.textContent = count ? "MODULE ACTIVE" : "CORE READY";
  if(activeModulesText) activeModulesText.textContent = `${count} MODULE ON`;
  document.body.classList.toggle("boosted", count > 0);
}
function renderFeatures(){
  const state = getFeatureState();
  Object.entries(featureIds).forEach(([name,id])=>{
    const on = Boolean(state[name]);
    const text = $(id);
    if(text) text.textContent = on ? "ON" : "OFF";
    document.querySelectorAll(`[data-toggle-feature="${name}"]`).forEach(btn=>btn.classList.toggle("is-on", on));
    document.querySelectorAll(`[data-feature-card="${name}"]`).forEach(card=>card.classList.toggle("is-on", on));
  });
  updateCoreHUD();
  const deviceIdText = $("deviceIdText");
  if(deviceIdText) deviceIdText.textContent = deviceId();
}
async function applyFeatureAction(name, value){
  if(!value) return;
  if(name === "boost") showToast("BOOST RAM đã bật");
  if(name === "aimbody") showToast("AIMBODY đã bật trên giao diện");
  if(name === "nhetam") showToast("NHẸ TÂM đã bật");
  if(name === "headlock") showToast("JAMELOCK đã bật");
  if(name === "ping"){
    try{ await apiFetch("/api/health"); showToast("AINTIBAN: Server online"); }
    catch{ showToast("AINTIBAN: Không kết nối được server"); }
  }
  if(name === "cache"){
    let removed = 0;
    Object.keys(localStorage).forEach(k=>{
      if(k.startsWith("aimlockTemp_") || k.startsWith("tmp_")){ localStorage.removeItem(k); removed++; }
    });
    showToast(`REG FF hoàn tất • ${removed} mục tạm`);
  }
}
async function toggleFeature(name){
  const state = getFeatureState();
  const next = !state[name];
  state[name] = next;
  saveFeatureState(state);
  renderFeatures();
  showToast(`${featureMeta[name]?.name || name}: ${next ? "ON" : "OFF"}`);
  await applyFeatureAction(name, next);
}
function closeUI(){
  modalOverlay?.classList.add("hidden");
  sideDrawer?.classList.add("hidden");
  document.querySelectorAll(".modal-card").forEach(el=>el.classList.add("hidden"));
}
function openWithOverlay(el){
  if(!el) return;
  modalOverlay?.classList.remove("hidden");
  el.classList.remove("hidden");
}
function openFeatureModal(name){
  activeFeatureModal = name;
  const meta = featureMeta[name] || {name:"MODULE",desc:"Chi tiết module."};
  if(featureModalTitle) featureModalTitle.textContent = meta.name;
  if(featureModalDesc) featureModalDesc.textContent = meta.desc;
  if(featureModalToggle){
    const on = Boolean(getFeatureState()[name]);
    featureModalToggle.textContent = on ? "TẮT MODULE" : "BẬT MODULE";
  }
  openWithOverlay(featureModal);
}
async function updateStats(){
  const onlineCount = $("onlineCount");
  const keyActive = $("keyActive");
  const keyActiveMini = $("keyActiveMini");
  const todayCount = $("todayCount");
  try{
    const data = await apiFetch("/api/stats");
    const online = Number(data.online ?? 0).toLocaleString("vi-VN");
    const active = Number(data.activeKeys ?? 2).toLocaleString("vi-VN");
    const today = Number(data.today ?? 1).toLocaleString("vi-VN");
    if(onlineCount) onlineCount.textContent = online;
    if(keyActive) keyActive.textContent = active;
    if(keyActiveMini) keyActiveMini.textContent = active;
    if(todayCount) todayCount.textContent = today;
  }catch{
    if(onlineCount) onlineCount.textContent = "0";
    if(keyActive) keyActive.textContent = "2";
    if(keyActiveMini) keyActiveMini.textContent = "2";
    if(todayCount) todayCount.textContent = "1";
  }
}
function resetFeatures(){
  saveFeatureState({});
  renderFeatures();
  showToast("Đã tắt toàn bộ module");
}

$("menuBtn")?.addEventListener("click", ()=>openWithOverlay(sideDrawer));
$("notifyBtn")?.addEventListener("click", ()=>showToast("Không có thông báo mới"));
$("keyCardBtn")?.addEventListener("click", ()=>openWithOverlay(accountModal));
$("infoBtn")?.addEventListener("click", ()=>openWithOverlay(infoModal));
$("infoNav")?.addEventListener("click", (e)=>{ e.preventDefault(); openWithOverlay(infoModal); });
$("accountNav")?.addEventListener("click", (e)=>{ e.preventDefault(); openWithOverlay(accountModal); });
$("homeNav")?.addEventListener("click", (e)=>{ e.preventDefault(); window.scrollTo({top:0, behavior:"smooth"}); showToast("Trang chủ"); });
$("hubBtn")?.addEventListener("click", ()=>{ document.body.classList.toggle("hud-boost"); showToast("Gaming HUD pulse"); });
$("hubPulseBtn")?.addEventListener("click", ()=>{ document.body.classList.toggle("hud-boost"); showToast("BOOST HUD đã kích hoạt"); });
$("featureModalToggle")?.addEventListener("click", async ()=>{ if(activeFeatureModal){ await toggleFeature(activeFeatureModal); openFeatureModal(activeFeatureModal); } });
$("copyDeviceBtn")?.addEventListener("click", async ()=>{
  try{ await navigator.clipboard.writeText(deviceId()); showToast("Đã copy Device ID"); }
  catch{ showToast(deviceId()); }
});
modalOverlay?.addEventListener("click", closeUI);

document.addEventListener("click", async (event)=>{
  if(event.target.closest("[data-close-ui]")){ closeUI(); return; }
  const action = event.target.closest("[data-action]")?.dataset.action;
  if(action === "refresh-stats"){ await updateStats(); closeUI(); showToast("Đã làm mới thống kê"); return; }
  if(action === "key-info"){ openWithOverlay(accountModal); return; }
  if(action === "reset-features"){ resetFeatures(); closeUI(); return; }

  const toggleBtn = event.target.closest("[data-toggle-feature]");
  if(toggleBtn){
    event.preventDefault();
    event.stopPropagation();
    await toggleFeature(toggleBtn.dataset.toggleFeature);
    return;
  }
  const featureCard = event.target.closest("[data-open-feature]");
  if(featureCard){ openFeatureModal(featureCard.dataset.openFeature); return; }
});

renderFeatures();
if(document.body.classList.contains("dashboard-page")){
  updateStats();
  setInterval(updateStats, 6000);
}
