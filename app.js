
const keyInput = document.getElementById("key") || document.getElementById("keyInput");
const loginBtn = document.getElementById("login") || document.getElementById("loginBtn");
const message = document.getElementById("msg") || document.getElementById("status");

const showBtn = document.getElementById("eye");
const pasteBtn = document.getElementById("paste");

function msg(text, success=false){
    if(!message) return;
    message.innerHTML = text;
    message.style.color = success ? "#6dffb1" : "#ff8fa8";
}

showBtn?.addEventListener("click",()=>{
    if(!keyInput) return;
    keyInput.type = keyInput.type === "password" ? "text" : "password";
});

pasteBtn?.addEventListener("click",async()=>{
    try{
        keyInput.value = await navigator.clipboard.readText();
        msg("✓ Đã dán key",true);
    }catch{
        msg("Không thể dán tự động");
    }
});


loginBtn?.addEventListener("click",()=>{

    const value = keyInput?.value.trim();

    if(!value){
        msg("⚠ Vui lòng nhập key");
        return;
    }

    /*
      Login local fallback.
      Khi có backend thật có thể thay đoạn này bằng API verify.
    */
    const validKeys=[
        "admin11",
        "jame-free-key"
    ];

    if(validKeys.includes(value.toLowerCase())){

        localStorage.setItem("jame-auth","true");
        localStorage.setItem("jame-key",value);

        msg("✓ Kích hoạt thành công",true);

        setTimeout(()=>{
            window.location.href="./dashboard.html";
        },700);

    }else{

        msg("❌ Key không đúng");

    }

});


document.querySelectorAll(".toggle").forEach(btn=>{
    btn.addEventListener("click",()=>{
        btn.classList.toggle("active");
        btn.textContent =
        btn.classList.contains("active") ? "ON" : "OFF";
    });
});


document.querySelectorAll(".interactive").forEach(btn=>{
    btn.addEventListener("click",()=>{
        if(btn.dataset.toast){
            alert(btn.dataset.toast);
        }
    });
});
