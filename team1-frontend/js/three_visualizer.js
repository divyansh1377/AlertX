/**
 * AlertX - High-Performance Three.js Visualizer Engine (Premium Monochrome Theme)
 * Module: team1-frontend/js/three_visualizer.js
 * 
 * Features:
 * 1. Cinematic Monochrome Atmospheric Background: Deep black & charcoal highway, soft grey fog,
 *    graphite/silver metallic vehicle hull, white environmental lighting, and mouse parallax.
 * 2. 3D Face Digital Twin Rig: Cybernetic wireframe & point-cloud face geometry in elegant silver/white,
 *    reflecting head pose Euler angles (Pitch, Yaw, Roll), EAR eye morphing, MAR mouth yawning, and alert state tints.
 * 3. Performance & Resilience: Visibility API tab suspension, WebGL fallback to CSS ambient gradient,
 *    and prefers-reduced-motion support.
 */

export class ThreeVisualizer {
  constructor() {
    // Background Scene Components
    this.bgCanvas = null;
    this.bgScene = null;
    this.bgCamera = null;
    this.bgRenderer = null;
    this.bgRoadGrid = null;
    this.bgRoadLines = null;
    this.bgCarGroup = null;
    this.bgAnimId = null;

    // Face Twin Scene Components
    this.faceContainer = null;
    this.faceScene = null;
    this.faceCamera = null;
    this.faceRenderer = null;
    this.faceGroup = null;
    this.faceMesh = null;
    this.facePoints = null;
    this.leftEyeMesh = null;
    this.rightEyeMesh = null;
    this.mouthMesh = null;
    this.customModelMount = null;
    this.faceAnimId = null;

    // State & Kinematics
    this.targetRotation = { pitch: 0, yaw: 0, roll: 0 };
    this.currentRotation = { pitch: 0, yaw: 0, roll: 0 };
    this.targetEar = 0.3;
    this.targetMar = 0.2;
    this.currentEar = 0.3;
    this.currentMar = 0.2;

    // Mouse Parallax
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Monochrome Palette & Semantic Alert Accents
    this.alertColors = {
      Normal: 0xE5E5E5,    // Elegant silver/white default
      Advisory: 0xF59E0B,  // Warm Gold
      Warning: 0xF97316,   // Amber Orange
      Critical: 0xEF4444   // Laser Red
    };
    this.currentHexColor = this.alertColors.Normal;

    this.isTabVisible = !document.hidden;
    this._bindVisibilityHandler();
  }

  // =========================================================================
  // 1. ATMOSPHERIC 3D AUTOMOTIVE BACKGROUND (MONOCHROME LUXURY)
  // =========================================================================
  initBackground(canvasElementOrSelector = '#threejs-bg-canvas') {
    try {
      this.bgCanvas = typeof canvasElementOrSelector === 'string'
        ? document.querySelector(canvasElementOrSelector)
        : canvasElementOrSelector;

      if (!this.bgCanvas) {
        console.warn('[ThreeVisualizer] Background canvas not found. Using CSS ambient fallback.');
        return;
      }

      // 1. Scene & Soft Grey Atmospheric Fog
      this.bgScene = new THREE.Scene();
      this.bgScene.background = new THREE.Color(0x0A0A0A);
      this.bgScene.fog = new THREE.FogExp2(0x0A0A0A, 0.035);

      // 2. Camera Setup
      const width = window.innerWidth;
      const height = window.innerHeight;
      this.bgCamera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
      this.bgCamera.position.set(0, 2.2, 5);
      this.bgCamera.lookAt(0, 1.2, -20);

      // 3. WebGL Renderer with Subtle Tone Mapping
      this.bgRenderer = new THREE.WebGLRenderer({
        canvas: this.bgCanvas,
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance'
      });
      this.bgRenderer.setSize(width, height);
      this.bgRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.bgRenderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.bgRenderer.toneMappingExposure = 1.05;

      // 4. Subtle White Environmental Lighting
      const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.7);
      this.bgScene.add(ambientLight);

      const topLight = new THREE.DirectionalLight(0xFFFFFF, 0.9);
      topLight.position.set(0, 12, -8);
      this.bgScene.add(topLight);

      const subtleFill = new THREE.PointLight(0xE5E5E5, 0.8, 25);
      subtleFill.position.set(0, 3, 2);
      this.bgScene.add(subtleFill);

      // 5. Build Monochrome Road & Horizon Grid
      this._buildAtmosphericRoad();

      // 6. Build Graphite & Silver Vehicle Hull
      this._buildProceduralCarHull();

      // 7. Parallax & Resize Listeners
      window.addEventListener('mousemove', this._onMouseMove.bind(this), { passive: true });
      window.addEventListener('resize', this._onWindowResize.bind(this));

      // 8. Start Background Render Loop
      this._animateBackground();
      console.log('[ThreeVisualizer] Monochrome 3D background engine running.');
    } catch (err) {
      console.error('[ThreeVisualizer] WebGL background initialization failed:', err);
      if (this.bgCanvas) this.bgCanvas.style.display = 'none';
    }
  }

  _buildAtmosphericRoad() {
    const roadGroup = new THREE.Group();

    // Road Surface Plane (Deep Charcoal / Black)
    const roadGeo = new THREE.PlaneGeometry(16, 120, 1, 1);
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x0E0E0E,
      roughness: 0.9,
      metalness: 0.15
    });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.position.set(0, 0, -40);
    roadGroup.add(roadMesh);

    // Subtle Grey Grid Lines
    const gridHelper = new THREE.GridHelper(120, 60, 0x333333, 0x1A1A1A);
    gridHelper.position.set(0, 0.02, -40);
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.4;
    this.bgRoadGrid = gridHelper;
    roadGroup.add(gridHelper);

    // Silver Dashed Center Lane Dividers
    const lineGeo = new THREE.BufferGeometry();
    const linePoints = [];
    for (let z = -100; z <= 20; z += 4) {
      linePoints.push(new THREE.Vector3(0, 0.05, z));
      linePoints.push(new THREE.Vector3(0, 0.05, z + 2));
    }
    lineGeo.setFromPoints(linePoints);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xCCCCCC,
      linewidth: 2,
      transparent: true,
      opacity: 0.75
    });
    this.bgRoadLines = new THREE.LineSegments(lineGeo, lineMat);
    roadGroup.add(this.bgRoadLines);

    // Lateral Guard Rails / Silver Accent Strips
    const railGeo = new THREE.BoxGeometry(0.12, 0.08, 120);
    const railMat = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.3,
      metalness: 0.8
    });

    const leftRail = new THREE.Mesh(railGeo, railMat);
    leftRail.position.set(-6, 0.08, -40);
    roadGroup.add(leftRail);

    const rightRail = new THREE.Mesh(railGeo, railMat);
    rightRail.position.set(6, 0.08, -40);
    roadGroup.add(rightRail);

    this.bgScene.add(roadGroup);
  }

  _buildProceduralCarHull() {
    this.bgCarGroup = new THREE.Group();

    // Dark Graphite Metallic Chassis
    const chassisGeo = new THREE.BoxGeometry(2.1, 0.7, 4.2);
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x141414,
      roughness: 0.3,
      metalness: 0.85
    });
    const chassisMesh = new THREE.Mesh(chassisGeo, chassisMat);
    chassisMesh.position.set(0, 0.55, 0);
    this.bgCarGroup.add(chassisMesh);

    // Silver / Smoked Glass Aerodynamic Cabin Roof
    const roofGeo = new THREE.BoxGeometry(1.6, 0.55, 2.2);
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.15,
      metalness: 0.9,
      transparent: true,
      opacity: 0.85
    });
    const roofMesh = new THREE.Mesh(roofGeo, roofMat);
    roofMesh.position.set(0, 1.1, -0.2);
    this.bgCarGroup.add(roofMesh);

    // Subtle White/Silver Headlights
    const headlightGeo = new THREE.BoxGeometry(0.4, 0.06, 0.08);
    const headlightMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });

    const leftHeadlight = new THREE.Mesh(headlightGeo, headlightMat);
    leftHeadlight.position.set(-0.75, 0.55, -2.11);
    this.bgCarGroup.add(leftHeadlight);

    const rightHeadlight = new THREE.Mesh(headlightGeo, headlightMat);
    rightHeadlight.position.set(0.75, 0.55, -2.11);
    this.bgCarGroup.add(rightHeadlight);

    // Rear Light Ribbon (Subtle red tail-bar for vehicle realism)
    const rearLightGeo = new THREE.BoxGeometry(1.85, 0.06, 0.08);
    const rearLightMat = new THREE.MeshBasicMaterial({ color: 0xCC2222 });
    const rearLight = new THREE.Mesh(rearLightGeo, rearLightMat);
    rearLight.position.set(0, 0.65, 2.11);
    this.bgCarGroup.add(rearLight);

    // Position vehicle in lower foreground
    this.bgCarGroup.position.set(0, 0, 1.2);
    this.bgScene.add(this.bgCarGroup);
  }

  _animateBackground() {
    this.bgAnimId = requestAnimationFrame(this._animateBackground.bind(this));

    if (!this.isTabVisible || !this.bgRenderer) return;

    // 1. Moving Highway Markings & Grid
    if (this.bgRoadLines) {
      this.bgRoadLines.position.z += 0.35;
      if (this.bgRoadLines.position.z > 4) {
        this.bgRoadLines.position.z = 0;
      }
    }

    if (this.bgRoadGrid) {
      this.bgRoadGrid.position.z += 0.35;
      if (this.bgRoadGrid.position.z > 4) {
        this.bgRoadGrid.position.z = 0;
      }
    }

    // 2. Parallax Camera & Vehicle Micro-Movement
    if (!this.reducedMotion) {
      this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
      this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

      this.bgCamera.position.x = this.mouse.x * 0.7;
      this.bgCamera.position.y = 2.2 + this.mouse.y * 0.25;
      this.bgCamera.lookAt(0, 1.2, -20);

      if (this.bgCarGroup) {
        this.bgCarGroup.rotation.y = -this.mouse.x * 0.04;
        this.bgCarGroup.rotation.z = -this.mouse.x * 0.02;
        this.bgCarGroup.position.x = this.mouse.x * 0.25;
      }
    }

    this.bgRenderer.render(this.bgScene, this.bgCamera);
  }

  _onMouseMove(event) {
    this.mouse.targetX = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.targetY = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  _onWindowResize() {
    if (this.bgCamera && this.bgRenderer) {
      const width = window.innerWidth;
      const height = window.innerHeight;
      this.bgCamera.aspect = width / height;
      this.bgCamera.updateProjectionMatrix();
      this.bgRenderer.setSize(width, height);
    }

    if (this.faceContainer && this.faceCamera && this.faceRenderer) {
      const width = this.faceContainer.clientWidth || 300;
      const height = this.faceContainer.clientHeight || 300;
      this.faceCamera.aspect = width / height;
      this.faceCamera.updateProjectionMatrix();
      this.faceRenderer.setSize(width, height);
    }
  }

  // =========================================================================
  // 2. 3D DIGITAL TWIN & FACE RIG VISUALIZER (MONOCHROME ELEGANCE)
  // =========================================================================
  initFaceTwin(mountTarget = '#threejs-face-mount') {
    try {
      this.faceContainer = typeof mountTarget === 'string'
        ? document.querySelector(mountTarget)
        : mountTarget;

      if (!this.faceContainer) {
        console.warn('[ThreeVisualizer] Face mount container not found.');
        return;
      }

      const width = this.faceContainer.clientWidth || 320;
      const height = this.faceContainer.clientHeight || 320;

      // 1. Scene
      this.faceScene = new THREE.Scene();
      this.faceScene.background = new THREE.Color(0x080808);

      // 2. Camera
      this.faceCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      this.faceCamera.position.set(0, 0, 4.8);
      this.faceCamera.lookAt(0, 0, 0);

      // 3. Renderer
      this.faceRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      this.faceRenderer.setSize(width, height);
      this.faceRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.faceContainer.innerHTML = '';
      this.faceContainer.appendChild(this.faceRenderer.domElement);

      // 4. Lights
      const ambient = new THREE.AmbientLight(0xFFFFFF, 0.8);
      this.faceScene.add(ambient);

      const pLight = new THREE.PointLight(0xFFFFFF, 1.2, 20);
      pLight.position.set(2, 3, 4);
      this.faceScene.add(pLight);

      // 5. Build Cybernetic Face Mesh & Point Cloud
      this._buildCyberneticFaceRig();

      // 6. Start Face Render Loop
      this._animateFaceTwin();
      console.log('[ThreeVisualizer] 3D Face Digital Twin initialized.');
    } catch (err) {
      console.error('[ThreeVisualizer] Face Twin initialization error:', err);
    }
  }

  init(containerSelector = '#threejs-mount') {
    this.initFaceTwin(containerSelector);
  }

  _buildCyberneticFaceRig() {
    this.faceGroup = new THREE.Group();

    // 1. Silver / Pale Grey Wireframe Head
    const headGeo = new THREE.IcosahedronGeometry(1.25, 3);
    const headMat = new THREE.MeshStandardMaterial({
      color: this.currentHexColor,
      wireframe: true,
      transparent: true,
      opacity: 0.6,
      roughness: 0.2,
      metalness: 0.85
    });
    this.faceMesh = new THREE.Mesh(headGeo, headMat);
    this.faceGroup.add(this.faceMesh);

    // 2. White Landmark Vertex Point Cloud
    const pointsMat = new THREE.PointsMaterial({
      color: 0xFFFFFF,
      size: 0.04,
      transparent: true,
      opacity: 0.85
    });
    this.facePoints = new THREE.Points(headGeo, pointsMat);
    this.faceGroup.add(this.facePoints);

    // 3. Left Eye Geometry
    const eyeGeo = new THREE.SphereGeometry(0.11, 16, 16);
    const eyeMat = new THREE.MeshStandardMaterial({
      color: this.currentHexColor,
      emissive: this.currentHexColor,
      emissiveIntensity: 0.2
    });
    this.leftEyeMesh = new THREE.Mesh(eyeGeo, eyeMat);
    this.leftEyeMesh.position.set(-0.38, 0.22, 1.1);
    this.faceGroup.add(this.leftEyeMesh);

    // 4. Right Eye Geometry
    this.rightEyeMesh = new THREE.Mesh(eyeGeo, eyeMat.clone());
    this.rightEyeMesh.position.set(0.38, 0.22, 1.1);
    this.faceGroup.add(this.rightEyeMesh);

    // 5. Mouth Aperture Torus
    const mouthGeo = new THREE.TorusGeometry(0.24, 0.045, 12, 24);
    const mouthMat = new THREE.MeshStandardMaterial({
      color: this.currentHexColor,
      emissive: this.currentHexColor,
      emissiveIntensity: 0.2
    });
    this.mouthMesh = new THREE.Mesh(mouthGeo, mouthMat);
    this.mouthMesh.position.set(0, -0.42, 1.1);
    this.faceGroup.add(this.mouthMesh);

    // 6. Custom Model Hook Group
    this.customModelMount = new THREE.Group();
    this.faceGroup.add(this.customModelMount);

    // Subtle Dark Grey Floor Grid
    const floorGrid = new THREE.GridHelper(8, 16, 0x444444, 0x1A1A1A);
    floorGrid.position.y = -1.8;
    this.faceScene.add(floorGrid);

    this.faceScene.add(this.faceGroup);
  }

  _animateFaceTwin() {
    this.faceAnimId = requestAnimationFrame(this._animateFaceTwin.bind(this));

    if (!this.isTabVisible || !this.faceRenderer || !this.faceGroup) return;

    // Smooth Kinematic Rotation Interpolation (Lerp)
    this.currentRotation.pitch += (this.targetRotation.pitch - this.currentRotation.pitch) * 0.15;
    this.currentRotation.yaw += (this.targetRotation.yaw - this.currentRotation.yaw) * 0.15;
    this.currentRotation.roll += (this.targetRotation.roll - this.currentRotation.roll) * 0.15;

    this.faceGroup.rotation.x = this.currentRotation.pitch;
    this.faceGroup.rotation.y = this.currentRotation.yaw;
    this.faceGroup.rotation.z = this.currentRotation.roll;

    // Biometrics Morphing Interpolation
    this.currentEar += (this.targetEar - this.currentEar) * 0.2;
    this.currentMar += (this.targetMar - this.currentMar) * 0.2;

    const eyeScaleY = Math.max(0.08, Math.min(1.4, this.currentEar / 0.30));
    if (this.leftEyeMesh && this.rightEyeMesh) {
      this.leftEyeMesh.scale.set(1.0, eyeScaleY, 1.0);
      this.rightEyeMesh.scale.set(1.0, eyeScaleY, 1.0);
    }

    const mouthScaleY = Math.max(0.4, Math.min(2.4, this.currentMar / 0.20));
    if (this.mouthMesh) {
      this.mouthMesh.scale.set(1.0, mouthScaleY, 1.0);
    }

    this.faceRenderer.render(this.faceScene, this.faceCamera);
  }

  // =========================================================================
  // 3. TELEMETRY & ALERT HOOKS
  // =========================================================================
  updateHeadPose(pitchDeg = 0, yawDeg = 0, rollDeg = 0) {
    this.targetRotation.pitch = THREE.MathUtils.degToRad(pitchDeg);
    this.targetRotation.yaw = THREE.MathUtils.degToRad(yawDeg);
    this.targetRotation.roll = THREE.MathUtils.degToRad(rollDeg);
  }

  updateBiometrics(ear = 0.3, mar = 0.2) {
    this.targetEar = ear;
    this.targetMar = mar;
  }

  setAlertState(alertLevel = 'Normal') {
    const hex = this.alertColors[alertLevel] || this.alertColors.Normal;
    this.currentHexColor = hex;

    if (this.faceMesh && this.faceMesh.material) {
      this.faceMesh.material.color.setHex(hex);
    }
    if (this.leftEyeMesh && this.leftEyeMesh.material) {
      this.leftEyeMesh.material.color.setHex(hex);
      this.leftEyeMesh.material.emissive.setHex(hex);
    }
    if (this.rightEyeMesh && this.rightEyeMesh.material) {
      this.rightEyeMesh.material.color.setHex(hex);
      this.rightEyeMesh.material.emissive.setHex(hex);
    }
    if (this.mouthMesh && this.mouthMesh.material) {
      this.mouthMesh.material.color.setHex(hex);
      this.mouthMesh.material.emissive.setHex(hex);
    }
  }

  mountCustomModel(customObject3D) {
    if (!this.customModelMount) return;
    while (this.customModelMount.children.length > 0) {
      this.customModelMount.remove(this.customModelMount.children[0]);
    }
    if (customObject3D) {
      this.customModelMount.add(customObject3D);
      if (this.faceMesh) this.faceMesh.visible = false;
    } else {
      if (this.faceMesh) this.faceMesh.visible = true;
    }
  }

  _bindVisibilityHandler() {
    document.addEventListener('visibilitychange', () => {
      this.isTabVisible = !document.hidden;
    });
  }

  destroy() {
    if (this.bgAnimId) cancelAnimationFrame(this.bgAnimId);
    if (this.faceAnimId) cancelAnimationFrame(this.faceAnimId);

    window.removeEventListener('resize', this._onWindowResize);
    window.removeEventListener('mousemove', this._onMouseMove);

    if (this.bgRenderer) this.bgRenderer.dispose();
    if (this.faceRenderer) this.faceRenderer.dispose();
  }
}
