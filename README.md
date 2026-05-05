# GenSim — Genetic Algorithm Visualizer

![Version](https://img.shields.io/badge/version-0.1-blue)
![Status](https://img.shields.io/badge/status-active-success)
![Technology](https://img.shields.io/badge/tech-HTML%2FCSS%2FJS-yellow)

## 🎯 Overview

**GenSim** is an interactive web-based visualization platform that demonstrates how **genetic algorithms** work in real-time. Watch as digital organisms evolve step-by-step, learning to navigate toward a goal through the principles of natural selection, mutation, and reproduction.

This project makes complex evolutionary algorithms accessible and intuitive by allowing users to:
- Observe organisms adapting across generations
- Adjust parameters to explore algorithm behavior
- Track fitness improvements in real-time
- Analyze detailed post-simulation reports

---

## 📚 Understanding Genetic Algorithms

### What Are Genetic Algorithms?

Genetic Algorithms (GAs) are optimization techniques inspired by **natural evolution**. They solve problems by mimicking how species evolve over time through survival of the fittest.

#### Core Principles

| Principle | Description |
|-----------|-------------|
| **Population** | A group of candidate solutions (individuals/organisms) |
| **Genes** | Instructions that define an organism's behavior |
| **Fitness** | A measure of how well a solution solves the problem |
| **Selection** | Fitter organisms are more likely to reproduce |
| **Crossover** | Combining genes from two parents to create offspring |
| **Mutation** | Random changes in genes to introduce diversity |
| **Evolution** | Repeated cycles of selection, reproduction, and mutation |

### The Algorithm Process

```
┌─────────────────────────────────────────────────────┐
│ 1. INITIALIZE: Create random population             │
└──────────────────┬──────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────┐
│ 2. EVALUATE: Calculate fitness for each organism    │
└──────────────────┬──────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────┐
│ 3. SELECT: Choose best performers (elitism)         │
└──────────────────┬──────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────┐
│ 4. REPRODUCE: Create offspring via crossover        │
└──────────────────┬──────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────┐
│ 5. MUTATE: Randomly modify genes for diversity      │
└──────────────────┬──────────────────────────────────┘
                   ↓
                REPEAT → Convergence/Goal Reached
```

### Why Genetic Algorithms Work

- **Exploration**: Mutation and crossover explore the solution space
- **Exploitation**: Selection focuses on promising regions
- **Parallelism**: Multiple solutions evaluated simultaneously
- **Adaptation**: Population converges toward optimal solutions
- **Robustness**: Work on complex, non-linear problems

---

## 🎮 How the Visualizer Works

### The Simulation Environment

The visualizer simulates organisms attempting to reach a **target goal** on a 2D field. Each organism carries a set of genetic instructions (velocity vectors) that guide its movement.

```
SPAWN LOCATION (green dot)
        ↓
    🟢🔵🔵
    🔵🔵🟡 ← Elite organism (yellow) = closest to goal
    🔵
    ↓
   🎯 TARGET (blue/orange dot, can be dragged)
```

### Organism Lifecycle (Per Generation)

1. **Movement Phase**: Each organism executes its genes (velocity vectors) one at a time
2. **Fitness Evaluation**: After all movements, organisms are scored based on:
   - **Closest distance achieved** (dominant factor)
   - **Final position** (secondary factor)
   - **Goal reached bonus** (if target is within goal radius)
   - **Speed bonus** (reaching goal faster adds points)
3. **Selection**: Top performers (based on selection pressure) survive
4. **Reproduction**: Survivors create offspring via:
   - **Crossover**: Combining genes from two parents
   - **Mutation**: Random alterations to introduce variation
5. **New Generation**: Offspring replace eliminated organisms

### Visual Indicators

| Color | Size | Meaning |
|-------|------|---------|
| **Yellow/Orange** | Large (14px) | Elite organism (current best performer) |
| **Green** | Medium (11px) | Reached the goal |
| **Blue** | Small (10px) | Normal organism (still searching) |
| **Trail Lines** | Thin | Path taken by organisms |
| **Bold Lines** | Thick | Best path found by elite organism |

---

## 🏗️ Project Architecture

### Directory Structure

```
Genetic Algorithm Visualizer/
├── landing/                    # Landing page & intro
│   ├── index.html
│   ├── script.js              # Theme toggle, particle animation
│   └── style.css              # Landing page styles
│
├── loading/                    # Loading screen with spinner
│   └── index.html
│
├── simulation/                 # Main simulation environment
│   ├── index.html             # Simulation UI/controls
│   ├── script.js              # Core GA logic (1200+ lines)
│   └── style.css              # Simulation styles
│
└── README.md                   # This file
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend Framework** | Vanilla JavaScript | No dependencies, lightweight |
| **Markup** | HTML5 | Semantic structure |
| **Styling** | CSS3 | Modern design with CSS variables, animations |
| **Themes** | Light/Dark Mode | User preference persistence with localStorage |
| **Graphics** | Canvas (landing) + DOM (simulation) | Particle effects and organism rendering |

### Key Design Decisions

✅ **No External Dependencies**: Pure HTML/CSS/JS for portability
✅ **DOM-Based Rendering**: Each organism is a DOM element (allows styling, hover effects)
✅ **CSS Variables**: Easy theme switching between light and dark modes
✅ **Responsive Design**: Works on different screen sizes
✅ **Real-Time Updates**: 28ms tick rate (~35 FPS) for smooth animation

---

## 🎛️ Core Components

### 1. Genetic Components

#### `makeGenes(genLen)`
Creates a chromosome of random movement vectors
- **Length**: Configurable (default: 200 genes per organism)
- **Each Gene**: Angle (0-2π) + magnitude (0.3-1.0)

#### `mutateGenes(genes, rate)`
Applies mutations to a chromosome
- **Full Replacement**: Complete random gene (rate probability)
- **Adjustment**: Small random change ±0.3 (rate × 0.5 probability)
- **Preservation**: Gene survives unchanged (default)

#### `crossover(genesA, genesB)`
Single-point crossover combining two parent chromosomes
```javascript
Cut point = random position in gene array
Child = Parent_A genes[0...cut] + Parent_B genes[cut...end]
```

#### `calcFitness(organism, generationLength)`
Multi-factor fitness scoring:
```
fitness = 
  (1 / (closestDist + 1)) +              // PRIMARY: closest ever
  (1 / (finalDist + 1)) × 0.3 +          // SECONDARY: final position
  (reachedGoal ? 2.0 : 0) +              // BONUS: reached target
  (speedBonus if reached early)          // BONUS: time factor
```

### 2. Simulation Engine

#### `doTick()`
Main loop running every 28ms:
1. Find elite (closest) organism
2. Move each organism using current gene
3. Update trails and paths
4. Check for goal reaches
5. Update UI/stats

#### `endGeneration()`
Transition logic between generations:
1. Score all organisms
2. Sort by fitness
3. Apply selection pressure
4. Detect stagnation
5. Trigger adaptive mutation boost
6. Create new offspring population

#### Stagnation Detection & Adaptive Mutation
- If best fitness improves <0.8% for 5+ generations = stagnation
- Boost mutation rate up to 4× to escape local optima
- Inject 12% fully random organisms
- Reset and try again

### 3. Rendering System

#### `renderOrganisms()`
- Create DOM divs for each organism
- Apply CSS styling based on fitness

#### `styleOrganism(el, org)`
Dynamic styling:
- Elite: Yellow with strong glow
- Reached: Green with satisfaction indicator
- Normal: Blue with subtle glow

#### `addTrailSegment()` & `fadeAllTrailSegments()`
- Track movement paths as line segments
- Fade older trails over time
- Max 400 trail segments on screen (garbage collection)

---

## 🎮 User Interface & Controls

### Top Bar
- **Status Pill**: Shows simulation state (READY, RUNNING, PAUSED, ENDED)
- **Start Button**: Begin new simulation
- **Pause Button**: Pause/resume without reset
- **End Button**: Stop and show analytics

### Sidebar (Left)
- **Guide Toggle**: Open simulation guide with explanations
- **Panel Toggle**: Open control panel with parameters
- **Overlay Toggle**: Hide/show UI for clean visualization

### Control Panel

#### Population Size
- **Range**: 10-200 organisms
- **Effect**: More diversity vs. more compute
- **Default**: 40

#### Mutation Rate
- **Range**: 0% - 100%
- **Effect**: 0% = perfect inheritance; 100% = total chaos
- **Default**: 5%

#### Generation Length
- **Range**: 50-500 steps
- **Effect**: More steps = more time to evolve per generation
- **Default**: 200

#### Selection Pressure
- **Range**: 1% - 99%
- **Effect**: % of population that survives to reproduce
- **Default**: 60%

#### Stop on Goal
- **Toggle**: ON/OFF
- **Effect**: Auto-end simulation when first organism reaches goal

### Statistics Panel (Bottom Right)

| Stat | Meaning |
|------|---------|
| **Population** | Current organism count |
| **Best Fitness** | Distance to nearest organism to goal |
| **Generation** | Current iteration number |

### Goal Interaction
- **Click on field**: Reposition goal to any location
- **Drag goal**: Move goal in real-time
- **Visual feedback**: Goal glows brighter as organisms get closer

---

## 📊 Analytics & Post-Simulation Report

After simulation ends, a detailed report displays:

### Statistics Grid
- **Generations Run**: How many iterations completed
- **Closest to Goal**: Final distance to target (0 px if reached)
- **Goal Reaches**: Total times any organism reached goal
- **First Goal At**: Generation when goal first reached
- **Population Size**: Size used in simulation
- **Mutation Rate**: Used mutation probability
- **Selection Pressure**: Used selection percentage
- **Generation Length**: Steps per generation
- **Stagnation Recoveries**: Times adaptive mutation triggered
- **Stop on Goal**: Whether auto-stop was enabled

### Fitness Chart
- Bar chart showing best fitness per generation
- Visualizes convergence/improvement over time
- Hover for exact generation and fitness value

### Path Snapshots
- Thumbnails of best organism's path at key generations
- Shows spawn point (green), path (blue/yellow), goal (cyan)
- Click to open modal with enlarged path view
- Final path marked with ★ (star)

### Modal Path Viewer
- Full-size path visualization
- Spawn location, complete trajectory, goal position
- Detailed view of evolution strategy

---

## 🚀 How to Run

### Local Deployment

1. **Clone or download the project**
```bash
cd "Genetic Algorithm Visualizer"
```

2. **Open in browser** (no build step needed)
   - **Option A**: Open `landing/index.html` directly in a web browser
   - **Option B**: Run a local server
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   
   # Node.js (if http-server installed)
   http-server
   ```

3. **Navigate to simulation**
   - Click "Enter Simulation" button on landing page
   - Wait for loading screen to complete
   - Simulation UI loads

### Browser Compatibility
- ✅ Chrome/Chromium (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Modern mobile browsers (tested on iOS Safari, Chrome Android)

---

## 🎓 Educational Features

### Interactive Learning
- **Simulation Guide**: In-app explanations of GA concepts
- **Real-time Visualization**: Watch abstract algorithms in action
- **Parameter Experimentation**: Adjust settings and observe results
- **Analytics Dashboard**: Understand outcomes with charts and metrics

### Experiment Ideas

1. **Low Mutation Rate** (1-2%)
   - Observe: Stable convergence, possible premature convergence
   - Result: Elite solutions but limited diversity

2. **High Mutation Rate** (20-30%)
   - Observe: Chaotic movement, slower convergence
   - Result: More exploration, but harder to converge

3. **Small Population** (10-20)
   - Observe: Faster generations, limited diversity
   - Result: Quick local optima, limited exploration

4. **Large Population** (100+)
   - Observe: Slower generations, more diversity
   - Result: Better exploration, higher-quality solutions

5. **Move Goal During Simulation**
   - Observe: Population re-adapts to new target
   - Result: Stagnation recovery triggers, mutation boost activates

6. **High Selection Pressure** (80-99%)
   - Observe: Only best reproduce, quick convergence
   - Result: Fast improvement but risk of local optima

7. **Low Selection Pressure** (1-20%)
   - Observe: More organisms survive, slower improvement
   - Result: Maintains diversity, slower convergence

---

## 🔧 Configuration Constants

Located in `simulation/script.js`:

```javascript
SPAWN_X_RATIO = 0.12      // Organism spawn at 12% from left
SPAWN_Y_RATIO = 0.82      // Organism spawn at 82% from top
SPEED = 3.2               // Movement speed multiplier
TICK_MS = 28              // Update interval (28ms ≈ 35 FPS)
GOAL_RADIUS = 26          // Pixel radius for goal detection
MAX_TRAILS = 400          // Maximum trail segments rendered
TRAIL_INTERVAL = 5        // Draw trail every N ticks
STAGNATION_LIMIT = 5      // Generations before adaptive mutation
PATH_RECORD_INTERVAL = 4  // Record path every N ticks
```

---

## 🎨 Design & UX

### Theme System
- **Dark Mode** (default): Reduces eye strain, modern aesthetic
- **Light Mode**: Alternative with warm orange accents
- **Persistence**: Theme preference saved to localStorage

### Visual Hierarchy
- **Top Bar**: Status and primary controls
- **Sidebar**: Secondary controls (collapsible)
- **Main Field**: Large, uncluttered workspace
- **Stats Panel**: Floating right-bottom corner
- **Guide & Controls**: Hidden by default, overlay when opened

### Color Palette

**Dark Mode**
- Background: `#060810` (near-black)
- Primary: `#38bdf8` (cyan)
- Accent: `#38bdf8` (cyan glow)
- Text: `#dce8f5` (light gray-blue)

**Light Mode**
- Background: `#f2ede6` (warm cream)
- Primary: `#b06a10` (warm orange)
- Accent: `#b06a10` (orange glow)
- Text: `#2a1f10` (dark brown)

### CSS Features Used
- CSS Variables for theming
- Flexbox/Grid for layout
- Backdrop filters for glassmorphism
- CSS animations for smooth transitions
- Transform and translate for 60fps performance

---

## 💾 Data Structures

### Organism Object
```javascript
{
  x: number,                 // Current X position
  y: number,                 // Current Y position
  vx: number,                // Velocity X
  vy: number,                // Velocity Y
  genes: Array,              // Chromosome
  fitness: number,           // Evaluated fitness score
  elite: boolean,            // Currently best performer?
  reached: boolean,          // Reached goal?
  reachedTick: number,       // When it reached goal
  path: Array,               // Movement history
  lastX: number,             // Previous X position
  lastY: number,             // Previous Y position
  totalDist: number,         // Distance traveled
  closestDist: number,       // Closest ever got to goal
  prevDist: number           // Previous distance to goal
}
```

### Gene Object
```javascript
{
  ax: number,                // X-axis acceleration
  ay: number                 // Y-axis acceleration
}
```

### Simulation State
```javascript
sim: {
  running: boolean,
  paused: boolean,
  generation: number,
  tick: number,
  organisms: Array,
  history: Array,            // {gen, bestFitness, path}
  bestEverPath: Array,
  bestEverFitness: number,
  pathSnapshots: Array,      // Snapshots every 5 gens
  // ... additional tracking properties
}
```

---

## 📈 Performance Metrics

### Optimization Techniques
- **DOM Pooling**: Reuse organism elements instead of creating new ones
- **Trail Garbage Collection**: Remove old trails when limit exceeded
- **Batch DOM Updates**: Minimize layout recalculations
- **60 FPS Target**: Use requestAnimationFrame-compatible tick rate

### Performance Considerations
- **Large Populations**: 200+ organisms may cause frame drops
- **Visible Trails**: More trails = more DOM elements = slower
- **Path Recording**: Enabled by default, can be optimized

---

## 🐛 Known Limitations & Future Improvements

### Current Limitations
- Single 2D plane (could extend to 3D)
- Simple fitness function (could use multi-objective optimization)
- No parallel processing (single-threaded)
- Limited to CPU performance

### Potential Enhancements
- 🔮 **3D Visualization**: WebGL rendering for 3D evolution
- 🔮 **Multi-Objective GA**: Pareto frontier optimization
- 🔮 **Graph Export**: Save fitness charts as images
- 🔮 **Video Recording**: Capture simulation replay
- 🔮 **Simulation Presets**: Pre-configured scenarios
- 🔮 **Network Mode**: Collaborative simulations
- 🔮 **Advanced Analytics**: Statistical analysis tools

---

## 📝 Code Quality

- **Clean JavaScript**: No external dependencies
- **Modular Functions**: Each function has single responsibility
- **Descriptive Variables**: Clear naming conventions
- **Organized Structure**: Logical grouping of related functions
- **No Comments**: Comments removed (clean code is self-documenting)

---

## 📄 License

This project is open-source and available for educational and personal use.

---

## 🙏 Credits

Inspired by the principles of:
- **John Holland** (Genetic Algorithms pioneer)
- **Daniel Shiffman** (Nature of Code, creative coding)
- **Karl Sims** (Evolved Virtual Creatures)

Built with vanilla web technologies for maximum accessibility and learning value.

---

## 🤝 Contributing

Found a bug or have an improvement? Feel free to:
1. Report issues
2. Submit improvements
3. Suggest new features
4. Share experimental results

---

## 📞 Support & Questions

For questions about:
- **Genetic Algorithms**: See "Understanding Genetic Algorithms" section
- **How to Use**: See "User Interface & Controls" section
- **Customization**: Check "Configuration Constants" section
- **Technical Details**: Review "Core Components" section

---

**GenSim v0.1** — Making evolutionary algorithms interactive and educational since 2026 ✨
