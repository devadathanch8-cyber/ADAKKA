import * as THREE from 'three';
import { CharacterConfig } from '../types/game';
import { GAME_CONSTANTS } from './constants';

export class Character3D {
  public root: THREE.Group;
  public config: CharacterConfig;
  public isPlayer1: boolean;

  // Visual sub-nodes for animation
  public headGroup: THREE.Group;
  public hairGroup: THREE.Group;
  public bodyGroup: THREE.Group;
  public leftLegGroup: THREE.Group;
  public rightLegGroup: THREE.Group; // Primary kicking leg
  public auraRing: THREE.Mesh;
  public specialGlowMesh: THREE.Mesh;
  public shadowMesh: THREE.Mesh;

  // Animation states
  private kickAnimProgress: number = 0;
  private isKicking: boolean = false;
  private kickType: 'normal' | 'power' | 'special' = 'normal';
  private headTilt: number = 0;
  private walkTime: number = 0;
  private facingSign: number = 1; // 1 facing right, -1 facing left

  constructor(config: CharacterConfig, isPlayer1: boolean) {
    this.config = config;
    this.isPlayer1 = isPlayer1;
    this.facingSign = isPlayer1 ? 1 : -1;

    this.root = new THREE.Group();
    this.root.name = `character_${config.id}_${isPlayer1 ? 'p1' : 'p2'}`;

    // 1. Shadow blob on pitch floor
    const shadowGeo = new THREE.CircleGeometry(0.85, 24);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    this.shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowMesh.rotation.x = -Math.PI / 2;
    this.shadowMesh.position.y = 0.04;
    this.root.add(this.shadowMesh);

    // 2. Team Aura Ring (shows player identity on pitch)
    const ringGeo = new THREE.RingGeometry(0.85, 1.05, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(isPlayer1 ? 0x06b6d4 : 0xef4444),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
    });
    this.auraRing = new THREE.Mesh(ringGeo, ringMat);
    this.auraRing.rotation.x = -Math.PI / 2;
    this.auraRing.position.y = 0.05;
    this.root.add(this.auraRing);

    // 3. Body & Torso
    this.bodyGroup = new THREE.Group();
    this.bodyGroup.position.y = 1.0;
    this.root.add(this.bodyGroup);

    // Torso (athletic jersey)
    const torsoGeo = new THREE.CylinderGeometry(0.48, 0.42, 0.85, 16);
    const primaryColor = new THREE.Color(config.kitColorPrimary);
    const secondaryColor = new THREE.Color(config.kitColorSecondary);

    const torsoMat = new THREE.MeshStandardMaterial({
      color: primaryColor,
      roughness: 0.4,
      metalness: 0.2,
    });
    const torsoMesh = new THREE.Mesh(torsoGeo, torsoMat);
    torsoMesh.castShadow = true;
    this.bodyGroup.add(torsoMesh);

    // Jersey stripe / chest armor plate
    const chestPlateGeo = new THREE.BoxGeometry(0.55, 0.45, 0.45);
    const chestPlateMat = new THREE.MeshStandardMaterial({
      color: secondaryColor,
      roughness: 0.3,
      metalness: 0.4,
    });
    const chestPlate = new THREE.Mesh(chestPlateGeo, chestPlateMat);
    chestPlate.position.set(0, 0.1, 0.1);
    this.bodyGroup.add(chestPlate);

    // Collar trim
    const collarGeo = new THREE.TorusGeometry(0.3, 0.06, 12, 24);
    const collarMat = new THREE.MeshStandardMaterial({ color: secondaryColor });
    const collar = new THREE.Mesh(collarGeo, collarMat);
    collar.rotation.x = Math.PI / 2;
    collar.position.y = 0.45;
    this.bodyGroup.add(collar);

    // Shorts
    const shortsGeo = new THREE.CylinderGeometry(0.45, 0.42, 0.38, 16);
    const shortsMat = new THREE.MeshStandardMaterial({
      color: secondaryColor,
      roughness: 0.6,
    });
    const shortsMesh = new THREE.Mesh(shortsGeo, shortsMat);
    shortsMesh.position.y = -0.45;
    this.bodyGroup.add(shortsMesh);

    // 4. Legs
    // Left leg (support leg)
    this.leftLegGroup = new THREE.Group();
    this.leftLegGroup.position.set(-0.25, -0.65, 0);
    this.bodyGroup.add(this.leftLegGroup);
    this.buildLeg(this.leftLegGroup, config, false);

    // Right leg (primary kicking leg)
    this.rightLegGroup = new THREE.Group();
    this.rightLegGroup.position.set(0.25, -0.65, 0);
    this.bodyGroup.add(this.rightLegGroup);
    this.buildLeg(this.rightLegGroup, config, true);

    // 5. Stylized Head & Face (oversized head soccer proportion)
    this.headGroup = new THREE.Group();
    this.headGroup.position.y = GAME_CONSTANTS.HEAD_OFFSET_Y;
    this.root.add(this.headGroup);

    // Head base sphere
    const headRadius = GAME_CONSTANTS.HEAD_RADIUS;
    const headGeo = new THREE.SphereGeometry(headRadius, 32, 24);
    // Deform slightly to give a strong jaw / cheekbone athletic stylized silhouette
    headGeo.scale(1.0, 1.15, 1.05);

    const skinMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.skinTone),
      roughness: 0.55,
      metalness: 0.05,
    });
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.castShadow = true;
    this.headGroup.add(headMesh);

    // Hair
    this.hairGroup = new THREE.Group();
    this.buildHair(this.hairGroup, config);
    this.headGroup.add(this.hairGroup);

    // Face features (Eyes, Eyebrows, Cyber Earpiece)
    this.buildFaceFeatures(this.headGroup, config);

    // Sweatband / Headband
    const bandGeo = new THREE.TorusGeometry(headRadius * 0.98, 0.07, 12, 32);
    bandGeo.scale(1.0, 1.1, 1.05);
    const bandMat = new THREE.MeshStandardMaterial({
      color: secondaryColor,
      roughness: 0.4,
    });
    const band = new THREE.Mesh(bandGeo, bandMat);
    band.rotation.x = Math.PI / 2 - 0.15;
    band.position.set(0, 0.35, 0.02);
    this.headGroup.add(band);

    // 6. Special Ability Glowing Shield / Fire Halo (activated when ready)
    const glowGeo = new THREE.SphereGeometry(1.6, 24, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(config.specialAbility.color),
      transparent: true,
      opacity: 0,
      wireframe: true,
    });
    this.specialGlowMesh = new THREE.Mesh(glowGeo, glowMat);
    this.specialGlowMesh.position.y = 1.3;
    this.root.add(this.specialGlowMesh);

    // Orient facing direction
    this.updateFacing(this.facingSign);
  }

  private buildLeg(legGroup: THREE.Group, config: CharacterConfig, isKickingLeg: boolean) {
    const skinMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.skinTone),
      roughness: 0.55,
    });

    // Thigh
    const thighGeo = new THREE.CylinderGeometry(0.14, 0.12, 0.42, 12);
    const thigh = new THREE.Mesh(thighGeo, skinMat);
    thigh.position.y = -0.21;
    thigh.castShadow = true;
    legGroup.add(thigh);

    // Sock
    const sockGeo = new THREE.CylinderGeometry(0.13, 0.12, 0.36, 12);
    const sockMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.kitColorPrimary),
      roughness: 0.4,
    });
    const sock = new THREE.Mesh(sockGeo, sockMat);
    sock.position.y = -0.48;
    sock.castShadow = true;
    legGroup.add(sock);

    // Cleat / Football boot (curved futuristic cleat with studs)
    const bootGroup = new THREE.Group();
    bootGroup.position.set(0, -0.72, 0.1);

    const bootGeo = new THREE.BoxGeometry(0.24, 0.18, 0.52);
    const bootMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(isKickingLeg ? config.kitColorSecondary : 0x1e293b),
      roughness: 0.3,
      metalness: 0.5,
    });
    const boot = new THREE.Mesh(bootGeo, bootMat);
    boot.position.z = 0.08;
    boot.castShadow = true;
    bootGroup.add(boot);

    // Glowing energy sole
    const soleGeo = new THREE.BoxGeometry(0.24, 0.04, 0.54);
    const soleMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(config.specialAbility.color),
    });
    const sole = new THREE.Mesh(soleGeo, soleMat);
    sole.position.set(0, -0.09, 0.08);
    bootGroup.add(sole);

    legGroup.add(bootGroup);
  }

  private buildHair(hairGroup: THREE.Group, config: CharacterConfig) {
    const hairColor = new THREE.Color(config.hairColor);
    const hairMat = new THREE.MeshStandardMaterial({
      color: hairColor,
      roughness: 0.85,
      metalness: 0.1,
    });

    if (config.hairStyle === 'curly_tousled') {
      // Magician style: tousled, wavy layered curls
      for (let i = 0; i < 18; i++) {
        const curlGeo = new THREE.DodecahedronGeometry(0.22 + (i % 3) * 0.04, 1);
        const curl = new THREE.Mesh(curlGeo, hairMat);
        const angle = (i / 18) * Math.PI * 2;
        const radius = 0.65;
        const height = 0.45 + (Math.sin(i * 1.5) * 0.22);
        curl.position.set(
          Math.cos(angle) * radius * 0.9,
          height,
          Math.sin(angle) * radius * 0.95 - 0.05
        );
        curl.scale.set(1.2, 0.9, 1.1);
        curl.castShadow = true;
        hairGroup.add(curl);
      }
      // Top crown curl
      const crownGeo = new THREE.DodecahedronGeometry(0.42, 1);
      const crown = new THREE.Mesh(crownGeo, hairMat);
      crown.position.set(0, 0.78, -0.05);
      crown.scale.set(1.4, 0.8, 1.3);
      hairGroup.add(crown);

    } else if (config.hairStyle === 'fade_undercut') {
      // Striker style: sharp slicked back undercut with shaved sides
      const topGeo = new THREE.BoxGeometry(0.85, 0.35, 1.2);
      const topHair = new THREE.Mesh(topGeo, hairMat);
      topHair.position.set(0, 0.75, -0.08);
      topHair.rotation.x = -0.15;
      hairGroup.add(topHair);

      // Pompadour crest
      const crestGeo = new THREE.ConeGeometry(0.38, 0.6, 6);
      const crest = new THREE.Mesh(crestGeo, hairMat);
      crest.rotation.x = Math.PI / 2 - 0.3;
      crest.position.set(0, 0.82, 0.2);
      hairGroup.add(crest);

      // Dark fade side panels
      const sideMat = new THREE.MeshStandardMaterial({
        color: hairColor.clone().multiplyScalar(0.7),
        roughness: 0.9,
      });
      [-0.68, 0.68].forEach((x) => {
        const sideGeo = new THREE.CylinderGeometry(0.25, 0.28, 0.5, 8);
        const side = new THREE.Mesh(sideGeo, sideMat);
        side.position.set(x, 0.2, -0.1);
        hairGroup.add(side);
      });

    } else if (config.hairStyle === 'spiked_fringe') {
      // Spiked aerodynamic anime/cyber style
      for (let i = 0; i < 9; i++) {
        const spikeGeo = new THREE.ConeGeometry(0.18, 0.55, 5);
        const spike = new THREE.Mesh(spikeGeo, hairMat);
        const xOffset = (i - 4) * 0.18;
        spike.position.set(xOffset, 0.7 + Math.cos(i) * 0.1, 0.15 - Math.abs(xOffset) * 0.2);
        spike.rotation.x = -0.3 + (i % 2) * 0.2;
        spike.rotation.z = -xOffset * 0.4;
        hairGroup.add(spike);
      }
    } else {
      // Buzz cut with clean cyber lines
      const buzzGeo = new THREE.SphereGeometry(GAME_CONSTANTS.HEAD_RADIUS * 1.02, 24, 16);
      buzzGeo.scale(1.0, 1.16, 1.05);
      const buzz = new THREE.Mesh(buzzGeo, hairMat);
      buzz.position.set(0, 0.05, -0.05);
      hairGroup.add(buzz);
    }
  }

  private buildFaceFeatures(headGroup: THREE.Group, config: CharacterConfig) {
    // Eyes: Stylized anime-athletic eyes with cyber pupils
    const eyeGeo = new THREE.SphereGeometry(0.12, 16, 12);
    eyeGeo.scale(1.0, 0.75, 0.5);

    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const irisMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(config.kitColorPrimary),
    });

    [-0.26, 0.26].forEach((xPos) => {
      const eyeWhite = new THREE.Mesh(eyeGeo, eyeWhiteMat);
      eyeWhite.position.set(xPos, 0.08, 0.65);
      headGroup.add(eyeWhite);

      const pupilGeo = new THREE.SphereGeometry(0.065, 12, 8);
      pupilGeo.scale(1.0, 1.0, 0.3);
      const pupil = new THREE.Mesh(pupilGeo, irisMat);
      pupil.position.set(xPos + (this.facingSign > 0 ? 0.02 : -0.02), 0.08, 0.72);
      headGroup.add(pupil);

      // Eyebrow
      const browGeo = new THREE.BoxGeometry(0.24, 0.06, 0.08);
      const browMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(config.hairColor),
      });
      const brow = new THREE.Mesh(browGeo, browMat);
      brow.position.set(xPos, 0.25, 0.68);
      brow.rotation.z = (xPos > 0 ? -0.15 : 0.15); // Determined game face
      headGroup.add(brow);
    });

    // Nose
    const noseGeo = new THREE.ConeGeometry(0.08, 0.2, 5);
    const skinTone = new THREE.Color(config.skinTone).multiplyScalar(0.92);
    const noseMat = new THREE.MeshStandardMaterial({ color: skinTone });
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.position.set(0, -0.06, 0.76);
    nose.rotation.x = -0.3;
    headGroup.add(nose);

    // Confident mouth / smirk
    const mouthGeo = new THREE.BoxGeometry(0.28, 0.05, 0.04);
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0x6e2c2c });
    const mouth = new THREE.Mesh(mouthGeo, mouthMat);
    mouth.position.set(0.02, -0.28, 0.68);
    mouth.rotation.z = 0.05; // Playful confident smile
    headGroup.add(mouth);

    // Cyber Comm / Earpiece on ear
    const earPieceGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.08, 12);
    const earPieceMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.8,
      roughness: 0.2,
    });
    const earPiece = new THREE.Mesh(earPieceGeo, earPieceMat);
    earPiece.rotation.z = Math.PI / 2;
    earPiece.position.set(0.72, 0.05, 0);
    headGroup.add(earPiece);

    // Glowing LED on ear-piece
    const ledGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const ledMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(config.specialAbility.color),
    });
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(0.78, 0.05, 0);
    headGroup.add(led);
  }

  public updateFacing(dirSign: number) {
    this.facingSign = dirSign >= 0 ? 1 : -1;
    // Rotate character towards facing direction (angle on Y)
    const targetRotY = this.facingSign > 0 ? Math.PI / 2 : -Math.PI / 2;
    this.root.rotation.y = targetRotY;
  }

  public triggerKick(type: 'normal' | 'power' | 'special' = 'normal') {
    this.isKicking = true;
    this.kickAnimProgress = 0;
    this.kickType = type;
  }

  public triggerHeaderTilt() {
    this.headTilt = 0.45;
  }

  public updateAnimation(delta: number, vx: number, vy: number, isGrounded: boolean, specialChargePct: number) {
    // 1. Kick Animation
    if (this.isKicking) {
      const kickSpeed = this.kickType === 'power' ? 5.5 : 7.0;
      this.kickAnimProgress += delta * kickSpeed;

      if (this.kickAnimProgress < 0.3) {
        // Backswing
        const t = this.kickAnimProgress / 0.3;
        this.rightLegGroup.rotation.x = -0.7 * t;
      } else if (this.kickAnimProgress < 0.7) {
        // Snap Kick Forward
        const t = (this.kickAnimProgress - 0.3) / 0.4;
        this.rightLegGroup.rotation.x = -0.7 + 2.2 * t;
      } else if (this.kickAnimProgress < 1.0) {
        // Recovery
        const t = (this.kickAnimProgress - 0.7) / 0.3;
        this.rightLegGroup.rotation.x = 1.5 * (1 - t);
      } else {
        this.isKicking = false;
        this.kickAnimProgress = 0;
        this.rightLegGroup.rotation.x = 0;
      }
    } else {
      // Running / Idle Leg animation
      if (Math.abs(vx) > 0.5 && isGrounded) {
        this.walkTime += delta * 12;
        const swing = Math.sin(this.walkTime) * 0.4;
        this.leftLegGroup.rotation.x = swing;
        this.rightLegGroup.rotation.x = -swing;
        this.bodyGroup.position.y = 1.0 + Math.abs(Math.sin(this.walkTime * 2)) * 0.08;
      } else {
        this.leftLegGroup.rotation.x = 0;
        this.rightLegGroup.rotation.x = 0;
        // Breathing idle bob
        this.walkTime += delta * 3;
        this.bodyGroup.position.y = 1.0 + Math.sin(this.walkTime) * 0.03;
      }
    }

    // 2. Jump pose
    if (!isGrounded) {
      // Tuck legs slightly in mid-air
      this.leftLegGroup.rotation.x = 0.35;
      if (!this.isKicking) {
        this.rightLegGroup.rotation.x = -0.25;
      }
    }

    // 3. Header snap decay
    if (this.headTilt > 0) {
      this.headGroup.rotation.x = this.headTilt;
      this.headTilt -= delta * 3.5;
      if (this.headTilt < 0) this.headTilt = 0;
    } else {
      this.headGroup.rotation.x = 0;
    }

    // 4. Special Ability Aura Pulse
    if (specialChargePct >= 1.0) {
      const pulse = 0.4 + Math.sin(Date.now() * 0.008) * 0.3;
      (this.specialGlowMesh.material as THREE.MeshBasicMaterial).opacity = pulse;
      this.specialGlowMesh.rotation.y += delta * 2;
    } else {
      (this.specialGlowMesh.material as THREE.MeshBasicMaterial).opacity = 0;
    }
  }
}
