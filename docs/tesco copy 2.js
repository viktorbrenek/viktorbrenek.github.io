import * as THREE from './three.module.js'
import { OrbitControls } from './OrbitControls.js'
import * as dat from './lil-gui.module.min.js'
import { GLTFLoader } from "./GLTFLoader.js"
import waterVertexShader from "./vertex.js"
import waterFragmentShader from "./fragment.js"


/**
 * Base
 */
// Debug
//const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

//material

// const material = new THREE.MeshStandardMaterial({
//     color: 0xffffff,
//     wireframe: true
// })
// scene.add( material );

//my model 
const geometry = new THREE.BoxGeometry( 1, 1, 20 );
const material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
//const wireframe = new THREE.WireframeGeometry( geometry ); const line = new THREE.LineSegments( wireframe ); line.material.depthTest = false; line.material.opacity = 0.25; line.material.transparent = true; scene.add( line );
const geometry2 = new THREE.BoxGeometry( 20, 1, 1 );
const material2 = new THREE.MeshBasicMaterial( {color: 0xffffff} );
const geometry3 = new THREE.BoxGeometry( 1, 1, 20 );
const material3 = new THREE.MeshBasicMaterial( {color: 0xAAAA00} );

const cube2 = new THREE.Mesh( geometry2, material2)
const cube = new THREE.Mesh( geometry, material );
const cube3 = new THREE.Mesh( geometry3, material3)

//positions
scene.add( cube, cube2, cube3 );

/**
 * Floor
 */
// const floor = new THREE.Mesh(
//     new THREE.PlaneGeometry(10, 10),
//     new THREE.MeshStandardMaterial({
//         color: '#444444',
//         metalness: 0,
//         roughness: 0.5
//     })
// )
// floor.receiveShadow = true
// floor.rotation.x = - Math.PI * 0.5
// scene.add(floor)

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.camera.left = - 7
directionalLight.shadow.camera.top = 7
directionalLight.shadow.camera.right = 7
directionalLight.shadow.camera.bottom = - 7
directionalLight.position.set(5, 5, 5)
scene.add(directionalLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}



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

// Controls
// const controls = new OrbitControls(camera, canvas)
// controls.target.set(0, 0.75, 0)
// controls.enableDamping = false

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
// const clock = new THREE.Clock()
// let previousTime = 0
const clock = new THREE.Clock()

const tick = () =>
{
    // const elapsedTime = clock.getElapsedTime()
    // const deltaTime = elapsedTime - previousTime
    // previousTime = elapsedTime
    const elapsedTime = clock.getElapsedTime()

    //Animation
    //scene.children[1].rotation.y = elapsedTime / 10
    cube3.position.y = -3
    cube2.position.y = -1.5
    cube.position.z = Math.sin(1.5 * elapsedTime)
    //camera.lookAt(cube.position)
    //cube2.position.y += 0.01 * elapsedTime
    cube2.position.x = Math.sin(1.5 * elapsedTime)
    cube3.position.z = Math.sin(1.5 * elapsedTime)

    // Update controls
    //controls.update()
    

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()





