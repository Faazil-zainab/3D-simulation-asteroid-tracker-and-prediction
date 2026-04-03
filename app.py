from __future__ import annotations

from typing import Any, Dict, List

from fastapi import FastAPI
from pydantic import BaseModel, Field

from asteroid_simulation import simulate_asteroid_trajectory


class SimulationRequest(BaseModel):
    velocity: float = Field(..., gt=0)
    approach_angle: float = Field(..., ge=0)
    initial_distance: float = Field(..., gt=0)
    time_horizon: float = Field(120.0, gt=0)
    time_step: float = Field(1.0, gt=0)
    lateral_offset: float = Field(0.35, ge=-1.0, le=1.0)
    vertical_offset: float = Field(0.18, ge=-1.0, le=1.0)


class TrajectoryPoint(BaseModel):
    time: float
    x: float
    y: float
    z: float


class SimulationResponse(BaseModel):
    closest_distance: float
    risk_level: str
    trajectory_points: List[TrajectoryPoint]


app = FastAPI(title='Asteroid Trajectory Simulation API', version='1.0.0')


@app.get('/health')
def health() -> Dict[str, str]:
    return {'status': 'ok'}


@app.post('/simulate', response_model=SimulationResponse)
def simulate(payload: SimulationRequest) -> Dict[str, Any]:
    return simulate_asteroid_trajectory(
        velocity=payload.velocity,
        approach_angle=payload.approach_angle,
        initial_distance=payload.initial_distance,
        time_horizon=payload.time_horizon,
        time_step=payload.time_step,
        lateral_offset=payload.lateral_offset,
        vertical_offset=payload.vertical_offset,
    )