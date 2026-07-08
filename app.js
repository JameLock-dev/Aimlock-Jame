
const keyInput = document.getElementById("keyInput") || document.getElementById("licenseKey");
const loginBtn = document.getElementById("loginBtn") || document.getElementById("activateBtn");
const message = document.getElementById("msg") || document.getElementById("loginStatus");
const showBtn = document.getElementById("eye") || document.getElementById("toggleKey");
const pasteBtn = document.getElementById("paste") || document.getElementById("pasteKeyBtn");

const localKeys = ["admin11","jame-free-key"];

function setMessage(text, ok=false){
  if(!message) return;
  message.textContent = text;
  message.style.color = ok ? "#7dffbf" : "#ff8fa3";
}

showBtn?.addEventListener("click",()=>{
  if(!keyInput) return;
  keyInput.type = keyInput.type === "password" ? "text" : "password";
});

pasteBtn?.addEventListener("click", async ()=>{
  try{
    keyInput.value = await navigator.clipboard.readText();
    setMessage("Đã dán key", true);
  }catch{
    setMessage("Không thể truy cập clipboard");
  }
});

async function verifyKey(value){
  try{
    const response = await fetch("/api/verify-key",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        key:value,
        deviceId:"browser"
      })
    });

    const data = await response.json();

    if(data.ok){
      return true;
    }

    throw new Error(data.message || "Key không hợp lệ");
  }
  catch(error){
    // Chế độ fallback khi mở giao diện tĩnh
    if(localKeys.includes(value.toLowerCase())){
      return true;
    }
    throw error;
  }
}

loginBtn?.addEventListener("click", async ()=>{
  const value = keyInput?.value.trim();

  if(!value){
    setMessage("⚠ Vui lòng nhập key");
    return;
  }

  loginBtn.disabled = true;
  setMessage("Đang kiểm tra key...");

  try{
    await verifyKey(value);

    localStorage.setItem("jame-auth","1");
    localStorage.setItem("jame-key",value);

    setMessage("✓ Kích hoạt thành công", true);

    setTimeout(()=>{
      window.location.href="dashboard.html";
    },500);

  }catch(error){
    setMessage(error.message || "Không đăng nhập được");
    loginBtn.disabled=false;
  }
});


document.querySelectorAll(".toggle").forEach(btn=>{
  btn.addEventListener("click",()=>{
    btn.classList.toggle("active");
    btn.textContent = btn.classList.contains("active") ? "ON" : "OFF";
  });
});

document.querySelectorAll(".interactive").forEach(btn=>{
  btn.addEventListener("click",()=>{
    const text = btn.dataset.toast;
    if(text) alert(text);
  });
});
