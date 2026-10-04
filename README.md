# Unified Building Energy Intelligence Platform

**Schneider Electric · Yuva Yodha Energy Tech Hackathon · Challenge 02 — Smart Buildings**

Cloud-style building management prototype that cuts energy waste, protects comfort, supports data-driven operations, and integrates solar, storage, and demand response.

## Modules

1. Occupancy-driven HVAC and lighting (facility-manager override + audit)  
2. ECBC digital twin with interactive spatial cockpit and what-if sandbox  
3. Fault detection and equipment health trends  
4. Solar self-consumption, ToD arbitrage, demand response, blackout islanding simulation  
5. Explainable AI and natural-language query  
6. Tenant engagement, eco-action logging, leaderboard  

## Demo flow

1. Command Center — performance pillars + KPIs + alerts  
2. Occupancy HVAC — room cards + manager override  
3. Digital Twin — thermal / airflow / presence layers, heatwave slider  
4. Solar & Grid — power flow, **Simulate grid blackout**, resilience runway  
5. Tenant Engagement — log eco-action, green credits  

## Run

```powershell
cd backend
python -m pip install -r requirements.txt
python seed.py
python run.py
```

```powershell
cd frontend
npm install
npm run dev
```

- API: http://127.0.0.1:8000/health  
- UI: http://localhost:5173  

Optional `frontend/.env`: `VITE_API_BASE=http://127.0.0.1:8000/api/v1`

**Demo logins:** facility@demo.com / demo123 · tenant@demo.com / demo123 · maintenance@demo.com / demo123

## Stack

Flask + PyJWT (pure Python) · React + Vite + Tailwind + Recharts + Leaflet
