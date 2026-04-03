import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';

export const EARTH_RADIUS = 6371;
export const ASTEROID_RADIUS = 150;

export function classifyRisk(distance) {
  if (distance < 7000) {
    return 'HIGH';
  }

  if (distance < 20000) {
    return 'MEDIUM';
  }

  return 'SAFE';
}

export function riskColor(riskLevel) {
  switch (riskLevel) {
    case 'HIGH':
      return 0xff6a5f;
    case 'MEDIUM':
      return 0xffb347;
    default:
      return 0x4ee09a;
  }
}

function buildPerpendicularVector(direction) {
  const reference = Math.abs(direction.y) < 0.92 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  return new THREE.Vector3().crossVectors(direction, reference).normalize();
}

function computeTrajectoryDirection(startPosition, approachAngleDeg) {
  const toEarth = startPosition.clone().multiplyScalar(-1).normalize();
  const perpendicular = buildPerpendicularVector(toEarth);
  const angleRadians = THREE.MathUtils.degToRad(approachAngleDeg);

  return toEarth
    .clone()
    .multiplyScalar(Math.cos(angleRadians))
    .add(perpendicular.multiplyScalar(Math.sin(angleRadians)))
    .normalize();
}

export class OrbitEngine {
  constructor(initialState) {
    this.time = 0;
    this.closestApproachDistance = Infinity;
    this.closestApproachTime = 0;
    this.lastState = null;
    this.reset(initialState);
  }

  reset(state) {
    const {
      velocityMagnitude,
      approachAngle,
      initialDistance,
      lateralOffset = 0.35,
      verticalOffset = 0.18,
    } = state;

    this.state = {
      velocityMagnitude,
      approachAngle,
      initialDistance,
      lateralOffset,
      verticalOffset,
    };

    this.startPosition = new THREE.Vector3(
      -initialDistance,
      initialDistance * lateralOffset,
      initialDistance * verticalOffset
    );
    this.direction = computeTrajectoryDirection(this.startPosition, approachAngle);
    this.velocity = this.direction.clone().multiplyScalar(velocityMagnitude);
    this.time = 0;
    this.closestApproachDistance = this.startPosition.length();
    this.closestApproachTime = 0;
    this.lastState = null;
  }

  update(deltaSeconds) {
    this.time += deltaSeconds;
    const currentPosition = this.getPositionAt(this.time);
    const currentDistance = currentPosition.length();

    if (currentDistance < this.closestApproachDistance) {
      this.closestApproachDistance = currentDistance;
      this.closestApproachTime = this.time;
    }

    const risk = classifyRisk(currentDistance);
    this.lastState = {
      time: this.time,
      position: currentPosition,
      currentDistance,
      closestApproachDistance: this.closestApproachDistance,
      closestApproachTime: this.closestApproachTime,
      risk,
    };

    return this.lastState;
  }

  getPositionAt(timeSeconds) {
    return this.startPosition.clone().addScaledVector(this.velocity, timeSeconds);
  }

  getPredictedClosestApproach() {
    const origin = new THREE.Vector3();
    const numerator = -this.startPosition.dot(this.velocity);
    const denominator = this.velocity.lengthSq();

    if (denominator === 0) {
      return {
        time: 0,
        distance: this.startPosition.length(),
        position: this.startPosition.clone(),
      };
    }

    const time = Math.max(0, numerator / denominator);
    const position = this.getPositionAt(time);
    return {
      time,
      distance: position.distanceTo(origin),
      position,
    };
  }

  generateTrajectoryPoints(sampleCount = 96, leadTimeSeconds = 120) {
    const points = [];
    const predictedClosest = this.getPredictedClosestApproach();
    const duration = Math.max(leadTimeSeconds, predictedClosest.time + 20);
    const step = duration / Math.max(sampleCount - 1, 1);

    for (let index = 0; index < sampleCount; index += 1) {
      points.push(this.getPositionAt(index * step));
    }

    return points;
  }

  getDisplayState() {
    return this.lastState || {
      time: 0,
      position: this.startPosition.clone(),
      currentDistance: this.startPosition.length(),
      closestApproachDistance: this.closestApproachDistance,
      closestApproachTime: this.closestApproachTime,
      risk: classifyRisk(this.startPosition.length()),
    };
  }
}

export function createEngineState({ velocityMagnitude, approachAngle, initialDistance }) {
  return {
    velocityMagnitude,
    approachAngle,
    initialDistance,
  };
}