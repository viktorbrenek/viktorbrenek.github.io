import * as THREE from "./three.module.js";

const canvas = document.querySelector("canvas.webgl");
if (!canvas) {
  // Page has no background canvas, so skip all WebGL work.
  console.warn("Canvas .webgl not found, skipping background renderer.");
}
if (!canvas) {
  // No-op on pages without the canvas.
} else {
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isSmallViewport = window.innerWidth < 768;
const objectCount = prefersReducedMotion ? 8 : (isSmallViewport ? 12 : 20);
const bounds = 5;

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
};

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.set(5, 5, 5);
camera.lookAt(scene.position);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isSmallViewport });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

const baseColor = new THREE.Color("#ECAC08");
const spheres = [];

for (let i = 0; i < objectCount; i += 1) {
  const radius = Math.random() * 0.45 + 0.12;
  const geometry = new THREE.SphereGeometry(radius, 12, 10);
  const material = new THREE.MeshBasicMaterial({
    wireframe: true,
    color: baseColor.clone().offsetHSL(
      (Math.random() - 0.5) * 0.1,
      (Math.random() - 0.5) * 0.1,
      (Math.random() - 0.5) * 0.1
    )
  });

  const sphere = new THREE.Mesh(geometry, material);
  sphere.position.set(
    Math.random() * bounds * 2 - bounds,
    Math.random() * bounds * 2 - bounds,
    Math.random() * bounds * 2 - bounds
  );
  sphere.userData.radius = radius;
  sphere.userData.velocity = new THREE.Vector3(
    (Math.random() - 0.5) * 0.02,
    (Math.random() - 0.5) * 0.02,
    (Math.random() - 0.5) * 0.02
  );
  sphere.userData.rotationVelocity = new THREE.Vector3(
    Math.random() * 0.01,
    Math.random() * 0.01,
    Math.random() * 0.01
  );

  spheres.push(sphere);
  scene.add(sphere);
}

const onResize = () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
};

window.addEventListener("resize", onResize, { passive: true });

const clock = new THREE.Clock();
let rafId = null;
let lastCollisionCheck = 0;

function resolveCollisions() {
  for (let i = 0; i < spheres.length; i += 1) {
    for (let j = i + 1; j < spheres.length; j += 1) {
      const a = spheres[i];
      const b = spheres[j];
      const minDistance = a.userData.radius + b.userData.radius;
      const delta = a.position.clone().sub(b.position);
      const distance = delta.length();

      if (distance === 0 || distance >= minDistance) {
        continue;
      }

      const normal = delta.normalize();
      const overlap = (minDistance - distance) * 0.5;
      a.position.addScaledVector(normal, overlap);
      b.position.addScaledVector(normal, -overlap);

      const aVel = a.userData.velocity;
      const bVel = b.userData.velocity;
      const aNormalSpeed = aVel.dot(normal);
      const bNormalSpeed = bVel.dot(normal);
      const impulse = aNormalSpeed - bNormalSpeed;

      aVel.addScaledVector(normal, -impulse);
      bVel.addScaledVector(normal, impulse);
    }
  }
}

function animate() {
  const delta = Math.min(clock.getDelta(), 0.033);
  const elapsed = clock.getElapsedTime();

  if (elapsed - lastCollisionCheck > 0.08) {
    resolveCollisions();
    lastCollisionCheck = elapsed;
  }

  for (let i = 0; i < spheres.length; i += 1) {
    const sphere = spheres[i];
    const velocity = sphere.userData.velocity;
    sphere.position.addScaledVector(velocity, delta * 60);

    if (sphere.position.x < -bounds || sphere.position.x > bounds) {
      velocity.x *= -1;
    }
    if (sphere.position.y < -bounds || sphere.position.y > bounds) {
      velocity.y *= -1;
    }
    if (sphere.position.z < -bounds || sphere.position.z > bounds) {
      velocity.z *= -1;
    }

    const rotationVelocity = sphere.userData.rotationVelocity;
    sphere.rotation.x += rotationVelocity.x * (prefersReducedMotion ? 0.4 : 1);
    sphere.rotation.y += rotationVelocity.y * (prefersReducedMotion ? 0.4 : 1);
    sphere.rotation.z += rotationVelocity.z * (prefersReducedMotion ? 0.4 : 1);
  }

  renderer.render(scene, camera);
  rafId = window.requestAnimationFrame(animate);
}

function stopAnimation() {
  if (rafId !== null) {
    window.cancelAnimationFrame(rafId);
    rafId = null;
  }
}

function startAnimation() {
  if (rafId === null) {
    clock.getDelta();
    animate();
  }
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopAnimation();
  } else {
    startAnimation();
  }
});

window.addEventListener("beforeunload", () => {
  stopAnimation();
  renderer.dispose();
  spheres.forEach((sphere) => {
    sphere.geometry.dispose();
    sphere.material.dispose();
  });
});

startAnimation();
}
