import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';
import { createThreeScene } from './scene.js';
import { OrbitEngine, createEngineState } from './orbitEngine.js';
import { createUIControls } from './uiControls.js';

const viewport = document.getElementById('viewport');
const controlsPanel = document.getElementById('controlsPanel');
const statsPanel = document.getElementById('statsPanel');

const sceneView = createThreeScene(viewport);

const ASTEROID_DATA_URL = './asteroid_simulation/dataset/dataset.csv';
const ASTEROID_LIMIT = 15;
const ASTEROID_SCALE_FACTOR = 32000;
let asteroidData = [];
let selectedAsteroidIndex = 0;

const initialValues = {
  velocityMagnitude: 2800,
  approachAngle: 18,
  initialDistance: 55000,
  simulationSpeed: 1,
  timeScale: 0.01,
};

const engine = new OrbitEngine(createEngineState(initialValues));
let simulationSpeed = initialValues.simulationSpeed;
let timeScale = initialValues.timeScale;
let trajectoryNeedsUpdate = true;
let lastFrameTime = performance.now();
let simulationElapsedSeconds = 0;
let animationStarted = false;
let nearestAsteroid = null;
let focusTarget = null;
let selectedAsteroidMotionState = null;
let selectedAsteroidVelocity = initialValues.velocityMagnitude;
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const homeCameraPosition = new THREE.Vector3(0, 16000, 52000);
const homeCameraTarget = new THREE.Vector3(0, 0, 0);

window.nearestAsteroid = null;
window.focusTarget = null;

const cameraFocusTargets = [];

function captureSelectedAsteroidMotionState(index) {
  selectedAsteroidMotionState = sceneView.getAsteroidSimulationState(index);

  if (selectedAsteroidMotionState) {
    selectedAsteroidVelocity = selectedAsteroidMotionState.velocity.length();
  } else {
    selectedAsteroidVelocity = initialValues.velocityMagnitude;
  }
}

function applySelectedAsteroidSimulation(velocityMagnitude = null) {
  if (!selectedAsteroidMotionState) {
    engine.reset(createEngineState(initialValues));
    trajectoryNeedsUpdate = true;
    lastFrameTime = performance.now();
    simulationElapsedSeconds = 0;
    return;
  }

  const nextVelocityMagnitude = Number.isFinite(velocityMagnitude)
    ? velocityMagnitude
    : selectedAsteroidVelocity;
  const velocity = selectedAsteroidMotionState.velocity.clone().setLength(nextVelocityMagnitude);
  selectedAsteroidVelocity = nextVelocityMagnitude;
  engine.reset({
    startPosition: selectedAsteroidMotionState.startPosition,
    velocity,
  });

  trajectoryNeedsUpdate = true;
  lastFrameTime = performance.now();
  simulationElapsedSeconds = 0;
}

const ui = createUIControls({
  container: controlsPanel,
  statsContainer: statsPanel,
  initialValues,
  onChange: (state) => {
    simulationSpeed = state.simulationSpeed;
    timeScale = state.timeScale;
    if (selectedAsteroidMotionState) {
      applySelectedAsteroidSimulation(selectedAsteroidVelocity);
      return;
    }

    engine.reset(createEngineState(state));
    trajectoryNeedsUpdate = true;
    lastFrameTime = performance.now();
    simulationElapsedSeconds = 0;
  },
  onAsteroidChange: (index) => {
    selectedAsteroidIndex = index;
    sceneView.setSelectedAsteroid(index);
    captureSelectedAsteroidMotionState(index);
    applySelectedAsteroidSimulation(selectedAsteroidVelocity);
    ui.setSelectedAsteroidVelocity(selectedAsteroidVelocity);
  },
  onSelectedAsteroidVelocityChange: (velocityMagnitude) => {
    selectedAsteroidVelocity = velocityMagnitude;
    applySelectedAsteroidSimulation(velocityMagnitude);
  },
  onFocusChange: (index) => {
    focusTarget = cameraFocusTargets[index] || null;
    window.focusTarget = focusTarget;
  },
  onZoomIn: () => {
    if (focusTarget) {
      focusTarget.distance = Math.max((focusTarget.distance || 50000) * 0.75, 1200);
      return;
    }

    sceneView.zoomBy(0.75);
  },
  onZoomOut: () => {
    if (focusTarget) {
      focusTarget.distance = Math.min((focusTarget.distance || 50000) * 1.25, 320000);
      return;
    }

    sceneView.zoomBy(1.25);
  },
  onZoomReset: () => {
    if (focusTarget) {
      focusTarget.distance = cameraFocusTargets[0]?.distance || 90000;
      return;
    }

    sceneView.camera.position.copy(homeCameraPosition);
    sceneView.controls.target.copy(homeCameraTarget);
    sceneView.controls.update();
  },
});

function refreshTrajectory() {
  const points = engine.generateTrajectoryPoints(128, 200);
  sceneView.setTrajectory(points);
  trajectoryNeedsUpdate = false;
}

function buildCameraFocusTargets() {
  cameraFocusTargets.length = 0;
  cameraFocusTargets.push({ label: 'Sun', object: sceneView.sun, distance: 90000 });

  sceneView.planets.forEach((planet) => {
    const visualRadius = planet.geometry?.parameters?.radius || 200;
    cameraFocusTargets.push({
      label: planet.name,
      object: planet,
      distance: Math.max(visualRadius * 16, 2600),
    });
  });

  sceneView.asteroids.forEach((asteroid) => {
    cameraFocusTargets.push({
      label: asteroid.name,
      object: asteroid,
      distance: Math.max((asteroid.geometry?.parameters?.radius || 150) * 25, 8000),
    });
  });
}

function handleViewportPointerDown(event) {
  const domElement = sceneView.renderer.domElement;
  const bounds = domElement.getBoundingClientRect();

  if (!bounds.width || !bounds.height) {
    return;
  }

  pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
  pointer.y = -(((event.clientY - bounds.top) / bounds.height) * 2 - 1);

  raycaster.setFromCamera(pointer, sceneView.camera);
  const intersections = raycaster.intersectObjects(sceneView.asteroids, false);

  if (!intersections.length) {
    return;
  }

  const pickedAsteroid = intersections[0].object;
  const pickedIndex = sceneView.asteroids.indexOf(pickedAsteroid);

  if (pickedIndex >= 0) {
    ui.selectAsteroid(pickedIndex);
    focusTarget = {
      label: pickedAsteroid.name,
      object: pickedAsteroid,
      distance: Math.max((pickedAsteroid.geometry?.parameters?.radius || 150) * 25, 8000),
    };
    window.focusTarget = focusTarget;
  }
}

function parseCsvLine(line) {
  return line.split(',').map((value) => value.trim());
}

async function loadAsteroidData(url, limit) {
  const response = await fetch(url);

  if (!response.ok || !response.body) {
    throw new Error(`Failed to load asteroid dataset from ${url}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let headerMap = null;
  const rows = [];
  const currentYear = new Date().getFullYear();

  const getColumnIndex = (aliases) => {
    for (const alias of aliases) {
      if (headerMap?.has(alias)) {
        return headerMap.get(alias);
      }
    }

    return undefined;
  };

  const parseAsteroidRow = (columns) => {
    const semiMajorAxisIndex = getColumnIndex(['semi_major_axis', 'a']);
    const eccentricityIndex = getColumnIndex(['eccentricity', 'e']);
    const inclinationIndex = getColumnIndex(['inclination', 'i']);
    const orbitalPeriodIndex = getColumnIndex(['orbital_period', 'per_y', 'per']);
    const epochMjdIndex = getColumnIndex(['epoch_mjd']);
    const epochCalIndex = getColumnIndex(['epoch_cal']);

    const semiMajorAxis = Number.parseFloat(columns[semiMajorAxisIndex]);
    const eccentricity = Number.parseFloat(columns[eccentricityIndex]);
    const inclinationDeg = Number.parseFloat(columns[inclinationIndex]);
    const orbitalPeriod = Number.parseFloat(columns[orbitalPeriodIndex]);
    const epochMjd = Number.parseFloat(columns[epochMjdIndex]);
    const epochCal = columns[epochCalIndex] || '';
    const epochYear = Number.parseInt(epochCal.slice(0, 4), 10);

    if (![semiMajorAxis, eccentricity, inclinationDeg, orbitalPeriod, epochMjd].every(Number.isFinite) || !Number.isFinite(epochYear)) {
      return null;
    }

    // Keep only historical records from past years in the CSV.
    if (epochYear >= currentYear) {
      return null;
    }

    const orbitRadius = semiMajorAxis * ASTEROID_SCALE_FACTOR;
    const orbitSpeed = orbitalPeriod > 0 ? (Math.PI * 2) / orbitalPeriod : 0;
    const inclination = Math.sin((inclinationDeg * Math.PI) / 180) * orbitRadius * 0.18;
    const initialAngle = (((rows.length * 0.61803398875) + eccentricity) % 1) * Math.PI * 2;

    return {
      name: `Asteroid ${rows.length + 1}`,
      semi_major_axis: semiMajorAxis,
      eccentricity,
      inclinationDeg,
      inclination: Math.abs(inclination),
      orbital_period: orbitalPeriod,
      orbitalPeriod,
      epochMjd,
      epochCal,
      epochYear,
      orbitRadius,
      orbitSpeed,
      initialAngle,
    };
  };

  const closeReader = async () => {
    try {
      await reader.cancel();
    } catch {
      // Ignore cancellation errors when stopping after the sample limit.
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });

    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || '';

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) {
        continue;
      }

      if (!headerMap) {
        headerMap = new Map(parseCsvLine(line).map((column, index) => [column, index]));
        continue;
      }

      const asteroidRow = parseAsteroidRow(parseCsvLine(line));
      if (!asteroidRow) {
        continue;
      }

      rows.push(asteroidRow);

      if (rows.length >= limit) {
        await closeReader();
        return rows;
      }
    }

    if (done) {
      break;
    }
  }

  const tail = buffer.trim();
  if (tail && headerMap && rows.length < limit) {
    const asteroidRow = parseAsteroidRow(parseCsvLine(tail));

    if (asteroidRow) {
      rows.push(asteroidRow);
    }
  }

  return rows.slice(0, limit);
}

function animate() {
  requestAnimationFrame(animate);

  if (trajectoryNeedsUpdate) {
    refreshTrajectory();
  }

  const now = performance.now();
  const delta = Math.min((now - lastFrameTime) / 1000, 0.05) * simulationSpeed;
  lastFrameTime = now;

  const state = engine.update(delta);

  simulationElapsedSeconds += delta;
  const orbitTime = simulationElapsedSeconds * timeScale;
  sceneView.updatePlanetOrbits(simulationElapsedSeconds, timeScale);
  sceneView.updateAsteroidBelt(simulationElapsedSeconds, timeScale);
  sceneView.updateCelestialEffects(orbitTime);
  nearestAsteroid = sceneView.updateAsteroids(simulationElapsedSeconds, sceneView.earth.position, timeScale);
  window.nearestAsteroid = nearestAsteroid;
  const selectedAsteroid = sceneView.asteroids[selectedAsteroidIndex] || null;

  if (selectedAsteroid) {
    selectedAsteroid.userData.simulationVelocity = engine.state.velocityMagnitude;
    selectedAsteroid.userData.simulationClosestApproach = state.closestApproachDistance;
    selectedAsteroid.userData.simulationProbability = state.currentDistance ? Math.min(1, Math.max(0, (engine.state.velocityMagnitude / Math.max(state.currentDistance, 1)) * 0.0001)) : 0;
    selectedAsteroid.userData.simulationRisk = state.risk;
  }

  if (focusTarget && focusTarget.object) {
    const focusPosition = focusTarget.object.position;
    const focusDistance = focusTarget.distance || 50000;
    const offsetDirection = sceneView.camera.position.clone().sub(focusPosition);
    if (offsetDirection.lengthSq() < 0.0001) {
      offsetDirection.set(0, 0.25, 1);
    }
    offsetDirection.normalize();

    const cinematicOrbit = new THREE.Vector3(
      Math.cos(orbitTime * 0.22) * 0.12,
      Math.sin(orbitTime * 0.17) * 0.05,
      Math.sin(orbitTime * 0.22) * 0.12
    ).multiplyScalar(focusDistance);

    const desiredCameraPosition = focusPosition.clone()
      .add(offsetDirection.multiplyScalar(focusDistance))
      .add(cinematicOrbit);

    sceneView.camera.position.lerp(desiredCameraPosition, 0.05);
    sceneView.controls.target.lerp(focusPosition, 0.05);
    sceneView.camera.fov = THREE.MathUtils.lerp(sceneView.camera.fov, 42, 0.02);
    sceneView.camera.updateProjectionMatrix();
  } else {
    const idleOrbit = new THREE.Vector3(
      Math.sin(orbitTime * 0.08) * 550,
      Math.sin(orbitTime * 0.13) * 180,
      Math.cos(orbitTime * 0.08) * 550
    );

    const desiredHomePosition = homeCameraPosition.clone().add(idleOrbit);
    sceneView.camera.position.lerp(desiredHomePosition, 0.012);
    sceneView.controls.target.lerp(homeCameraTarget, 0.012);
    sceneView.camera.fov = THREE.MathUtils.lerp(sceneView.camera.fov, 48, 0.015);
    sceneView.camera.updateProjectionMatrix();
  }

  ui.updateStats({
    velocityMagnitude: engine.state.velocityMagnitude,
    currentDistance: state.currentDistance,
    closestApproachDistance: state.closestApproachDistance,
    risk: state.risk,
  }, nearestAsteroid, selectedAsteroid, state);

  sceneView.controls.update();
  sceneView.render();
}

async function bootstrap() {
  asteroidData = await loadAsteroidData(ASTEROID_DATA_URL, ASTEROID_LIMIT);
  sceneView.setAsteroids(asteroidData);
  ui.setAsteroidOptions(asteroidData);
  buildCameraFocusTargets();
  ui.setFocusOptions(cameraFocusTargets);
  refreshTrajectory();

  if (!animationStarted) {
    animationStarted = true;
    animate();
  }
}

function handleResize() {
  sceneView.resize(viewport.clientWidth || window.innerWidth, viewport.clientHeight || window.innerHeight);
}

window.addEventListener('resize', handleResize);
sceneView.renderer.domElement.addEventListener('pointerdown', handleViewportPointerDown);
handleResize();
bootstrap().catch((error) => {
  console.error(error);
  if (!animationStarted) {
    animationStarted = true;
    animate();
  }
});