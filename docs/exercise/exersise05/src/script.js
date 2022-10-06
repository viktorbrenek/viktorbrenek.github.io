import './style.css'
import * as THREE from 'three'
import { Mesh } from 'three'
import gsap from "gsap"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import * as lil from 'lil-gui'+

//debug
const gui = new lil.GUI()



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
const group = new THREE.Group()
scene.add(group)
const cube1 = new THREE.Mesh(
    new THREE.BoxGeometry(1,1,1),
    new THREE.MeshBasicMaterial({ color: parameters.color })
)
const cube2 = new THREE.Mesh(
    new THREE.BoxGeometry(0.9,0.9,0.9),
    new THREE.MeshBasicMaterial({ color: "green" })
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
    
    controls.update()
   
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