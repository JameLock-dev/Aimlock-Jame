
const key=document.getElementById("key");
const login=document.getElementById("login");
const msg=document.getElementById("msg");

document.getElementById("eye")?.onclick=()=>{
 key.type=key.type==="password"?"text":"password";
};

document.getElementById("paste")?.onclick=async()=>{
 try{key.value=await navigator.clipboard.readText()}catch{}
};

login?.addEventListener("click",async()=>{
 if(!key.value.trim()){
  msg.textContent="⚠ Vui lòng nhập key";
  return;
 }

 try{
  const r=await fetch("/api/verify-key",{
   method:"POST",
   headers:{"Content-Type":"application/json"},
   body:JSON.stringify({
    key:key.value,
    deviceId:"browser"
   })
  });

  const data=await r.json();

  if(data.ok){
   localStorage.setItem("jame-auth","1");
   location.href="dashboard.html";
  }else{
   msg.textContent=data.message;
  }
 }catch{
  msg.textContent="Không kết nối được server";
 }
});

document.querySelectorAll(".toggle").forEach(btn=>{
 btn.onclick=()=>{
  btn.classList.toggle("active");
  btn.textContent=btn.classList.contains("active")?"ON":"OFF";
 };
});
