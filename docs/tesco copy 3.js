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

//my model 
const geometry = new THREE.BoxGeometry( 1, 1, 20 );
const material = new THREE.MeshBasicMaterial( {color: 0xca2b2b} );
const material3 = new THREE.MeshBasicMaterial( {color: 0xea5353} );
const material4 = new THREE.MeshBasicMaterial( {color: 0x8d1e1e} );
const material5 = new THREE.MeshBasicMaterial( {color: 0x651515} );
const material6 = new THREE.MeshBasicMaterial( {color: 0x3d0d0d} );
const material7 = new THREE.MeshBasicMaterial( {color: 0x1e060e} );
//reverse movement
const geometry2 = new THREE.BoxGeometry( 20, 1, 1 );
const material2 = new THREE.MeshBasicMaterial( {color: 0x7083e1} );
const material21 = new THREE.MeshBasicMaterial( {color: 0x495fca} );
const material22 = new THREE.MeshBasicMaterial( {color: 0x33428e} );
const material23 = new THREE.MeshBasicMaterial( {color: 0x252f65} );
const material24 = new THREE.MeshBasicMaterial( {color: 0x161c3d} );
const material25 = new THREE.MeshBasicMaterial( {color: 0x0b0e1e} );

const cube = new THREE.Mesh( geometry, material );
const cube3 = new THREE.Mesh( geometry, material3)
const cube4 = new THREE.Mesh( geometry, material4)
const cube5 = new THREE.Mesh( geometry, material5)
const cube6 = new THREE.Mesh( geometry, material6)
const cube7 = new THREE.Mesh( geometry, material7)
//reversed
const cube2 = new THREE.Mesh( geometry2, material2)
const cube21 = new THREE.Mesh( geometry2, material21)
const cube22 = new THREE.Mesh( geometry2, material22)
const cube23 = new THREE.Mesh( geometry2, material23)
const cube24 = new THREE.Mesh( geometry2, material24)
const cube25 = new THREE.Mesh( geometry2, material25)


//positions
scene.add( cube, cube2, cube3, cube4, cube5, cube6, cube7, cube21, cube22, cube23, cube24, cube25 );

const clock = new THREE.Clock()

// Set the initial camera position
camera.position.z = 5;

// Animate the boxes by looping them from a random position to the start
const animate = function () {
    requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime()

    //Animation
    if (elapsedTime < 2) {
        cube3.position.z = -20 + Math.sin(1.5 * elapsedTime) * 21
        cube.position.z = -18 + Math.sin(1.5 * elapsedTime) * 18
        cube4.position.z = -16 + Math.sin(1.5 * elapsedTime) * 15
        cube5.position.z = -14 + Math.sin(1.5 * elapsedTime) * 12
        cube6.position.z = -12 + Math.sin(1.5 * elapsedTime) * 9
        cube7.position.z = -10 + Math.sin(1.5 * elapsedTime) * 6
        cube.position.x = 2
        cube4.position.x = 4
        cube5.position.x = 6
        cube6.position.x = 8
        cube7.position.x = 10
        //reversed
        cube2.position.x = -17 + Math.sin(1.5 * elapsedTime) * 21
        cube21.position.x = -15 + Math.sin(1.5 * elapsedTime) * 18
        cube22.position.x = -13 + Math.sin(1.5 * elapsedTime) * 15
        cube23.position.x = -11 + Math.sin(1.5 * elapsedTime) * 12
        cube24.position.x = -9 + Math.sin(1.5 * elapsedTime) * 9
        cube25.position.x = -7 + Math.sin(1.5 * elapsedTime) * 6
        cube2.position.y = 1
        cube21.position.y = 1
        cube21.position.z = 2
        cube22.position.y = 1
        cube22.position.z = 4
        cube23.position.y = 1
        cube23.position.z = 6
        cube24.position.y = 1
        cube24.position.z = 8
        cube25.position.y = 1
        cube25.position.z = 10
    }

    // Render
    renderer.render(scene, camera)

}

animate();
