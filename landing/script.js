// TOGGLE

let toggle = document.getElementById("themeToggle");
let enterSimulationBtn = document.getElementById("enterSimulationBtn");

toggle.addEventListener("change", () => {
document.body.classList.toggle("light");
document.body.classList.toggle("dark");
});

if (enterSimulationBtn) {
enterSimulationBtn.addEventListener("click", () => {
window.location.href = "../simulation/index.html";
});
}


// PARTICLES

let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particles = [];

for(let i=0;i<100;i++){
particles.push({
x:Math.random()*canvas.width,
y:Math.random()*canvas.height,
dx:(Math.random()-0.5)*2,
dy:(Math.random()-0.5)*2
});
}

function animate(){

ctx.clearRect(0,0,canvas.width,canvas.height);

let color = getComputedStyle(document.body).getPropertyValue('--primary');

particles.forEach(p=>{

p.x+=p.dx;
p.y+=p.dy;

if(p.x<0||p.x>canvas.width)p.dx*=-1;
if(p.y<0||p.y>canvas.height)p.dy*=-1;

ctx.beginPath();
ctx.arc(p.x,p.y,3,0,Math.PI*2);
ctx.fillStyle=color;
ctx.fill();

});

requestAnimationFrame(animate);
}

animate();


// SCROLL ANIMATION

let elements = document.querySelectorAll(".hidden");

function showOnScroll(){

let trigger = window.innerHeight * 0.85;

elements.forEach(el=>{
let top = el.getBoundingClientRect().top;

if(top < trigger){
el.classList.add("show");
}
});

}

window.addEventListener("scroll", showOnScroll);
