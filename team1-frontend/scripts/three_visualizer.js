/**
 * AlertX - Three.js 3D Spatial Digital Twin & Face Rig Visualizer
 * Module: team1-frontend/scripts/three_visualizer.js
 * Author: Person 1 (Frontend, UI/UX & 3D Visualization)
 * 
 * Provides an isolated, extensible Three.js environment that mounts to the DOM container.
 * Features:
 * 1. Scene, Perspective Camera, WebGLRenderer, Studio Lighting.
 * 2. 3D Wireframe Driver Face Mesh & Cockpit Orientation Rig.
 * 3. Real-time kinematic binding to Pitch, Yaw, Roll, EAR, and MAR.
 * 4. Extensible hook `mountCustomModel()` for user-injected 3D templates/GLTF models.
 */

export class ThreeVisualizer {
  constructor() {
    this.container = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.animationFrameId = null;

    // 3D Objects
    this.driverHeadGroup = null;
    this.headMesh = null;
    this.leftEyeMesh = null;
    this.rightEyeMesh = null;
    this.mouthMesh = null;
    this.customModelMount = null;

    // Color Palette
    this.alertColors = {
      Normal: 0x00ff88,
      Advisory: 0xffdd00,
      Warning: 0xff8800,
      Critical: 0xff0044
    };

    // Current State
    this.targetRotation = { pitch: 0, yaw: 0, roll: 0 };
    this.currentRotation = { pitch: 0, yaw: 0, roll: 0 };
    this.targetEar = 0.3;
    this.targetMar = 0.2;
  }

  /**
   * Initializes the Three.js viewport in the specified DOM element.
   * @param {HTMLElement|string} container - Mount target element or selector
   */
  init(container) {
    if (typeof container === 'string') {
      this.container = document.querySelector(container);
    } else {
      this.container = container;
    }

    if (!this.container) {
      console.error('[ThreeVisualizer] Container element not found.');
      return;
    }

    const width = this.container.clientWidth || 300;
    const height = this.container.clientHeight || 300;

    // 1. Scene Setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0d14);

    // 2. Camera Setup
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 5);
    this.camera.lookAt(0, 0, 0);

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x00ff88, 1.2, 50);
    pointLight.position.set(2, 4, 3);
    this.scene.add(pointLight);

    const fillLight = new THREE.DirectionalLight(0x4a90e2, 0.4);
    fillLight.position.set(-3, -2, 2);
    this.scene.add(fillLight);

    // 5. Grid Helper & Origin Floor
    const grid = new THREE.GridHelper(10, 20, 0x00ff88, 0x1f293d);
    grid.position.y = -1.8;
    this.scene.add(grid);

    // 6. Build Default 3D Avatar Rig
    this._buildDefaultAvatar();

    // 7. Event Listeners
    window.addEventListener('resize', this.onWindowResize.bind(this));

    // 8. Start Animation Loop
    this.animate();
    console.log('[ThreeVisualizer] Initialized successfully.');
  }

  /**
   * Constructs a high-tech geometric wireframe avatar head placeholder.
   */
  _buildDefaultAvatar() {
    this.driverHeadGroup = new THREE.Group();

    // Outer Head Geometry (Icosahedron wireframe)
    const headGeo = new THREE.IcosahedronGeometry(1.2, 2);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0x00ff88,
      wireframe: true,
      transparent: true,
      opacity: 0.8
    });
    this.headMesh = new THREE.Mesh(headGeo, headMat);
    this.driverHeadGroup.add(this.headMesh);

    // Left Eye Sphere
    const eyeGeo = new THREE.SphereGeometry(0.12, 12, 12);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x00ff88 });
    this.leftEyeMesh = new THREE.Mesh(eyeGeo, eyeMat);
    this.leftEyeMesh.position.set(-0.4, 0.2, 1.05);
    this.driverHeadGroup.add(this.leftEyeMesh);

    // Right Eye Sphere
    this.rightEyeMesh = new THREE.Mesh(eyeGeo, eyeMat);
    this.rightEyeMesh.position.set(0.4, 0.2, 1.05);
    this.driverHeadGroup.add(this.rightEyeMesh);

    // Mouth Geometry (Torus for aperture tracking)
    const mouthGeo = new THREE.TorusGeometry(0.25, 0.05, 8, 16);
    const mouthMat = new THREE.MeshStandardMaterial({ color: 0x00ff88 });
    this.mouthMesh = new THREE.Mesh(mouthGeo, mouthMat);
    this.mouthMesh.position.set(0, -0.4, 1.05);
    this.driverHeadGroup.add(this.mouthMesh);

    // Custom Model Injection Anchor Point
    this.customModelMount = new THREE.Group();
    this.driverHeadGroup.add(this.customModelMount);

    this.scene.add(this.driverHeadGroup);
  }

  /**
   * Updates 3D Head Orientation based on Euler angles from SolvePnP.
   * @param {number} pitchDeg - Pitch in degrees (Negative = nodding down)
   * @param {number} yawDeg - Yaw in degrees (Left/Right rotation)
   * @param {number} rollDeg - Roll in degrees (Lateral tilt)
   */
  updateHeadPose(pitchDeg, yawDeg, rollDeg) {
    this.targetRotation.pitch = THREE.MathUtils.degToRad(pitchDeg || 0);
    this.targetRotation.yaw = THREE.MathUtils.degToRad(yawDeg || 0);
    this.targetRotation.roll = THREE.MathUtils.degToRad(rollDeg || 0);
  }

  /**
   * Updates eye opening and mouth yawn morph scales.
   * @param {number} ear - Eye Aspect Ratio (Normal ~0.30, Closed <0.20)
   * @param {number} mar - Mouth Aspect Ratio (Normal ~0.20, Yawn >0.60)
   */
  updateBiometrics(ear, mar) {
    this.targetEar = ear || 0.3;
    this.targetMar = mar || 0.2;
  }

  /**
   * Updates avatar wireframe color based on alert severity tier.
   * @param {string} alertLevel - 'Normal' | 'Advisory' | 'Warning' | 'Critical'
   */
  setAlertState(alertLevel) {
    const hexColor = this.alertColors[alertLevel] || this.alertColors.Normal;
    if (this.headMesh && this.headMesh.material) {
      this.headMesh.material.color.setHex(hexColor);
    }
    if (this.leftEyeMesh && this.leftEyeMesh.material) {
      this.leftEyeMesh.material.color.setHex(hexColor);
      this.rightEyeMesh.material.color.setHex(hexColor);
    }
    if (this.mouthMesh && this.mouthMesh.material) {
      this.mouthMesh.material.color.setHex(hexColor);
    }
  }

  /**
   * Clean Hook: Mounts a custom Three.js Object3D or GLTF scene provided by the user.
   * @param {THREE.Object3D} customObject3D 
   */
  mountCustomModel(customObject3D) {
    if (!this.customModelMount) return;
    
    // Clear previous custom model
    while (this.customModelMount.children.length > 0) {
      this.customModelMount.remove(this.customModelMount.children[0]);
    }

    if (customObject3D) {
      this.customModelMount.add(customObject3D);
      // Hide default geometric mesh if custom model is present
      this.headMesh.visible = false;
      console.log('[ThreeVisualizer] Custom 3D model mounted successfully.');
    } else {
      this.headMesh.visible = true;
    }
  }

  /**
   * Render Loop with smooth exponential damping (lerp).
   */
  animate() {
    this.animationFrameId = requestAnimationFrame(this.animate.bind(this));

    if (this.driverHeadGroup) {
      // Smooth interpolation for head rotations
      this.driverHeadGroup.rotation.x += (this.targetRotation.pitch - this.driverHeadGroup.rotation.x) * 0.15;
      this.driverHeadGroup.rotation.y += (this.targetRotation.yaw - this.driverHeadGroup.rotation.y) * 0.15;
      this.driverHeadGroup.rotation.z += (this.targetRotation.roll - this.driverHeadGroup.rotation.z) * 0.15;

      // Morph eye scaling (EAR)
      const eyeScaleY = Math.max(0.1, Math.min(1.5, this.targetEar / 0.30));
      if (this.leftEyeMesh && this.rightEyeMesh) {
        this.leftEyeMesh.scale.set(1.0, eyeScaleY, 1.0);
        this.rightEyeMesh.scale.set(1.0, eyeScaleY, 1.0);
      }

      // Morph mouth yawn scaling (MAR)
      const mouthScaleY = Math.max(0.4, Math.min(2.5, this.targetMar / 0.20));
      if (this.mouthMesh) {
        this.mouthMesh.scale.set(1.0, mouthScaleY, 1.0);
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.onWindowResize);
    if (this.renderer && this.renderer.domElement && this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

