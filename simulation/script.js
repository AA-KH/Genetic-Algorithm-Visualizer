var field = document.getElementById('field');
var goal = document.getElementById('goal');
var goalCoords = document.getElementById('goal-coords');
var guideToggle = document.getElementById('guide-toggle');
var guidePanel = document.getElementById('guide-panel');
var panelToggle = document.getElementById('panel-toggle');
var controlPanel = document.getElementById('control-panel');
var overlayToggle = document.getElementById('overlay-toggle');
var sidebarButtons = document.getElementById('sidebar-buttons');
var themeToggle = document.getElementById('theme-toggle');
var themeStatus = document.getElementById('theme-status');
var statusPill = document.getElementById('status-pill');
var statusText = document.getElementById('status-text');
var btnStart = document.getElementById('btn-start');
var btnPause = document.getElementById('btn-pause');
var btnEnd = document.getElementById('btn-end');
var fieldStatus = document.getElementById('field-status');
var populationSlider = document.getElementById('sl-pop');
var mutationSlider = document.getElementById('sl-mut');
var generationSlider = document.getElementById('sl-gen');
var selectionSlider = document.getElementById('sl-sel');
var populationValue = document.getElementById('val-pop');
var mutationValue = document.getElementById('val-mut');
var generationValue = document.getElementById('val-gen');
var selectionValue = document.getElementById('val-sel');
var statRows = document.querySelectorAll('#stats-panel .stat-val');
var themeStorageKey = 'ga-visualizer-theme';

var goalX = window.innerWidth * 0.62;
var goalY = window.innerHeight * 0.38;

function placeGoal(x, y) {
  goalX = x;
  goalY = y;
  goal.style.left = x + 'px';
  goal.style.top = y + 'px';
  goalCoords.textContent = '(' + Math.round(x) + ', ' + Math.round(y) + ')';
}

placeGoal(goalX, goalY);

var dragging = false;
var dragOffsetX = 0;
var dragOffsetY = 0;

goal.addEventListener('mousedown', function(event) {
  dragging = true;
  dragOffsetX = event.clientX - parseInt(goal.style.left, 10);
  dragOffsetY = event.clientY - parseInt(goal.style.top, 10);
  event.preventDefault();
});

document.addEventListener('mousemove', function(event) {
  if (!dragging) return;
  placeGoal(event.clientX - dragOffsetX, event.clientY - dragOffsetY);
});

document.addEventListener('mouseup', function() {
  dragging = false;
});

field.addEventListener('click', function(event) {
  if (event.target === goal || goal.contains(event.target)) return;
  placeGoal(event.clientX, event.clientY);
});

guideToggle.addEventListener('click', function() {
  if (guidePanel.classList.contains('open')) {
    guidePanel.classList.remove('open');
    guideToggle.textContent = '›';
    sidebarButtons.classList.remove('shifted-guide');
  } else {
    guidePanel.classList.add('open');
    guideToggle.textContent = '‹';
    controlPanel.classList.remove('open');
    panelToggle.textContent = '›';
    sidebarButtons.classList.remove('shifted-panel');
    sidebarButtons.classList.add('shifted-guide');
  }
});

panelToggle.addEventListener('click', function() {
  if (controlPanel.classList.contains('open')) {
    controlPanel.classList.remove('open');
    panelToggle.textContent = '›';
    sidebarButtons.classList.remove('shifted-panel');
  } else {
    controlPanel.classList.add('open');
    panelToggle.textContent = '‹';
    guidePanel.classList.remove('open');
    guideToggle.textContent = '›';
    sidebarButtons.classList.remove('shifted-guide');
    sidebarButtons.classList.add('shifted-panel');
  }
});

overlayToggle.addEventListener('click', function() {
  if (document.body.classList.contains('overlays-hidden')) {
    document.body.classList.remove('overlays-hidden');
    overlayToggle.classList.remove('hidden-state');
  } else {
    document.body.classList.add('overlays-hidden');
    overlayToggle.classList.add('hidden-state');
  }
});

function applyTheme(themeName) {
  document.documentElement.setAttribute('data-theme', themeName);
  themeStatus.textContent = themeName === 'light' ? 'LIGHT MODE' : 'DARK MODE';
  localStorage.setItem(themeStorageKey, themeName);
}

applyTheme(localStorage.getItem(themeStorageKey) || 'dark');

themeToggle.addEventListener('click', function() {
  applyTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
});

populationSlider.addEventListener('input', function() {
  populationValue.textContent = populationSlider.value;
  if (!sim.running && !sim.paused) updateStatDisplay();
});

mutationSlider.addEventListener('input', function() {
  mutationValue.textContent = (mutationSlider.value / 100).toFixed(2);
});

generationSlider.addEventListener('input', function() {
  generationValue.textContent = generationSlider.value;
});

selectionSlider.addEventListener('input', function() {
  selectionValue.textContent = (selectionSlider.value / 100).toFixed(2);
});

setTimeout(function() { fieldStatus.classList.add('hidden'); }, 15000);

var sim = {
  running: false,
  paused: false,
  generation: 0,
  tick: 0,
  organisms: [],
  elems: [],
  trailElems: [],
  tickInterval: null,
  transitioning: false
};

var SPAWN_X_RATIO = 0.12;
var SPAWN_Y_RATIO = 0.82;
var GENE_POOL = 8;
var SPEED = 3.2;
var TICK_MS = 28;
var GOAL_RADIUS = 26;

function rnd(a, b) { return a + Math.random() * (b - a); }
function randGenes(len) {
  var g = [];
  for (var i = 0; i < len; i++) g.push({ ax: rnd(-1, 1), ay: rnd(-1, 1) });
  return g;
}

function mutateGenes(genes, rate) {
  return genes.map(function(g) {
    if (Math.random() < rate) return { ax: rnd(-1, 1), ay: rnd(-1, 1) };
    if (Math.random() < rate * 0.5) return { ax: g.ax + rnd(-0.3, 0.3), ay: g.ay + rnd(-0.3, 0.3) };
    return { ax: g.ax, ay: g.ay };
  });
}

function crossover(a, b) {
  var cut = Math.floor(Math.random() * a.length);
  return a.slice(0, cut).concat(b.slice(cut));
}

function fitness(ox, oy) {
  var dx = ox - goalX, dy = oy - goalY;
  var dist = Math.sqrt(dx * dx + dy * dy);
  return 1 / (dist + 1);
}

function initPopulation() {
  var count = parseInt(populationSlider.value);
  var genLen = parseInt(generationSlider.value);
  sim.organisms = [];
  for (var i = 0; i < count; i++) {
    var sx = window.innerWidth * SPAWN_X_RATIO + rnd(-30, 30);
    var sy = window.innerHeight * SPAWN_Y_RATIO + rnd(-20, 20);
    sim.organisms.push({
      x: sx, y: sy,
      startX: sx, startY: sy,
      vx: 0, vy: 0,
      genes: randGenes(genLen),
      fitness: 0,
      hue: Math.floor(rnd(0, 360)),
      elite: false,
      reached: false
    });
  }
}

function renderOrganisms() {
  sim.elems.forEach(function(el) { if (el.parentNode) el.parentNode.removeChild(el); });
  sim.elems = [];
  sim.organisms.forEach(function(org, i) {
    var el = document.createElement('div');
    el.className = 'organism';
    el.style.left = org.x + 'px';
    el.style.top = org.y + 'px';
    styleOrganism(el, org);
    field.appendChild(el);
    sim.elems[i] = el;
  });
}

function styleOrganism(el, org) {
  var theme = document.documentElement.getAttribute('data-theme');
  if (org.elite) {
    el.style.width = '13px';
    el.style.height = '13px';
    el.style.zIndex = '5';
    if (theme === 'light') {
      el.style.background = 'rgba(220,100,10,0.95)';
      el.style.boxShadow = '0 0 16px rgba(220,100,10,0.7), 0 0 32px rgba(220,100,10,0.35)';
    } else {
      el.style.background = 'rgba(250,220,50,0.95)';
      el.style.boxShadow = '0 0 16px rgba(250,220,50,0.7), 0 0 32px rgba(250,220,50,0.35)';
    }
  } else if (org.reached) {
    el.style.width = '11px';
    el.style.height = '11px';
    el.style.zIndex = '4';
    if (theme === 'light') {
      el.style.background = 'rgba(50,160,80,0.9)';
      el.style.boxShadow = '0 0 10px rgba(50,160,80,0.5)';
    } else {
      el.style.background = 'rgba(74,222,128,0.9)';
      el.style.boxShadow = '0 0 10px rgba(74,222,128,0.5)';
    }
  } else {
    var alpha = 0.35 + org.fitness * 1.5;
    if (alpha > 0.85) alpha = 0.85;
    el.style.width = '10px';
    el.style.height = '10px';
    el.style.zIndex = '2';
    if (theme === 'light') {
      el.style.background = 'rgba(176,106,16,' + alpha + ')';
      el.style.boxShadow = '0 0 6px rgba(176,106,16,0.25)';
    } else {
      el.style.background = 'rgba(56,189,248,' + alpha + ')';
      el.style.boxShadow = '0 0 6px rgba(56,189,248,0.25)';
    }
  }
}

function updateStatDisplay() {
  var count = sim.running || sim.paused ? sim.organisms.length : parseInt(populationSlider.value);
  statRows[0].textContent = count;
  if (sim.generation === 0 && !sim.running && !sim.paused) {
    statRows[1].textContent = '—';
    statRows[2].textContent = '0';
  } else {
    var best = 0;
    sim.organisms.forEach(function(o) { if (o.fitness > best) best = o.fitness; });
    statRows[1].textContent = best > 0 ? (best * 100).toFixed(1) + '%' : '—';
    statRows[2].textContent = sim.generation;
  }
}

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

function spawnTrail(org, isElite) {
  var el = document.createElement('div');
  el.style.cssText = 'position:absolute;border-radius:50%;pointer-events:none;transform:translate(-50%,-50%);';
  var size = isElite ? 5 : 3;
  el.style.width = size + 'px';
  el.style.height = size + 'px';
  el.style.left = org.x + 'px';
  el.style.top = org.y + 'px';
  var theme = document.documentElement.getAttribute('data-theme');
  var opacity = isElite ? 0.45 : 0.18;
  if (isElite) {
    el.style.background = theme === 'light' ? 'rgba(220,100,10,' + opacity + ')' : 'rgba(250,220,50,' + opacity + ')';
  } else {
    el.style.background = theme === 'light' ? 'rgba(176,106,16,' + opacity + ')' : 'rgba(56,189,248,' + opacity + ')';
  }
  el.style.zIndex = '1';
  field.appendChild(el);
  sim.trailElems.push({ el: el, born: sim.generation, opacity: opacity });
}

function fadeTrails() {
  var keep = [];
  sim.trailElems.forEach(function(t) {
    var age = sim.generation - t.born;
    var fade = t.opacity * Math.pow(0.55, age);
    if (fade < 0.02) {
      if (t.el.parentNode) t.el.parentNode.removeChild(t.el);
    } else {
      t.el.style.opacity = fade / t.opacity;
      keep.push(t);
    }
  });
  sim.trailElems = keep;
}

function clearTrails() {
  sim.trailElems.forEach(function(t) { if (t.el.parentNode) t.el.parentNode.removeChild(t.el); });
  sim.trailElems = [];
}

function clearOrganisms() {
  sim.elems.forEach(function(el) { if (el.parentNode) el.parentNode.removeChild(el); });
  sim.elems = [];
}

function doTick() {
  if (!sim.running || sim.transitioning) return;
  var genLen = parseInt(generationSlider.value);
  sim.tick++;

  var eliteIdx = 0;
  var bestF = 0;
  sim.organisms.forEach(function(o, i) {
    if (o.fitness > bestF) { bestF = o.fitness; eliteIdx = i; }
  });

  sim.organisms.forEach(function(org, i) {
    if (org.reached) return;
    var geneIdx = Math.floor((sim.tick / genLen) * org.genes.length);
    if (geneIdx >= org.genes.length) geneIdx = org.genes.length - 1;
    var g = org.genes[geneIdx];
    org.vx = org.vx * 0.85 + g.ax * SPEED;
    org.vy = org.vy * 0.85 + g.ay * SPEED;
    org.x += org.vx;
    org.y += org.vy;
    org.x = Math.max(5, Math.min(window.innerWidth - 5, org.x));
    org.y = Math.max(48, Math.min(window.innerHeight - 5, org.y));

    var dx = org.x - goalX, dy = org.y - goalY;
    if (Math.sqrt(dx * dx + dy * dy) < GOAL_RADIUS) org.reached = true;

    if (sim.elems[i]) {
      sim.elems[i].style.left = org.x + 'px';
      sim.elems[i].style.top = org.y + 'px';
    }

    if (sim.tick % 8 === 0 && i === eliteIdx) spawnTrail(org, true);
    if (sim.tick % 20 === 0 && org.fitness > 0.003 && i !== eliteIdx) spawnTrail(org, false);
  });

  var goalActivated = sim.organisms.some(function(o) { return o.reached; });
  if (goalActivated) {
    goal.style.filter = 'brightness(1.5) drop-shadow(0 0 12px var(--accent))';
  } else {
    var nearest = Infinity;
    sim.organisms.forEach(function(o) {
      var dx = o.x - goalX, dy = o.y - goalY;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d < nearest) nearest = d;
    });
    var intensity = Math.max(0, 1 - nearest / 200);
    goal.style.filter = intensity > 0.1 ? 'brightness(' + (1 + intensity * 0.6) + ')' : '';
  }

  sim.organisms.forEach(function(org) {
    org.fitness = fitness(org.x, org.y);
  });

  sim.organisms.forEach(function(org, i) {
    if (sim.elems[i]) styleOrganism(sim.elems[i], org);
  });

  var eliteOrg = sim.organisms[eliteIdx];
  if (eliteOrg) {
    eliteOrg.elite = true;
    if (sim.elems[eliteIdx]) styleOrganism(sim.elems[eliteIdx], eliteOrg);
  }

  updateStatDisplay();

  if (goalActivated || sim.tick >= genLen) {
    endGeneration();
  }
}

function endGeneration() {
  sim.transitioning = true;
  clearInterval(sim.tickInterval);

  sim.organisms.forEach(function(org) { org.fitness = fitness(org.x, org.y); });

  var sorted = sim.organisms.slice().sort(function(a, b) { return b.fitness - a.fitness; });
  var best = sorted[0];
  best.elite = true;

  var selPressure = parseInt(selectionSlider.value) / 100;
  var keepCount = Math.max(2, Math.round(sorted.length * selPressure));
  var survivors = sorted.slice(0, keepCount);

  fadeTrails();

  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(56,189,248,0.04);pointer-events:none;z-index:9;transition:opacity 0.5s;';
  document.body.appendChild(overlay);
  setTimeout(function() { overlay.style.opacity = '0'; }, 300);
  setTimeout(function() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 800);

  setTimeout(function() {
    if (!sim.running) { sim.transitioning = false; return; }

    sim.generation++;
    sim.tick = 0;

    var genLen = parseInt(generationSlider.value);
    var mutRate = parseInt(mutationSlider.value) / 100;
    var totalNeeded = sim.organisms.length;
    var newOrgs = [];

    survivors[0].genes = survivors[0].genes;
    var sx0 = window.innerWidth * SPAWN_X_RATIO + rnd(-30, 30);
    var sy0 = window.innerHeight * SPAWN_Y_RATIO + rnd(-20, 20);
    newOrgs.push({
      x: sx0, y: sy0, startX: sx0, startY: sy0,
      vx: 0, vy: 0,
      genes: survivors[0].genes.slice(),
      fitness: 0, hue: survivors[0].hue, elite: false, reached: false
    });

    while (newOrgs.length < totalNeeded) {
      var parentA = survivors[Math.floor(Math.random() * survivors.length)];
      var parentB = survivors[Math.floor(Math.random() * survivors.length)];
      var childGenes = mutateGenes(crossover(parentA.genes, parentB.genes), mutRate);
      var sx = window.innerWidth * SPAWN_X_RATIO + rnd(-30, 30);
      var sy = window.innerHeight * SPAWN_Y_RATIO + rnd(-20, 20);
      newOrgs.push({
        x: sx, y: sy, startX: sx, startY: sy,
        vx: 0, vy: 0,
        genes: childGenes,
        fitness: 0,
        hue: Math.random() < 0.6 ? parentA.hue : Math.floor(rnd(0, 360)),
        elite: false,
        reached: false
      });
    }

    sim.organisms = newOrgs;
    renderOrganisms();
    updateStatDisplay();

    sim.transitioning = false;
    if (sim.running) {
      sim.tickInterval = setInterval(doTick, TICK_MS);
    }
  }, 600);
}

function startSim() {
  if (sim.paused) {
    sim.paused = false;
    sim.running = true;
    setStatus('running');
    sim.tickInterval = setInterval(doTick, TICK_MS);
    return;
  }

  clearOrganisms();
  clearTrails();
  goal.style.filter = '';

  sim.running = true;
  sim.paused = false;
  sim.generation = 1;
  sim.tick = 0;
  sim.transitioning = false;

  initPopulation();
  renderOrganisms();
  updateStatDisplay();
  setStatus('running');

  sim.tickInterval = setInterval(doTick, TICK_MS);
}

function pauseSim() {
  if (!sim.running) return;
  clearInterval(sim.tickInterval);
  sim.running = false;
  sim.paused = true;
  setStatus('paused');
}

function endSim() {
  clearInterval(sim.tickInterval);
  sim.running = false;
  sim.paused = false;
  sim.transitioning = false;
  sim.generation = 0;
  sim.tick = 0;
  goal.style.filter = '';
  clearOrganisms();
  clearTrails();
  sim.organisms = [];
  updateStatDisplay();
  setStatus('ended');
}

btnStart.addEventListener('click', startSim);
btnPause.addEventListener('click', pauseSim);
btnEnd.addEventListener('click', endSim);

updateStatDisplay();
setStatus('ready');