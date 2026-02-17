# SABLEv2
### T1-1 — Repo + Environment Lock

Objective:
Stabilize backend boot, isolate environment, and enforce clean package structure.

Completed:
- Created backend/.venv and bound project to Python 3.11.7
- Refactored backend into app/ package namespace
- Fixed import graph (app.audio.routes)
- Added .gitignore to prevent .pyc pollution
- Confirmed uvicorn boot via: uvicorn app.main:app --reload
- Verified /health endpoint responds correctly

Result:
Backend boots predictably from /backend using a single command in isolated environment.
No global Python bleed.
Package structure aligned for Tier-1 architecture.
