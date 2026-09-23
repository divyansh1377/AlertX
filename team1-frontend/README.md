# AlertX — Frontend & 3D Visualization (Team 1)

This module contains the browser client, real-time telemetry HUD, procedural audio alarm synthesizer, and Three.js 3D avatar rig.

---

## 🎨 Three.js Custom Template Injection

The 3D environment is encapsulated inside [`scripts/three_visualizer.js`](scripts/three_visualizer.js).

### How to Inject a Custom 3D Model / Template:
You can mount custom GLTF/GLB models, custom shaders, or custom cockpit scenes cleanly using the `mountCustomModel` method:

```javascript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
loader.load('/path/to/custom_driver_head.glb', (gltf) => {
  // Pass the root object to the visualizer
  app.visualizer.mountCustomModel(gltf.scene);
});
```

The visualizer automatically synchronizes:
- **Head Pose Rotation**: Pitch (X), Yaw (Y), Roll (Z) via `updateHeadPose(pitch, yaw, roll)`
- **Eye Blink Morph**: Scales eye geometry with EAR via `updateBiometrics(ear, mar)`
- **Mouth Yawn Morph**: Scales mouth geometry with MAR
- **Alert Colors**: Switches material shaders to Green/Yellow/Orange/Red according to vigilance tier.

---

## 🚀 Running the Frontend

### Option 1: Standalone Vite Dev Server
```bash
npm install
npm run dev
```

### Option 2: Direct Static File Ingestion
Open `index.html` directly in any modern browser (Chrome / Edge / Firefox) supporting WebGL and Web Audio.

