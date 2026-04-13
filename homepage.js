/* ═══════════════════════════════════════════════════════════════════
   TrustWatch AI — Homepage JavaScript (Extension Size + Light Theme)
   Three.js 3D Scenes + Scroll Animations
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

const state = {
  mouse: { nx: 0, ny: 0 },
  countersAnimated: false,
};

// ══════════════════════════════════════════════════════════════════
// 1. HERO — 3D SHIELD + PARTICLES (Light Theme)
// ══════════════════════════════════════════════════════════════════
function initHeroScene() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;

  const width = 400;
  const height = 280;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0); // transparent

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100);
  camera.position.z = 5;

  // ── Shield Icosphere ──
  const shieldGeo = new THREE.IcosahedronGeometry(1.3, 1);
  const shieldMat = new THREE.MeshBasicMaterial({
    color: 0x0ea5e9,
    wireframe: true,
    transparent: true,
    opacity: 0.35,
  });
  const shield = new THREE.Mesh(shieldGeo, shieldMat);
  scene.add(shield);

  // Inner sphere
  const innerGeo = new THREE.IcosahedronGeometry(1.0, 2);
  const innerMat = new THREE.MeshBasicMaterial({
    color: 0x8b5cf6,
    wireframe: true,
    transparent: true,
    opacity: 0.12,
  });
  const innerSphere = new THREE.Mesh(innerGeo, innerMat);
  scene.add(innerSphere);

  // Core glow
  const coreGeo = new THREE.SphereGeometry(0.25, 24, 24);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0x0ea5e9,
    transparent: true,
    opacity: 0.2,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  scene.add(core);

  // ── Particles ──
  const particleCount = 600;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  const c1 = new THREE.Color(0x0ea5e9);
  const c2 = new THREE.Color(0x8b5cf6);
  const c3 = new THREE.Color(0x3b82f6);

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    const r = 2.5 + Math.random() * 6;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = r * Math.cos(phi);

    const c = [c1, c2, c3][Math.floor(Math.random() * 3)];
    colors[i3] = c.r;
    colors[i3 + 1] = c.g;
    colors[i3 + 2] = c.b;
  }

  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const pMat = new THREE.PointsMaterial({
    size: 0.03,
    vertexColors: true,
    transparent: true,
    opacity: 0.5,
    sizeAttenuation: true,
  });
  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  // ── Orbital Rings ──
  const ringColors = [0x0ea5e9, 0x8b5cf6, 0x3b82f6];
  const rings = [];
  for (let i = 0; i < 3; i++) {
    const rGeo = new THREE.TorusGeometry(1.8 + i * 0.5, 0.006, 8, 80);
    const rMat = new THREE.MeshBasicMaterial({
      color: ringColors[i],
      transparent: true,
      opacity: 0.2,
    });
    const ring = new THREE.Mesh(rGeo, rMat);
    ring.rotation.x = Math.PI / 3 + i * 0.35;
    ring.rotation.y = i * 0.5;
    scene.add(ring);
    rings.push(ring);
  }

  // ── Animate ──
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    shield.rotation.x = t * 0.15 + state.mouse.ny * 0.2;
    shield.rotation.y = t * 0.2 + state.mouse.nx * 0.2;

    innerSphere.rotation.x = -t * 0.1;
    innerSphere.rotation.y = -t * 0.15;

    const pulse = 1 + Math.sin(t * 2) * 0.12;
    core.scale.set(pulse, pulse, pulse);
    coreMat.opacity = 0.15 + Math.sin(t * 3) * 0.1;

    particles.rotation.y = t * 0.025;
    particles.rotation.x = t * 0.008;

    rings.forEach((ring, i) => {
      ring.rotation.z = t * (0.06 + i * 0.025);
    });

    shieldMat.opacity = 0.3 + Math.sin(t * 1.5) * 0.08;

    renderer.render(scene, camera);
  }

  animate();
}

// ══════════════════════════════════════════════════════════════════
// 2. NEURAL NETWORK (AI Section — Light Theme)
// ══════════════════════════════════════════════════════════════════
function initNeuralScene() {
  const canvas = document.getElementById('neuralCanvas');
  if (!canvas) return;

  const width = canvas.clientWidth || 368;
  const height = 180;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.z = 9;

  // ── Nodes ──
  const layers = [
    { count: 3, x: -4, color: 0x0ea5e9 },
    { count: 5, x: -1.3, color: 0x3b82f6 },
    { count: 5, x: 1.3, color: 0x8b5cf6 },
    { count: 2, x: 4, color: 0x10b981 },
  ];

  const nodes = [];
  const nodeGroup = new THREE.Group();

  layers.forEach(layer => {
    const layerNodes = [];
    const spacing = 1;
    const startY = -(layer.count - 1) * spacing / 2;

    for (let i = 0; i < layer.count; i++) {
      const geo = new THREE.SphereGeometry(0.12, 12, 12);
      const mat = new THREE.MeshBasicMaterial({ color: layer.color, transparent: true, opacity: 0.8 });
      const node = new THREE.Mesh(geo, mat);
      node.position.set(layer.x, startY + i * spacing, 0);
      nodeGroup.add(node);
      layerNodes.push(node);

      // Glow
      const gGeo = new THREE.SphereGeometry(0.2, 12, 12);
      const gMat = new THREE.MeshBasicMaterial({ color: layer.color, transparent: true, opacity: 0.12 });
      const glow = new THREE.Mesh(gGeo, gMat);
      glow.position.copy(node.position);
      nodeGroup.add(glow);
    }
    nodes.push(layerNodes);
  });

  scene.add(nodeGroup);

  // ── Connections ──
  const connGroup = new THREE.Group();
  for (let l = 0; l < nodes.length - 1; l++) {
    nodes[l].forEach(fromNode => {
      nodes[l + 1].forEach(toNode => {
        const pts = [fromNode.position.clone(), toNode.position.clone()];
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const mat = new THREE.LineBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.1 });
        connGroup.add(new THREE.Line(geo, mat));
      });
    });
  }
  scene.add(connGroup);

  // ── Data Packets ──
  const packets = [];
  const pktGeo = new THREE.SphereGeometry(0.05, 6, 6);

  function spawnPacket() {
    const li = Math.floor(Math.random() * (nodes.length - 1));
    const from = nodes[li][Math.floor(Math.random() * nodes[li].length)];
    const to = nodes[li + 1][Math.floor(Math.random() * nodes[li + 1].length)];
    const colors = [0x0ea5e9, 0x8b5cf6, 0x3b82f6, 0x10b981];
    const mat = new THREE.MeshBasicMaterial({ color: colors[Math.floor(Math.random() * 4)], transparent: true, opacity: 0.9 });
    const pkt = new THREE.Mesh(pktGeo, mat);
    pkt.position.copy(from.position);
    scene.add(pkt);
    packets.push({ mesh: pkt, from: from.position.clone(), to: to.position.clone(), progress: 0, speed: 0.01 + Math.random() * 0.015 });
  }

  // ── Animate ──
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    if (Math.random() < 0.06 && packets.length < 15) spawnPacket();

    for (let i = packets.length - 1; i >= 0; i--) {
      const p = packets[i];
      p.progress += p.speed;
      if (p.progress >= 1) {
        scene.remove(p.mesh);
        packets.splice(i, 1);
        continue;
      }
      p.mesh.position.lerpVectors(p.from, p.to, p.progress);
      p.mesh.material.opacity = 1 - Math.abs(p.progress - 0.5) * 1.6;
    }

    nodes.forEach((layer, li) => {
      layer.forEach((node, ni) => {
        const s = 1 + Math.sin(t * 2 + li + ni * 0.5) * 0.15;
        node.scale.set(s, s, s);
      });
    });

    nodeGroup.rotation.y = Math.sin(t * 0.3) * 0.06;
    connGroup.rotation.y = Math.sin(t * 0.3) * 0.06;

    renderer.render(scene, camera);
  }

  animate();
}

// ══════════════════════════════════════════════════════════════════
// 3. SCROLL REVEAL
// ══════════════════════════════════════════════════════════════════
function initScrollReveal() {
  const els = document.querySelectorAll('.reveal');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const siblings = entry.target.parentElement.querySelectorAll('.reveal');
        let delay = 0;
        siblings.forEach((sib, i) => {
          if (sib === entry.target) delay = i * 80;
        });
        setTimeout(() => entry.target.classList.add('visible'), delay);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  els.forEach(el => observer.observe(el));
}

// ══════════════════════════════════════════════════════════════════
// 4. ANIMATED COUNTERS
// ══════════════════════════════════════════════════════════════════
function initCounters() {
  const counters = document.querySelectorAll('.counter');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !state.countersAnimated) {
        state.countersAnimated = true;
        counters.forEach(counter => {
          const target = parseInt(counter.dataset.target);
          const duration = 1500;
          const start = performance.now();

          function update(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            counter.textContent = Math.floor(eased * target);
            if (progress < 1) requestAnimationFrame(update);
            else counter.textContent = target;
          }
          requestAnimationFrame(update);
        });
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  const sec = document.getElementById('stats');
  if (sec) observer.observe(sec);
}

// ══════════════════════════════════════════════════════════════════
// 5. MOUSE TRACKING
// ══════════════════════════════════════════════════════════════════
function initMouseTracking() {
  document.addEventListener('mousemove', (e) => {
    state.mouse.nx = (e.clientX / 400) * 2 - 1;
    state.mouse.ny = -(e.clientY / 280) * 2 + 1;
  });
}

// ══════════════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  initHeroScene();
  initNeuralScene();
  initScrollReveal();
  initCounters();
  initMouseTracking();
  console.log('[TrustWatch AI] Homepage loaded.');
});
