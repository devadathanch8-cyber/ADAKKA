import * as THREE from 'three';
import { GAME_CONSTANTS } from './constants';

export class Ball3D {
  public root: THREE.Group;
  public ballMesh: THREE.Mesh;
  public shadowMesh: THREE.Mesh;
  public trailPoints: THREE.Vector3[] = [];
  public trailMesh: THREE.Line;
  public trailGeometry: THREE.BufferGeometry;

  // Energy aura around ball
  public auraMesh: THREE.Mesh;

  constructor() {
    this.root = new THREE.Group();
    this.root.name = 'soccer_ball';

    const radius = GAME_CONSTANTS.BALL_RADIUS;

    // 1. Create procedural cyber football texture
    const ballTexture = this.createCyberBallTexture();

    // 2. Ball sphere
    const ballGeo = new THREE.SphereGeometry(radius, 32, 24);
    const ballMat = new THREE.MeshStandardMaterial({
      map: ballTexture,
      roughness: 0.25,
      metalness: 0.35,
    });
    this.ballMesh = new THREE.Mesh(ballGeo, ballMat);
    this.ballMesh.castShadow = true;
    this.root.add(this.ballMesh);

    // 3. Glowing aura shell (visible during power shots and special moves)
    const auraGeo = new THREE.SphereGeometry(radius * 1.3, 16, 12);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0,
      wireframe: true,
    });
    this.auraMesh = new THREE.Mesh(auraGeo, auraMat);
    this.root.add(this.auraMesh);

    // 4. Ground Shadow projection
    const shadowGeo = new THREE.CircleGeometry(radius * 1.1, 24);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    this.shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowMesh.rotation.x = -Math.PI / 2;
    this.shadowMesh.position.y = 0.03;
    // We keep shadow separate or adjust in update
    this.root.add(this.shadowMesh);

    // 5. Motion Trail Line
    const maxTrailCount = 20;
    for (let i = 0; i < maxTrailCount; i++) {
      this.trailPoints.push(new THREE.Vector3(0, 0, 0));
    }
    this.trailGeometry = new THREE.BufferGeometry().setFromPoints(this.trailPoints);
    const trailMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.7,
      linewidth: 3,
    });
    this.trailMesh = new THREE.Line(this.trailGeometry, trailMat);
    this.trailMesh.frustumCulled = false;
  }

  private createCyberBallTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // White cyber base
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 512, 256);

    // Cyber panel borders
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 6;

    // Draw hexagonal grid lines across the texture
    const hexSize = 36;
    for (let y = 0; y < 256 + hexSize; y += hexSize * 1.5) {
      for (let x = 0; x < 512 + hexSize * 2; x += hexSize * Math.sqrt(3)) {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
          const px = x + hexSize * Math.cos(angle);
          const py = y + hexSize * Math.sin(angle);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();

        // Fill alternate hex panels with obsidian cyber patches
        if ((Math.floor(x / 40) + Math.floor(y / 40)) % 3 === 0) {
          ctx.fillStyle = '#0f172a';
          ctx.fill();
        }
      }
    }

    // Glowing core logo on ball
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(256, 128, 28, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }

  public update(pos: THREE.Vector3, vel: THREE.Vector3, isSpecial: boolean, specialColor: string = '#38bdf8') {
    // Position ball
    this.ballMesh.position.copy(pos);

    // Rotate ball according to rolling & flight velocity
    const speed = vel.length();
    if (speed > 0.1) {
      // Rotation axis perpendicular to velocity and up vector
      const rotAxis = new THREE.Vector3(0, 0, 1).cross(vel).normalize();
      this.ballMesh.rotateOnAxis(rotAxis, (speed * 0.05));
    }

    // Shadow on ground floor: tracks ball X and Z, scales and fades with Y height
    this.shadowMesh.position.x = pos.x;
    this.shadowMesh.position.z = pos.z;
    const heightAboveGround = Math.max(0, pos.y - GAME_CONSTANTS.BALL_RADIUS);
    const shadowScale = Math.max(0.3, 1.0 - heightAboveGround * 0.12);
    this.shadowMesh.scale.set(shadowScale, shadowScale, shadowScale);
    (this.shadowMesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0.1, 0.55 - heightAboveGround * 0.08);

    // Update trail
    this.trailPoints.pop();
    this.trailPoints.unshift(pos.clone());
    this.trailGeometry.setFromPoints(this.trailPoints);

    // Power & Special FX Aura
    if (isSpecial || speed > 22.0) {
      const col = new THREE.Color(specialColor);
      (this.auraMesh.material as THREE.MeshBasicMaterial).color = col;
      (this.auraMesh.material as THREE.MeshBasicMaterial).opacity = 0.65;
      (this.trailMesh.material as THREE.LineBasicMaterial).color = col;
      (this.trailMesh.material as THREE.LineBasicMaterial).opacity = 0.9;
      this.auraMesh.position.copy(pos);
      this.auraMesh.rotation.y += 0.2;
    } else {
      (this.auraMesh.material as THREE.MeshBasicMaterial).opacity = 0;
      (this.trailMesh.material as THREE.LineBasicMaterial).opacity = speed > 12 ? 0.35 : 0.05;
    }
  }
}
