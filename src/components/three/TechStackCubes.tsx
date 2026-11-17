import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

interface TechCubeSpec {
  name: string;
  subtitle: string;
  primary: string;
  accent: string;
}

const TECH_CUBES: TechCubeSpec[] = [
  { name: 'Java 17', subtitle: 'Business Logic', primary: '#ea580c', accent: '#fb923c' },
  { name: 'Spring Boot', subtitle: 'REST & Security', primary: '#16a34a', accent: '#4ade80' },
  { name: 'MySQL 8', subtitle: 'Normalized RDBMS', primary: '#0284c7', accent: '#38bdf8' },
  { name: 'Three.js', subtitle: 'WebGL 3D Engine', primary: '#7c3aed', accent: '#c084fc' },
];

function makeCubeFaceTexture(spec: TechCubeSpec, maxAniso: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, '#0b1128');
  grad.addColorStop(1, '#111c3d');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = spec.accent;
  ctx.lineWidth = 10;
  ctx.strokeRect(24, 24, 464, 464);

  ctx.fillStyle = spec.primary;
  ctx.fillRect(48, 48, 416, 16);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 58px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(spec.name, 256, 248);

  ctx.fillStyle = spec.accent;
  ctx.font = '600 28px monospace';
  ctx.fillText(spec.subtitle, 256, 314);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

export const TechStackCubes: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const hoveredIdxRef = useRef<number | null>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let renderer: THREE.WebGLRenderer;
    try {
      const glProbe = document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl');
      if (!glProbe) {
        setFallback(true);
        return;
      }
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setFallback(true);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 50);
    camera.position.set(0, 0.2, 8.2);

    const key = new THREE.DirectionalLight(0xffffff, 2.0);
    key.position.set(4, 5, 6);
    scene.add(key);
    scene.add(new THREE.HemisphereLight(0x38bdf8, 0x1e1b4b, 0.8));

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const disposables: { dispose: () => void }[] = [env];
    const cubes: THREE.Group[] = [];

    TECH_CUBES.forEach((spec, i) => {
      const grp = new THREE.Group();
      const tex = makeCubeFaceTexture(spec, maxAniso);
      disposables.push(tex);
      const faceMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.28, metalness: 0.35 });
      const bevelMat = new THREE.MeshStandardMaterial({ color: spec.accent, roughness: 0.2, metalness: 0.85 });
      disposables.push(faceMat, bevelMat);

      const boxGeo = new THREE.BoxGeometry(1.35, 1.35, 1.35);
      const frameGeo = new THREE.BoxGeometry(1.42, 1.42, 1.42);
      disposables.push(boxGeo, frameGeo);

      const core = new THREE.Mesh(boxGeo, faceMat);
      const wireframe = new THREE.Mesh(frameGeo, new THREE.MeshBasicMaterial({ color: spec.accent, wireframe: true, transparent: true, opacity: 0.35 }));
      disposables.push(wireframe.material);

      grp.add(core, wireframe);
      const spacing = container.clientWidth < 640 ? 1.55 : 2.35;
      grp.position.set((i - 1.5) * spacing, 0, 0);
      grp.rotation.set(0.3 + i * 0.2, 0.5 + i * 0.4, 0);
      scene.add(grp);
      cubes.push(grp);
    });

    let isVisible = true;
    const obs = new IntersectionObserver((entries) => {
      isVisible = entries[0]?.isIntersecting ?? true;
    }, { threshold: 0.1 });
    obs.observe(container);

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

    const clock = new THREE.Clock();
    let frameId = 0;

    const animate = () => {
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();
      if (isVisible) {
        const scale = prefersReducedMotion ? 0 : 1;
        cubes.forEach((cube, idx) => {
          const boost = hoveredIdxRef.current === idx ? 2.6 : 1;
          cube.rotation.y += delta * 0.55 * boost * scale;
          cube.rotation.x += delta * 0.3 * boost * scale;
          cube.position.y = Math.sin(elapsed * 1.4 + idx) * 0.12 * scale;
        });
        renderer.render(scene, camera);
      }
      frameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      obs.disconnect();
      window.removeEventListener('resize', onResize);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  if (fallback) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {TECH_CUBES.map((t) => (
          <div key={t.name} className="glass-panel rounded-2xl p-6 text-center">
            <div className="font-display font-bold text-lg text-slate-900 dark:text-white">{t.name}</div>
            <div className="text-xs font-mono text-cyan-600 dark:text-cyan-400 mt-1">{t.subtitle}</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={mountRef} className="w-full h-56 sm:h-64" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
        {TECH_CUBES.map((t, idx) => (
          <button
            key={t.name}
            type="button"
            onMouseEnter={() => { hoveredIdxRef.current = idx; }}
            onMouseLeave={() => { hoveredIdxRef.current = null; }}
            onFocus={() => { hoveredIdxRef.current = idx; }}
            onBlur={() => { hoveredIdxRef.current = null; }}
            className="glass-panel rounded-xl px-4 py-3 text-left transition-colors hover:border-cyan-400/50 cursor-pointer"
          >
            <div className="font-display font-bold text-sm text-slate-900 dark:text-white">{t.name}</div>
            <div className="text-xs font-mono text-slate-500 dark:text-slate-400">{t.subtitle}</div>
          </button>
        ))}
      </div>
    </div>
  );
};
