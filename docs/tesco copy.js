import * as THREE from './three.module.js'
import { OrbitControls } from './OrbitControls.js'
import * as dat from './lil-gui.module.min.js'
import { GLTFLoader } from "./GLTFLoader.js"
import waterVertexShader from "./vertex.js"
import waterFragmentShader from "./fragment.js"


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

/**
 * Camera
 */
// Base camera
const aspect = window.innerWidth / window.innerHeight;
const d = 5;
const camera = new THREE.OrthographicCamera( - d * aspect, d * aspect, d, - d, 1, 1000 );

camera.position.set( 20, 20, 20 ); // all components equal
camera.lookAt( scene.position );

// create a renderer and add it to the page
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
document.body.appendChild(renderer.domElement);

// create 8 boxes and add them to the scene
for (let i = 0; i < 8; i++) {
  const boxGeometry = new THREE.BoxGeometry(10, 10, 10);
  const boxMaterial = new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff });
  const box = new THREE.Mesh(boxGeometry, boxMaterial);

  // set the initial position of the box
  box.position.set(
    Math.random() * 100 - 50,
    Math.random() * 100 - 50,
    Math.random() * 100 - 50
  );

  scene.add(box);
}


// create a function that will be called on each frame
const animate = () => {
  requestAnimationFrame(animate);

  // move the boxes towards the center of the scene
  scene.children.forEach(child => {
    child.position.x = child.position.x * 0.99;
    child.position.y = child.position.y * 0.99;
    child.position.z = child.position.z * 0.99;
  });

  // render the scene
  renderer.render(scene, camera);
};

// start the animation
animate();


