import * as THREE from './three.module.js'

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}
// set up the scene
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// create the isometric camera
window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})
/*
window.addEventListener('click', (event) => {
    // Change the color of each box to a random color
    boxes.forEach(box => {
        box.material.color.set(Math.random() * 0xECAC08);
    });

    // Reshuffle the boxes into random positions and rotations
    boxes.forEach(box => {
        box.position.x = Math.random() * 10 - 5; // Random x-coordinate between -5 and 5
        box.position.y = Math.random() * 10 - 5; // Random y-coordinate between -5 and 5
        box.position.z = Math.random() * 10 - 5; // Random z-coordinate between -5 and 5
        box.rotation.x = Math.random() * Math.PI * 2; // Random rotation around the x-axis
        box.rotation.y = Math.random() * Math.PI * 2; // Random rotation around the y-axis
        box.rotation.z = Math.random() * Math.PI * 2; // Random rotation around the z-axis
    });
});*/

/**
 * Camera
 */
// Base camera
const aspect = window.innerWidth / window.innerHeight;
const d = 5;

const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.set(5, 5, 5); // all components equal
camera.lookAt(scene.position);

// create a renderer and add it to the page
const renderer = new THREE.WebGLRenderer({
  canvas: canvas
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Create a random number of boxes with random sizes, colors, and positions
const numBoxes = Math.floor(Math.random() * 10) + 10; // Random number of boxes
const boxes = [];

for (let i = 0; i < numBoxes; i++) {
  const size = Math.random() * 0.5 + 0.1; // Random size between 0.1 and 0.6
  const boxGeometry = new THREE.SphereGeometry(size, size, size);
  const baseColor = new THREE.Color("#ECAC08");
  const colorVariation = 0.1; // adjust as desired

  const boxMaterial = new THREE.MeshBasicMaterial({
    wireframe: true,
    color: baseColor.clone().offsetHSL(
      Math.random() * colorVariation - colorVariation / 2,
      Math.random() * colorVariation - colorVariation / 2,
      Math.random() * colorVariation - colorVariation / 2
    ),
  });

  const box = new THREE.Mesh(boxGeometry, boxMaterial);
  box.position.x = Math.random() * 10 - 5; // Random x-coordinate between -5 and 5
  box.position.y = Math.random() * 10 - 5; // Random y-coordinate between -5 and 5
  box.position.z = Math.random() * 10 - 5; // Random z-coordinate between -5 and 5
  box.velocity = new THREE.Vector3(
    (Math.random() - 0.05) * 0.01,
    (Math.random() - 0.05) * 0.01,
    (Math.random() - 0.05) * 0.01
  ); // Random velocity
  boxes.push(box);
  scene.add(box);
}

function detectCollisions() {
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const box1 = boxes[i];
      const box2 = boxes[j];
      const distance = box1.position.distanceTo(box2.position);
      if (distance < (box1.geometry.parameters.width + box2.geometry.parameters.width) / 2) {
        // collision detected, set velocities to move away from each other
        const normal = box1.position.clone().sub(box2.position).normalize();
        const v1 = box1.velocity.clone().projectOnVector(normal);
        const v2 = box2.velocity.clone().projectOnVector(normal);
        box1.velocity.sub(v1).add(v2);
        box2.velocity.sub(v2).add(v1);
      }
    }
  }
}


// Set the initial camera position
camera.position.z = 5;

// Animate the boxes by looping them from a random position to the start
const animate = function () {
  requestAnimationFrame(animate);
  detectCollisions();

  boxes.forEach((box) => {
    
    // Add velocity to position
    box.position.add(box.velocity);

    // Bounce back if the box hits the edge of the screen
    if (box.position.x < -5 || box.position.x > 5) {
      box.velocity.setX(-box.velocity.x);
    }

    if (box.position.y < -5 || box.position.y > 5) {
      box.velocity.setY(-box.velocity.y);
    }

    if (box.position.z < -5 || box.position.z > 5) {
      box.velocity.setZ(-box.velocity.z);
    }

    // Add rotation to box
    const rotationSpeed = 0.005; // Set the speed of the rotation
    box.rotation.x += rotationSpeed * Math.random(); // Rotate randomly on the x-axis
    box.rotation.y += rotationSpeed * Math.random(); // Rotate randomly on the y-axis
    box.rotation.z += rotationSpeed * Math.random(); // Rotate randomly on the z-axis
  });

  // render the scene
  renderer.render(scene, camera);
};


// start the animation
animate();
