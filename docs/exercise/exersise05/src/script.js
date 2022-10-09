import './style.css'
import * as THREE from 'three'
import { Mesh } from 'three'
import gsap from "gsap"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import * as lil from 'lil-gui'


//debug
const gui = new lil.GUI()

//texture loader
const loadingManager = new THREE.LoadingManager()

loadingManager.onStart = () =>
{
    console.log("onStart")
}

loadingManager.onLoaded = () =>
{
    console.log("onLoaded")
}

loadingManager.onProgress = () =>
{
    console.log("onProgress")
}

loadingManager.onError = () =>
{
    console.log("onError")
}

const textureLoader = new THREE.TextureLoader(loadingManager)
const colorTexture = textureLoader.load("./image.jpg")
const alphaTexture = textureLoader.load("./image.jpg")
const heightTexture = textureLoader.load("./image.jpg")
const normalTexture = textureLoader.load("./image.jpg")
const ambientOcclusionTexture = textureLoader.load("./image.jpg")
const metalnessTexture = textureLoader.load("./image.jpg")
const rougnessTexture = textureLoader.load("./image.jpg")
const matcapTexture = textureLoader.load("./image.jpg")

colorTexture.repeat.x = 2
colorTexture.repeat.y = 3
colorTexture.wrapS = THREE.RepeatWrapping
colorTexture.wrapT = THREE.RepeatWrapping
//colorTexture.wrapT = THREE.MirroredRepeatWrapping

//colorTexture.offset.x = 0.5
//colorTexture.offset.y = 0.5

colorTexture.rotation = Math.PI / 4
colorTexture.center.x = 0.5
colorTexture.center.y = 0.5

//colorTexture.minFilter = THREE.NearestFilter  
colorTexture.magFilter = THREE.NearestFilter  //toto umí scalovat textury


const parameters = {
    color: 0xff0000,
    spin: () =>
    {
        gsap.to(cube1.rotation, { duration: 1, y: cube1.rotation.y + 10 })
    }
}

gui
    .addColor(parameters, "color" )
    .onChange(() =>
    {
        cube1.material.color.set(parameters.color)
    })

gui
    .add(parameters, "spin")

//cursor
const cursor = {
    x: 0,
    y: 0
}
    
window.addEventListener("mousemove", (event) => 
{
    cursor.x = event.clientX / sizes.width - 0.5
    cursor.y = - (event.clientY / sizes.width - 0.5)
})

console.log(gsap)
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Objects
 */
const material = new THREE.MeshBasicMaterial()
material.map = colorTexture
material.color = new THREE.Color(0x00ff00)
material.opacity = 0.5
material.transparent = true
//material.alphaMap = doorAlphaTexture
material.side = THREE.DoubleSide

const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 16, 16),
    material
)
sphere.position.x = - 1.5

const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(1,1),
    material
)
plane.position.y = - 1

const torus = new THREE.Mesh(
    new THREE.TorusGeometry(0.3, 0.2, 16, 32),
    material
)
torus.position.x = 1.5

scene.add(sphere, plane, torus)

const group = new THREE.Group()
scene.add(group)
const cube1 = new THREE.Mesh(
    new THREE.BoxGeometry(1,1,1),
    new THREE.MeshBasicMaterial({ color: parameters.color })
)
const cube2 = new THREE.Mesh(
    new THREE.BoxGeometry(0.9,0.9,0.9),
    new THREE.MeshBasicMaterial({ map: colorTexture })
)
const cube3 = new THREE.Mesh(
    new THREE.BoxGeometry(0.8,0.8,0.8),
    new THREE.MeshBasicMaterial({ color: "blue" })
)

cube2.position.set(0.5, 0.7, 1)
cube3.position.set(0,1,0.5)
group.add(cube1, cube2, cube3)
const axesHelper = new THREE.AxesHelper(2)
scene.add(axesHelper)


//debug
gui
    .add(group.position, "y")
    .min(- 3)
    .max(3)
    .step(0.01)
    .name("elevation")

gui
    .add(cube1, "visible")

gui
    .add(cube1.material, "wireframe")

// gui
//     .addColor(cube1, "ff8888")

//hide panel
window.addEventListener("keydown", (event) =>
{
    if(event.key === "h")
    {
        if (gui._hidden)
            gui.show()
        else
            gui.hide()
    }
})

//mesh.position.normalize()
/**
 * Sizes
 */
const sizes = {
    width: 800,
    height: 600
}

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height)
camera.position.z = 3
camera.position.y = 1
camera.position.x = -1

scene.add(camera)

// Controls
// const controls = new OrbitControls(camera, canvas)
// controls.enableDamping = true

//console.log(mesh.position.distanceTo(camera.position))
/**
 * Renderer
 */

const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)

//gsap
gsap.to(cube3.position, { duration: 1, delay: 1, x: 2 })

//time
const clock = new THREE.Clock()
//animations
const tick = () =>
{
    

    //time
    const elapsedTime = clock.getElapsedTime()
    //update controls
    controls.update()

    //update objects
    sphere.rotation.y = 0.15 * elapsedTime
    torus.rotation.y = 0.15 * elapsedTime
    plane.rotation.x = 0.15 * elapsedTime
   
    // render
    renderer.render(scene, camera)

    window.requestAnimationFrame(tick)
}

// const tick = () =>
// {
//     //time
//     const elapsedTime = clock.getElapsedTime()
//     console.log(elapsedTime)
//     // update objects
//     cube1.rotation.y = Math.sin(elapsedTime) 
//     cube2.position.y = Math.cos(elapsedTime) 
//     //cube3.position.x = Math.sin(elapsedTime) 
//     camera.lookAt(cube2.position)

//     // render
//     renderer.render(scene, camera)

//     window.requestAnimationFrame(tick)
// }

tick()