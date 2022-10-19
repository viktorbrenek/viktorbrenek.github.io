import * as THREE from './three.module.js'
//import OrbitControls from './OrbitControls.js'
import * as dat from './lil-gui.module.min.js'
//script(src="OrbitControls.js")
//import waterVertexShader from "./vertex.js"
//import waterFragmentShader from "./fragment.js"

//console.log(waterFragmentShader)
// import * as waterVertexShader from "./vertex.js"
// console.log(waterVertexShader)

/**
 * Base
 */
// Debug
//const gui = new GUI( { class: $('guie') } );
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
const waterGeometry = new THREE.PlaneGeometry(20, 20, 512, 512)

//Color
debugObject.depthColor = "#0000ff"
debugObject.surfaceColor = "#f7a07a"

// Material
const waterMaterial = new THREE.RawShaderMaterial({
    vertexShader: `
        uniform float uTime;
        uniform mat4 projectionMatrix;
        uniform mat4 viewMatrix;
        uniform mat4 modelMatrix;
        uniform float uBigWavesElevation;
        uniform vec2 uBigWavesFrequency;
        uniform float uBigWavesSpeed;
        
        uniform float uSmallWavesElevation;
        uniform float uSmallWavesFrequency;
        uniform float uSmallWavesSpeed;
        uniform float uSmallWavesIterations;

        varying float vElevation;

        attribute vec3 position;

        //	Classic Perlin 3D Noise 
        //	by Stefan Gustavson
        //
        vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
        vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
        vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}

        float cnoise(vec3 P){
        vec3 Pi0 = floor(P); // Integer part for indexing
        vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
        Pi0 = mod(Pi0, 289.0);
        Pi1 = mod(Pi1, 289.0);
        vec3 Pf0 = fract(P); // Fractional part for interpolation
        vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
        vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
        vec4 iy = vec4(Pi0.yy, Pi1.yy);
        vec4 iz0 = Pi0.zzzz;
        vec4 iz1 = Pi1.zzzz;

        vec4 ixy = permute(permute(ix) + iy);
        vec4 ixy0 = permute(ixy + iz0);
        vec4 ixy1 = permute(ixy + iz1);

        vec4 gx0 = ixy0 / 7.0;
        vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
        gx0 = fract(gx0);
        vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
        vec4 sz0 = step(gz0, vec4(0.0));
        gx0 -= sz0 * (step(0.0, gx0) - 0.5);
        gy0 -= sz0 * (step(0.0, gy0) - 0.5);

        vec4 gx1 = ixy1 / 7.0;
        vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
        gx1 = fract(gx1);
        vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
        vec4 sz1 = step(gz1, vec4(0.0));
        gx1 -= sz1 * (step(0.0, gx1) - 0.5);
        gy1 -= sz1 * (step(0.0, gy1) - 0.5);

        vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
        vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
        vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
        vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
        vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
        vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
        vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
        vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

        vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
        g000 *= norm0.x;
        g010 *= norm0.y;
        g100 *= norm0.z;
        g110 *= norm0.w;
        vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
        g001 *= norm1.x;
        g011 *= norm1.y;
        g101 *= norm1.z;
        g111 *= norm1.w;

        float n000 = dot(g000, Pf0);
        float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
        float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
        float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
        float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
        float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
        float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
        float n111 = dot(g111, Pf1);

        vec3 fade_xyz = fade(Pf0);
        vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
        vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
        float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
        return 2.2 * n_xyz;
        }

        void main()
        {
            gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
            gl_Position.x += 1.0;

            //elevation
            float elevation =   sin(gl_Position.x * uBigWavesFrequency.x + uTime * uBigWavesSpeed) * 
                                sin(gl_Position.z * uBigWavesFrequency.y + uTime * uBigWavesSpeed) * 
                                uBigWavesElevation;

            // uniform float uSmallWavesIterations


            for(float i = 1.0; i <= 4.0; i++) 
            {
                elevation -= abs(cnoise(vec3(gl_Position.xz * uSmallWavesFrequency * i, uTime * uSmallWavesSpeed)) * uSmallWavesElevation / i);
            }                   
                  
            gl_Position.y += elevation;

            //varyings
            vElevation = elevation;
            
        }  `,
    fragmentShader: `
        precision mediump float;
        uniform vec3 uDepthColor;
        uniform vec3 uSurfaceColor;
        uniform float uColorOffset;
        uniform float uColorMultiplier;

        varying float vElevation;

        void main()
        {
            float mixStrength = (vElevation + uColorOffset) * uColorMultiplier; 
            vec3 color = mix(uDepthColor, uSurfaceColor, mixStrength);
            gl_FragColor = vec4(color, 1.0);
        }
    `,
    uniforms: {
        uTime: { value: 0 },

        uBigWavesElevation: { value: 0.2 },
        uBigWavesFrequency: { value: new THREE.Vector2(4, 1.5) },
        uBigWavesSpeed: { value: 0.75},

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



// RawShaderMaterial
// {
//     vertexShader: `
//         uniform mat4 projectionMatrix;
//         uniform mat4 viewMatrix;
//         uniform mat4 modelMatrix;

//         attribute vec3 position;

//         void main()
//         {
//             gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
//         }  `,
//     fragmentShader: `
//         precision mediump float;

//         void main()
//         {
//             gl_FragColor = vec4(1.0, 0.0, 0.0, 0.1);
//         }
//     `
    
// }

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
    // controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()

