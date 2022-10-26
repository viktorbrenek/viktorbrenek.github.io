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

const loader = new GLTFLoader()

loader.load(
    'assets/images/mac.gltf',
    (gltf) =>
    {
        // const children = [...gltf.scene.children]
        // for(const child of children)
        // {
        //     scene.add(child)
        // }
        // // scale
        // // gltf.scene.scale.set(0.025, 0.025, 0.025)
        //loader.material = material
        var model = gltf.scene;
        var newMaterial = new THREE.LineBasicMaterial({color: 0xff8811, linewidth: 1, linecap: 'round', linejoin:  'round'});
        model.traverse((o) => {
        if (o.isMesh) o.material = newMaterial;
        if (!o.isMesh) return;
        o.material.wireframe = true;
        });
	
        scene.add(gltf.scene)
        
    }
    
)

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
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(1, 1, 1)
scene.add(camera)

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
    scene.children[2].rotation.y = elapsedTime

    // Update controls
    //controls.update()
    

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()


