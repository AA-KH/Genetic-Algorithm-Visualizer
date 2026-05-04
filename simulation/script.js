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
var stopOnGoalToggle = document.getElementById('stop-on-goal-toggle');
var stopOnGoalLabel = document.getElementById('stop-on-goal-label');
var analyticsPanel = document.getElementById('analytics-panel');
var analyticsDismiss = document.getElementById('analytics-dismiss');
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

goal.addEventListener('mousedown', function(e) {
  dragging = true;
  dragOffsetX = e.clientX - parseInt(goal.style.left, 10);
  dragOffsetY = e.clientY - parseInt(goal.style.top, 10);
  e.preventDefault();
});

document.addEventListener('mousemove', function(e) {
  if (!dragging) return;
  placeGoal(e.clientX - dragOffsetX, e.clientY - dragOffsetY);
});

document.addEventListener('mouseup', function() { dragging = false; });

field.addEventListener('click', function(e) {
  if (e.target === goal || goal.contains(e.target)) return;
  placeGoal(e.clientX, e.clientY);
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

function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  themeStatus.textContent = t === 'light' ? 'LIGHT MODE' : 'DARK MODE';
  localStorage.setItem(themeStorageKey, t);
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

var stopOnGoal = false;
stopOnGoalToggle.addEventListener('click', function() {
  stopOnGoal = !stopOnGoal;
  stopOnGoalToggle.classList.toggle('active', stopOnGoal);
  stopOnGoalLabel.textContent = stopOnGoal ? 'ON' : 'OFF';
});

setTimeout(function() { fieldStatus.classList.add('hidden'); }, 15000);

var SPAWN_X_RATIO = 0.12;
var SPAWN_Y_RATIO = 0.82;
var SPEED = 3.2;
var TICK_MS = 28;
var GOAL_RADIUS = 26;
var MAX_TRAILS = 320;
var TRAIL_INTERVAL = 6;
var STAGNATION_LIMIT = 4;

var sim = {
  running: false,
  paused: false,
  generation: 0,
  tick: 0,
  organisms: [],
  elems: [],
  tickInterval: null,
  transitioning: false,
  goalReachCount: 0,
  firstGoalGen: -1,
  history: [],
  stagnantGens: 0,
  lastBestFitness: 0,
  boostMutRate: false,
  bestPathElems: [],
  trailSegments: []
};

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

function dist(ax, ay, bx, by) {
  var dx = ax - bx, dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

function fitness(ox, oy) {
  return 1 / (dist(ox, oy, goalX, goalY) + 1);
}

function initPopulation() {
  var count = parseInt(populationSlider.value);
  var genLen = parseInt(generationSlider.value);
  sim.organisms = [];
  for (var i = 0; i < count; i++) {
    var sx = window.innerWidth * SPAWN_X_RATIO + rnd(-30, 30);
    var sy = window.innerHeight * SPAWN_Y_RATIO + rnd(-20, 20);
    sim.organisms.push({
      x: sx, y: sy, vx: 0, vy: 0,
      genes: randGenes(genLen),
      fitness: 0,
      elite: false,
      reached: false,
      path: [],
      lastX: sx, lastY: sy
    });
  }
}

function renderOrganisms() {
  sim.elems.forEach(function(el) { if (el.parentNode) el.parentNode.removeChild(el); });
  sim.elems = [];
  sim.organisms.forEach(function(org, i) {
    var el = document.createElement('div');
    el.className = 'organism';
    field.appendChild(el);
    sim.elems[i] = el;
    moveElem(el, org.x, org.y);
    styleOrganism(el, org);
  });
}

function moveElem(el, x, y) {
  el.style.transform = 'translate(' + (x - 5) + 'px,' + (y - 5) + 'px)';
}

function styleOrganism(el, org) {
  var light = document.documentElement.getAttribute('data-theme') === 'light';
  if (org.elite) {
    el.style.width = '14px';
    el.style.height = '14px';
    el.style.zIndex = '6';
    el.style.background = light ? 'rgba(220,100,10,0.97)' : 'rgba(255,225,60,0.97)';
    el.style.boxShadow = light
      ? '0 0 18px rgba(220,100,10,0.8),0 0 36px rgba(220,100,10,0.4)'
      : '0 0 18px rgba(255,225,60,0.8),0 0 36px rgba(255,225,60,0.4)';
  } else if (org.reached) {
    el.style.width = '11px';
    el.style.height = '11px';
    el.style.zIndex = '4';
    el.style.background = light ? 'rgba(50,160,80,0.9)' : 'rgba(74,222,128,0.9)';
    el.style.boxShadow = light ? '0 0 10px rgba(50,160,80,0.5)' : '0 0 10px rgba(74,222,128,0.5)';
  } else {
    var alpha = Math.min(0.9, 0.3 + org.fitness * 2);
    el.style.width = '10px';
    el.style.height = '10px';
    el.style.zIndex = '2';
    el.style.background = light ? 'rgba(176,106,16,' + alpha + ')' : 'rgba(56,189,248,' + alpha + ')';
    el.style.boxShadow = light ? '0 0 6px rgba(176,106,16,0.2)' : '0 0 6px rgba(56,189,248,0.2)';
  }
}

function addTrailSegment(x1, y1, x2, y2, isElite) {
  if (sim.trailSegments.length >= MAX_TRAILS) {
    var old = sim.trailSegments.shift();
    if (old.el.parentNode) old.el.parentNode.removeChild(old.el);
  }

  var dx = x2 - x1, dy = y2 - y1;
  var length = Math.sqrt(dx * dx + dy * dy);
  if (length < 1) return;

  var angle = Math.atan2(dy, dx) * 180 / Math.PI;
  var cx = (x1 + x2) / 2;
  var cy = (y1 + y2) / 2;
  var light = document.documentElement.getAttribute('data-theme') === 'light';

  var el = document.createElement('div');
  el.style.cssText = 'position:absolute;pointer-events:none;border-radius:2px;transform-origin:center center;z-index:1;';
  el.style.width = length + 'px';
  el.style.height = isElite ? '2.5px' : '1.5px';
  el.style.left = '0';
  el.style.top = '0';
  el.style.transform = 'translate(' + (cx - length / 2) + 'px,' + (cy - 0.75) + 'px) rotate(' + angle + 'deg)';

  var opacity = isElite ? 0.55 : 0.22;
  if (isElite) {
    el.style.background = light
      ? 'linear-gradient(90deg,rgba(220,100,10,0),rgba(220,100,10,' + opacity + '),rgba(220,100,10,0))'
      : 'linear-gradient(90deg,rgba(255,225,60,0),rgba(255,225,60,' + opacity + '),rgba(255,225,60,0))';
  } else {
    el.style.background = light
      ? 'linear-gradient(90deg,rgba(176,106,16,0),rgba(176,106,16,' + opacity + '),rgba(176,106,16,0))'
      : 'linear-gradient(90deg,rgba(56,189,248,0),rgba(56,189,248,' + opacity + '),rgba(56,189,248,0))';
  }

  field.appendChild(el);
  sim.trailSegments.push({ el: el, born: sim.generation, opacity: opacity });
}

function fadeAllTrailSegments() {
  var keep = [];
  sim.trailSegments.forEach(function(t) {
    var age = sim.generation - t.born;
    var newOpacity = t.opacity * Math.pow(0.6, age);
    if (newOpacity < 0.02) {
      if (t.el.parentNode) t.el.parentNode.removeChild(t.el);
    } else {
      t.el.style.opacity = newOpacity / t.opacity;
      keep.push(t);
    }
  });
  sim.trailSegments = keep;
}

function clearAllTrails() {
  sim.trailSegments.forEach(function(t) { if (t.el.parentNode) t.el.parentNode.removeChild(t.el); });
  sim.trailSegments = [];
}

function clearOrganisms() {
  sim.elems.forEach(function(el) { if (el.parentNode) el.parentNode.removeChild(el); });
  sim.elems = [];
}

function clearBestPath() {
  sim.bestPathElems.forEach(function(el) { if (el.parentNode) el.parentNode.removeChild(el); });
  sim.bestPathElems = [];
}

function drawBestPath(path) {
  clearBestPath();
  if (!path || path.length < 2) return;
  var light = document.documentElement.getAttribute('data-theme') === 'light';

  for (var i = 1; i < path.length; i++) {
    var p0 = path[i - 1], p1 = path[i];
    var dx = p1.x - p0.x, dy = p1.y - p0.y;
    var len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) continue;
    var angle = Math.atan2(dy, dx) * 180 / Math.PI;
    var cx = (p0.x + p1.x) / 2;
    var cy = (p0.y + p1.y) / 2;

    var el = document.createElement('div');
    el.style.cssText = 'position:absolute;pointer-events:none;border-radius:2px;z-index:3;';
    el.style.width = len + 'px';
    el.style.height = '2px';
    el.style.left = '0';
    el.style.top = '0';
    el.style.transform = 'translate(' + (cx - len / 2) + 'px,' + (cy - 1) + 'px) rotate(' + angle + 'deg)';
    el.style.background = light
      ? 'linear-gradient(90deg,rgba(220,100,10,0),rgba(220,100,10,0.7),rgba(220,100,10,0))'
      : 'linear-gradient(90deg,rgba(255,225,60,0),rgba(255,225,60,0.7),rgba(255,225,60,0))';
    field.appendChild(el);
    sim.bestPathElems.push(el);
  }
}

function updateStatDisplay() {
  var count = (sim.running || sim.paused) ? sim.organisms.length : parseInt(populationSlider.value);
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

function doTick() {
  if (!sim.running || sim.transitioning) return;
  var genLen = parseInt(generationSlider.value);
  sim.tick++;

  var eliteIdx = 0;
  var bestFNow = 0;
  sim.organisms.forEach(function(o, i) {
    o.fitness = fitness(o.x, o.y);
    if (o.fitness > bestFNow) { bestFNow = o.fitness; eliteIdx = i; }
  });

  sim.organisms.forEach(function(org) { org.elite = false; });
  sim.organisms[eliteIdx].elite = true;

  var reachedAny = false;

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

    if (dist(org.x, org.y, goalX, goalY) < GOAL_RADIUS) {
      org.reached = true;
      reachedAny = true;
    }

    if (sim.tick % TRAIL_INTERVAL === 0) {
      addTrailSegment(org.lastX, org.lastY, org.x, org.y, org.elite);
    }

    if (sim.tick % TRAIL_INTERVAL === 0) {
      org.lastX = org.x;
      org.lastY = org.y;
    }

    if (i === eliteIdx && sim.tick % 5 === 0) {
      org.path.push({ x: org.x, y: org.y });
    }

    if (sim.elems[i]) {
      moveElem(sim.elems[i], org.x, org.y);
      styleOrganism(sim.elems[i], org);
    }
  });

  var nearest = Infinity;
  sim.organisms.forEach(function(o) {
    var d = dist(o.x, o.y, goalX, goalY);
    if (d < nearest) nearest = d;
  });

  if (sim.organisms.some(function(o) { return o.reached; })) {
    goal.style.filter = 'brightness(1.6) drop-shadow(0 0 14px var(--accent))';
  } else {
    var intensity = Math.max(0, 1 - nearest / 180);
    goal.style.filter = intensity > 0.08 ? 'brightness(' + (1 + intensity * 0.7) + ')' : '';
  }

  updateStatDisplay();

  if (reachedAny) {
    sim.goalReachCount++;
    if (sim.firstGoalGen < 0) sim.firstGoalGen = sim.generation;
    if (stopOnGoal) {
      var winner = sim.organisms[eliteIdx];
      drawBestPath(winner.path);
      finishSimulation(winner);
      return;
    }
  }

  if (sim.tick >= genLen) {
    endGeneration();
  }
}

function endGeneration() {
  sim.transitioning = true;
  clearInterval(sim.tickInterval);

  sim.organisms.forEach(function(org) { org.fitness = fitness(org.x, org.y); });
  var sorted = sim.organisms.slice().sort(function(a, b) { return b.fitness - a.fitness; });
  var bestOrg = sorted[0];
  var bestF = bestOrg.fitness;

  sim.history.push({ gen: sim.generation, bestFitness: bestF, path: bestOrg.path.slice() });

  var selPressure = parseInt(selectionSlider.value) / 100;
  var keepCount = Math.max(2, Math.round(sorted.length * selPressure));
  var survivors = sorted.slice(0, keepCount);

  if (bestF <= sim.lastBestFitness * 1.005) {
    sim.stagnantGens++;
  } else {
    sim.stagnantGens = 0;
    sim.lastBestFitness = bestF;
  }

  var boostActive = sim.stagnantGens >= STAGNATION_LIMIT;
  sim.boostMutRate = boostActive;

  if (boostActive) {
    sim.stagnantGens = 0;
  }

  fadeAllTrailSegments();

  var light = document.documentElement.getAttribute('data-theme') === 'light';
  var flashColor = light ? 'rgba(176,106,16,0.06)' : 'rgba(56,189,248,0.05)';
  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9;transition:opacity 0.5s;background:' + flashColor + ';';
  document.body.appendChild(overlay);
  setTimeout(function() { overlay.style.opacity = '0'; }, 250);
  setTimeout(function() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 750);

  setTimeout(function() {
    if (!sim.running) { sim.transitioning = false; return; }

    sim.generation++;
    sim.tick = 0;

    var genLen = parseInt(generationSlider.value);
    var baseMutRate = parseInt(mutationSlider.value) / 100;
    var mutRate = boostActive ? Math.min(0.5, baseMutRate * 3.5) : baseMutRate;
    var totalNeeded = sim.organisms.length;
    var newOrgs = [];
    var injectCount = boostActive ? Math.max(2, Math.floor(totalNeeded * 0.1)) : 0;

    var sx0 = window.innerWidth * SPAWN_X_RATIO + rnd(-30, 30);
    var sy0 = window.innerHeight * SPAWN_Y_RATIO + rnd(-20, 20);
    newOrgs.push({
      x: sx0, y: sy0, vx: 0, vy: 0,
      genes: survivors[0].genes.slice(),
      fitness: 0, elite: false, reached: false,
      path: [], lastX: sx0, lastY: sy0
    });

    while (newOrgs.length < totalNeeded - injectCount) {
      var pA = survivors[Math.floor(Math.random() * survivors.length)];
      var pB = survivors[Math.floor(Math.random() * survivors.length)];
      var childGenes = mutateGenes(crossover(pA.genes, pB.genes), mutRate);
      var sx = window.innerWidth * SPAWN_X_RATIO + rnd(-30, 30);
      var sy = window.innerHeight * SPAWN_Y_RATIO + rnd(-20, 20);
      newOrgs.push({
        x: sx, y: sy, vx: 0, vy: 0,
        genes: childGenes,
        fitness: 0, elite: false, reached: false,
        path: [], lastX: sx, lastY: sy
      });
    }

    for (var j = 0; j < injectCount; j++) {
      var rx = window.innerWidth * SPAWN_X_RATIO + rnd(-30, 30);
      var ry = window.innerHeight * SPAWN_Y_RATIO + rnd(-20, 20);
      newOrgs.push({
        x: rx, y: ry, vx: 0, vy: 0,
        genes: randGenes(genLen),
        fitness: 0, elite: false, reached: false,
        path: [], lastX: rx, lastY: ry
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

function finishSimulation(winnerOrg) {
  clearInterval(sim.tickInterval);
  sim.running = false;
  sim.paused = false;
  sim.transitioning = false;

  goal.style.filter = 'brightness(2) drop-shadow(0 0 20px var(--accent))';

  if (winnerOrg && winnerOrg.path.length > 1) {
    drawBestPath(winnerOrg.path);
  }

  sim.organisms.forEach(function(org, i) {
    var el = sim.elems[i];
    if (!el) return;
    if (org === winnerOrg || org.elite) {
      el.classList.add('organism-winner');
    }
  });

  setStatus('ended');
  setTimeout(function() { showAnalytics(); }, 800);
}

function showAnalytics() {
  var totalGens = sim.generation;
  var bestF = 0;
  sim.history.forEach(function(h) { if (h.bestFitness > bestF) bestF = h.bestFitness; });

  document.getElementById('an-generations').textContent = totalGens;
  document.getElementById('an-best-fitness').textContent = (bestF * 100).toFixed(2) + '%';
  document.getElementById('an-goal-reaches').textContent = sim.goalReachCount;
  document.getElementById('an-first-goal').textContent = sim.firstGoalGen >= 0 ? 'Gen ' + sim.firstGoalGen : 'N/A';

  var avgFitnesses = sim.history.map(function(h) { return h.bestFitness; });
  var totalAvg = avgFitnesses.reduce(function(a, b) { return a + b; }, 0) / (avgFitnesses.length || 1);
  document.getElementById('an-avg-fitness').textContent = (totalAvg * 100).toFixed(2) + '%';

  buildFitnessChart(sim.history);

  analyticsPanel.classList.add('open');
}

function buildFitnessChart(history) {
  var chart = document.getElementById('fitness-chart');
  chart.innerHTML = '';
  if (!history.length) return;

  var maxF = 0;
  history.forEach(function(h) { if (h.bestFitness > maxF) maxF = h.bestFitness; });
  if (maxF === 0) maxF = 1;

  var showEvery = Math.ceil(history.length / 60);

  history.forEach(function(h, i) {
    if (i % showEvery !== 0 && i !== history.length - 1) return;
    var pct = (h.bestFitness / maxF) * 100;
    var bar = document.createElement('div');
    bar.className = 'chart-bar';
    bar.style.height = pct + '%';
    bar.title = 'Gen ' + h.gen + ': ' + (h.bestFitness * 100).toFixed(1) + '%';
    chart.appendChild(bar);
  });
}

analyticsDismiss.addEventListener('click', function() {
  analyticsPanel.classList.remove('open');
});

function startSim() {
  if (sim.paused) {
    sim.paused = false;
    sim.running = true;
    setStatus('running');
    sim.tickInterval = setInterval(doTick, TICK_MS);
    return;
  }

  clearOrganisms();
  clearAllTrails();
  clearBestPath();
  goal.style.filter = '';

  sim.running = true;
  sim.paused = false;
  sim.generation = 1;
  sim.tick = 0;
  sim.transitioning = false;
  sim.goalReachCount = 0;
  sim.firstGoalGen = -1;
  sim.history = [];
  sim.stagnantGens = 0;
  sim.lastBestFitness = 0;
  sim.boostMutRate = false;

  document.querySelectorAll('.organism-winner').forEach(function(el) {
    el.classList.remove('organism-winner');
  });

  analyticsPanel.classList.remove('open');

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
  var winner = null;
  sim.organisms.forEach(function(o) { if (o.elite) winner = o; });
  finishSimulation(winner);
  if (!sim.history.length) {
    clearOrganisms();
    clearAllTrails();
    clearBestPath();
    goal.style.filter = '';
    sim.generation = 0;
    sim.tick = 0;
    sim.organisms = [];
    updateStatDisplay();
    setStatus('ended');
  }
}

btnStart.addEventListener('click', startSim);
btnPause.addEventListener('click', pauseSim);
btnEnd.addEventListener('click', endSim);

updateStatDisplay();
setStatus('ready');