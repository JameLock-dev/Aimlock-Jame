const API = "";
const appShell = document.getElementById("appShell");
const loginOverlay = document.getElementById("loginOverlay");
const loginKeyInput = document.getElementById("loginKeyInput");
const toggleKeyBtn = document.getElementById("toggleKeyBtn");
const activateBtn = document.getElementById("activateBtn");
const loginStatus = document.getElementById("loginStatus");
const freeKeyBtn = document.getElementById("freeKeyBtn");
const contactKeyBtn = document.getElementById("contactKeyBtn");
const keyExpireText = document.getElementById("keyExpireText");
const keySlotText = document.getElementById("keySlotText");
const sideMenu = document.getElementById("sideMenu");
const menuBtn = document.querySelector(".menu-btn");
const closeMenuBtn = document.getElementById("closeMenuBtn");
const getKeyBtn = document.getElementById("getKeyBtn");
const logoutBtn = document.getElementById("logoutBtn");
const rows = [...document.querySelectorAll(".feature-row")];
const runAllBtn = document.getElementById("runAllBtn");
const refreshBtn = document.getElementById("refreshBtn");
const clearLogBtn = document.getElementById("clearLogBtn");
const onlineCount = document.getElementById("onlineCount");
const keyActive = document.getElementById("keyActive");
const todayCount = document.getElementById("todayCount");
const railwayStatus = document.getElementById("railwayStatus");
const updateTime = document.getElementById("updateTime");
const activityLog = document.getElementById("activityLog");
const activeTask = document.getElementById("activeTask");
const progressPercent = document.getElementById("progressPercent");
const progressFill = document.getElementById("progressFill");
const toast = document.getElementById("toast");

const featureSteps={network:["Kiểm tra độ trễ mạng","Ổn định luồng kết nối","Cập nhật trạng thái phản hồi"],antiban:["Kiểm tra phiên bảo vệ","Đồng bộ trạng thái an toàn","Ghi nhận báo cáo bảo vệ"],reg:["Nạp cấu hình OB54","Kiểm tra registry mô phỏng","Hoàn tất tối ưu phiên bản"],monitor:["Đọc CPU/RAM mô phỏng","Kiểm tra độ trễ","Cập nhật dashboard"],effects:["Kích hoạt hiệu ứng panel","Làm mượt chuyển động","Áp dụng hiệu ứng hiển thị"],aimdoy:["Làm mới dữ liệu","Đồng bộ chỉ số","Tạo báo cáo mới"],device:["Đọc thông tin trình duyệt","Kiểm tra màn hình","Cập nhật hồ sơ thiết bị"],aimlock:["Khởi tạo bộ ngắm mô phỏng","Kiểm tra điểm neo tâm","Hoàn tất trạng thái hỗ trợ"],diagnose:["Quét trạng thái panel","Kiểm tra lỗi mô phỏng","Xuất báo cáo hệ thống"]};
const featureNames={network:"TỐI ƯU MẠNG",antiban:"ANTIBAN",reg:"REG OB54",monitor:"GIÁM SÁT HỆ THỐNG",effects:"HIỆU ỨNG GIAO DIỆN",aimdoy:"AIMDOY",device:"THÔNG TIN THIẾT BỊ",aimlock:"AIMLOCK",diagnose:"CHẨN ĐOÁN HỆ THỐNG"};
let runningTimer=null;

function pad(n){return String(n).padStart(2,"0")}
function nowTime(){const n=new Date();return `${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())}`}
function showToast(msg){toast.textContent=msg;toast.classList.add("show");if(navigator.vibrate)navigator.vibrate(35);setTimeout(()=>toast.classList.remove("show"),2200)}
function addLog(type,msg){const line=document.createElement("div");line.className=`log-line ${type.toLowerCase()}`;line.textContent=`[${nowTime()}] [${type}] ${msg}`;activityLog.prepend(line);const lines=activityLog.querySelectorAll(".log-line");if(lines.length>80)lines[lines.length-1].remove()}
function setProgress(p,text){const v=Math.max(0,Math.min(100,p));progressFill.style.width=`${v}%`;progressPercent.textContent=`${v}%`;activeTask.textContent=text}
function deviceId(){let id=localStorage.getItem("deviceId");if(!id){id="DEV-"+Math.random().toString(36).slice(2,10).toUpperCase();localStorage.setItem("deviceId",id)}return id}
function lockApp(lock){if(lock){appShell.classList.add("locked");loginOverlay.classList.remove("hidden")}else{appShell.classList.remove("locked");loginOverlay.classList.add("hidden")}}
function formatExpire(expire){if(!expire)return"--";const d=new Date(expire);if(Number.isNaN(d.getTime()))return expire;return d.toLocaleString("vi-VN",{hour:"2-digit",minute:"2-digit",second:"2-digit",day:"2-digit",month:"2-digit",year:"numeric"})}

async function verifyKey(){
  const key=loginKeyInput.value.trim();
  if(!key){loginStatus.textContent="Vui lòng nhập Password / Key.";loginStatus.className="login-status error";showToast("Thiếu key");return}
  loginStatus.textContent="Đang kiểm tra key server...";loginStatus.className="login-status";activateBtn.disabled=true;activateBtn.textContent="Đang kích hoạt...";
  try{
    const res=await fetch(`${API}/api/verify-key`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key,deviceId:deviceId()})});
    const data=await res.json();
    if(!data.ok)throw new Error(data.message||"Key không hợp lệ.");
    localStorage.setItem("jameLoginUnlocked","true");
    localStorage.setItem("jameKeyInfo",JSON.stringify(data.key));
    keyExpireText.textContent=formatExpire(data.key.expire);
    keySlotText.textContent=`${data.key.slotUsed}/${data.key.slotLimit}`;
    loginStatus.textContent="Key hợp lệ. Đang vào app...";
    loginStatus.className="login-status success";
    addLog("OK",`Đăng nhập thành công bằng key: ${data.key.key}`);
    showToast("Đăng nhập thành công");
    setTimeout(()=>lockApp(false),650);
    updateStats();
  }catch(err){
    loginStatus.textContent=err.message||"Key không hợp lệ. Vui lòng thử lại.";
    loginStatus.className="login-status error";
    showToast("Key không hợp lệ");
    addLog("WARN","Đăng nhập thất bại.");
  }finally{
    activateBtn.disabled=false;activateBtn.textContent="⚡ Kích Hoạt Jame";
  }
}
toggleKeyBtn.addEventListener("click",()=>{const isPass=loginKeyInput.type==="password";loginKeyInput.type=isPass?"text":"password";toggleKeyBtn.textContent=isPass?"🙈":"👁"});
activateBtn.addEventListener("click",verifyKey);
loginKeyInput.addEventListener("keydown",e=>{if(e.key==="Enter")verifyKey()});

function openSupportMenu(){sideMenu.classList.add("open");document.body.classList.add("menu-open");sideMenu.setAttribute("aria-hidden","false")}
function closeSupportMenu(){sideMenu.classList.remove("open");document.body.classList.remove("menu-open");sideMenu.setAttribute("aria-hidden","true")}
menuBtn.addEventListener("click",openSupportMenu);
closeMenuBtn.addEventListener("click",closeSupportMenu);
sideMenu.addEventListener("click",e=>{if(e.target===sideMenu)closeSupportMenu()});
contactKeyBtn.addEventListener("click",openSupportMenu);
freeKeyBtn.addEventListener("click",()=>window.open("https://www.tiktok.com/@jame.ff.11","_blank","noopener"));
getKeyBtn.addEventListener("click",()=>window.open("https://www.tiktok.com/@jame.ff.11","_blank","noopener"));
logoutBtn.addEventListener("click",()=>{localStorage.removeItem("jameLoginUnlocked");showToast("Đã đăng xuất");lockApp(true);closeSupportMenu()});

function runFeature(row){const key=row.dataset.feature;const name=featureNames[key];const steps=featureSteps[key]||["Đang chạy","Cập nhật","Hoàn tất"];clearInterval(runningTimer);rows.forEach(r=>r.classList.remove("running"));row.classList.remove("done");row.classList.add("running");let progress=0,step=0;const rowProgress=row.querySelector(".row-progress span");rowProgress.style.width="0%";setProgress(0,`Đang khởi động ${name}...`);addLog("RUN",`${name} bắt đầu chạy.`);showToast(`${name} đang chạy...`);runningTimer=setInterval(()=>{progress+=Math.floor(Math.random()*17)+10;if(step<steps.length){addLog("CHECK",steps[step]);step++}if(progress>=100){progress=100;clearInterval(runningTimer);row.classList.remove("running");row.classList.add("done");rowProgress.style.width="100%";setProgress(100,`${name} đã hoạt động.`);addLog("OK",`${name} đã hoạt động và báo cáo về máy.`);showToast(`${name} đã bật thành công`);return}rowProgress.style.width=`${progress}%`;setProgress(progress,`Đang xử lý ${name}...`)},480)}
rows.forEach(row=>{const cb=row.querySelector("input"),badge=row.querySelector(".badge-state"),go=row.querySelector(".go-btn");cb.addEventListener("change",()=>{if(cb.checked){row.classList.remove("is-off");badge.textContent="BẬT";runFeature(row)}else{row.classList.add("is-off");row.classList.remove("running","done");badge.textContent="TẮT";row.querySelector(".row-progress span").style.width="0%";addLog("WARN",`${featureNames[row.dataset.feature]} đã tắt.`)}});go.addEventListener("click",()=>{if(!cb.checked){cb.checked=true;cb.dispatchEvent(new Event("change"))}else runFeature(row)})});
runAllBtn.addEventListener("click",()=>{const enabled=rows.filter(r=>r.querySelector("input").checked);let i=0;addLog("SYNC","Bắt đầu chạy tất cả tính năng đang bật.");function next(){if(i>=enabled.length){addLog("OK","Toàn bộ tính năng đã chạy xong.");return}runFeature(enabled[i]);i++;setTimeout(next,1850)}next()});
clearLogBtn.addEventListener("click",()=>{activityLog.innerHTML='<div class="log-line muted">[SYSTEM] Log đã được xóa.</div>';setProgress(0,"Chờ bật tính năng...")});

async function updateStats(){
  try{
    const res=await fetch(`${API}/api/stats`);
    const data=await res.json();
    onlineCount.textContent=data.online??0;
    keyActive.textContent=data.activeKeys??0;
    todayCount.textContent=data.today??0;
    railwayStatus.textContent=data.railway||"Online";
  }catch{
    railwayStatus.textContent="OFFLINE";
  }
  updateTime.textContent=nowTime();
}
refreshBtn.addEventListener("click",()=>{updateStats();addLog("SYNC","Dashboard đã được làm mới.")});

const savedInfo=JSON.parse(localStorage.getItem("jameKeyInfo")||"null");
if(localStorage.getItem("jameLoginUnlocked")==="true" && savedInfo){keyExpireText.textContent=formatExpire(savedInfo.expire);keySlotText.textContent=`${savedInfo.slotUsed}/${savedInfo.slotLimit}`;lockApp(false)}else lockApp(true);
updateStats();
setInterval(updateStats,3000);
