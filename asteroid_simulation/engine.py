from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Any, Dict, Iterable, List, Sequence, Tuple

import numpy as np

EARTH_CENTER = np.array([0.0, 0.0, 0.0], dtype=float)
HIGH_RISK_THRESHOLD = 7000.0
MEDIUM_RISK_THRESHOLD = 20000.0


@dataclass(frozen=True)
class AsteroidSimulationInput:
    velocity: float
    approach_angle: float
    initial_distance: float
    time_horizon: float = 120.0
    time_step: float = 1.0
    lateral_offset: float = 0.35
    vertical_offset: float = 0.18


@dataclass(frozen=True)
class AsteroidSimulationResult:
    closest_distance: float
    risk_level: str
    trajectory_points: List[Dict[str, float]]

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


def classify_risk(distance: float) -> str:
    if distance < HIGH_RISK_THRESHOLD:
        return 'HIGH'
    if distance < MEDIUM_RISK_THRESHOLD:
        return 'MEDIUM'
    return 'SAFE'


def _normalize(vector: np.ndarray) -> np.ndarray:
    magnitude = float(np.linalg.norm(vector))
    if magnitude == 0.0:
      raise ValueError('Cannot normalize a zero-length vector.')
    return vector / magnitude


def _build_perpendicular_vector(direction: np.ndarray) -> np.ndarray:
    reference = np.array([0.0, 1.0, 0.0], dtype=float)
    if abs(float(direction[1])) >= 0.92:
        reference = np.array([1.0, 0.0, 0.0], dtype=float)
    perpendicular = np.cross(direction, reference)
    return _normalize(perpendicular)


def compute_trajectory_direction(start_position: Sequence[float], approach_angle: float) -> np.ndarray:
    start_vector = np.asarray(start_position, dtype=float)
    to_earth = _normalize(-start_vector)
    perpendicular = _build_perpendicular_vector(to_earth)
    angle_radians = np.deg2rad(float(approach_angle))

    direction = (np.cos(angle_radians) * to_earth) + (np.sin(angle_radians) * perpendicular)
    return _normalize(direction)


def compute_velocity_components(velocity: float, approach_angle: float, start_position: Sequence[float]) -> np.ndarray:
    direction = compute_trajectory_direction(start_position, approach_angle)
    return direction * float(velocity)


def compute_position_at_time(start_position: Sequence[float], velocity_vector: Sequence[float], time_seconds: float) -> np.ndarray:
    start = np.asarray(start_position, dtype=float)
    velocity_vec = np.asarray(velocity_vector, dtype=float)
    return start + (velocity_vec * float(time_seconds))


def compute_trajectory_points(
    start_position: Sequence[float],
    velocity_vector: Sequence[float],
    time_horizon: float,
    time_step: float,
) -> List[Dict[str, float]]:
    if time_step <= 0:
        raise ValueError('time_step must be greater than 0.')

    points: List[Dict[str, float]] = []
    current_time = 0.0
    while current_time <= float(time_horizon):
        position = compute_position_at_time(start_position, velocity_vector, current_time)
        points.append(
            {
                'time': float(current_time),
                'x': float(position[0]),
                'y': float(position[1]),
                'z': float(position[2]),
            }
        )
        current_time += float(time_step)

    return points


def compute_closest_approach_distance(start_position: Sequence[float], velocity_vector: Sequence[float]) -> Tuple[float, float, np.ndarray]:
    start = np.asarray(start_position, dtype=float)
    velocity_vec = np.asarray(velocity_vector, dtype=float)
    speed_squared = float(np.dot(velocity_vec, velocity_vec))

    if speed_squared == 0.0:
        distance = float(np.linalg.norm(start - EARTH_CENTER))
        return 0.0, distance, start.copy()

    closest_time = max(0.0, float(-np.dot(start, velocity_vec) / speed_squared))
    closest_position = compute_position_at_time(start, velocity_vec, closest_time)
    closest_distance = float(np.linalg.norm(closest_position - EARTH_CENTER))
    return closest_time, closest_distance, closest_position


def simulate_asteroid_trajectory(
    velocity: float,
    approach_angle: float,
    initial_distance: float,
    time_horizon: float = 120.0,
    time_step: float = 1.0,
    lateral_offset: float = 0.35,
    vertical_offset: float = 0.18,
) -> Dict[str, Any]:
    start_position = np.array(
        [
            -float(initial_distance),
            float(initial_distance) * float(lateral_offset),
            float(initial_distance) * float(vertical_offset),
        ],
        dtype=float,
    )
    velocity_vector = compute_velocity_components(velocity, approach_angle, start_position)
    _, closest_distance, _ = compute_closest_approach_distance(start_position, velocity_vector)
    risk_level = classify_risk(closest_distance)
    trajectory_points = compute_trajectory_points(start_position, velocity_vector, time_horizon, time_step)

    result = AsteroidSimulationResult(
        closest_distance=closest_distance,
        risk_level=risk_level,
        trajectory_points=trajectory_points,
    )
    return result.to_dict()
