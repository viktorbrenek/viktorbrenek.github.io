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

// Geometry
const geometry = new THREE.BoxGeometry( 1, 1, 20 );
const material = new THREE.MeshBasicMaterial( {color: 0x33428e} );
const geometry3 = new THREE.BoxGeometry( 1, 1, 20 );
const material3 = new THREE.MeshBasicMaterial( {color: 0x495fca} );
const geometry4 = new THREE.BoxGeometry( 1, 1, 20 );
const material4 = new THREE.MeshBasicMaterial( {color: 0x7083e1} );
const geometry2 = new THREE.BoxGeometry( 20, 1, 1 );
const material2 = new THREE.MeshBasicMaterial( {color: 0xf6baba} );
const geometry5 = new THREE.BoxGeometry( 20, 1, 1 );
const material5 = new THREE.MeshBasicMaterial( {color: 0xf08686} );

const cube2 = new THREE.Mesh( geometry2, material2);
const cube = new THREE.Mesh( geometry, material );
const cube3 = new THREE.Mesh( geometry3, material3);
const cube4 = new THREE.Mesh( geometry4, material4);
const cube5 = new THREE.Mesh( geometry5, material5);

// Add objects to scene
scene.add( cube, cube2, cube3, cube4, cube5 );


const clock = new THREE.Clock();
const animate = () => {
  const elapsedTime = clock.getElapsedTime();
  const rotation = THREE.Math.degToRad(360 * elapsedTime);
  
  cube.rotation.x = rotation;
  cube.rotation.y = rotation;
  cube.rotation.z = rotation;
  
  cube2.rotation.x = rotation;
  cube2.rotation.y = rotation;
  cube2.rotation.z = rotation;
  
  cube3.rotation.x = rotation;
  cube3.rotation.y = rotation;
  cube3.rotation.z = rotation;
  
  cube4.rotation.x = rotation;
  cube4.rotation.y = rotation;
  cube4.rotation.z = rotation;
  
  cube5.rotation.x = rotation;
  cube5.rotation.y = rotation;
  cube5.rotation.z = rotation;
  
  cube.position.z = 10 * Math.sin(elapsedTime);
  cube2.position.z = 10 * Math.sin(elapsedTime);
  cube3.position.z = 10 * Math.sin(elapsedTime);
  cube4.position.z = 10 * Math.sin(elapsedTime);
  cube5.position.z = 10 * Math.sin(elapsedTime);
  
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
  };

animate();


