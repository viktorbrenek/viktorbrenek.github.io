import * as THREE from './three.module.js'
import { OrbitControls } from './OrbitControls.js'
import * as dat from './lil-gui.module.min.js'
//import { GLTFLoader } from "./GLTFLoader.js"
import waterVertexShader from "./vertex.js"
import waterFragmentShader from "./fragment.js"


//import waterVertexShader from "./vertex.js"
//import waterFragmentShader from "./fragment.js"

//console.log(waterFragmentShader)
// import * as waterVertexShader from "./vertex.js"
// console.log(waterVertexShader)

/**
 * Base
 */
// Debug
// //const gui = new GUI( { class: $('guie') } );
const gui = new dat.GUI({ width: 270 })
gui.domElement.id = 'gui';
const debugObject = {}
gui.close()
gui.title( "💚Click me and edit the background!💚" )    

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Water
 */
// Geometry
const waterGeometry = new THREE.TorusKnotGeometry( 10, 3, 512, 512 );

//PC loader
// renderer = new THREE.WebGLRenderer({antialias:true}); 
// //document.body.appendChild(renderer.domElement);
// renderer.shadowMap.enabled = true;
// renderer.shadowMap.type = THREE.PCFSoftShadowMap; 

// //container = document.getElementById('threejs').innerHTML = Width + "," + Height; //Toto zobrazuje dimenze a nějak to souvisí se zobrazením
// document.body.appendChild(renderer.domElement); //tady tohle zobrazuje výsledek renderu
// renderer.setSize(window.innerWidth, window.innerHeight); //tohle určuje velikost renderu

// //config

// renderer.render( scene, camera )
// //tohle načítá můj model - kde načtu textury? hmm
// const loader = new GLTFLoader();
// loader.load('assets/images/mac.gltf', function(gltf){
// model = gltf.scene.children[0];
// model.scale.set(0.5,0.5,0.5);
// model.traverse( function ( object ) {

//     if ( object.isMesh ) object.castShadow = true;

// } );


// scene.add(gltf.scene);
// //car.castShadow = true; //default is false
// //car.receiveShadow = false; //default
// animate();
// });

//Color
debugObject.depthColor = "#0042aa"
debugObject.surfaceColor = "#001e57"

// Material
const waterMaterial = new THREE.ShaderMaterial({
    vertexShader: waterVertexShader,
    fragmentShader: waterFragmentShader,

    uniforms: {
        uTime: { value: 0 },

        uBigWavesElevation: { value: 0.4 },
        uBigWavesFrequency: { value: new THREE.Vector2(6.5, 3.0) },
        uBigWavesSpeed: { value: 1.0},

        uSmallWavesElevation: { value: 0.15 },
        uSmallWavesFrequency: { value: 3.0 },
        uSmallWavesSpeed: { value: 0.2 },
        uSmallWavesIterations: { value: 4 },

        uDepthColor: { value: new THREE.Color(debugObject.depthColor) },
        uSurfaceColor: { value: new THREE.Color(debugObject.surfaceColor) },
        uColorOffset: { value: 0.399 },
        uColorMultiplier: { value: 2.289 }

    }
})
//debug
gui.add(waterMaterial.uniforms.uBigWavesElevation, "value").min(0).max(1).step(0.001).name("uBigWavesElevation")
gui.add(waterMaterial.uniforms.uBigWavesFrequency.value, "x").min(0).max(10).step(0.001).name("uBigWavesFrequencyX")
gui.add(waterMaterial.uniforms.uBigWavesFrequency.value, "y").min(0).max(10).step(0.001).name("uBigWavesFrequencyY")
gui.add(waterMaterial.uniforms.uBigWavesSpeed, "value").min(0).max(4).step(0.001).name("uBigWavesSpeed")

gui.add(waterMaterial.uniforms.uSmallWavesElevation, "value").min(0).max(1).step(0.001).name("uSmallWavesElevation")
gui.add(waterMaterial.uniforms.uSmallWavesFrequency, "value").min(0).max(30).step(0.001).name("uSmallWavesFrequencyX")
gui.add(waterMaterial.uniforms.uSmallWavesSpeed, "value").min(0).max(4).step(0.001).name("uSmallWavesSpeed")
//gui.add(waterMaterial.uniforms.uSmallWavesIterations, "value").min(0).max(5).step(1).name("uSmallWavesIterations")

gui
    .addColor(debugObject, "depthColor")
    .name("depthColor")
    .onChange(() => 
    {
        waterMaterial.uniforms.uDepthColor.value.set(debugObject.depthColor)
    })
gui
    .addColor(debugObject, "surfaceColor")
    .name("surfaceColor")
    .onChange(() => 
    {
        waterMaterial.uniforms.uSurfaceColor.value.set(debugObject.surfaceColor)
    })

gui.add(waterMaterial.uniforms.uColorOffset, "value").min(0).max(1).step(0.001).name("uColorOffset")
gui.add(waterMaterial.uniforms.uColorMultiplier, "value").min(0).max(10).step(0.001).name("uColorMultiplier")

// Mesh
const water = new THREE.Mesh(waterGeometry, waterMaterial)
water.rotation.x = - Math.PI * 0.5
scene.add(water)

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

// // Controls
// const controls = new OrbitControls(camera, canvas)
// controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    //waterUpdate
    waterMaterial.uniforms.uTime.value = elapsedTime

    // Update controls
    //controls.update()
    
    //animace pokus 
    water.rotation.y = elapsedTime / 10

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()

