const defaultFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
});

function createControlTemplate(control) {
  const wrapper = document.createElement('div');
  wrapper.className = 'control-row';

  const label = document.createElement('label');
  const title = document.createElement('span');
  title.textContent = control.label;
  const value = document.createElement('span');
  value.dataset.valueFor = control.key;
  label.append(title, value);

  const input = document.createElement('input');
  input.type = 'range';
  input.min = String(control.min);
  input.max = String(control.max);
  input.step = String(control.step);
  input.value = String(control.value);
  input.dataset.control = control.key;

  wrapper.append(label, input);
  return { wrapper, value, input };
}

function createStatCard(labelText, initialText = '—', valueClass = 'value') {
  const stat = document.createElement('div');
  stat.className = 'stat';

  const label = document.createElement('div');
  label.className = 'label';
  label.textContent = labelText;

  const value = document.createElement('div');
  value.className = valueClass;
  value.textContent = initialText;

  stat.append(label, value);
  return { stat, value };
}

function setRiskClass(element, riskLevel) {
  element.classList.remove('risk-high', 'risk-medium', 'risk-safe');
  element.classList.add(riskLevel === 'HIGH' ? 'risk-high' : riskLevel === 'MEDIUM' ? 'risk-medium' : 'risk-safe');
}

function formatProbability(probability) {
  return `${(probability * 100).toFixed(2)}%`;
}

function createOptionStyle(option) {
  option.style.color = '#eaf1ff';
  option.style.backgroundColor = '#08111f';
}

export function createUIControls({ container, statsContainer, initialValues, onChange, onAsteroidChange, onFocusChange, onZoomIn, onZoomOut, onZoomReset }) {
  const controlConfig = [
    {
      key: 'velocityMagnitude',
      label: 'Velocity',
      min: 1200,
      max: 8000,
      step: 50,
      value: initialValues.velocityMagnitude,
      format: (value) => `${Math.round(value)} units/s`,
    },
    {
      key: 'approachAngle',
      label: 'Approach angle',
      min: 0,
      max: 65,
      step: 0.5,
      value: initialValues.approachAngle,
      format: (value) => `${defaultFormatter.format(value)}°`,
    },
    {
      key: 'initialDistance',
      label: 'Initial distance',
      min: 25000,
      max: 90000,
      step: 500,
      value: initialValues.initialDistance,
      format: (value) => `${Math.round(value)} units`,
    },
    {
      key: 'simulationSpeed',
      label: 'Simulation speed',
      min: 0.25,
      max: 4,
      step: 0.05,
      value: initialValues.simulationSpeed,
      format: (value) => `${defaultFormatter.format(value)}x`,
    },
    {
      key: 'timeScale',
      label: 'Orbit time scale',
      min: 0.001,
      max: 0.08,
      step: 0.001,
      value: initialValues.timeScale,
      format: (value) => `${defaultFormatter.format(value)}x`,
    },
  ];

  const values = new Map();
  const inputs = new Map();
  const state = {
    asteroidOptions: [],
    selectedAsteroidIndex: 0,
    focusOptions: [],
    selectedFocusIndex: 0,
  };

  const focusSection = document.createElement('div');
  focusSection.className = 'control-row';

  const focusLabel = document.createElement('label');
  const focusTitle = document.createElement('span');
  focusTitle.textContent = 'Camera focus';
  focusLabel.append(focusTitle);

  const focusSelector = document.createElement('select');
  focusSelector.id = 'focusTargetSelector';
  focusSelector.style.width = '100%';
  focusSelector.style.padding = '12px 14px';
  focusSelector.style.borderRadius = '12px';
  focusSelector.style.border = '1px solid rgba(106, 215, 255, 0.24)';
  focusSelector.style.background = 'linear-gradient(180deg, rgba(10, 16, 29, 0.96), rgba(6, 10, 18, 0.92))';
  focusSelector.style.color = '#eaf1ff';
  focusSelector.style.font = 'inherit';
  focusSelector.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.05)';
  focusSection.append(focusLabel, focusSelector);
  container.appendChild(focusSection);

  focusSelector.addEventListener('change', () => {
    state.selectedFocusIndex = Number(focusSelector.value);
    if (typeof onFocusChange === 'function') {
      onFocusChange(state.selectedFocusIndex);
    }
  });

  const asteroidSection = document.createElement('div');
  asteroidSection.className = 'control-row';

  const asteroidLabel = document.createElement('label');
  const asteroidTitle = document.createElement('span');
  asteroidTitle.textContent = 'Asteroid';
  asteroidLabel.append(asteroidTitle);

  const asteroidSelector = document.createElement('select');
  asteroidSelector.id = 'asteroidSelector';
  asteroidSelector.style.width = '100%';
  asteroidSelector.style.padding = '12px 14px';
  asteroidSelector.style.borderRadius = '12px';
  asteroidSelector.style.border = '1px solid rgba(106, 215, 255, 0.24)';
  asteroidSelector.style.background = 'linear-gradient(180deg, rgba(10, 16, 29, 0.96), rgba(6, 10, 18, 0.92))';
  asteroidSelector.style.color = '#eaf1ff';
  asteroidSelector.style.font = 'inherit';
  asteroidSelector.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.05)';
  asteroidSection.append(asteroidLabel, asteroidSelector);
  container.appendChild(asteroidSection);

  asteroidSelector.addEventListener('change', () => {
    state.selectedAsteroidIndex = Number(asteroidSelector.value);
    if (typeof onAsteroidChange === 'function') {
      onAsteroidChange(state.selectedAsteroidIndex);
    }
  });

  const zoomSection = document.createElement('div');
  zoomSection.className = 'control-row';

  const zoomLabel = document.createElement('label');
  const zoomTitle = document.createElement('span');
  zoomTitle.textContent = 'Camera zoom';
  zoomLabel.append(zoomTitle);

  const zoomButtonRow = document.createElement('div');
  zoomButtonRow.style.display = 'grid';
  zoomButtonRow.style.gridTemplateColumns = 'repeat(3, minmax(0, 1fr))';
  zoomButtonRow.style.gap = '10px';

  const createZoomButton = (label, handler) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.style.padding = '10px 12px';
    button.style.borderRadius = '12px';
    button.style.border = '1px solid rgba(106, 215, 255, 0.22)';
    button.style.background = 'linear-gradient(180deg, rgba(94, 180, 255, 0.95), rgba(46, 109, 255, 0.78))';
    button.style.color = '#f5fbff';
    button.style.font = 'inherit';
    button.style.cursor = 'pointer';
    button.style.boxShadow = '0 10px 24px rgba(18, 46, 104, 0.22)';
    button.addEventListener('click', () => {
      if (typeof handler === 'function') {
        handler();
      }
    });
    button.addEventListener('mouseenter', () => {
      button.style.background = 'linear-gradient(180deg, rgba(118, 201, 255, 0.98), rgba(61, 126, 255, 0.9))';
    });
    button.addEventListener('mouseleave', () => {
      button.style.background = 'linear-gradient(180deg, rgba(94, 180, 255, 0.95), rgba(46, 109, 255, 0.78))';
    });
    return button;
  };

  zoomButtonRow.append(
    createZoomButton('Zoom In', onZoomIn),
    createZoomButton('Zoom Out', onZoomOut),
    createZoomButton('Reset', onZoomReset)
  );

  zoomSection.append(zoomLabel, zoomButtonRow);
  container.appendChild(zoomSection);

  controlConfig.forEach((control) => {
    const { wrapper, value, input } = createControlTemplate(control);
    container.appendChild(wrapper);
    values.set(control.key, value);
    inputs.set(control.key, input);
  });

  const setDisplayValues = (nextState) => {
    controlConfig.forEach((control) => {
      values.get(control.key).textContent = control.format(nextState[control.key]);
      inputs.get(control.key).value = String(nextState[control.key]);
    });
  };

  const currentState = { ...initialValues };
  setDisplayValues(currentState);

  const handleInput = () => {
    currentState.velocityMagnitude = Number(inputs.get('velocityMagnitude').value);
    currentState.approachAngle = Number(inputs.get('approachAngle').value);
    currentState.initialDistance = Number(inputs.get('initialDistance').value);
    currentState.simulationSpeed = Number(inputs.get('simulationSpeed').value);
    currentState.timeScale = Number(inputs.get('timeScale').value);
    setDisplayValues(currentState);
    onChange({ ...currentState });
  };

  inputs.forEach((input) => {
    input.addEventListener('input', handleInput);
  });

  const statNodes = new Map();
  const statEntries = [
    { key: 'selectedName', label: 'Selected asteroid' },
    { key: 'selectedVelocity', label: 'Velocity' },
    { key: 'selectedInclination', label: 'Inclination' },
    { key: 'selectedOrbitalPeriod', label: 'Orbital period' },
    { key: 'selectedClosestApproach', label: 'Closest approach' },
    { key: 'selectedProbability', label: 'Collision probability' },
    { key: 'selectedRiskLevel', label: 'Risk level' },
    { key: 'nearestName', label: 'Nearest asteroid' },
    { key: 'nearestDistance', label: 'Nearest distance' },
    { key: 'nearestClosestApproach', label: 'Nearest closest approach' },
    { key: 'nearestProbability', label: 'Nearest probability' },
    { key: 'nearestRisk', label: 'Nearest risk' },
  ];

  statsContainer.innerHTML = '';
  statEntries.forEach((entry) => {
    const { stat, value } = createStatCard(
      entry.label,
      entry.key.toLowerCase().includes('risk') ? 'SAFE' : '—',
      entry.key.toLowerCase().includes('risk') || entry.key.toLowerCase().includes('probability') ? 'risk-pill risk-safe' : 'value'
    );
    statsContainer.appendChild(stat);
    statNodes.set(entry.key, value);
  });

  function setSelectedAsteroidTelemetry(asteroid) {
    const nameNode = statNodes.get('selectedName');
    const velocityNode = statNodes.get('selectedVelocity');
    const inclinationNode = statNodes.get('selectedInclination');
    const orbitalPeriodNode = statNodes.get('selectedOrbitalPeriod');
    const closestApproachNode = statNodes.get('selectedClosestApproach');
    const probabilityNode = statNodes.get('selectedProbability');
    const riskLevelNode = statNodes.get('selectedRiskLevel');

    if (!asteroid) {
      nameNode.textContent = '—';
      velocityNode.textContent = '—';
      inclinationNode.textContent = '—';
      orbitalPeriodNode.textContent = '—';
      closestApproachNode.textContent = '—';
      probabilityNode.textContent = '—';
      riskLevelNode.textContent = 'SAFE';
      setRiskClass(riskLevelNode, 'SAFE');
      return;
    }

    nameNode.textContent = asteroid.name || `Asteroid ${state.selectedAsteroidIndex + 1}`;
    velocityNode.textContent = `${Math.round(asteroid.velocity ?? 0)} units/s`;
    inclinationNode.textContent = `${defaultFormatter.format(asteroid.inclinationDeg ?? asteroid.userData?.source?.inclinationDeg ?? 0)}°`;
    orbitalPeriodNode.textContent = `${defaultFormatter.format(asteroid.orbitalPeriod ?? asteroid.userData?.source?.orbitalPeriod ?? asteroid.userData?.source?.orbital_period ?? 0)} days`;
    closestApproachNode.textContent = `${Math.round(asteroid.closestApproach ?? asteroid.closestDistance ?? 0)} units`;
    probabilityNode.textContent = formatProbability(asteroid.collisionProbability ?? 0);

    const riskLevel = asteroid.riskLevel || 'SAFE';
    riskLevelNode.textContent = riskLevel;
    setRiskClass(riskLevelNode, riskLevel);
  }

  return {
    getValues() {
      return { ...currentState };
    },
    setAsteroidOptions(asteroidOptions) {
      state.asteroidOptions = asteroidOptions;
      asteroidSelector.innerHTML = '';

      asteroidOptions.forEach((asteroid, index) => {
        const option = document.createElement('option');
        option.value = String(index);
        option.textContent = asteroid.name || `Asteroid ${index + 1}`;
        createOptionStyle(option);
        asteroidSelector.appendChild(option);
      });

      state.selectedAsteroidIndex = 0;
      asteroidSelector.value = '0';

      if (typeof onAsteroidChange === 'function') {
        onAsteroidChange(0);
      }
    },
    selectAsteroid(index) {
      if (!state.asteroidOptions[index]) {
        return;
      }

      state.selectedAsteroidIndex = index;
      asteroidSelector.value = String(index);

      if (typeof onAsteroidChange === 'function') {
        onAsteroidChange(index);
      }
    },
    setFocusOptions(focusOptions) {
      state.focusOptions = focusOptions;
      focusSelector.innerHTML = '';

      focusOptions.forEach((focusOption, index) => {
        const option = document.createElement('option');
        option.value = String(index);
        option.textContent = focusOption.label;
        createOptionStyle(option);
        focusSelector.appendChild(option);
      });

      state.selectedFocusIndex = 0;
      focusSelector.value = '0';

      if (typeof onFocusChange === 'function') {
        onFocusChange(0);
      }
    },
    getSelectedAsteroidIndex() {
      return state.selectedAsteroidIndex;
    },
    getSelectedFocusIndex() {
      return state.selectedFocusIndex;
    },
    updateStats(state, nearestAsteroid = null, selectedAsteroid = null) {
      setSelectedAsteroidTelemetry(selectedAsteroid);

      const nearestNameNode = statNodes.get('nearestName');
      const nearestDistanceNode = statNodes.get('nearestDistance');
      const nearestClosestApproachNode = statNodes.get('nearestClosestApproach');
      const nearestProbabilityNode = statNodes.get('nearestProbability');
      const nearestRiskNode = statNodes.get('nearestRisk');

      nearestNameNode.textContent = nearestAsteroid ? nearestAsteroid.name : '—';
      nearestDistanceNode.textContent = nearestAsteroid ? `${Math.round(nearestAsteroid.currentDistance)} units` : '—';
      nearestClosestApproachNode.textContent = nearestAsteroid ? `${Math.round(nearestAsteroid.closestApproach)} units` : '—';
      nearestProbabilityNode.textContent = nearestAsteroid ? formatProbability(nearestAsteroid.collisionProbability ?? 0) : '—';
      nearestRiskNode.textContent = nearestAsteroid ? nearestAsteroid.riskLevel : '—';
      setRiskClass(nearestRiskNode, nearestAsteroid ? nearestAsteroid.riskLevel : 'SAFE');
    },
  };
}