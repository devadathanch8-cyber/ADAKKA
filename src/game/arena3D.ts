import * as THREE from 'three';
import { ArenaConfig } from '../types/game';
import { GAME_CONSTANTS } from './constants';

export class Arena3D {
  public root: THREE.Group;
  public config: ArenaConfig;

  // Jumbotron dynamic canvas & texture
  private jumbotronCanvas: HTMLCanvasElement;
  private jumbotronCtx: CanvasRenderingContext2D | null;
  private jumbotronTexture: THREE.CanvasTexture;
  private jumbotronMesh: THREE.Mesh | null = null;

  // Goal meshes & nets
  public leftGoalNet: THREE.Mesh | null = null;
  public rightGoalNet: THREE.Mesh | null = null;
  public leftGoalPortalGlow: THREE.Mesh | null = null;
  public rightGoalPortalGlow: THREE.Mesh | null = null;

  // Animated elements
  private crowdGlows: THREE.Points | null = null;
  private repulsorFlames: THREE.Mesh[] = [];
  private cloudsGroup: THREE.Group;
  private spotLights: THREE.SpotLight[] = [];

  constructor(config: ArenaConfig) {
    this.config = config;
    this.root = new THREE.Group();
    this.root.name = 'sky_stadium';

    // 1. Build Floating Pitch Platform
    this.buildPitchPlatform();

    // 2. Build Goal Portals
    this.buildGoalPortals();

    // 3. Build Holographic Jumbotron Screen
    const { canvas, ctx, texture } = this.createJumbotronCanvas();
    this.jumbotronCanvas = canvas;
    this.jumbotronCtx = ctx;
    this.jumbotronTexture = texture;
    this.buildJumbotron();

    // 4. Build Stadium Grandstands & Animated Crowd
    this.buildCrowd();

    // 5. Build Floating Sky City Backdrop & Clouds
    this.cloudsGroup = new THREE.Group();
    this.root.add(this.cloudsGroup);
    this.buildSkyCityAndClouds();

    // 6. Stadium Lighting & Spotlights
    this.setupLighting();
  }

  private buildPitchPlatform() {
    const halfW = GAME_CONSTANTS.FIELD_HALF_WIDTH;
    const halfD = GAME_CONSTANTS.FIELD_HALF_DEPTH;

    // Pitch turf floor
    const pitchGeo = new THREE.BoxGeometry(halfW * 2 + 1.5, 0.4, halfD * 2 + 2.0);
    const turfMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.config.fieldBaseColor),
      roughness: 0.65,
      metalness: 0.15,
    });
    const pitchMesh = new THREE.Mesh(pitchGeo, turfMat);
    pitchMesh.position.y = -0.2;
    pitchMesh.receiveShadow = true;
    this.root.add(pitchMesh);

    // Glowing Pitch Markings (Center circle, touchlines, penalty areas)
    const linesGroup = new THREE.Group();
    linesGroup.position.y = 0.02;
    this.root.add(linesGroup);

    const glowColor = new THREE.Color(this.config.fieldGlowColor);
    const lineMat = new THREE.MeshBasicMaterial({
      color: glowColor,
      transparent: true,
      opacity: 0.85,
    });

    // Touchlines
    const perimeterGeo = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      // Perimeter
      -halfW, 0, -halfD,   halfW, 0, -halfD,
       halfW, 0, -halfD,   halfW, 0,  halfD,
       halfW, 0,  halfD,  -halfW, 0,  halfD,
      -halfW, 0,  halfD,  -halfW, 0, -halfD,
      // Halfway line
      0, 0, -halfD,  0, 0, halfD,
    ]);
    perimeterGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    const linesMesh = new THREE.LineSegments(perimeterGeo, lineMat);
    linesGroup.add(linesMesh);

    // Center circle
    const circleGeo = new THREE.RingGeometry(2.4, 2.48, 36);
    const circleMesh = new THREE.Mesh(circleGeo, lineMat);
    circleMesh.rotation.x = -Math.PI / 2;
    linesGroup.add(circleMesh);

    // Center kick-off spot
    const spotGeo = new THREE.CircleGeometry(0.3, 16);
    const spotMesh = new THREE.Mesh(spotGeo, lineMat);
    spotMesh.rotation.x = -Math.PI / 2;
    linesGroup.add(spotMesh);

    // Floating Platform Undercarriage (High-tech floating stadium hull)
    const hullGeo = new THREE.CylinderGeometry(halfW * 1.15, halfW * 0.85, 4.0, 32, 1, false);
    hullGeo.scale(1.0, 1.0, 0.45);
    const hullMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.35,
      metalness: 0.8,
    });
    const hullMesh = new THREE.Mesh(hullGeo, hullMat);
    hullMesh.position.y = -2.2;
    this.root.add(hullMesh);

    // Anti-Gravity Repulsor Engines (under the hull)
    [-8, 0, 8].forEach((xPos) => {
      const thrusterGeo = new THREE.CylinderGeometry(0.8, 1.2, 1.2, 16);
      const thrusterMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.9,
      });
      const thruster = new THREE.Mesh(thrusterGeo, thrusterMat);
      thruster.position.set(xPos, -4.2, 0);
      this.root.add(thruster);

      // Glowing plasma exhaust cone
      const coneGeo = new THREE.ConeGeometry(1.0, 2.5, 16);
      const coneMat = new THREE.MeshBasicMaterial({
        color: glowColor,
        transparent: true,
        opacity: 0.75,
      });
      const flame = new THREE.Mesh(coneGeo, coneMat);
      flame.rotation.x = Math.PI;
      flame.position.set(xPos, -5.5, 0);
      this.root.add(flame);
      this.repulsorFlames.push(flame);
    });

    // Glass / Energy Perimeter Barrier (Prevents players/ball from falling into the sky abyss)
    const wallGeo = new THREE.PlaneGeometry(halfW * 2 + 1.0, 2.8);
    const wallMat = new THREE.MeshBasicMaterial({
      color: glowColor,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
    });
    // Back glass barrier
    const backWall = new THREE.Mesh(wallGeo, wallMat);
    backWall.position.set(0, 1.4, -halfD);
    this.root.add(backWall);

    // Front low rail
    const frontRailGeo = new THREE.BoxGeometry(halfW * 2 + 1.0, 0.25, 0.15);
    const railMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
    const frontRail = new THREE.Mesh(frontRailGeo, railMat);
    frontRail.position.set(0, 0.2, halfD);
    this.root.add(frontRail);
  }

  private buildGoalPortals() {
    const halfW = GAME_CONSTANTS.FIELD_HALF_WIDTH;
    const goalLineX = GAME_CONSTANTS.GOAL_LINE_X;
    const goalHeight = GAME_CONSTANTS.GOAL_HEIGHT;
    const goalHalfZ = GAME_CONSTANTS.GOAL_HALF_WIDTH;
    const postRadius = GAME_CONSTANTS.POST_RADIUS;

    // Glowing Goal Materials
    const p1Color = new THREE.Color(0x06b6d4); // Cyan for Left Goal
    const p2Color = new THREE.Color(0xef4444); // Crimson for Right Goal

    // Build Left Goal
    const leftGoal = this.createGoalFrame(p1Color, -1);
    leftGoal.position.set(-goalLineX, 0, 0);
    this.root.add(leftGoal);

    // Build Right Goal
    const rightGoal = this.createGoalFrame(p2Color, 1);
    rightGoal.position.set(goalLineX, 0, 0);
    this.root.add(rightGoal);
  }

  private createGoalFrame(neonColor: THREE.Color, dir: number): THREE.Group {
    const group = new THREE.Group();
    const goalHeight = GAME_CONSTANTS.GOAL_HEIGHT;
    const goalHalfZ = GAME_CONSTANTS.GOAL_HALF_WIDTH;
    const postRadius = GAME_CONSTANTS.POST_RADIUS;
    const goalDepth = GAME_CONSTANTS.GOAL_DEPTH;

    const postMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: neonColor,
      emissiveIntensity: 0.85,
      metalness: 0.9,
      roughness: 0.1,
    });

    // 1. Vertical Posts (Front-Left, Front-Right)
    const postGeo = new THREE.CylinderGeometry(postRadius, postRadius, goalHeight, 16);
    postGeo.translate(0, goalHeight / 2, 0);

    const postFront1 = new THREE.Mesh(postGeo, postMat);
    postFront1.position.set(0, 0, -goalHalfZ);
    group.add(postFront1);

    const postFront2 = new THREE.Mesh(postGeo, postMat);
    postFront2.position.set(0, 0, goalHalfZ);
    group.add(postFront2);

    // 2. Crossbar
    const crossbarGeo = new THREE.CylinderGeometry(postRadius, postRadius, goalHalfZ * 2, 16);
    crossbarGeo.rotateX(Math.PI / 2);
    const crossbar = new THREE.Mesh(crossbarGeo, postMat);
    crossbar.position.set(0, goalHeight, 0);
    group.add(crossbar);

    // 3. Back Support Frame
    const backPostGeo = new THREE.CylinderGeometry(postRadius * 0.7, postRadius * 0.7, goalHeight * 0.85, 12);
    backPostGeo.translate(0, (goalHeight * 0.85) / 2, 0);
    const backPost1 = new THREE.Mesh(backPostPost(), postMat);

    function backPostPost() {
      return backPostGeo;
    }

    // Top depth bars
    const topBarGeo = new THREE.CylinderGeometry(postRadius * 0.7, postRadius * 0.7, goalDepth, 12);
    topBarGeo.rotateZ(Math.PI / 2);

    const topBar1 = new THREE.Mesh(topBarGeo, postMat);
    topBar1.position.set((dir * goalDepth) / 2, goalHeight, -goalHalfZ);
    group.add(topBar1);

    const topBar2 = new THREE.Mesh(topBarGeo, postMat);
    topBar2.position.set((dir * goalDepth) / 2, goalHeight, goalHalfZ);
    group.add(topBar2);

    // 4. Holographic Energy Goal Net (Wireframe hex lattice with pulsing glow)
    const netGeo = new THREE.BoxGeometry(goalDepth, goalHeight, goalHalfZ * 2);
    const netMat = new THREE.MeshBasicMaterial({
      color: neonColor,
      wireframe: true,
      transparent: true,
      opacity: 0.4,
    });
    const net = new THREE.Mesh(netGeo, netMat);
    net.position.set((dir * goalDepth) / 2, goalHeight / 2, 0);
    group.add(net);

    if (dir < 0) {
      this.leftGoalNet = net;
    } else {
      this.rightGoalNet = net;
    }

    // 5. Goal Line Portal Glow Field
    const portalGeo = new THREE.PlaneGeometry(0.1, goalHeight);
    const portalMat = new THREE.MeshBasicMaterial({
      color: neonColor,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
    });
    const portal = new THREE.Mesh(portalGeo, portalMat);
    portal.position.set(0, goalHeight / 2, 0);
    group.add(portal);

    return group;
  }

  private createJumbotronCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const texture = new THREE.CanvasTexture(canvas);
    return { canvas, ctx, texture };
  }

  private buildJumbotron() {
    // Curved stadium jumbotron above the pitch
    const screenGeo = new THREE.PlaneGeometry(16, 5.5);
    const screenMat = new THREE.MeshBasicMaterial({
      map: this.jumbotronTexture,
      side: THREE.DoubleSide,
    });
    this.jumbotronMesh = new THREE.Mesh(screenGeo, screenMat);
    this.jumbotronMesh.position.set(0, 9.5, -8.5);
    this.jumbotronMesh.rotation.x = 0.15; // Tilted slightly downward toward the pitch
    this.root.add(this.jumbotronMesh);

    // Heavy truss structure holding the screen
    const trussMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.8,
      roughness: 0.3,
    });
    const trussFrameGeo = new THREE.BoxGeometry(16.5, 6.0, 0.4);
    const trussFrame = new THREE.Mesh(trussFrameGeo, trussMat);
    trussFrame.position.set(0, 9.5, -8.7);
    trussFrame.rotation.x = 0.15;
    this.root.add(trussFrame);

    // Cables anchoring the screen to sky pylons
    [-8, 8].forEach((x) => {
      const cableGeo = new THREE.CylinderGeometry(0.06, 0.06, 12, 8);
      const cable = new THREE.Mesh(cableGeo, trussMat);
      cable.position.set(x, 14, -8.5);
      this.root.add(cable);
    });

    this.renderJumbotronDefault('AETHER STRIKER 3D', 'SKY ARENA CUP - LIVE');
  }

  public renderJumbotronDefault(title: string, sub: string, p1Score: number = 0, p2Score: number = 0, timerText: string = '01:30') {
    if (!this.jumbotronCtx) return;
    const ctx = this.jumbotronCtx;
    const w = this.jumbotronCanvas.width;
    const h = this.jumbotronCanvas.height;

    // Background Cyber Grid
    ctx.fillStyle = '#060b18';
    ctx.fillRect(0, 0, w, h);

    // Hex / Scanline pattern
    ctx.strokeStyle = '#0e2346';
    ctx.lineWidth = 2;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Outer Neon Border
    ctx.strokeStyle = this.config.hologramColor;
    ctx.lineWidth = 12;
    ctx.strokeRect(16, 16, w - 32, h - 32);

    // Live Tag
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.roundRect(40, 36, 110, 42, 6);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('● LIVE', 95, 65);

    // Subtitle / Tournament Tag
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(sub.toUpperCase(), w / 2, 70);

    // Big Center Title
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 58px sans-serif';
    ctx.shadowColor = this.config.fieldGlowColor;
    ctx.shadowBlur = 25;
    ctx.fillText(title, w / 2, 160);
    ctx.shadowBlur = 0;

    // Big Scoreboard Display
    ctx.fillStyle = '#0b1329';
    ctx.beginPath();
    ctx.roundRect(w / 2 - 280, 210, 560, 230, 16);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Player 1 Side
    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('P1', w / 2 - 160, 270);
    ctx.font = '900 110px monospace';
    ctx.fillText(String(p1Score), w / 2 - 160, 390);

    // Center Timer
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText('TIME', w / 2, 270);
    ctx.font = 'bold 48px monospace';
    ctx.fillText(timerText, w / 2, 340);

    // Player 2 Side
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('P2', w / 2 + 160, 270);
    ctx.font = '900 110px monospace';
    ctx.fillText(String(p2Score), w / 2 + 160, 390);

    // Footer ticker
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('SKY STADIUM LEAGUE • HIGH VELOCITY CYBER FOOTBALL', w / 2, 480);

    this.jumbotronTexture.needsUpdate = true;
  }

  public flashJumbotronGoal(scorerText: string, p1Score: number, p2Score: number) {
    if (!this.jumbotronCtx) return;
    const ctx = this.jumbotronCtx;
    const w = this.jumbotronCanvas.width;
    const h = this.jumbotronCanvas.height;

    // Flash background
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(20, 20, w - 40, h - 40);

    ctx.fillStyle = '#f59e0b';
    ctx.font = '900 96px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GOOOOOAL!', w / 2, 170);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 50px sans-serif';
    ctx.fillText(scorerText.toUpperCase(), w / 2, 260);

    ctx.font = '900 90px monospace';
    ctx.fillText(`${p1Score} - ${p2Score}`, w / 2, 380);

    this.jumbotronTexture.needsUpdate = true;
  }

  private buildCrowd() {
    // Grandstands with thousands of glowing spectator particles
    const crowdCount = 1200;
    const positions = new Float32Array(crowdCount * 3);
    const colors = new Float32Array(crowdCount * 3);

    const c1 = new THREE.Color(0x06b6d4); // Cyan fan
    const c2 = new THREE.Color(0xef4444); // Crimson fan
    const c3 = new THREE.Color(0xf59e0b); // Gold fan

    for (let i = 0; i < crowdCount; i++) {
      // Semi-circular stadium bowl behind the pitch
      const angle = (Math.PI * (i / crowdCount)) + 0.1;
      const radius = 17 + Math.random() * 9;
      const x = -Math.cos(angle) * radius;
      const z = -4.0 - Math.sin(angle) * (radius * 0.45);
      const y = 1.0 + (radius - 17) * 0.8 + Math.random() * 0.6;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const pick = Math.random();
      const col = pick < 0.45 ? c1 : pick < 0.9 ? c2 : c3;
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    const crowdGeo = new THREE.BufferGeometry();
    crowdGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    crowdGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const crowdMat = new THREE.PointsMaterial({
      size: 0.4,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });

    this.crowdGlows = new THREE.Points(crowdGeo, crowdMat);
    this.root.add(this.crowdGlows);
  }

  private buildSkyCityAndClouds() {
    // Procedural distant futuristic skyscrapers below the stadium
    const cityGroup = new THREE.Group();
    cityGroup.position.set(0, -60, -35);
    this.root.add(cityGroup);

    const towerGeo = new THREE.BoxGeometry(1, 1, 1);
    const towerMat = new THREE.MeshStandardMaterial({
      color: 0x090e1a,
      roughness: 0.4,
      metalness: 0.8,
    });

    // 40 Cyber towers below
    for (let i = 0; i < 40; i++) {
      const tower = new THREE.Mesh(towerGeo, towerMat);
      const width = 4 + Math.random() * 6;
      const height = 30 + Math.random() * 45;
      const depth = 4 + Math.random() * 6;
      tower.scale.set(width, height, depth);
      tower.position.set(
        (Math.random() - 0.5) * 120,
        height / 2,
        (Math.random() - 0.5) * 60 - 20
      );
      cityGroup.add(tower);

      // Glowing spire on top
      const spireGeo = new THREE.CylinderGeometry(0.1, 0.4, 8, 6);
      const spireMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const spire = new THREE.Mesh(spireGeo, spireMat);
      spire.position.set(tower.position.x, height + 4, tower.position.z);
      cityGroup.add(spire);
    }

    // Atmospheric Cloud Layers
    const cloudMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(this.config.skyGradient[0]),
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });

    for (let c = 0; c < 12; c++) {
      const cloudGeo = new THREE.SphereGeometry(14 + Math.random() * 10, 8, 6);
      cloudGeo.scale(1.8, 0.3, 1.0);
      const cloud = new THREE.Mesh(cloudGeo, cloudMat);
      cloud.position.set(
        (Math.random() - 0.5) * 80,
        -12 - Math.random() * 14,
        (Math.random() - 0.5) * 60 - 15
      );
      this.cloudsGroup.add(cloud);
    }
  }

  private setupLighting() {
    // Ambient light
    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    this.root.add(ambient);

    // Directional sunlight / moonbeam
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.6);
    sunLight.position.set(10, 24, 18);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 60;
    sunLight.shadow.camera.left = -20;
    sunLight.shadow.camera.right = 20;
    sunLight.shadow.camera.top = 15;
    sunLight.shadow.camera.bottom = -5;
    this.root.add(sunLight);

    // Stadium Floodlights (angled down onto the pitch)
    const floodlightLeft = new THREE.SpotLight(0x38bdf8, 2.5);
    floodlightLeft.position.set(-16, 18, 12);
    floodlightLeft.target.position.set(-6, 0, 0);
    this.root.add(floodlightLeft);
    this.root.add(floodlightLeft.target);
    this.spotLights.push(floodlightLeft);

    const floodlightRight = new THREE.SpotLight(0xf43f5e, 2.5);
    floodlightRight.position.set(16, 18, 12);
    floodlightRight.target.position.set(6, 0, 0);
    this.root.add(floodlightRight);
    this.root.add(floodlightRight.target);
    this.spotLights.push(floodlightRight);
  }

  public update(delta: number) {
    // Pulse repulsor exhaust flames
    const time = Date.now() * 0.005;
    this.repulsorFlames.forEach((flame, idx) => {
      const scaleY = 1.0 + Math.sin(time + idx * 2) * 0.25;
      flame.scale.set(1.0, scaleY, 1.0);
    });

    // Drift clouds slowly
    this.cloudsGroup.children.forEach((cloud) => {
      cloud.position.x += delta * 1.2;
      if (cloud.position.x > 60) {
        cloud.position.x = -60;
      }
    });

    // Animate crowd glowsticks gently
    if (this.crowdGlows) {
      const pos = this.crowdGlows.geometry.attributes.position;
      const count = pos.count;
      for (let i = 0; i < count; i += 4) {
        const origY = pos.getY(i);
        pos.setY(i, origY + Math.sin(time + i) * 0.008);
      }
      pos.needsUpdate = true;
    }
  }
}
