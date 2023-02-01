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

const camera = new THREE.PerspectiveCamera(20, sizes.width / sizes.height, 0.1, 100)
camera.position.set( 3, 10, 3 ); // all components equal
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

// Geometry
const geometry = new THREE.BoxGeometry( 1, 1, 20 );
const material = new THREE.MeshBasicMaterial( {color: 0x33428e} );
const geometry2 = new THREE.BoxGeometry( 20, 1, 1 );
const material2 = new THREE.MeshBasicMaterial( {color: 0x1c6fce} );
const geometry3 = new THREE.BoxGeometry( 1, 1, 20 );
const material3 = new THREE.MeshBasicMaterial( {color: 0x495fca} );
const geometry4 = new THREE.BoxGeometry( 1, 1, 20 );
const material4 = new THREE.MeshBasicMaterial( {color: 0x7083e1} );

const cube2 = new THREE.Mesh( geometry2, material2);
const cube = new THREE.Mesh( geometry, material );
const cube3 = new THREE.Mesh( geometry3, material3);
const cube4 = new THREE.Mesh( geometry4, material4);

// Add objects to scene
scene.add( cube, cube2, cube3, cube4 );


/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () => {
  const elapsedTime = clock.getElapsedTime()

  // Animation
  cube3.position.x = -1
  cube4.position.x = -2
  cube2.position.y = -1

  cube.position.z = 10 * Math.sin(elapsedTime);
  cube2.position.x = 10 * Math.sin(elapsedTime);
  cube3.position.z = 10 * Math.sin(elapsedTime);
  cube4.position.z = 10 * Math.sin(elapsedTime);
  cube.position.z = 10 * Math.sin(elapsedTime);
  cube2.position.x = 10 * Math.sin(elapsedTime);
  cube3.position.z = 11 * Math.sin(elapsedTime);
  cube4.position.z = 12 * Math.sin(elapsedTime);


  renderer.render(scene, camera)
  window.requestAnimationFrame(tick)
}

tick()
