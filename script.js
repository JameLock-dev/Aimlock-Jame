const canvas=document.getElementById("chart");

const ctx=canvas.getContext("2d");

canvas.width=900;

canvas.height=250;

let cpu=[],ram=[],ping=[];

for(let i=0;i<60;i++){

cpu.push(40+Math.random()*20);

ram.push(35+Math.random()*25);

ping.push(15+Math.random()*10);

}

function draw(){

ctx.clearRect(0,0,900,250);

drawLine(cpu,"#00c8ff");

drawLine(ram,"orange");

drawLine(ping,"#2eff6d");

}

function drawLine(arr,color){

ctx.beginPath();

ctx.strokeStyle=color;

ctx.lineWidth=3;

arr.forEach((v,i)=>{

let x=i*15;

let y=230-v*3;

if(i==0)

ctx.moveTo(x,y);

else

ctx.lineTo(x,y);

});

ctx.stroke();

}

setInterval(()=>{

cpu.shift();

ram.shift();

ping.shift();

cpu.push(35+Math.random()*30);

ram.push(30+Math.random()*35);

ping.push(10+Math.random()*20);

draw();

document.getElementById("cpu").innerHTML=Math.round(cpu[cpu.length-1])+"%";

document.getElementById("ram").innerHTML=Math.round(ram[ram.length-1])+"%";

document.getElementById("ping").innerHTML=Math.round(ping[ping.length-1])+" ms";

},1000);

draw();

const functions=[

"Performance Mode",

"Network Optimizer",

"Battery Saver",

"Animation Boost",

"Background Cleaner",

"Memory Monitor"

];

const list=document.getElementById("list");

functions.forEach(name=>{

let div=document.createElement("div");

div.className="item";

div.innerHTML=`

<span>${name}</span>

<label class="switch">

<input type="checkbox">

<span class="slider"></span>

</label>

`;

list.appendChild(div);

});
