# 3D Simulation Asteroid Tracker and Prediction

A real-time asteroid flyby simulation and risk prediction project that combines:

- A Python FastAPI backend for trajectory and risk computation
- A 3D interactive frontend built with Three.js
- Dataset-driven asteroid orbit visualization and nearest-object telemetry

This project is designed to help visualize near-Earth object motion, estimate closest approach, and communicate impact risk in an intuitive way.

## Table of Contents

- Project Overview
- Key Features
- Tech Stack
- Repository Structure
- How It Works
- Getting Started
- API Reference
- Dataset Format
- Risk Classification Logic
- Roadmap
- License

## Project Overview

The simulator models asteroid motion in 3D space using velocity, approach angle, and initial distance. The backend computes trajectory points and closest approach distance, while the frontend renders the solar system and asteroid paths with cinematic camera controls.

It is suitable as:

- An academic simulation project
- A portfolio project for Python + 3D web development
- A base for future asteroid tracking and ML prediction workflows

## Key Features

- Real-time 3D visualization of planets and asteroid movement
- Interactive controls for velocity, approach angle, and simulation pacing
- Dynamic risk classification: HIGH, MEDIUM, SAFE
- Closest-approach prediction and trajectory generation
- Asteroid selection and camera focus tools
- FastAPI endpoint for simulation requests
- Health endpoint for deployment monitoring

## Tech Stack

Backend:

- Python
- FastAPI
- NumPy
- Uvicorn

Frontend:

- JavaScript (ES modules)
- Three.js
- OrbitControls and post-processing effects

Data:

- CSV dataset for asteroid orbital parameters

## Repository Structure

app.py                         FastAPI application entry point
index.html                     Frontend shell and UI styling
main.js                        Frontend bootstrap and interaction loop
scene.js                       Three.js scene creation and rendering logic
orbitEngine.js                 Orbit and risk engine used by frontend
uiControls.js                  Dynamic UI control and telemetry panel logic
requirements.txt               Python dependencies
asteroid_simulation/
	__init__.py
	engine.py                    Backend simulation and risk calculation engine
	dataset/
		dataset.csv                Local dataset file (ignored in GitHub due size)

## How It Works

1. Input parameters define an asteroid starting position and direction.
2. The simulation computes velocity vectors and propagated positions over time.
3. Closest distance to Earth is calculated from the motion model.
4. Risk is classified from distance thresholds.
5. Frontend renders orbit updates and telemetry cards continuously.

## Getting Started

### 1. Clone the repository

git clone https://github.com/Faazil-zainab/3D-simulation-asteroid-tracker-and-prediction.git
cd 3D-simulation-asteroid-tracker-and-prediction

### 2. Set up Python environment

Windows PowerShell:

python -m venv .venv
.venv\Scripts\Activate.ps1

Install dependencies:

pip install -r requirements.txt

### 3. Run backend API

uvicorn app:app --reload

Backend URL:

- http://127.0.0.1:8000

Docs:

- http://127.0.0.1:8000/docs

### 4. Run frontend

Serve the project root with any local static server (important because ES module imports and fetch are used):

python -m http.server 5500

Then open:

- http://127.0.0.1:5500/index.html

## API Reference

### GET /health

Returns service status.

Response example:

{
	"status": "ok"
}

### POST /simulate

Simulates asteroid trajectory and risk assessment.

Request body:

{
	"velocity": 3200,
	"approach_angle": 18,
	"initial_distance": 55000,
	"time_horizon": 120,
	"time_step": 1,
	"lateral_offset": 0.35,
	"vertical_offset": 0.18
}

Response body:

{
	"closest_distance": 13425.2,
	"risk_level": "MEDIUM",
	"trajectory_points": [
		{"time": 0.0, "x": -55000.0, "y": 19250.0, "z": 9900.0}
	]
}

## Dataset Format

The frontend loader expects a CSV with columns such as:

- semi_major_axis (or a)
- eccentricity (or e)
- inclination (or i)
- orbital_period (or per_y or per)
- epoch_mjd
- epoch_cal

Note:

- The dataset file is intentionally excluded from GitHub tracking due size constraints.
- If missing, place your CSV at asteroid_simulation/dataset/dataset.csv.

## Risk Classification Logic

Distance thresholds used by backend and frontend engines:

- HIGH: distance < 7000
- MEDIUM: 7000 <= distance < 20000
- SAFE: distance >= 20000

## Roadmap

- Add model-based collision probability forecasting
- Integrate live NEO feeds (NASA/JPL APIs)
- Add historical encounter playback mode
- Add unit and integration tests
- Provide deployment profiles for cloud hosting

## License

This project is for educational and portfolio use.

If you want, I can also add a formal open-source license file (MIT) and contributor guidelines.
