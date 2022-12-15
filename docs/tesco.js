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


// create an array of colors for the cube
const colors = [
  0x348888, // yellow
  0x22BABB, // red
  0x9EF8EE, // blue
  0xFA7F08, // green
  0xF24405, // magenta
  0xA52502, // cyan
];


// create a 3x3x3 grid of cubes
for (let x = 0; x < 3; x++) {
  for (let y = 0; y < 3; y++) {
    for (let z = 0; z < 3; z++) {
      // create a new cube
      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial({ color: colors[Math.floor(Math.random() * colors.length)] })
      
      );
      

      // position the cube
      cube.position.set((x - 1) * 1.2 - 0.25, (y - 1) * 1.2 - 0.25, (z - 1) * 1.2 - 0.25);
      

      // add the cube to the scene
      scene.add(cube);
      
      

      
    }
  }
}
// add a click event listener to the window
// create a variable to store the current score
let score = 0;

// add a click event listener to the window
window.addEventListener('click', function() {
  // get a random cube from the scene
  const randomCube = scene.children[Math.floor(Math.random() * scene.children.length)];

  // get a random color from the list of colors
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  // change the color of the random cube to the random color
  randomCube.material.color.set(randomColor);

  // increment the score
  score++;

  // update the score in the HTML
  document.querySelector('p.score').innerHTML = 'Score: ' + score;
});



// create a variable to store the current angle of rotation
let rotation = 0;

// create a function to update the rotation and render the scene
function animate() {
  
  // increase the rotation by a small amount
  rotation += 0.01;

  // rotate the cube around the x, y, and z axes
  scene.rotateOnAxis(new THREE.Vector3(1, 0, 0), 0.005);
  scene.rotateOnAxis(new THREE.Vector3(0, 1, 0), 0.005);
  scene.rotateOnAxis(new THREE.Vector3(0, 0, 1), 0.005);

  // render the scene
  renderer.render(scene, camera);

  // request the next animation frame
  requestAnimationFrame(animate);
}

// start the animation loop
animate();


