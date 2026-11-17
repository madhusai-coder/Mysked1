import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { BookOpen, CalendarCheck2, Clock, GraduationCap, Laptop, ListChecks } from 'lucide-react';

interface HeroAcademicSceneProps {
  scrollProgressRef: React.MutableRefObject<number>;
  theme: 'dark' | 'light';
}

function detectSoftwareGl(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function hasWebGlSupport(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

function makeLaptopScreenTexture(maxAniso: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 320;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#071024';
  ctx.fillRect(0, 0, 512, 320);

  // Header bar
  ctx.fillStyle = '#0f1b38';
  ctx.fillRect(0, 0, 512, 42);
  ctx.fillStyle = '#22d3ee';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('MySked Planner', 20, 27);

  // Study blocks
  const blocks = [
    { x: 24, y: 64, w: 140, h: 74, color: '#22d3ee', title: 'CS301 Trees' },
    { x: 184, y: 64, w: 140, h: 74, color: '#a855f7', title: 'DBMS Indexing' },
    { x: 344, y: 64, w: 144, h: 74, color: '#3b82f6', title: 'OS Paging' },
  ];
  blocks.forEach((b) => {
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, 6, b.h);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '600 14px sans-serif';
    ctx.fillText(b.title, b.x + 14, b.y + 32);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px monospace';
    ctx.fillText('09:00 - 10:30', b.x + 14, b.y + 54);
  });

  // Mini chart bars
  const heights = [45, 72, 60, 95, 84, 110, 90];
  heights.forEach((h, i) => {
    const grad = ctx.createLinearGradient(0, 280 - h, 0, 280);
    grad.addColorStop(0, '#22d3ee');
    grad.addColorStop(1, '#6366f1');
    ctx.fillStyle = grad;
    ctx.fillRect(34 + i * 66, 280 - h, 36, h);
  });

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

function makeClockDialTexture(maxAniso: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#0a1128';
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(256, 256, 224, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 12; i++) {
    const ang = (i / 12) * Math.PI * 2;
    const r1 = i % 3 === 0 ? 175 : 190;
    const r2 = 210;
    ctx.strokeStyle = i % 3 === 0 ? '#22d3ee' : '#64748b';
    ctx.lineWidth = i % 3 === 0 ? 6 : 3;
    ctx.beginPath();
    ctx.moveTo(256 + Math.cos(ang) * r1, 256 + Math.sin(ang) * r1);
    ctx.lineTo(256 + Math.cos(ang) * r2, 256 + Math.sin(ang) * r2);
    ctx.stroke();
  }

  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 28px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('25:00', 256, 338);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

function makeCalendarTexture(maxAniso: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 512, 512);

  ctx.fillStyle = '#4f46e5';
  ctx.fillRect(0, 0, 512, 128);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 42px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('STUDY WEEK', 256, 82);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 148px sans-serif';
  ctx.fillText('18', 256, 300);

  ctx.fillStyle = '#0284c7';
  ctx.font = '600 28px monospace';
  ctx.fillText('4 SESSIONS · 2 EXAMS', 256, 420);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

export const HeroAcademicScene: React.FC<HeroAcademicSceneProps> = ({ scrollProgressRef, theme }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglReady, setWebglReady] = useState<boolean>(() => hasWebGlSupport());
  const themeRef = useRef(theme);
  themeRef.current = theme;

  useEffect(() => {
    const container = mountRef.current;
    if (!container || !webglReady) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;
    const isSoftwareGl = detectSoftwareGl();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl && !isMobile,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglReady(false);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(themeRef.current === 'dark' ? 0x050816 : 0xf1f5f9, 0.032);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(46, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0.4, isMobile ? 13.5 : 10.2);

    // Three-point studio lighting + neon accents
    const hemi = new THREE.HemisphereLight(0x60a5fa, 0x1e1b4b, 0.9);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 2.2);
    keyLight.position.set(6, 8, 7);
    scene.add(keyLight);

    const rimCyan = new THREE.PointLight(0x22d3ee, 14, 24, 1.5);
    rimCyan.position.set(-5.5, 3.2, -2);
    scene.add(rimCyan);

    const rimPurple = new THREE.PointLight(0xa855f7, 14, 24, 1.5);
    rimPurple.position.set(5.5, -2.2, -2.5);
    scene.add(rimPurple);

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const disposables: { dispose: () => void }[] = [envTex];
    const track = <T extends { dispose: () => void }>(item: T): T => {
      disposables.push(item);
      return item;
    };

    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // Shared calibrated PBR materials
    const metalMat = track(new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.88, roughness: 0.2 }));
    const darkMetalMat = track(new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.28 }));
    const goldMat = track(new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.92, roughness: 0.18 }));
    const paperMat = track(new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.0, roughness: 0.85 }));
    const cyanGlowMat = track(new THREE.MeshStandardMaterial({
      color: 0x22d3ee,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.85,
      roughness: 0.25,
      metalness: 0.2,
    }));
    const purpleGlowMat = track(new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0x9333ea,
      emissiveIntensity: 0.75,
      roughness: 0.25,
      metalness: 0.2,
    }));

    // 1. Composite Hardcover Book Stack (5 parts)
    const booksGroup = new THREE.Group();
    const bookColors = [0x3b82f6, 0x7c3aed, 0x0891b2];
    bookColors.forEach((col, i) => {
      const coverMat = track(new THREE.MeshStandardMaterial({ color: col, roughness: 0.55, metalness: 0.12 }));
      const w = 1.65 - i * 0.14;
      const d = 1.2 - i * 0.08;
      const h = 0.26;
      const cover = new THREE.Mesh(track(new THREE.BoxGeometry(w, h, d)), coverMat);
      cover.position.set(i * 0.06, i * 0.28, 0);
      cover.rotation.y = (i - 1) * 0.16;
      const pages = new THREE.Mesh(track(new THREE.BoxGeometry(w - 0.12, h - 0.06, d - 0.1)), paperMat);
      pages.position.set(0.03, 0, 0);
      cover.add(pages);
      const spineBand = new THREE.Mesh(track(new THREE.BoxGeometry(0.1, h + 0.01, d + 0.01)), goldMat);
      spineBand.position.set(-w / 2 + 0.18, 0, 0);
      cover.add(spineBand);
      booksGroup.add(cover);
    });
    booksGroup.position.set(-3.4, -1.0, -0.5);
    booksGroup.rotation.set(0.25, 0.4, -0.1);
    masterGroup.add(booksGroup);

    // 2. Composite Student Laptop (6 parts)
    const laptopGroup = new THREE.Group();
    const baseDeck = new THREE.Mesh(track(new THREE.BoxGeometry(2.2, 0.09, 1.45)), darkMetalMat);
    const keyboardInset = new THREE.Mesh(track(new THREE.BoxGeometry(1.8, 0.02, 0.72)), track(new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 })));
    keyboardInset.position.set(0, 0.05, -0.18);
    const trackpad = new THREE.Mesh(track(new THREE.BoxGeometry(0.65, 0.02, 0.36)), metalMat);
    trackpad.position.set(0, 0.05, 0.42);
    const screenPivot = new THREE.Group();
    screenPivot.position.set(0, 0.04, -0.7);
    screenPivot.rotation.x = -0.32;
    const lid = new THREE.Mesh(track(new THREE.BoxGeometry(2.2, 1.38, 0.07)), darkMetalMat);
    lid.position.set(0, 0.69, 0);
    const screenTex = track(makeLaptopScreenTexture(maxAniso));
    const screenMat = track(new THREE.MeshStandardMaterial({ map: screenTex, emissiveMap: screenTex, emissive: 0xffffff, emissiveIntensity: 0.6, roughness: 0.15 }));
    const display = new THREE.Mesh(track(new THREE.PlaneGeometry(2.04, 1.24)), screenMat);
    display.position.set(0, 0.69, 0.04);
    screenPivot.add(lid, display);
    laptopGroup.add(baseDeck, keyboardInset, trackpad, screenPivot);
    laptopGroup.position.set(0.4, -0.15, 0.6);
    laptopGroup.rotation.set(0.18, -0.36, 0.05);
    masterGroup.add(laptopGroup);

    // 3. Composite Analog Study Clock (6 parts)
    const clockGroup = new THREE.Group();
    const clockRim = new THREE.Mesh(track(new THREE.TorusGeometry(0.82, 0.09, 18, 48)), metalMat);
    const clockBacking = new THREE.Mesh(track(new THREE.CylinderGeometry(0.8, 0.8, 0.16, 36)), darkMetalMat);
    clockBacking.rotation.x = Math.PI / 2;
    clockBacking.position.z = -0.04;
    const dialTex = track(makeClockDialTexture(maxAniso));
    const dialFace = new THREE.Mesh(track(new THREE.CircleGeometry(0.75, 36)), track(new THREE.MeshStandardMaterial({ map: dialTex, roughness: 0.3 })));
    dialFace.position.z = 0.05;
    const minuteHand = new THREE.Mesh(track(new THREE.BoxGeometry(0.05, 0.52, 0.03)), cyanGlowMat);
    minuteHand.position.set(0, 0.2, 0.08);
    const hourHand = new THREE.Mesh(track(new THREE.BoxGeometry(0.06, 0.34, 0.03)), purpleGlowMat);
    hourHand.position.set(0.14, 0.05, 0.09);
    hourHand.rotation.z = -Math.PI / 3;
    clockGroup.add(clockRim, clockBacking, dialFace, minuteHand, hourHand);
    clockGroup.position.set(3.4, 1.45, -0.4);
    clockGroup.rotation.set(0.1, -0.4, 0.06);
    masterGroup.add(clockGroup);

    // 4. Composite Desk Calendar (5 parts)
    const calendarGroup = new THREE.Group();
    const calStand = new THREE.Mesh(track(new THREE.BoxGeometry(1.35, 1.45, 0.12)), darkMetalMat);
    const calTex = track(makeCalendarTexture(maxAniso));
    const calPage = new THREE.Mesh(track(new THREE.PlaneGeometry(1.22, 1.28)), track(new THREE.MeshStandardMaterial({ map: calTex, roughness: 0.45 })));
    calPage.position.z = 0.07;
    for (let i = -2; i <= 2; i++) {
      const ring = new THREE.Mesh(track(new THREE.TorusGeometry(0.07, 0.018, 10, 20)), metalMat);
      ring.position.set(i * 0.22, 0.72, 0.04);
      ring.rotation.y = Math.PI / 2;
      calendarGroup.add(ring);
    }
    calendarGroup.add(calStand, calPage);
    calendarGroup.position.set(-2.9, 1.55, -0.8);
    calendarGroup.rotation.set(-0.1, 0.45, -0.08);
    masterGroup.add(calendarGroup);

    // 5. Composite Floating Checklist Board (6 parts)
    const checklistGroup = new THREE.Group();
    const board = new THREE.Mesh(track(new THREE.BoxGeometry(1.3, 1.7, 0.08)), track(new THREE.MeshPhysicalMaterial({ color: 0x0f172a, roughness: 0.25, metalness: 0.2, clearcoat: 0.8 })));
    const clip = new THREE.Mesh(track(new THREE.BoxGeometry(0.46, 0.16, 0.14)), metalMat);
    clip.position.set(0, 0.84, 0.03);
    checklistGroup.add(board, clip);
    for (let r = 0; r < 4; r++) {
      const y = 0.42 - r * 0.34;
      const checkBox = new THREE.Mesh(track(new THREE.BoxGeometry(0.16, 0.16, 0.04)), r < 3 ? cyanGlowMat : purpleGlowMat);
      checkBox.position.set(-0.36, y, 0.05);
      const lineBar = new THREE.Mesh(track(new THREE.BoxGeometry(0.64, 0.08, 0.04)), paperMat);
      lineBar.position.set(0.14, y, 0.05);
      checklistGroup.add(checkBox, lineBar);
    }
    checklistGroup.position.set(3.2, -1.3, 0.1);
    checklistGroup.rotation.set(-0.12, -0.42, 0.08);
    masterGroup.add(checklistGroup);

    // 6. Composite Graduation Cap (5 parts)
    const capGroup = new THREE.Group();
    const skullCap = new THREE.Mesh(track(new THREE.CylinderGeometry(0.55, 0.62, 0.38, 24)), darkMetalMat);
    skullCap.position.y = -0.15;
    const mortarboard = new THREE.Mesh(track(new THREE.BoxGeometry(1.55, 0.06, 1.55)), track(new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.45, metalness: 0.2 })));
    mortarboard.rotation.y = Math.PI / 4;
    const topButton = new THREE.Mesh(track(new THREE.CylinderGeometry(0.08, 0.08, 0.05, 16)), goldMat);
    topButton.position.y = 0.05;
    const tasselArm = new THREE.Mesh(track(new THREE.CylinderGeometry(0.015, 0.015, 0.72, 8)), goldMat);
    tasselArm.rotation.z = Math.PI / 2;
    tasselArm.position.set(0.36, 0.05, 0);
    const tasselDrop = new THREE.Mesh(track(new THREE.ConeGeometry(0.07, 0.32, 12)), goldMat);
    tasselDrop.position.set(0.72, -0.14, 0);
    capGroup.add(skullCap, mortarboard, topButton, tasselArm, tasselDrop);
    capGroup.position.set(0.1, 2.25, -1.1);
    capGroup.rotation.set(0.28, 0.35, -0.12);
    masterGroup.add(capGroup);

    // Subtle Particle Field
    const particleCount = isMobile ? 160 : 320;
    const pPositions = new Float32Array(particleCount * 3);
    const pColors = new Float32Array(particleCount * 3);
    const c1 = new THREE.Color(0x22d3ee);
    const c2 = new THREE.Color(0xa855f7);
    const c3 = new THREE.Color(0x3b82f6);
    for (let i = 0; i < particleCount; i++) {
      pPositions[i * 3] = (Math.random() - 0.5) * 20;
      pPositions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      pPositions[i * 3 + 2] = (Math.random() - 0.5) * 12 - 2;
      const picked = i % 3 === 0 ? c1 : i % 3 === 1 ? c2 : c3;
      pColors[i * 3] = picked.r;
      pColors[i * 3 + 1] = picked.g;
      pColors[i * 3 + 2] = picked.b;
    }
    const pGeo = track(new THREE.BufferGeometry());
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));
    const pMat = track(new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
    }));
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const basePositions = [
      booksGroup.position.clone(),
      laptopGroup.position.clone(),
      clockGroup.position.clone(),
      calendarGroup.position.clone(),
      checklistGroup.position.clone(),
      capGroup.position.clone(),
    ];
    const items = [booksGroup, laptopGroup, clockGroup, calendarGroup, checklistGroup, capGroup];

    let pointerX = 0;
    let pointerY = 0;
    let smoothX = 0;
    let smoothY = 0;
    let smoothScroll = 0;
    let isVisible = true;
    let contextLost = false;
    let frameId = 0;

    const onPointerMove = (e: PointerEvent) => {
      pointerX = (e.clientX / window.innerWidth - 0.5) * 2;
      pointerY = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0.05 },
    );
    observer.observe(container);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      contextLost = true;
    };
    const onContextRestored = () => {
      contextLost = false;
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    const clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const tick = () => {
      if (contextLost) {
        frameId = requestAnimationFrame(tick);
        return;
      }

      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();

      if (isVisible) {
        const bgHex = themeRef.current === 'dark' ? 0x050816 : 0xf1f5f9;
        if (scene.fog instanceof THREE.FogExp2) {
          scene.fog.color.setHex(bgHex);
        }

        const motionScale = prefersReducedMotion ? 0 : 1;
        smoothX = THREE.MathUtils.damp(smoothX, pointerX * motionScale, 4, delta);
        smoothY = THREE.MathUtils.damp(smoothY, pointerY * motionScale, 4, delta);
        smoothScroll = THREE.MathUtils.damp(smoothScroll, scrollProgressRef.current, 5, delta);

        // Scroll-driven 3D camera sweep & parallax
        const baseZ = isMobile ? 13.5 : 10.2;
        camera.position.x = smoothX * 0.85 + Math.sin(smoothScroll * Math.PI) * 1.6;
        camera.position.y = 0.4 + smoothY * 0.55 - smoothScroll * 1.4;
        camera.position.z = baseZ - smoothScroll * 2.2;
        camera.lookAt(smoothX * 0.2, -smoothScroll * 0.6, 0);

        masterGroup.rotation.y = smoothX * 0.14 + smoothScroll * 0.55;
        masterGroup.rotation.x = -smoothY * 0.08;

        items.forEach((grp, idx) => {
          const base = basePositions[idx];
          const phase = idx * 1.15;
          grp.position.y = base.y + Math.sin(elapsed * 0.85 + phase) * 0.16 * motionScale;
          grp.rotation.y += delta * (0.14 + idx * 0.025) * motionScale;
        });

        minuteHand.rotation.z = -elapsed * 0.6 * motionScale;
        particles.rotation.y = elapsed * 0.025 * motionScale;

        renderer.render(scene, camera);
      }

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      observer.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [webglReady, scrollProgressRef]);

  if (!webglReady) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-8">
        <div className="grid grid-cols-3 gap-4 opacity-40 max-w-lg">
          {[BookOpen, Laptop, Clock, CalendarCheck2, ListChecks, GraduationCap].map((Icon, i) => (
            <div key={i} className="glass-panel rounded-2xl p-6 flex items-center justify-center">
              <Icon className="w-10 h-10 text-cyan-400" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return <div ref={mountRef} className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true" />;
};
