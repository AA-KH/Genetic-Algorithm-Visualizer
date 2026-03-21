const field = document.getElementById('field');
const goal = document.getElementById('goal');
const goalCoords = document.getElementById('goal-coords');
const panelToggle = document.getElementById('panel-toggle');
const controlPanel = document.getElementById('control-panel');
const themeToggle = document.getElementById('theme-toggle');
const themeStatus = document.getElementById('theme-status');
const panelStateText = document.getElementById('panel-state-text');

const organisms = [
  { x: 18, y: 25, sel: false },
  { x: 30, y: 55, sel: true },
  { x: 45, y: 30, sel: false },
  { x: 60, y: 68, sel: false },
  { x: 22, y: 72, sel: false },
  { x: 55, y: 15, sel: false },
  { x: 75, y: 42, sel: true },
  { x: 80, y: 70, sel: false },
  { x: 38, y: 80, sel: false },
  { x: 65, y: 22, sel: false },
  { x: 12, y: 45, sel: false },
  { x: 90, y: 30, sel: false },
  { x: 50, y: 88, sel: false },
  { x: 83, y: 85, sel: true },
  { x: 70, y: 55, sel: false },
];

organisms.forEach(o => {
  const el = document.createElement('div');
  el.className = 'organism' + (o.sel ? ' selected' : '');
  el.style.left = o.x + '%';
  el.style.top = o.y + '%';
  field.appendChild(el);
});

function placeGoal(x, y) {
  goal.style.left = x + 'px';
  goal.style.top = y + 'px';
  goalCoords.textContent = '(' + Math.round(x) + ', ' + Math.round(y) + ')';
}

placeGoal(window.innerWidth * 0.62, window.innerHeight * 0.38);

field.addEventListener('click', function(e) {
  if (e.target === goal || goal.contains(e.target)) return;
  placeGoal(e.clientX, e.clientY);
});

let dragging = false;
let dragOffX = 0;
let dragOffY = 0;

goal.addEventListener('mousedown', function(e) {
  dragging = true;
  dragOffX = e.clientX - parseInt(goal.style.left);
  dragOffY = e.clientY - parseInt(goal.style.top);
  e.preventDefault();
});

document.addEventListener('mousemove', function(e) {
  if (!dragging) return;
  placeGoal(e.clientX - dragOffX, e.clientY - dragOffY);
});

document.addEventListener('mouseup', function() {
  dragging = false;
});

panelToggle.addEventListener('click', function() {
  const isOpen = controlPanel.classList.toggle('open');
  panelToggle.classList.toggle('open', isOpen);
  panelToggle.textContent = isOpen ? '‹' : '›';
  panelStateText.textContent = isOpen ? 'PANEL OPEN' : 'PANEL CLOSED';
});

themeToggle.addEventListener('click', function() {
  const html = document.documentElement;
  const isLight = html.getAttribute('data-theme') === 'light';
  html.setAttribute('data-theme', isLight ? 'dark' : 'light');
  themeStatus.textContent = isLight ? 'DARK MODE' : 'LIGHT MODE';
});

document.getElementById('sl-pop').addEventListener('input', function() {
  document.getElementById('val-pop').textContent = this.value;
  document.querySelector('#stats-panel .stat-val').textContent = this.value;
});

document.getElementById('sl-mut').addEventListener('input', function() {
  document.getElementById('val-mut').textContent = (this.value / 100).toFixed(2);
});

document.getElementById('sl-gen').addEventListener('input', function() {
  document.getElementById('val-gen').textContent = this.value;
});

document.getElementById('sl-sel').addEventListener('input', function() {
  document.getElementById('val-sel').textContent = (this.value / 100).toFixed(2);
});
