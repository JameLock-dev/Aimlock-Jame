const APP_CONFIG = window.AIMLOCK_CONFIG || {};
const API_BASE = APP_CONFIG.apiBase || "https://aimlock-jame-production.up.railway.app";
const DEMO_MODE = Boolean(APP_CONFIG.demoMode);

const $ = (id) => document.getElementById(id);
const licenseKey = $("licenseKey");
const toggleKey = $("toggleKey");
const activateBtn = $("activateBtn");
const loginStatus = $("loginStatus");
const toast = $("toast");

function showToast(message){
  if(!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(()=>toast.classList.remove("show"), 2200);
}
function setLoginStatus(message, type="ready"){
  if(!loginStatus) return;
  loginStatus.classList.toggle("error", type === "error");
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
async function apiFetch(path, options={}){
  if(DEMO_MODE){
    await new Promise(r=>setTimeout(r,260));
    if(path === "/api/verify-key") return {ok:true,key:{expire:"2100-01-01T06:59:59.000Z",slotUsed:1,slotLimit:1}};
    if(path === "/api/stats") return {ok:true,online:0,activeKeys:2,today:1,railway:"Online"};
    if(path === "/api/health") return {ok:true,message:"Server OK"};
  }
  const res = await fetch(apiUrl(path), {
    ...options,
    headers:{Accept:"application/json",...(options.headers||{})},
    cache:"no-store"
  });
  const text = await res.text();
  let data;
  try{ data = JSON.parse(text); }catch{ throw new Error("API không trả về JSON hợp lệ."); }
  if(!res.ok || data.ok === false) throw new Error(data.message || "Request thất bại.");
  return data;
}

if(toggleKey && licenseKey){
  toggleKey.addEventListener("click", ()=>{
    licenseKey.type = licenseKey.type === "password" ? "text" : "password";
  });
}
if(activateBtn && licenseKey){
  activateBtn.addEventListener("click", async ()=>{
    const key = licenseKey.value.trim();
    if(!key){
      setLoginStatus("Vui lòng nhập mật khẩu hoặc key", "error");
      licenseKey.focus();
      return;
    }
    activateBtn.disabled = true;
    const oldText = activateBtn.querySelector("span:last-child")?.textContent || "KÍCH HOẠT JAME";
    const label = activateBtn.querySelector("span:last-child");
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
      setLoginStatus("Kích hoạt thành công");
      setTimeout(()=>{ window.location.href = "./dashboard.html"; }, 520);
    }catch(err){
      setLoginStatus(err.message || "Key không hợp lệ", "error");
      activateBtn.disabled = false;
      if(label) label.textContent = oldText;
    }
  });
  licenseKey.addEventListener("keydown", (event)=>{
    if(event.key === "Enter") activateBtn.click();
  });
}

const featureIds = {
  boost:"boostState",
  aimbody:"aimbodyState",
  nhetam:"nhetamState",
  headlock:"headlockState",
  ping:"pingState",
  cache:"cacheState"
};
const featureNames = {boost:"BOOST RAM", aimbody:"AIMBODY", nhetam:"NHẸ TÂM", headlock:"JAMELOCK", ping:"AINTIBAN", cache:"REG FF"};
function getFeatureState(){
  try{return JSON.parse(localStorage.getItem("aimlockFeatureState") || "{}");}
  catch{return {};}
}
function saveFeatureState(state){ localStorage.setItem("aimlockFeatureState", JSON.stringify(state)); }
function renderFeatures(){
  const state = getFeatureState();
  Object.entries(featureIds).forEach(([name,id])=>{
    const on = Boolean(state[name]);
    const text = $(id);
    if(text) text.textContent = on ? "ON" : "OFF";
    document.querySelectorAll(`[data-toggle-feature="${name}"]`).forEach(btn=>btn.classList.toggle("is-on", on));
    document.querySelectorAll(`[data-feature-card="${name}"]`).forEach(card=>card.classList.toggle("is-on", on));
  });
}
async function applyFeatureAction(name, value){
  if(!value) return;
  if(name === "boost") showToast("BOOST RAM đã bật");
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
document.addEventListener("click", async (event)=>{
  const btn = event.target.closest("[data-toggle-feature]");
  if(!btn) return;
  const name = btn.dataset.toggleFeature;
  const state = getFeatureState();
  const next = !state[name];
  state[name] = next;
  saveFeatureState(state);
  renderFeatures();
  showToast(`${featureNames[name] || name}: ${next ? "ON" : "OFF"}`);
  await applyFeatureAction(name, next);
});

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
renderFeatures();
if(document.body.classList.contains("dashboard-page")){
  updateStats();
  setInterval(updateStats, 5000);
}
