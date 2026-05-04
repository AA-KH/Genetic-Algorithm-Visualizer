// ─── GET ALL THE HTML ELEMENTS WE NEED ───────────────────────────────────────

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

// ─── GOAL POSITION ────────────────────────────────────────────────────────────

var goalX = window.innerWidth * 0.62;
var goalY = window.innerHeight * 0.38;

function placeGoal(x, y) {
  goalX = x;
  goalY = y;
  goal.style.left = x + 'px';
  goal.style.top = y + 'px';
  goalCoords.textContent = '(' + Math.round(x) + ', ' + Math.round(y) + ')';
  if (typeof sim !== 'undefined' && sim.running) sim.goalMoved = true;
}

placeGoal(goalX, goalY);

// drag the goal around
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

// ─── SIDEBAR PANELS ───────────────────────────────────────────────────────────

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

// ─── THEME ────────────────────────────────────────────────────────────────────

function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  themeStatus.textContent = t === 'light' ? 'LIGHT MODE' : 'DARK MODE';
  localStorage.setItem(themeStorageKey, t);
}

applyTheme(localStorage.getItem(themeStorageKey) || 'dark');
themeToggle.addEventListener('click', function() {
  var current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'light' ? 'dark' : 'light');
});

// ─── SLIDER LABELS ────────────────────────────────────────────────────────────

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

// ─── STOP ON GOAL TOGGLE ─────────────────────────────────────────────────────

var stopOnGoal = false;
stopOnGoalToggle.addEventListener('click', function() {
  stopOnGoal = !stopOnGoal;
  stopOnGoalToggle.classList.toggle('active', stopOnGoal);
  stopOnGoalLabel.textContent = stopOnGoal ? 'ON' : 'OFF';
});

setTimeout(function() { fieldStatus.classList.add('hidden'); }, 15000);

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

var SPAWN_X_RATIO = 0.12;
var SPAWN_Y_RATIO = 0.82;
var SPEED = 3.2;
var TICK_MS = 28;
var GOAL_RADIUS = 26;
var MAX_TRAILS = 400;
var TRAIL_INTERVAL = 5;
var STAGNATION_LIMIT = 5;
var PATH_RECORD_INTERVAL = 4;

// ─── SIMULATION STATE OBJECT ─────────────────────────────────────────────────

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
  trailSegments: [],
  stagnationRecoveries: 0,
  goalMoved: false,
  goalMovedGen: -1,
  bestEverPath: [],
  bestEverFitness: 0,
  pathSnapshots: [],
  // track which organism index is currently the "best" (yellow) right now
  currentBestIdx: 0
};

// ─── SIMPLE MATH HELPERS ─────────────────────────────────────────────────────

// random number between a and b
function rnd(a, b) {
  return a + Math.random() * (b - a);
}

// distance between two points
function dist(ax, ay, bx, by) {
  var dx = ax - bx;
  var dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

// ─── GENE CREATION ───────────────────────────────────────────────────────────
// Each gene is a small push (acceleration) the organism gets at that tick.
// Generation 1 is completely random — the algorithm discovers the goal on its own
// purely through selection pressure over many generations.

function makeGenes(genLen) {
  var genes = [];
  for (var i = 0; i < genLen; i++) {
    // Fully random direction and magnitude — no knowledge of where the goal is
    var angle = rnd(0, Math.PI * 2);
    var mag = rnd(0.3, 1.0);
    genes.push({
      ax: Math.cos(angle) * mag,
      ay: Math.sin(angle) * mag
    });
  }
  return genes;
}

// ─── MUTATION ────────────────────────────────────────────────────────────────
// Takes a child's genes (inherited from parents) and randomly changes some of them.
// No knowledge of the goal — just random noise applied to inherited genes.
// Over generations, the good changes accumulate and bad ones get selected out.

function mutateGenes(genes, rate) {
  var newGenes = [];
  for (var i = 0; i < genes.length; i++) {
    var g = genes[i];

    if (Math.random() < rate) {
      // Full replacement with a brand new random gene
      var angle = rnd(0, Math.PI * 2);
      var mag = rnd(0.3, 1.0);
      newGenes.push({
        ax: Math.cos(angle) * mag,
        ay: Math.sin(angle) * mag
      });
    } else if (Math.random() < rate * 0.5) {
      // Small nudge — keeps roughly the same direction with a little variation
      newGenes.push({
        ax: g.ax + rnd(-0.3, 0.3),
        ay: g.ay + rnd(-0.3, 0.3)
      });
    } else {
      // Keep the gene exactly as inherited — most genes survive unchanged
      newGenes.push({ ax: g.ax, ay: g.ay });
    }
  }
  return newGenes;
}

// ─── CROSSOVER ───────────────────────────────────────────────────────────────
// Mix two parents' genes together at a random cut point.

function crossover(genesA, genesB) {
  var cut = Math.floor(Math.random() * genesA.length);
  return genesA.slice(0, cut).concat(genesB.slice(cut));
}

// ─── FITNESS CALCULATION ─────────────────────────────────────────────────────
// How good was this organism? Higher score = better.
// This is what drives the whole algorithm — good scores mean your genes get
// passed on. Bad scores mean you don't reproduce.

function calcFitness(org, genLen) {
  // PRIMARY score: the closest it EVER got to the goal during the whole generation.
  // Using closest-ever (not final position) means an organism is rewarded for
  // getting near the goal even briefly. This is the main selection pressure —
  // every generation, the ones that got closer win.
  var closestScore = 1 / (org.closestDist + 1);

  // SECONDARY score: where it ended up. Smaller bonus than closestDist.
  // This helps break ties and nudges organisms to stay near the goal, not just pass by.
  var finalDist = dist(org.x, org.y, goalX, goalY);
  var finalScore = (1 / (finalDist + 1)) * 0.3;

  // Big bonus if it actually reached the goal
  var reachedBonus = org.reached ? 2.0 : 0;

  // If it reached the goal faster, extra bonus
  var timeBonus = 0;
  if (org.reached && org.reachedTick > 0) {
    timeBonus = (1 - org.reachedTick / genLen) * 0.8;
  }

  // closestScore is the dominant term — that's intentional.
  // It means "how close did you get?" is the #1 thing that matters.
  return closestScore + finalScore + reachedBonus + timeBonus;
}

// ─── MAKE A BLANK ORGANISM OBJECT ────────────────────────────────────────────

function makeOrganism(x, y, genes) {
  return {
    x: x,
    y: y,
    vx: 0,
    vy: 0,
    genes: genes,
    fitness: 0,
    elite: false,
    reached: false,
    reachedTick: 0,
    path: [],
    lastX: x,
    lastY: y,
    totalDist: 0,
    closestDist: dist(x, y, goalX, goalY),
    prevDist: dist(x, y, goalX, goalY)
  };
}

// ─── BUILD STARTING POPULATION ───────────────────────────────────────────────

function initPopulation() {
  var count = parseInt(populationSlider.value);
  var genLen = parseInt(generationSlider.value);
  var spawnX = window.innerWidth * SPAWN_X_RATIO;
  var spawnY = window.innerHeight * SPAWN_Y_RATIO;

  sim.organisms = [];
  for (var i = 0; i < count; i++) {
    var sx = spawnX + rnd(-30, 30);
    var sy = spawnY + rnd(-20, 20);
    sim.organisms.push(makeOrganism(sx, sy, makeGenes(genLen)));
  }
}

// ─── RENDER (CREATE DOM ELEMENTS FOR) ALL ORGANISMS ─────────────────────────

function renderOrganisms() {
  // remove old elements
  for (var i = 0; i < sim.elems.length; i++) {
    if (sim.elems[i] && sim.elems[i].parentNode) {
      sim.elems[i].parentNode.removeChild(sim.elems[i]);
    }
  }
  sim.elems = [];

  // create new elements
  for (var j = 0; j < sim.organisms.length; j++) {
    var el = document.createElement('div');
    el.className = 'organism';
    field.appendChild(el);
    sim.elems[j] = el;
    moveElem(el, sim.organisms[j].x, sim.organisms[j].y);
    styleOrganism(el, sim.organisms[j]);
  }
}

// ─── MOVE AN ORGANISM'S DOM ELEMENT ─────────────────────────────────────────

function moveElem(el, x, y) {
  el.style.transform = 'translate(' + (x - 5) + 'px,' + (y - 5) + 'px)';
}

// ─── STYLE AN ORGANISM (COLOR, SIZE, GLOW) ──────────────────────────────────

function styleOrganism(el, org) {
  var light = document.documentElement.getAttribute('data-theme') === 'light';

  if (org.elite) {
    // yellow / orange — the current best performer
    el.style.width = '14px';
    el.style.height = '14px';
    el.style.zIndex = '6';
    el.style.background = light ? 'rgba(220,100,10,0.97)' : 'rgba(255,225,60,0.97)';
    el.style.boxShadow = light
      ? '0 0 18px rgba(220,100,10,0.8),0 0 36px rgba(220,100,10,0.4)'
      : '0 0 18px rgba(255,225,60,0.8),0 0 36px rgba(255,225,60,0.4)';
  } else if (org.reached) {
    // green — reached the goal
    el.style.width = '11px';
    el.style.height = '11px';
    el.style.zIndex = '4';
    el.style.background = light ? 'rgba(50,160,80,0.9)' : 'rgba(74,222,128,0.9)';
    el.style.boxShadow = light ? '0 0 10px rgba(50,160,80,0.5)' : '0 0 10px rgba(74,222,128,0.5)';
  } else {
    // blue — normal organism
    var alpha = 0.45;
    el.style.width = '10px';
    el.style.height = '10px';
    el.style.zIndex = '2';
    el.style.background = light ? 'rgba(176,106,16,' + alpha + ')' : 'rgba(56,189,248,' + alpha + ')';
    el.style.boxShadow = light ? '0 0 6px rgba(176,106,16,0.2)' : '0 0 6px rgba(56,189,248,0.2)';
  }
}

// ─── TRAIL LINES ──────────────────────────────────────────────────────────────

function addTrailSegment(x1, y1, x2, y2, isElite) {
  // keep trail count under the limit
  if (sim.trailSegments.length >= MAX_TRAILS) {
    var old = sim.trailSegments.shift();
    if (old.el.parentNode) old.el.parentNode.removeChild(old.el);
  }

  var dx = x2 - x1;
  var dy = y2 - y1;
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

  var opacity = isElite ? 0.65 : 0.2;
  if (isElite) {
    el.style.background = light
      ? 'linear-gradient(90deg,rgba(220,100,10,0),rgba(220,100,10,' + opacity + '),rgba(220,100,10,0))'
      : 'linear-gradient(90deg,rgba(255,225,60,0),rgba(255,225,60,' + opacity + '),rgba(255,225,60,0))';
    el.style.boxShadow = light ? '0 0 3px rgba(220,100,10,0.3)' : '0 0 3px rgba(255,225,60,0.3)';
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
  for (var i = 0; i < sim.trailSegments.length; i++) {
    var t = sim.trailSegments[i];
    var age = sim.generation - t.born;
    var newOpacity = t.opacity * Math.pow(0.55, age);
    if (newOpacity < 0.02) {
      if (t.el.parentNode) t.el.parentNode.removeChild(t.el);
    } else {
      t.el.style.opacity = newOpacity / t.opacity;
      keep.push(t);
    }
  }
  sim.trailSegments = keep;
}

function clearAllTrails() {
  for (var i = 0; i < sim.trailSegments.length; i++) {
    if (sim.trailSegments[i].el.parentNode) {
      sim.trailSegments[i].el.parentNode.removeChild(sim.trailSegments[i].el);
    }
  }
  sim.trailSegments = [];
}

// ─── CLEAR ORGANISMS FROM THE SCREEN ─────────────────────────────────────────

function clearOrganisms() {
  for (var i = 0; i < sim.elems.length; i++) {
    if (sim.elems[i] && sim.elems[i].parentNode) {
      sim.elems[i].parentNode.removeChild(sim.elems[i]);
    }
  }
  sim.elems = [];
}

// ─── BEST PATH DRAWING ───────────────────────────────────────────────────────

function clearBestPath() {
  for (var i = 0; i < sim.bestPathElems.length; i++) {
    if (sim.bestPathElems[i].parentNode) {
      sim.bestPathElems[i].parentNode.removeChild(sim.bestPathElems[i]);
    }
  }
  sim.bestPathElems = [];
}

function drawBestPath(path, persist) {
  if (!persist) clearBestPath();
  if (!path || path.length < 2) return;
  var light = document.documentElement.getAttribute('data-theme') === 'light';

  for (var i = 1; i < path.length; i++) {
    var p0 = path[i - 1];
    var p1 = path[i];
    var dx = p1.x - p0.x;
    var dy = p1.y - p0.y;
    var len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) continue;

    var angle = Math.atan2(dy, dx) * 180 / Math.PI;
    var cx = (p0.x + p1.x) / 2;
    var cy = (p0.y + p1.y) / 2;
    var progress = i / path.length;

    var el = document.createElement('div');
    el.style.cssText = 'position:absolute;pointer-events:none;border-radius:3px;z-index:3;';
    el.style.width = len + 'px';
    el.style.height = '3px';
    el.style.left = '0';
    el.style.top = '0';
    el.style.transform = 'translate(' + (cx - len / 2) + 'px,' + (cy - 1.5) + 'px) rotate(' + angle + 'deg)';

    var brightOpacity = 0.4 + progress * 0.55;
    el.style.background = light
      ? 'linear-gradient(90deg,rgba(220,100,10,0),rgba(220,100,10,' + brightOpacity + '),rgba(220,100,10,0))'
      : 'linear-gradient(90deg,rgba(255,225,60,0),rgba(255,225,60,' + brightOpacity + '),rgba(255,225,60,0))';
    el.style.boxShadow = light ? '0 0 4px rgba(220,100,10,0.4)' : '0 0 4px rgba(255,225,60,0.4)';

    field.appendChild(el);
    sim.bestPathElems.push(el);
  }
}

// ─── UPDATE THE STATS PANEL ON THE RIGHT ─────────────────────────────────────

function updateStatDisplay() {
  var count = (sim.running || sim.paused) ? sim.organisms.length : parseInt(populationSlider.value);
  statRows[0].textContent = count;

  if (sim.generation === 0 && !sim.running && !sim.paused) {
    statRows[1].textContent = '—';
    statRows[2].textContent = '0';
    return;
  }

  // find nearest organism to goal
  var nearest = Infinity;
  for (var i = 0; i < sim.organisms.length; i++) {
    var d = dist(sim.organisms[i].x, sim.organisms[i].y, goalX, goalY);
    if (d < nearest) nearest = d;
  }
  var distLabel = nearest === Infinity ? '—' : Math.round(nearest) + 'px';
  statRows[1].textContent = distLabel;
  statRows[2].textContent = sim.generation;
}

// ─── SET THE STATUS BAR AT THE TOP ───────────────────────────────────────────

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

// ─── THE MAIN TICK FUNCTION — RUNS EVERY 28ms ─────────────────────────────────
// This is the heart of the simulation. Each tick we move every organism forward
// by one step using their genes, then check if any reached the goal.

function doTick() {
  if (!sim.running || sim.transitioning) return;

  var genLen = parseInt(generationSlider.value);
  sim.tick++;

  // ── STEP 1: Find who is currently closest to goal RIGHT NOW ──────────────
  // This is how we pick the yellow (elite) organism in real time.
  // We compare CURRENT distance to goal — whoever is closest becomes the star.
  var bestDistNow = Infinity;
  var bestIdxNow = 0;
  for (var k = 0; k < sim.organisms.length; k++) {
    var dNow = dist(sim.organisms[k].x, sim.organisms[k].y, goalX, goalY);
    if (dNow < bestDistNow) {
      bestDistNow = dNow;
      bestIdxNow = k;
    }
  }

  // Update elite status — only the current closest gets the yellow highlight
  for (var m = 0; m < sim.organisms.length; m++) {
    sim.organisms[m].elite = false;
  }
  sim.organisms[bestIdxNow].elite = true;
  sim.currentBestIdx = bestIdxNow;

  // ── STEP 2: Move every organism ──────────────────────────────────────────
  var reachedAny = false;
  var winnerOrg = null;

  for (var i = 0; i < sim.organisms.length; i++) {
    var org = sim.organisms[i];
    if (org.reached) continue; // already at goal, don't move

    // which gene to use this tick — we spread genes evenly across the generation
    var geneIdx = Math.floor((sim.tick / genLen) * org.genes.length);
    if (geneIdx >= org.genes.length) geneIdx = org.genes.length - 1;
    var g = org.genes[geneIdx];

    // apply the gene as an acceleration, with a little momentum
    org.vx = org.vx * 0.82 + g.ax * SPEED;
    org.vy = org.vy * 0.82 + g.ay * SPEED;

    // move the organism
    org.x += org.vx;
    org.y += org.vy;

    // keep inside the screen
    org.x = Math.max(5, Math.min(window.innerWidth - 5, org.x));
    org.y = Math.max(48, Math.min(window.innerHeight - 5, org.y));

    // track the closest it ever got to the goal
    var currDist = dist(org.x, org.y, goalX, goalY);
    if (currDist < org.closestDist) org.closestDist = currDist;
    org.prevDist = currDist;

    // track total distance traveled
    var moved = dist(org.x, org.y, org.lastX, org.lastY);
    org.totalDist += moved;

    // check if it reached the goal
    if (currDist < GOAL_RADIUS) {
      org.reached = true;
      org.reachedTick = sim.tick;
      reachedAny = true;
      if (!winnerOrg) winnerOrg = org;
    }

    // draw trail lines every few ticks
    if (sim.tick % TRAIL_INTERVAL === 0) {
      addTrailSegment(org.lastX, org.lastY, org.x, org.y, org.elite);
      org.lastX = org.x;
      org.lastY = org.y;
    }

    // record the path for the best organism so we can draw it later
    if (i === bestIdxNow && sim.tick % PATH_RECORD_INTERVAL === 0) {
      org.path.push({ x: org.x, y: org.y });
    }

    // update the dot on screen
    if (sim.elems[i]) {
      moveElem(sim.elems[i], org.x, org.y);
      styleOrganism(sim.elems[i], org);
    }
  }

  // ── STEP 3: Update goal glow based on proximity ──────────────────────────
  var nearest = Infinity;
  for (var n = 0; n < sim.organisms.length; n++) {
    var nd = dist(sim.organisms[n].x, sim.organisms[n].y, goalX, goalY);
    if (nd < nearest) nearest = nd;
  }

  if (sim.organisms.some(function(o) { return o.reached; })) {
    goal.style.filter = 'brightness(1.6) drop-shadow(0 0 14px var(--accent))';
  } else {
    var intensity = Math.max(0, 1 - nearest / 200);
    goal.style.filter = intensity > 0.08 ? 'brightness(' + (1 + intensity * 0.7) + ')' : '';
  }

  updateStatDisplay();

  // ── STEP 4: If something reached the goal, handle it ────────────────────
  if (reachedAny) {
    sim.goalReachCount++;
    if (sim.firstGoalGen < 0) sim.firstGoalGen = sim.generation;
    if (stopOnGoal && winnerOrg) {
      drawBestPath(winnerOrg.path);
      finishSimulation(winnerOrg);
      return;
    }
  }

  // ── STEP 5: End the generation when ticks run out ───────────────────────
  if (sim.tick >= genLen) {
    endGeneration();
  }
}

// ─── END OF A GENERATION — SCORE, SELECT, REPRODUCE ─────────────────────────

function endGeneration() {
  sim.transitioning = true;
  clearInterval(sim.tickInterval);

  // score every organism
  for (var i = 0; i < sim.organisms.length; i++) {
    sim.organisms[i].fitness = calcFitness(sim.organisms[i], parseInt(generationSlider.value));
  }

  // sort by fitness, best first
  var sorted = sim.organisms.slice().sort(function(a, b) { return b.fitness - a.fitness; });
  var bestOrg = sorted[0];
  var bestF = bestOrg.fitness;

  // save if this is the best path we've ever seen
  if (bestF > sim.bestEverFitness) {
    sim.bestEverFitness = bestF;
    sim.bestEverPath = bestOrg.path.slice();
  }

  // save a snapshot every 5 generations for the report
  if (sim.generation % 5 === 0 && bestOrg.path.length > 1) {
    sim.pathSnapshots.push({ gen: sim.generation, path: bestOrg.path.slice() });
    if (sim.pathSnapshots.length > 8) sim.pathSnapshots.shift();
  }

  sim.history.push({ gen: sim.generation, bestFitness: bestF, path: bestOrg.path.slice() });

  // how many survive to next generation
  var selPressure = parseInt(selectionSlider.value) / 100;
  var keepCount = Math.max(1, Math.round(sorted.length * selPressure));
  var survivors = sorted.slice(0, keepCount);

  // check for stagnation (no improvement)
  if (bestF <= sim.lastBestFitness * 1.008) {
    sim.stagnantGens++;
  } else {
    sim.stagnantGens = 0;
    sim.lastBestFitness = bestF;
  }

  var boostActive = sim.stagnantGens >= STAGNATION_LIMIT;
  sim.boostMutRate = boostActive;
  if (boostActive) {
    sim.stagnantGens = 0;
    sim.stagnationRecoveries++;
  }

  fadeAllTrailSegments();
  drawBestPath(bestOrg.path);

  // little flash effect between generations
  var light = document.documentElement.getAttribute('data-theme') === 'light';
  var flashColor = light ? 'rgba(176,106,16,0.06)' : 'rgba(56,189,248,0.05)';
  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9;transition:opacity 0.5s;background:' + flashColor + ';';
  document.body.appendChild(overlay);
  setTimeout(function() { overlay.style.opacity = '0'; }, 250);
  setTimeout(function() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 750);

  // short pause, then build the next generation
  setTimeout(function() {
    if (!sim.running) { sim.transitioning = false; return; }

    sim.generation++;
    sim.tick = 0;

    if (sim.goalMoved) {
      sim.goalMoved = false;
      sim.goalMovedGen = sim.generation;
      sim.lastBestFitness = 0;
      sim.stagnantGens = 0;
    }

    var genLen = parseInt(generationSlider.value);
    var baseMutRate = parseInt(mutationSlider.value) / 100;
    // if stagnating, boost mutation a lot to escape local trap
    var mutRate = boostActive ? Math.min(0.55, baseMutRate * 4) : baseMutRate;

    var spawnX = window.innerWidth * SPAWN_X_RATIO;
    var spawnY = window.innerHeight * SPAWN_Y_RATIO;
    var totalNeeded = sim.organisms.length;
    var newOrgs = [];
    var injectCount = boostActive ? Math.max(3, Math.floor(totalNeeded * 0.12)) : 0;

    // keep the best organism's genes exactly (elitism — top performer always survives)
    var sx0 = spawnX + rnd(-30, 30);
    var sy0 = spawnY + rnd(-20, 20);
    newOrgs.push(makeOrganism(sx0, sy0, survivors[0].genes.slice()));

    // Fitness-weighted parent selection.
    // Each survivor gets "tickets" proportional to their fitness.
    // Better performers are more likely to be chosen as parents.
    // This is natural selection — fitter organisms have more offspring.
    var totalFitness = 0;
    for (var t = 0; t < survivors.length; t++) {
      totalFitness += survivors[t].fitness;
    }
    function pickParent() {
      var pick = Math.random() * totalFitness;
      var running = 0;
      for (var p = 0; p < survivors.length; p++) {
        running += survivors[p].fitness;
        if (running >= pick) return survivors[p];
      }
      return survivors[survivors.length - 1];
    }

    // fill the rest with children of survivors
    while (newOrgs.length < totalNeeded - injectCount) {
      var pA = pickParent();
      var pB = pickParent();
      // crossover combines genes from two parents, mutation adds variation
      var childGenes = mutateGenes(crossover(pA.genes, pB.genes), mutRate);
      var sx = spawnX + rnd(-30, 30);
      var sy = spawnY + rnd(-20, 20);
      newOrgs.push(makeOrganism(sx, sy, childGenes));
    }

    // inject fully random organisms if stagnating
    for (var j = 0; j < injectCount; j++) {
      var rx = spawnX + rnd(-30, 30);
      var ry = spawnY + rnd(-20, 20);
      newOrgs.push(makeOrganism(rx, ry, makeGenes(genLen)));
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

// ─── FINISH THE SIMULATION ───────────────────────────────────────────────────

function finishSimulation(winnerOrg) {
  clearInterval(sim.tickInterval);
  sim.running = false;
  sim.paused = false;
  sim.transitioning = false;

  goal.style.filter = 'brightness(2.2) drop-shadow(0 0 24px var(--accent))';

  if (winnerOrg && winnerOrg.path.length > 1) {
    drawBestPath(winnerOrg.path);
  } else if (sim.bestEverPath.length > 1) {
    drawBestPath(sim.bestEverPath);
  }

  // mark remaining organisms visually
  for (var i = 0; i < sim.organisms.length; i++) {
    var el = sim.elems[i];
    if (!el) continue;
    if (sim.organisms[i] === winnerOrg || sim.organisms[i].elite) {
      el.classList.add('organism-winner');
    }
  }

  setStatus('ended');

  var light = document.documentElement.getAttribute('data-theme') === 'light';
  var endFlash = document.createElement('div');
  endFlash.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9;background:' +
    (light ? 'rgba(220,100,10,0.12)' : 'rgba(56,189,248,0.09)') + ';transition:opacity 1.2s;';
  document.body.appendChild(endFlash);
  setTimeout(function() { endFlash.style.opacity = '0'; }, 300);
  setTimeout(function() { if (endFlash.parentNode) endFlash.parentNode.removeChild(endFlash); }, 1500);

  setTimeout(function() { showAnalytics(winnerOrg); }, 1200);
}

// ─── ANALYTICS REPORT ────────────────────────────────────────────────────────

function showAnalytics(winnerOrg) {
  var totalGens = sim.generation;
  var bestF = 0;
  for (var i = 0; i < sim.history.length; i++) {
    if (sim.history[i].bestFitness > bestF) bestF = sim.history[i].bestFitness;
  }

  var avgFitTotal = 0;
  for (var j = 0; j < sim.history.length; j++) avgFitTotal += sim.history[j].bestFitness;
  var totalAvg = avgFitTotal / (sim.history.length || 1);

  document.getElementById('an-generations').textContent = totalGens;

  var closestReached = Infinity;
  for (var k = 0; k < sim.organisms.length; k++) {
    var d = dist(sim.organisms[k].x, sim.organisms[k].y, goalX, goalY);
    if (d < closestReached) closestReached = d;
  }
  var distDisplay = closestReached < GOAL_RADIUS ? '0 px (GOAL!)' : Math.round(closestReached) + ' px';
  document.getElementById('an-best-fitness').textContent = distDisplay;

  document.getElementById('an-goal-reaches').textContent = sim.goalReachCount;
  document.getElementById('an-first-goal').textContent = sim.firstGoalGen >= 0 ? 'Gen ' + sim.firstGoalGen : 'N/A';
  document.getElementById('an-avg-fitness').textContent = (totalAvg * 100).toFixed(1) + ' pts';
  document.getElementById('an-pop-size').textContent = parseInt(populationSlider.value);
  document.getElementById('an-mut-rate').textContent = (parseInt(mutationSlider.value) / 100).toFixed(2);
  document.getElementById('an-sel-pressure').textContent = (parseInt(selectionSlider.value) / 100).toFixed(2);
  document.getElementById('an-gen-length').textContent = parseInt(generationSlider.value);
  document.getElementById('an-stagnation').textContent = sim.stagnationRecoveries;
  document.getElementById('an-stop-on-goal').textContent = stopOnGoal ? 'YES' : 'NO';

  buildFitnessChart(sim.history);
  buildPathSnapshotView(winnerOrg);

  analyticsPanel.classList.add('open');
}

// ─── FITNESS CHART ───────────────────────────────────────────────────────────

function buildFitnessChart(history) {
  var chart = document.getElementById('fitness-chart');
  chart.innerHTML = '';
  if (!history.length) return;

  var maxF = 0;
  for (var i = 0; i < history.length; i++) {
    if (history[i].bestFitness > maxF) maxF = history[i].bestFitness;
  }
  if (maxF === 0) maxF = 1;

  var showEvery = Math.ceil(history.length / 80);

  for (var j = 0; j < history.length; j++) {
    if (j % showEvery !== 0 && j !== history.length - 1) continue;
    var pct = (history[j].bestFitness / maxF) * 100;
    var bar = document.createElement('div');
    bar.className = 'chart-bar';
    bar.style.height = pct + '%';
    bar.title = 'Gen ' + history[j].gen + ': ' + (history[j].bestFitness * 100).toFixed(1) + ' pts';
    chart.appendChild(bar);
  }
}

// ─── PATH SNAPSHOT VIEW (in the report) ──────────────────────────────────────
// Each snapshot is a small thumbnail showing how the best organism moved.
// Clicking one opens a bigger modal view.

function buildPathSnapshotView(winnerOrg) {
  var container = document.getElementById('path-snapshots');
  if (!container) return;
  container.innerHTML = '';

  // collect all snapshots
  var snaps = sim.pathSnapshots.slice();
  if (winnerOrg && winnerOrg.path.length > 1) {
    snaps.push({ gen: sim.generation, path: winnerOrg.path });
  } else if (sim.bestEverPath.length > 1) {
    snaps.push({ gen: sim.generation, path: sim.bestEverPath });
  }

  if (!snaps.length) {
    container.innerHTML = '<div style="color:var(--text-muted);font-size:11px;text-align:center;padding:20px;">No path data recorded</div>';
    return;
  }

  var fieldW = window.innerWidth;
  var fieldH = window.innerHeight;

  // bigger thumbnails so they're actually readable
  var snapW = 180;
  var snapH = 120;

  for (var idx = 0; idx < snaps.length; idx++) {
    // we use a closure to capture idx and snap properly
    (function(snap, snapIdx) {
      var isLast = snapIdx === snaps.length - 1;

      var wrapper = document.createElement('div');
      wrapper.style.cssText = 'display:inline-block;vertical-align:top;margin-right:12px;margin-bottom:10px;text-align:center;cursor:pointer;';

      var label = document.createElement('div');
      label.style.cssText = 'font-family:"Share Tech Mono",monospace;font-size:9px;color:var(--text-muted);letter-spacing:0.1em;margin-bottom:5px;';
      label.textContent = isLast ? 'GEN ' + snap.gen + ' ★' : 'GEN ' + snap.gen;

      var canvas = document.createElement('div');
      canvas.style.cssText = 'position:relative;width:' + snapW + 'px;height:' + snapH + 'px;' +
        'background:var(--accent-dim);border:1px solid var(--glass-border);border-radius:8px;overflow:hidden;' +
        'transition:border-color 0.2s,box-shadow 0.2s;';

      // hover effect
      canvas.addEventListener('mouseenter', function() {
        canvas.style.borderColor = 'var(--accent)';
        canvas.style.boxShadow = '0 0 12px var(--accent-glow)';
      });
      canvas.addEventListener('mouseleave', function() {
        canvas.style.borderColor = 'var(--glass-border)';
        canvas.style.boxShadow = '';
      });

      var scaleX = snapW / fieldW;
      var scaleY = snapH / fieldH;

      // draw the goal dot
      var gx = Math.round(goalX * scaleX);
      var gy = Math.round(goalY * scaleY);
      var goalDot = document.createElement('div');
      goalDot.style.cssText = 'position:absolute;width:8px;height:8px;background:var(--accent);border-radius:50%;' +
        'left:' + (gx - 4) + 'px;top:' + (gy - 4) + 'px;box-shadow:0 0 8px var(--accent);';
      canvas.appendChild(goalDot);

      // draw the path as line segments
      var path = snap.path;
      for (var i = 1; i < path.length; i++) {
        var p0 = path[i - 1];
        var p1 = path[i];
        var sx = p0.x * scaleX;
        var sy = p0.y * scaleY;
        var ex = p1.x * scaleX;
        var ey = p1.y * scaleY;
        var ddx = ex - sx;
        var ddy = ey - sy;
        var len = Math.sqrt(ddx * ddx + ddy * ddy);
        if (len < 0.5) continue;

        var angle = Math.atan2(ddy, ddx) * 180 / Math.PI;
        var cx = (sx + ex) / 2;
        var cy = (sy + ey) / 2;
        var prog = i / path.length;
        var op = isLast ? (0.5 + prog * 0.5) : 0.45;

        var seg = document.createElement('div');
        seg.style.cssText = 'position:absolute;height:2px;border-radius:1px;';
        seg.style.width = len + 'px';
        seg.style.transform = 'translate(' + (cx - len / 2) + 'px,' + (cy - 1) + 'px) rotate(' + angle + 'deg)';
        seg.style.background = isLast
          ? 'rgba(255,225,60,' + op + ')'
          : 'rgba(56,189,248,' + op + ')';
        canvas.appendChild(seg);
      }

      // draw spawn dot (green)
      var sdx = Math.round(window.innerWidth * SPAWN_X_RATIO * scaleX);
      var sdy = Math.round(window.innerHeight * SPAWN_Y_RATIO * scaleY);
      var spawnDot = document.createElement('div');
      spawnDot.style.cssText = 'position:absolute;width:5px;height:5px;background:rgba(74,222,128,0.9);border-radius:50%;' +
        'left:' + (sdx - 2) + 'px;top:' + (sdy - 2) + 'px;box-shadow:0 0 5px rgba(74,222,128,0.6);';
      canvas.appendChild(spawnDot);

      // "click to expand" hint
      var hint = document.createElement('div');
      hint.style.cssText = 'position:absolute;bottom:4px;right:6px;font-family:"Share Tech Mono",monospace;' +
        'font-size:8px;color:var(--text-muted);opacity:0.6;pointer-events:none;';
      hint.textContent = '⊕ zoom';
      canvas.appendChild(hint);

      wrapper.appendChild(label);
      wrapper.appendChild(canvas);
      container.appendChild(wrapper);

      // clicking opens a big modal with the path
      wrapper.addEventListener('click', function() {
        openPathModal(snap, isLast);
      });
    })(snaps[idx], idx);
  }
}

// ─── PATH MODAL (big popup when you click a snapshot) ────────────────────────

function openPathModal(snap, isLast) {
  // remove any existing modal
  var existing = document.getElementById('path-modal');
  if (existing) existing.parentNode.removeChild(existing);

  var fieldW = window.innerWidth;
  var fieldH = window.innerHeight;

  // modal size — big but fits the screen
  var modalW = Math.min(700, fieldW * 0.85);
  var modalH = Math.min(460, fieldH * 0.7);

  var overlay = document.createElement('div');
  overlay.id = 'path-modal';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;' +
    'background:rgba(0,0,0,0.75);backdrop-filter:blur(6px);';

  var box = document.createElement('div');
  box.style.cssText = 'position:relative;background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:14px;' +
    'padding:20px;width:' + modalW + 'px;';

  // title bar
  var titleRow = document.createElement('div');
  titleRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;';

  var title = document.createElement('div');
  title.style.cssText = 'font-family:"Share Tech Mono",monospace;font-size:12px;color:var(--text-secondary);letter-spacing:0.12em;';
  title.textContent = 'PATH — GENERATION ' + snap.gen + (isLast ? '  ★ FINAL' : '');

  var closeBtn = document.createElement('button');
  closeBtn.style.cssText = 'background:none;border:1px solid var(--glass-border);color:var(--text-secondary);' +
    'font-family:"Share Tech Mono",monospace;font-size:11px;padding:4px 10px;border-radius:6px;cursor:pointer;';
  closeBtn.textContent = '✕ CLOSE';
  closeBtn.addEventListener('click', function() {
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
  });

  titleRow.appendChild(title);
  titleRow.appendChild(closeBtn);
  box.appendChild(titleRow);

  // the big path canvas
  var canvas = document.createElement('div');
  canvas.style.cssText = 'position:relative;width:100%;height:' + modalH + 'px;' +
    'background:var(--field-bg);border:1px solid var(--glass-border);border-radius:8px;overflow:hidden;';

  var scaleX = (modalW - 40) / fieldW;
  var scaleY = modalH / fieldH;

  // goal dot
  var gx = Math.round(goalX * scaleX);
  var gy = Math.round(goalY * scaleY);
  var goalDot = document.createElement('div');
  goalDot.style.cssText = 'position:absolute;width:14px;height:14px;background:var(--accent);border-radius:50%;' +
    'left:' + (gx - 7) + 'px;top:' + (gy - 7) + 'px;box-shadow:0 0 16px var(--accent);';
  canvas.appendChild(goalDot);

  var goalLabel = document.createElement('div');
  goalLabel.style.cssText = 'position:absolute;font-family:"Share Tech Mono",monospace;font-size:9px;color:var(--accent);' +
    'left:' + (gx + 10) + 'px;top:' + (gy - 6) + 'px;';
  goalLabel.textContent = 'TARGET';
  canvas.appendChild(goalLabel);

  // draw path segments
  var path = snap.path;
  for (var i = 1; i < path.length; i++) {
    var p0 = path[i - 1];
    var p1 = path[i];
    var sx = p0.x * scaleX;
    var sy = p0.y * scaleY;
    var ex = p1.x * scaleX;
    var ey = p1.y * scaleY;
    var ddx = ex - sx;
    var ddy = ey - sy;
    var len = Math.sqrt(ddx * ddx + ddy * ddy);
    if (len < 0.5) continue;

    var angle = Math.atan2(ddy, ddx) * 180 / Math.PI;
    var cx = (sx + ex) / 2;
    var cy = (sy + ey) / 2;
    var prog = i / path.length;
    var op = isLast ? (0.4 + prog * 0.6) : (0.3 + prog * 0.5);

    var seg = document.createElement('div');
    seg.style.cssText = 'position:absolute;height:3px;border-radius:2px;';
    seg.style.width = len + 'px';
    seg.style.transform = 'translate(' + (cx - len / 2) + 'px,' + (cy - 1.5) + 'px) rotate(' + angle + 'deg)';
    seg.style.background = isLast
      ? 'rgba(255,225,60,' + op + ')'
      : 'rgba(56,189,248,' + op + ')';
    if (isLast) {
      seg.style.boxShadow = '0 0 4px rgba(255,225,60,0.3)';
    }
    canvas.appendChild(seg);
  }

  // spawn dot
  var sdx = Math.round(window.innerWidth * SPAWN_X_RATIO * scaleX);
  var sdy = Math.round(window.innerHeight * SPAWN_Y_RATIO * scaleY);
  var spawnDot = document.createElement('div');
  spawnDot.style.cssText = 'position:absolute;width:10px;height:10px;background:rgba(74,222,128,0.9);border-radius:50%;' +
    'left:' + (sdx - 5) + 'px;top:' + (sdy - 5) + 'px;box-shadow:0 0 10px rgba(74,222,128,0.6);';
  canvas.appendChild(spawnDot);

  var spawnLabel = document.createElement('div');
  spawnLabel.style.cssText = 'position:absolute;font-family:"Share Tech Mono",monospace;font-size:9px;color:rgba(74,222,128,0.8);' +
    'left:' + (sdx + 8) + 'px;top:' + (sdy - 6) + 'px;';
  spawnLabel.textContent = 'SPAWN';
  canvas.appendChild(spawnLabel);

  box.appendChild(canvas);
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  // click outside the box to close
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) {
      overlay.parentNode.removeChild(overlay);
    }
  });
}

// ─── CLOSE ANALYTICS ─────────────────────────────────────────────────────────

analyticsDismiss.addEventListener('click', function() {
  analyticsPanel.classList.remove('open');
});

// ─── START / PAUSE / END BUTTONS ─────────────────────────────────────────────

function startSim() {
  // if paused, just resume
  if (sim.paused) {
    sim.paused = false;
    sim.running = true;
    setStatus('running');
    sim.tickInterval = setInterval(doTick, TICK_MS);
    return;
  }

  // fresh start — reset everything
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
  sim.stagnationRecoveries = 0;
  sim.goalMoved = false;
  sim.goalMovedGen = -1;
  sim.bestEverPath = [];
  sim.bestEverFitness = 0;
  sim.pathSnapshots = [];
  sim.currentBestIdx = 0;

  // remove any leftover winner styling
  var oldWinners = document.querySelectorAll('.organism-winner');
  for (var i = 0; i < oldWinners.length; i++) {
    oldWinners[i].classList.remove('organism-winner');
  }

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
  for (var i = 0; i < sim.organisms.length; i++) {
    if (sim.organisms[i].elite) winner = sim.organisms[i];
  }
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

// ─── INITIAL STATE ────────────────────────────────────────────────────────────

updateStatDisplay();
setStatus('ready');