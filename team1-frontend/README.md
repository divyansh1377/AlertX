# AlertX — Luxury Automotive Cockpit & Driver Safety HUD (Team 1)

This module delivers a cinematic, luxury automotive cockpit user experience combined with real-time driver vigilance intelligence, WebGL 3D spatial visualization, and procedural Web Audio synthesizers.

---

## 🏗️ Architecture & Component Directory

```
team1-frontend/
├── index.html               # Dual-view master template (Auth Landing + Cockpit HUD)
├── styles/
│   ├── main.css             # Glassmorphism, CSS Variables, Split Layouts, Responsive Grid
│   └── components.css       # Reusable Buttons, Cards, Inputs, Status Badges, History Log
├── js/
│   ├── main.js              # Application orchestrator, Auth router, and Lifecycle manager
│   ├── three_visualizer.js  # Atmospheric 3D Highway Background & 3D Face Digital Twin Rig
│   ├── dashboard.js         # HUD Telemetry gauges, EAR/MAR/PERCLOS rendering & Event log
│   ├── webcam_manager.js    # HTML5 Camera ingestion & 30 FPS canvas frame capture
│   ├── websocket_client.js  # Full-duplex WebSocket client (`ws://localhost:8000/ws/telemetry`)
│   └── audio_alert.js       # Web Audio procedural multi-tier alarm synthesizer
└── scripts/                 # Backwards-compatible module re-exports
```

---

## 🎨 Three.js Visualizer Engine (`three_visualizer.js`)

The visualizer provides dual concurrent 3D systems:
1. **Atmospheric Background Scene**: Fullscreen real-time 3D dark automotive highway with dynamic moving cybernetic grid lines, exponential horizon fog (`THREE.FogExp2`), low-poly vehicle hull silhouette, and responsive mouse/touch parallax.
2. **3D Spatial Digital Twin Rig**: Cybernetic face mesh with glowing landmark vertex point clouds that dynamically reflect:
   - **Head Pose Kinematics**: Pitch, Yaw, Roll Euler angles.
   - **Biometric Morphing**: Eye aperture scaling based on EAR and mouth yawning based on MAR.
   - **Alert State Lighting**: Real-time color transitions (`Normal` #10B981, `Advisory` #F59E0B, `Warning` #F97316, `Critical` #EF4444).

### Custom 3D Model Injection:
Mount external GLTF/GLB models or custom geometries seamlessly:
```javascript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
loader.load('/assets/custom_driver_avatar.glb', (gltf) => {
  app.visualizer.mountCustomModel(gltf.scene);
});
```

---

## 🔐 Auth Experience & Session Handling
- **Split-Screen Landing**: Luxury glassmorphism card featuring branding, tagline, product highlights, and driver authentication form.
- **Client-Side Validation & Mock Authentication**: Instant format checks and isolated `mockAuthenticate()` handler with password show/hide and "Remember Me" session persistence (`localStorage`).

---

## 🚀 Running the Frontend

### Option 1: Standalone Vite Dev Server
```bash
npm install
npm run dev
```

### Option 2: Direct Static File Ingestion
Open `index.html` directly in any modern WebGL and Web Audio-enabled browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari).
