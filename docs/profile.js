import * as THREE from './three.module.js'

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()


// Base camera
const aspect = window.innerWidth / window.innerHeight;
const d = 5;

const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set( 3, 3, 3 ); // all components equal
camera.lookAt( scene.position );

// create a renderer and add it to the page
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

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

// Add a click event listener to the renderer
renderer.domElement.addEventListener('click', () => {
    // Set a new random position for each object
    cubeMesh.position.set(Math.random() * 10 - 5, Math.random() * 10 - 5, Math.random() * 10 - 5);
    sphereMesh.position.set(Math.random() * 10 - 5, Math.random() * 10 - 5, Math.random() * 10 - 5);
    torusMesh.position.set(Math.random() * 10 - 5, Math.random() * 10 - 5, Math.random() * 10 - 5);
  
    // Set a new random color for each object
    cubeMaterial.color.set(Math.random() * 0xffffff);
    sphereMaterial.color.set(Math.random() * 0xffffff);
    torusMaterial.color.set(Math.random() * 0xffffff);
  });
  
// Create a new cube
const cube = new THREE.BoxGeometry(1, 1, 1);
const cubeMaterial = new THREE.MeshBasicMaterial({ wireframe: true });
const cubeMesh = new THREE.Mesh(cube, cubeMaterial);

// Create a new sphere
const sphere = new THREE.SphereGeometry(1, 32, 32);
const sphereMaterial = new THREE.MeshBasicMaterial({ wireframe: true });
const sphereMesh = new THREE.Mesh(sphere, sphereMaterial);

// Create a new torus
const torus = new THREE.TorusGeometry(1, 0.5, 16, 100);
const torusMaterial = new THREE.MeshBasicMaterial({ wireframe: true });
const torusMesh = new THREE.Mesh(torus, torusMaterial);

// Add the objects to the scene
scene.add(cubeMesh);
scene.add(sphereMesh);
scene.add(torusMesh);

// Set a random position for each object
cubeMesh.position.set(Math.random() * 10 - 5, Math.random() * 10 - 5, Math.random() * 10 - 5);
sphereMesh.position.set(Math.random() * 10 - 5, Math.random() * 10 - 5, Math.random() * 10 - 5);
torusMesh.position.set(Math.random() * 10 - 5, Math.random() * 10 - 5, Math.random() * 10 - 5);

// Set a random color for each object
cubeMaterial.color.set(Math.random() * 0xffffff);
sphereMaterial.color.set(Math.random() * 0xffffff);
torusMaterial.color.set(Math.random() * 0xffffff);

// Set the camera position
camera.position.z = 5;

// Animate the objects
function animate() {
  requestAnimationFrame(animate);

  // Rotate the objects indefinitely
  cubeMesh.rotation.x += 0.01;
  cubeMesh.rotation.y += 0.01;
  sphereMesh.rotation.x += 0.01;
  sphereMesh.rotation.y += 0.01;
  torusMesh.rotation.x += 0.01;
  torusMesh.rotation.y += 0.01;

  renderer.render(scene, camera);
}

// Start the animation
animate();
