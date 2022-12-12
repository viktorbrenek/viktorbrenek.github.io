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

window.addEventListener('click', (event) => {
    // Change the color of each box to a random color
    boxes.forEach(box => {
        box.material.color.set(Math.random() * 0xffffff);
    });

    // Reshuffle the boxes into random positions
    boxes.forEach(box => {
        box.position.x = Math.random() * 10 - 5; // Random x-coordinate between -5 and 5
        box.position.y = Math.random() * 10 - 5; // Random y-coordinate between -5 and 5
        box.position.z = Math.random() * 10 - 5; // Random z-coordinate between -5 and 5
    });
});



/**
 * Camera
 */
// Base camera
const aspect = window.innerWidth / window.innerHeight;
const d = 5;

const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set( 5, 5, 5 ); // all components equal
camera.lookAt( scene.position );

// create a renderer and add it to the page
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))


// Create a random number of boxes with random sizes, colors, and positions
const numBoxes = Math.floor(Math.random() * 10) + 10; // Random number of boxes
const boxes = [];

for (let i = 0; i < numBoxes; i++) {
  const size = Math.random() * 0.5 + 0.1; // Random size between 0.1 and 0.6
  const boxGeometry = new THREE.BoxGeometry(size, size, size);
  const boxMaterial = new THREE.MeshBasicMaterial({color: Math.random() * 0xffffff}); // Random color
  const box = new THREE.Mesh(boxGeometry, boxMaterial);
  box.position.x = Math.random() * 10 - 5; // Random x-coordinate between -5 and 5
  box.position.y = Math.random() * 10 - 5; // Random y-coordinate between -5 and 5
  box.position.z = Math.random() * 10 - 5; // Random z-coordinate between -5 and 5
  boxes.push(box);
  scene.add(box);
}

// Set the initial camera position
camera.position.z = 5;

// Animate the boxes by looping them from a random position to the start
let time = 0;

// Animate the boxes by looping them from a random position to the start
// and updating their size over time


const animate = function () {
    requestAnimationFrame(animate);
  
    // Increment the time counter
    time += 0.01;
    if (time >= 1 / 60) {
    boxes.forEach(box => {
      const speed = 0.01; // Set the speed of the animation
      box.position.x -= speed; // Move the box along the x-axis
  
      // Update the size of the box based on the time
      box.scale.x = Math.sin(time) * 0.5 + 1;
      box.scale.y = Math.sin(time) * 0.5 + 1;
      box.scale.z = Math.sin(time) * 0.5 + 1;
  
      if (box.position.x < -5) { // If the box reaches the left edge
        // Generate a new random position for the box
        box.position.x = Math.random() * 10 - 5;
        box.position.y = Math.random() * 10 - 5;
        box.position.z = Math.random() * 10 - 5;
      }
    }
    
    );
    time = 0;}
  
    // render the scene
    renderer.render(scene, camera);
  };
  

// start the animation
animate();