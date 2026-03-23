// TOGGLE

const THEME_STORAGE_KEY = "ga-visualizer-theme";
let themeToggle = document.getElementById("theme-toggle");
let themeStatus = document.getElementById("theme-status");
let enterSimulationBtn = document.getElementById("enterSimulationBtn");

function applyTheme(theme) {
document.documentElement.setAttribute("data-theme", theme);
themeStatus.textContent = theme === "light" ? "LIGHT MODE" : "DARK MODE";
localStorage.setItem(THEME_STORAGE_KEY, theme);
}

const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || "dark";
applyTheme(savedTheme);

if (themeToggle) {
themeToggle.addEventListener("click", () => {
const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
applyTheme(currentTheme === "light" ? "dark" : "light");
});
}

if (enterSimulationBtn) {
enterSimulationBtn.addEventListener("click", () => {
window.location.href = "../loading/index.html";
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
