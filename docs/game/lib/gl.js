// Sporium – WebGL2 renderer: sprite batch, tile lightmap + per-pixel torch, spores, post FX
const VS = `#version 300 es
layout(location=0) in vec2 aPos; layout(location=1) in vec2 aUV; layout(location=2) in vec4 aCol; layout(location=3) in float aMode;
uniform vec2 uRes; uniform vec3 uCam;
out vec2 vUV; out vec4 vCol; out float vMode; out vec2 vWorld;
void main(){
  vec2 s=(aPos-uCam.xy)*uCam.z; vWorld=aPos;
  gl_Position=vec4(s.x/uRes.x*2.0, -s.y/uRes.y*2.0, 0.0, 1.0);
  vUV=aUV; vCol=aCol; vMode=aMode;
}`;
const LIGHT_FN = `
uniform sampler2D uLight; uniform vec2 uMap; uniform float uT;
uniform vec4 uTorch; // x,y world, radius(px), intensity
uniform vec3 uAmbient;
vec4 lightAt(vec2 w){
  vec4 L=texture(uLight, w/uT/uMap);
  float d=length(w-uTorch.xy)/uTorch.z;
  float t=clamp(1.0-d,0.0,1.0); t=t*t*(3.0-2.0*t);
  float vis=L.a;
  vec3 torch=vec3(1.0,0.78,0.56)*t*uTorch.w*smoothstep(0.55,1.0,vis);
  return vec4(uAmbient+L.rgb*2.0+torch, vis);
}`;
const FS_SPRITE = `#version 300 es
precision highp float;
in vec2 vUV; in vec4 vCol; in float vMode; in vec2 vWorld;
uniform sampler2D uTex; uniform int uLit;
${LIGHT_FN}
out vec4 o;
void main(){
  vec4 c;
  if(vMode<0.5){ c=texture(uTex,vUV)*vCol; }
  else if(vMode<1.5){ c=vCol; }
  else { float d=length(vUV-0.5)*2.0; float a=clamp(1.0-d,0.0,1.0); a=a*a; c=vec4(vCol.rgb,vCol.a*a); }
  if(c.a<0.004) discard;
  if(uLit==1){ vec4 L=lightAt(vWorld); float k=0.35+min(length(L.rgb),2.2)*0.6; c.rgb*=k; c.a*=smoothstep(0.15,0.9,L.a); }
  o=c;
}`;
const VS_FULL = `#version 300 es
layout(location=0) in vec2 aPos; out vec2 vUV; void main(){ vUV=aPos*0.5+0.5; gl_Position=vec4(aPos,0.0,1.0);} `;
const FS_COMP = `#version 300 es
precision highp float;
in vec2 vUV; uniform sampler2D uScene; uniform vec2 uRes; uniform vec3 uCam; uniform float uTime; uniform float uHurt;
${LIGHT_FN}
out vec4 o;
float hash(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
void main(){
  vec3 col=texture(uScene,vUV).rgb;
  vec2 sp=(vUV-0.5)*uRes; sp.y=-sp.y;
  vec2 w=sp/uCam.z+uCam.xy;
  vec4 L=lightAt(w);
  float vis=L.a;
  vec3 lit=col*L.rgb;
  // remembered areas: cold desaturated memory
  float g=dot(col,vec3(0.3,0.59,0.11));
  vec3 mem=mix(vec3(g),col,0.25)*vec3(0.20,0.24,0.30);
  float vk=smoothstep(0.38,0.9,vis);
  col=mix(mem*smoothstep(0.0,0.35,vis), lit, vk);
  // grade: teal shadows, warm highlights
  float lum=dot(col,vec3(0.3,0.59,0.11));
  col=mix(col*vec3(0.85,1.0,1.08), col*vec3(1.08,1.0,0.88), smoothstep(0.05,0.6,lum));
  col=col/(1.0+col*0.35);
  // vignette + hurt pulse
  vec2 q=vUV-0.5; float vig=1.0-dot(q,q)*1.6;
  col*=clamp(vig,0.0,1.0);
  col=mix(col, col*vec3(1.6,0.35,0.3), uHurt*smoothstep(0.15,0.75,length(q)));
  col+= (hash(vUV*uRes+fract(uTime)*100.0)-0.5)*0.035;
  o=vec4(col,1.0);
}`;

function sh(gl, type, src){ const s=gl.createShader(type); gl.shaderSource(s,src); gl.compileShader(s);
  if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)+'\n'+src); return s; }
function prog(gl, vs, fs){ const p=gl.createProgram(); gl.attachShader(p,sh(gl,gl.VERTEX_SHADER,vs)); gl.attachShader(p,sh(gl,gl.FRAGMENT_SHADER,fs)); gl.linkProgram(p);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  const u={}; const n=gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS); for(let i=0;i<n;i++){const a=gl.getActiveUniform(p,i); u[a.name]=gl.getUniformLocation(p,a.name);} return {p,u}; }

const FLOATS=9, MAXQ=20000;
export class Renderer{
  constructor(canvas, img, meta){
    this.c=canvas; const gl=this.gl=canvas.getContext('webgl2',{antialias:false,premultipliedAlpha:false});
    if(!gl) throw new Error('WebGL2 není k dispozici');
    this.meta=meta; this.T=64;
    this.sp=prog(gl,VS,FS_SPRITE); this.cp=prog(gl,VS_FULL,FS_COMP);
    this.tex=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,this.tex);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img); gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    this.ltex=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,this.ltex);
    for(const [k,v] of [[gl.TEXTURE_MIN_FILTER,gl.LINEAR],[gl.TEXTURE_MAG_FILTER,gl.LINEAR],[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D,k,v);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array(4));
    this.mapW=1; this.mapH=1;
    this.data=new Float32Array(MAXQ*4*FLOATS); this.n=0;
    this.vbo=gl.createBuffer(); this.ibo=gl.createBuffer();
    const idx=new Uint32Array(MAXQ*6); for(let i=0;i<MAXQ;i++){idx.set([i*4,i*4+1,i*4+2,i*4,i*4+2,i*4+3],i*6);}
    this.vao=gl.createVertexArray(); gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER,this.vbo); gl.bufferData(gl.ARRAY_BUFFER,this.data.byteLength,gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.ibo); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,idx,gl.STATIC_DRAW);
    const st=FLOATS*4; gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0,2,gl.FLOAT,false,st,0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1,2,gl.FLOAT,false,st,8);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2,4,gl.FLOAT,false,st,16);
    gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3,1,gl.FLOAT,false,st,32);
    this.fvao=gl.createVertexArray(); gl.bindVertexArray(this.fvao); const fb=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,fb);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,1,1,-1,-1,1,1,-1,1]),gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
    gl.bindVertexArray(null);
    this.fbo=gl.createFramebuffer(); this.ftex=gl.createTexture();
    this.layers={base:[],add:[],ui:[]}; this.cur='base';
    this.cam={x:0,y:0,z:1}; this.torch=[0,0,300,1]; this.ambient=[0.05,0.06,0.08]; this.hurt=0;
    this.resize();
  }
  resize(){
    const d=Math.min(window.devicePixelRatio||1,2); const w=Math.floor(this.c.clientWidth*d), h=Math.floor(this.c.clientHeight*d);
    if(w===this.W&&h===this.H) return; this.W=this.c.width=w; this.H=this.c.height=h; this.dpr=d;
    const gl=this.gl; gl.bindTexture(gl.TEXTURE_2D,this.ftex);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.bindFramebuffer(gl.FRAMEBUFFER,this.fbo); gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,this.ftex,0);
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  }
  setLight(u8, w, h){ const gl=this.gl; gl.bindTexture(gl.TEXTURE_2D,this.ltex);
    if(w!==this.mapW||h!==this.mapH){ gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,u8); this.mapW=w; this.mapH=h; }
    else gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,u8); }
  layer(l){ this.cur=l; }
  // world-space quad push
  q(x,y,w,h,u0,v0,u1,v1,r,g,b,a,mode,rot=0){
    this.layers[this.cur].push([x,y,w,h,u0,v0,u1,v1,r,g,b,a,mode,rot]); }
  has(n){ return !!this.meta.s[n]; }
  size(n){ const s=this.meta.s[n]; return s?[s[2],s[3]]:[64,64]; }
  sprite(n,x,y,w,h,o={}){ const s=this.meta.s[n]; if(!s) return; const W=this.meta.w,H=this.meta.h;
    let u0=(s[0]+0.5)/W,u1=(s[0]+s[2]-0.5)/W; let v0=(s[1]+0.5)/H,v1=(s[1]+s[3]-0.5)/H;
    if(o.sub){ const [a,b,c,d]=o.sub; const du=u1-u0, dv=v1-v0; [u0,u1]=[u0+du*a,u0+du*c]; [v0,v1]=[v0+dv*b,v0+dv*d]; }
    if(o.flip){const t=u0;u0=u1;u1=t;}
    const t=o.tint||[1,1,1]; this.q(x,y,w,h,u0,v0,u1,v1,t[0],t[1],t[2],o.a??1,0,o.rot||0); }
  rect(x,y,w,h,c,a=1){ this.q(x,y,w,h,0,0,1,1,c[0],c[1],c[2],a,1); }
  glow(x,y,r,c,a=1){ this.q(x-r,y-r,r*2,r*2,0,0,1,1,c[0],c[1],c[2],a,2); }
  flush(list){ const gl=this.gl; let n=0; const d=this.data;
    for(const e of list){ if(n>=MAXQ) break; const [x,y,w,h,u0,v0,u1,v1,r,g,b,a,m,rot]=e; let o=n*4*FLOATS;
      let pts;
      if(rot){ const cx=x+w/2,cy=y+h/2,c=Math.cos(rot),s=Math.sin(rot); pts=[[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]].map(([px,py])=>[cx+px*c-py*s,cy+px*s+py*c]); }
      else pts=[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
      const uv=[[u0,v0],[u1,v0],[u1,v1],[u0,v1]];
      for(let k=0;k<4;k++){ d[o++]=pts[k][0]; d[o++]=pts[k][1]; d[o++]=uv[k][0]; d[o++]=uv[k][1]; d[o++]=r; d[o++]=g; d[o++]=b; d[o++]=a; d[o++]=m; }
      n++; }
    if(!n) return; gl.bindBuffer(gl.ARRAY_BUFFER,this.vbo); gl.bufferSubData(gl.ARRAY_BUFFER,0,d,0,n*4*FLOATS);
    gl.drawElements(gl.TRIANGLES,n*6,gl.UNSIGNED_INT,0); }
  setLightUniforms(p){ const gl=this.gl,u=p.u;
    gl.uniform1i(u.uLight,1); gl.uniform2f(u.uMap,this.mapW,this.mapH); gl.uniform1f(u.uT,this.T);
    gl.uniform4f(u.uTorch,...this.torch); gl.uniform3f(u.uAmbient,...this.ambient); }
  render(time){
    const gl=this.gl; this.resize(); const z=this.cam.z*this.dpr;
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D,this.ltex);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,this.tex);
    // pass 1: albedo
    gl.bindFramebuffer(gl.FRAMEBUFFER,this.fbo); gl.viewport(0,0,this.W,this.H);
    gl.clearColor(0.02,0.018,0.022,1); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(this.sp.p); gl.uniform2f(this.sp.u.uRes,this.W,this.H); gl.uniform3f(this.sp.u.uCam,this.cam.x,this.cam.y,z);
    gl.uniform1i(this.sp.u.uTex,0); gl.uniform1i(this.sp.u.uLit,0); this.setLightUniforms(this.sp);
    gl.bindVertexArray(this.vao); this.flush(this.layers.base);
    // pass 2: composite with light
    gl.bindFramebuffer(gl.FRAMEBUFFER,null); gl.disable(gl.BLEND);
    gl.useProgram(this.cp.p); const u=this.cp.u;
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D,this.ftex); gl.uniform1i(u.uScene,2);
    gl.uniform2f(u.uRes,this.W,this.H); gl.uniform3f(u.uCam,this.cam.x,this.cam.y,z); gl.uniform1f(u.uTime,time); gl.uniform1f(u.uHurt,this.hurt);
    this.setLightUniforms(this.cp); gl.bindVertexArray(this.fvao); gl.drawArrays(gl.TRIANGLES,0,6);
    gl.activeTexture(gl.TEXTURE0);
    // pass 3: additive lit particles + glows
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA,gl.ONE);
    gl.useProgram(this.sp.p); gl.uniform1i(this.sp.u.uLit,1); gl.bindVertexArray(this.vao); this.flush(this.layers.add);
    // pass 4: unlit overlay (telegraphs, text markers)
    gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA); gl.uniform1i(this.sp.u.uLit,0); this.flush(this.layers.ui);
    this.layers.base.length=0; this.layers.add.length=0; this.layers.ui.length=0; this.cur='base';
  }
}
