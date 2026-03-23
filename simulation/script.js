const field = document.getElementById('field');
const goal = document.getElementById('goal');
const goalCoords = document.getElementById('goal-coords');
const guideToggle = document.getElementById('guide-toggle');
const guidePanel = document.getElementById('guide-panel');
const panelToggle = document.getElementById('panel-toggle');
const controlPanel = document.getElementById('control-panel');
const overlayToggle = document.getElementById('overlay-toggle');
const sidebarButtons = document.getElementById('sidebar-buttons');
const themeToggle = document.getElementById('theme-toggle');
const themeStatus = document.getElementById('theme-status');
const statusPill = document.getElementById('status-pill');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const btnStart = document.getElementById('btn-start');
const btnPause = document.getElementById('btn-pause');
const btnEnd = document.getElementById('btn-end');
const fieldStatus = document.getElementById('field-status');
const THEME_STORAGE_KEY = 'ga-visualizer-theme';

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

guideToggle.addEventListener('click', function() {
  const isOpen = guidePanel.classList.toggle('open');
  guideToggle.textContent = isOpen ? '‹' : '›';
  if (isOpen) {
    controlPanel.classList.remove('open');
    panelToggle.textContent = '›';
    sidebarButtons.classList.remove('shifted-panel');
    sidebarButtons.classList.add('shifted-guide');
  } else {
    sidebarButtons.classList.remove('shifted-guide');
  }
});

panelToggle.addEventListener('click', function() {
  const isOpen = controlPanel.classList.toggle('open');
  panelToggle.textContent = isOpen ? '‹' : '›';
  if (isOpen) {
    guidePanel.classList.remove('open');
    guideToggle.textContent = '›';
    sidebarButtons.classList.remove('shifted-guide');
    sidebarButtons.classList.add('shifted-panel');
  } else {
    sidebarButtons.classList.remove('shifted-panel');
  }
});

overlayToggle.addEventListener('click', function() {
  const hidden = document.body.classList.toggle('overlays-hidden');
  overlayToggle.classList.toggle('hidden-state', hidden);
});

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeStatus.textContent = theme === 'light' ? 'LIGHT MODE' : 'DARK MODE';
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

applyTheme(localStorage.getItem(THEME_STORAGE_KEY) || 'dark');

themeToggle.addEventListener('click', function() {
  const html = document.documentElement;
  const isLight = html.getAttribute('data-theme') === 'light';
  applyTheme(isLight ? 'dark' : 'light');
});

function setStatus(state) {
  statusPill.className = 'status-pill';
  if (state === 'running') {
    statusPill.classList.add('running');
    statusText.textContent = 'SIMULATION RUNNING';
    btnStart.disabled = true;
    btnPause.disabled = false;
    btnEnd.disabled = false;
  } else if (state === 'paused') {
    statusPill.classList.add('paused');
    statusText.textContent = 'SIMULATION PAUSED';
    btnStart.disabled = false;
    btnStart.innerHTML = '&#9654; Resume';
    btnPause.disabled = true;
    btnEnd.disabled = false;
  } else if (state === 'ended') {
    statusPill.classList.add('ended');
    statusText.textContent = 'SIMULATION ENDED';
    btnStart.disabled = false;
    btnStart.innerHTML = '&#9654; Start';
    btnPause.disabled = true;
    btnEnd.disabled = true;
  } else {
    statusText.textContent = 'SIMULATION READY';
    btnStart.disabled = false;
    btnStart.innerHTML = '&#9654; Start';
    btnPause.disabled = true;
    btnEnd.disabled = true;
  }
}

btnStart.addEventListener('click', function() {
  setStatus('running');
});

btnPause.addEventListener('click', function() {
  setStatus('paused');
});

btnEnd.addEventListener('click', function() {
  setStatus('ended');
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

setTimeout(function() {
  fieldStatus.classList.add('hidden');
}, 15000);
