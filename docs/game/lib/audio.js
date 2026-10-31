// Sporium audio: procedural WebAudio SFX + generative dungeon music.
// Any sound can be replaced by a real file: list it in assets/audio/manifest.json
// e.g. {"sfx":{"hit":["hit1.ogg","hit2.ogg"]},"music":{"halls":"halls.ogg","combat":"combat.ogg"}}
const PENTA=[0,3,5,7,10]; const BIOME_ROOT={halls:45,roots:43,drowned:47};
const mtof=m=>440*Math.pow(2,(m-69)/12);
class Audio{
  constructor(){ this.ctx=null; this.vol=this.load(); this.files={sfx:{},music:{}}; this.buffers=new Map(); this.last={}; this.state='explore'; this.biome='halls'; }
  load(){ try{ return JSON.parse(localStorage.getItem('sporium_audio'))||{master:0.8,music:0.55,sfx:0.8,muted:false}; }catch(e){ return {master:0.8,music:0.55,sfx:0.8,muted:false}; } }
  saveVol(){ try{ localStorage.setItem('sporium_audio',JSON.stringify(this.vol)); }catch(e){} this.apply(); }
  apply(){ if(!this.ctx) return; const t=this.ctx.currentTime; this.master.gain.setTargetAtTime(this.vol.muted?0:this.vol.master,t,0.05); this.musicBus.gain.setTargetAtTime(this.vol.music,t,0.1); this.sfxBus.gain.setTargetAtTime(this.vol.sfx,t,0.05); }
  toggleMute(){ this.vol.muted=!this.vol.muted; this.saveVol(); return this.vol.muted; }
  async init(){
    if(this.ctx){ if(this.ctx.state==='suspended') this.ctx.resume(); return; }
    const C=window.AudioContext||window.webkitAudioContext; if(!C) return; this.setup(new C()); this.startMusic();
    fetch('assets/audio/manifest.json').then(r=>r.ok?r.json():null).then(m=>{ if(m){ this.files={sfx:m.sfx||{},music:m.music||{}}; this.musicFile(); } }).catch(()=>{});
  }
  setup(c){ this.ctx=c;
    this.master=c.createGain(); const comp=c.createDynamicsCompressor(); comp.threshold.value=-14; comp.ratio.value=4; this.master.connect(comp).connect(c.destination);
    this.musicBus=c.createGain(); this.sfxBus=c.createGain(); this.musicBus.connect(this.master); this.sfxBus.connect(this.master);
    this.verb=c.createConvolver(); this.verb.buffer=this.impulse(3.2,2.6); this.verbIn=c.createGain(); this.verbIn.gain.value=0.9; this.verbIn.connect(this.verb).connect(this.master);
    this.noiseBuf=c.createBuffer(1,c.sampleRate*2,c.sampleRate); const d=this.noiseBuf.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
    this.apply();
  }
  impulse(sec,decay){ const c=this.ctx, n=c.sampleRate*sec, b=c.createBuffer(2,n,c.sampleRate); for(let ch=0;ch<2;ch++){ const d=b.getChannelData(ch); for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/n,decay); } return b; }
  async buf(url){ if(this.buffers.has(url)) return this.buffers.get(url); const p=fetch('assets/audio/'+url).then(r=>r.arrayBuffer()).then(a=>this.ctx.decodeAudioData(a)).catch(()=>null); this.buffers.set(url,p); return p; }
  // ---------- building blocks ----------
  out(pan=0,wet=0.25){ const c=this.ctx, g=c.createGain(), p=c.createStereoPanner(); p.pan.value=Math.max(-1,Math.min(1,pan)); g.connect(p); p.connect(this.sfxBus); if(wet){ const w=c.createGain(); w.gain.value=wet; p.connect(w).connect(this.verbIn); } return g; }
  env(g,t,a,h,r,peak){ g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(peak,t+a); g.gain.setValueAtTime(peak,t+a+h); g.gain.exponentialRampToValueAtTime(0.0001,t+a+h+r); }
  osc(dst,type,f0,f1,t,dur,peak,a=0.005){ const c=this.ctx, o=c.createOscillator(), g=c.createGain(); o.type=type; o.frequency.setValueAtTime(f0,t); if(f1!==f0) o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur); this.env(g,t,a,0,dur,peak); o.connect(g).connect(dst); o.start(t); o.stop(t+a+dur+0.05); return o; }
  noise(dst,t,dur,peak,type,f0,f1,q=1,a=0.003){ const c=this.ctx, s=c.createBufferSource(), f=c.createBiquadFilter(), g=c.createGain(); s.buffer=this.noiseBuf; s.loop=true; f.type=type; f.Q.value=q; f.frequency.setValueAtTime(f0,t); if(f1!==f0) f.frequency.exponentialRampToValueAtTime(Math.max(30,f1),t+dur); this.env(g,t,a,0,dur,peak); s.connect(f).connect(g).connect(dst); s.start(t,Math.random()); s.stop(t+a+dur+0.05); }
  pluck(dst,f,t,dur,peak){ const c=this.ctx, o=c.createOscillator(), o2=c.createOscillator(), fl=c.createBiquadFilter(), g=c.createGain(); o.type='sawtooth'; o2.type='triangle'; o.frequency.value=f; o2.frequency.value=f*1.003; fl.type='lowpass'; fl.frequency.setValueAtTime(f*8,t); fl.frequency.exponentialRampToValueAtTime(f*1.2,t+dur*0.6); this.env(g,t,0.003,0,dur,peak); o.connect(fl); o2.connect(fl); fl.connect(g).connect(dst); o.start(t); o2.start(t); o.stop(t+dur+0.1); o2.stop(t+dur+0.1); }
  bell(dst,f,t,dur,peak){ for(const [r,a] of [[1,1],[2.76,0.4],[5.4,0.18],[0.5,0.3]]) this.osc(dst,'sine',f*r,f*r,t,dur*(r>1?0.6:1),peak*a,0.004); }
  // ---------- SFX ----------
  play(name,{x,y,px,py,vol=1,at=0,note=0}={}){
    if(!this.ctx||this.vol.muted) return; const c=this.ctx, t=c.currentTime+at;
    const now=performance.now(); const gap={step:90,hit:40,hover:60,coin:50,die:40,crystal:0}[name]??25; if(now-(this.last[name]||0)<gap) return; this.last[name]=now;
    let pan=0, att=1; if(x!=null&&px!=null){ const dx=x-px, dy=y-py; pan=dx/8; att=Math.max(0.15,1-Math.hypot(dx,dy)/14); }
    const files=this.files.sfx[name]; if(files&&files.length){ this.buf(files[Math.floor(Math.random()*files.length)]).then(b=>{ if(!b) return; const s=c.createBufferSource(); s.buffer=b; s.playbackRate.value=0.94+Math.random()*0.12; const o=this.out(pan,0.2); o.gain.value=vol*att; s.connect(o); s.start(); }); return; }
    const o=this.out(pan,{ui_click:0.05,hover:0,step:0.1}[name]??0.28); o.gain.value=vol*att; const R=(a,b)=>a+Math.random()*(b-a);
    switch(name){
      case 'crystal': { const f=mtof(72+[0,3,7,10,12][note%5]); this.bell(o,f,t,1.8,0.2); this.osc(o,'sine',f*2,f*2,t,0.8,0.05); break; }
      case 'hover': this.osc(o,'sine',1400,1300,t,0.03,0.04); break;
      case 'ui_click': this.noise(o,t,0.04,0.25,'bandpass',2200,1800,3); this.osc(o,'triangle',320,180,t,0.06,0.18); break;
      case 'open': this.noise(o,t,0.22,0.22,'lowpass',900,300,1); this.osc(o,'sine',110,70,t,0.18,0.3); break;
      case 'close': this.noise(o,t,0.12,0.15,'lowpass',600,250,1); this.osc(o,'sine',90,60,t,0.12,0.22); break;
      case 'step': this.noise(o,t,0.07,0.12,'bandpass',R(350,520),200,1.5); break;
      case 'swing': this.noise(o,t,0.16,0.35,'bandpass',600,2600,2.5,0.03); break;
      case 'bow': this.pluck(o,R(150,180),t,0.25,0.3); this.noise(o,t+0.02,0.12,0.15,'highpass',3000,5000,1); break;
      case 'zap': this.osc(o,'square',R(500,600),180,t,0.18,0.08); this.noise(o,t,0.15,0.15,'bandpass',1800,800,4); break;
      case 'hit': this.noise(o,t,0.09,0.5,'lowpass',2400,400,1); this.osc(o,'sine',R(130,170),55,t,0.12,0.5); break;
      case 'crit': this.noise(o,t,0.12,0.6,'lowpass',5000,600,1); this.osc(o,'sine',190,50,t,0.18,0.7); this.osc(o,'square',R(900,1100),700,t,0.08,0.06); break;
      case 'hurt': this.osc(o,'sawtooth',150,70,t,0.2,0.22); this.noise(o,t,0.15,0.4,'lowpass',1400,300,1); break;
      case 'dodge': this.noise(o,t,0.14,0.2,'highpass',2500,5000,1,0.02); break;
      case 'block': this.noise(o,t,0.08,0.4,'bandpass',900,700,4); this.osc(o,'triangle',220,200,t,0.15,0.25); break;
      case 'die': this.noise(o,t,0.35,0.35,'bandpass',900,140,3); this.osc(o,'sawtooth',R(200,260),60,t,0.3,0.08); break;
      case 'bossdie': this.osc(o,'sawtooth',90,30,t,1.6,0.35,0.02); this.noise(o,t,1.4,0.5,'lowpass',1500,80,1,0.02); this.bell(o,mtof(57),t+0.3,2.5,0.12); break;
      case 'coin': for(let i=0;i<3;i++) this.osc(o,'sine',R(2200,3300),R(2000,3000),t+i*0.05,0.12,0.12); break;
      case 'loot': this.bell(o,mtof(76),t,0.5,0.12); break;
      case 'loot_rare': this.bell(o,mtof(79),t,0.7,0.14); this.bell(o,mtof(86),t+0.08,0.7,0.1); break;
      case 'loot_leg': [72,79,84,88,91].forEach((m,i)=>this.bell(o,mtof(m),t+i*0.07,1.4,0.12)); this.noise(o,t,1.2,0.08,'highpass',6000,9000,1,0.2); break;
      case 'potion': for(let i=0;i<6;i++) this.osc(o,'sine',R(300,600),R(600,1100),t+i*0.06,0.07,0.12); break;
      case 'levelup': [60,64,67,72,76,79].forEach((m,i)=>this.bell(o,mtof(m),t+i*0.08,1.2,0.12)); break;
      case 'equip': this.noise(o,t,0.1,0.25,'bandpass',1200,700,2); this.osc(o,'triangle',600,400,t,0.08,0.1); break;
      case 'salvage': this.noise(o,t,0.25,0.25,'highpass',2000,600,1); this.osc(o,'sine',400,120,t,0.25,0.12); break;
      case 'learn': [67,71,74,79].forEach((m,i)=>this.bell(o,mtof(m),t+i*0.1,1,0.1)); break;
      case 'sporebolt': this.noise(o,t,0.3,0.3,'bandpass',600,2400,3,0.02); for(let i=0;i<4;i++) this.osc(o,'sine',R(400,900),R(900,1500),t+i*0.04,0.06,0.07); break;
      case 'puffbomb': this.osc(o,'sine',120,35,t,0.5,0.8); this.noise(o,t,0.6,0.5,'lowpass',2500,200,1); this.noise(o,t+0.1,0.8,0.15,'highpass',3000,1500,1,0.1); break;
      case 'plague': this.noise(o,t,1.0,0.25,'bandpass',300,1200,6,0.2); this.osc(o,'sawtooth',55,52,t,1,0.06,0.2); break;
      case 'fire': this.noise(o,t,0.6,0.4,'lowpass',400,3000,1,0.05); for(let i=0;i<8;i++) this.noise(o,t+R(0,0.5),0.03,0.25,'highpass',3000,3000,1); break;
      case 'blink': this.osc(o,'sine',300,2400,t,0.25,0.18); this.osc(o,'sine',2400,300,t+0.22,0.2,0.12); break;
      case 'drain': this.osc(o,'sawtooth',420,110,t,0.5,0.08); this.osc(o,'sawtooth',428,113,t,0.5,0.08); break;
      case 'bash': this.osc(o,'sine',110,40,t,0.25,0.9); this.noise(o,t,0.12,0.5,'lowpass',1200,200,1); break;
      case 'cleave': this.noise(o,t,0.25,0.5,'bandpass',400,3000,2,0.04); this.osc(o,'sine',140,60,t+0.12,0.12,0.3); break;
      case 'buff': [62,69,74].forEach((m,i)=>this.osc(o,'triangle',mtof(m),mtof(m),t+i*0.05,0.6,0.08,0.05)); break;
      case 'warcry': this.osc(o,'sawtooth',110,80,t,0.6,0.25,0.03); this.osc(o,'sawtooth',165,118,t,0.6,0.15,0.03); this.noise(o,t,0.5,0.3,'bandpass',700,400,2,0.03); break;
      case 'warn': this.osc(o,'sawtooth',70,90,t,0.45,0.18,0.05); this.noise(o,t,0.4,0.2,'lowpass',300,600,1,0.05); break;
      case 'slam': this.osc(o,'sine',90,30,t,0.5,1); this.noise(o,t,0.4,0.6,'lowpass',1800,100,1); break;
      case 'roar': { const os=this.osc(o,'sawtooth',80,55,t,1.3,0.4,0.08); const l=c.createOscillator(), lg=c.createGain(); l.frequency.value=22; lg.gain.value=18; l.connect(lg).connect(os.frequency); l.start(t); l.stop(t+1.5); this.noise(o,t,1.2,0.35,'bandpass',500,250,2,0.08); break; }
      case 'alert': this.osc(o,'triangle',R(500,600),R(800,900),t,0.1,0.05); break;
      case 'chest': this.noise(o,t,0.35,0.25,'bandpass',300,700,6,0.05); this.play('coin'); break;
      case 'squish': this.noise(o,t,0.25,0.4,'lowpass',900,150,2); this.osc(o,'sine',260,80,t,0.2,0.25); break;
      case 'ignite': this.noise(o,t,0.5,0.4,'bandpass',200,1600,1,0.03); this.osc(o,'sine',90,180,t,0.4,0.25); break;
      case 'rune': this.bell(o,mtof(81),t,1.6,0.14); this.bell(o,mtof(88),t+0.05,1.4,0.06); break;
      case 'wrong': this.osc(o,'square',220,207,t,0.4,0.08); this.osc(o,'square',233,220,t,0.4,0.08); break;
      case 'gate': this.noise(o,t,1.4,0.35,'bandpass',180,120,4,0.1); this.osc(o,'sawtooth',45,40,t,1.3,0.15,0.1); break;
      case 'shrine': [57,64,69,72,76].forEach(m=>this.osc(o,'sine',mtof(m),mtof(m),t,2.2,0.07,0.4)); break;
      case 'ambush': [[45,48],[46,49]].forEach(([a,b],i)=>{ this.osc(o,'sawtooth',mtof(a),mtof(a),t+i*0.25,0.5,0.12,0.02); this.osc(o,'sawtooth',mtof(b),mtof(b),t+i*0.25,0.5,0.12,0.02); }); this.osc(o,'sine',60,40,t,0.6,0.8); break;
      case 'curse': this.osc(o,'sawtooth',110,55,t,1.2,0.15,0.1); this.osc(o,'sawtooth',116,58,t,1.2,0.15,0.1); this.noise(o,t,1,0.2,'bandpass',800,200,5,0.2); break;
      case 'descend': this.noise(o,t,1.5,0.4,'lowpass',2000,90,1,0.1); this.osc(o,'sine',220,55,t,1.5,0.3,0.1); break;
      case 'death': [57,56,53,50].forEach((m,i)=>this.osc(o,'triangle',mtof(m),mtof(m-1),t+i*0.35,0.9,0.15,0.05)); this.osc(o,'sine',55,30,t,2.5,0.4,0.2); break;
    }
  }
  // ---------- generative music ----------
  setState(state,biome){ if(this.state!==state){ this.state=state; this.musicFile(); } if(biome&&this.biome!==biome){ this.biome=biome; this.retune(); this.musicFile(); } }
  startMusic(){
    const c=this.ctx; this.mus=c.createGain(); this.mus.connect(this.musicBus); const mw=c.createGain(); mw.gain.value=0.7; this.mus.connect(mw).connect(this.verbIn);
    this.drone=[]; const lp=this.droneLP=c.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=320; lp.Q.value=2; const dg=this.droneGain=c.createGain(); dg.gain.value=0.045; lp.connect(dg).connect(this.mus);
    for(const [r,ty,det] of [[1,'sawtooth',-6],[1,'sawtooth',6],[1.5,'triangle',0],[0.5,'sine',0]]){ const o=c.createOscillator(); o.type=ty; o.detune.value=det; o.connect(lp); o.start(); this.drone.push([o,r]); }
    const lfo=c.createOscillator(), lg=c.createGain(); lfo.frequency.value=0.05; lg.gain.value=160; lfo.connect(lg).connect(lp.frequency); lfo.start();
    this.retune(); this.nextT=c.currentTime+0.5; this.step=0; if(!this.offline) this.timer=setInterval(()=>this.schedule(),120);
  }
  retune(){ if(!this.drone) return; const f=mtof(BIOME_ROOT[this.biome]||45)/2; const t=this.ctx.currentTime; for(const [o,r] of this.drone) o.frequency.setTargetAtTime(f*r,t,2); }
  musicFile(){ if(!this.ctx) return; const key=this.state==='explore'?this.biome:this.state; const f=this.files.music[key]||this.files.music[this.biome];
    if(f===this.curFile) return; this.curFile=f; const t=this.ctx.currentTime;
    if(this.fileSrc){ const old=this.fileSrc; old.g.gain.setTargetAtTime(0,t,0.8); setTimeout(()=>old.s.stop(),4000); this.fileSrc=null; }
    this.mus.gain.setTargetAtTime(f?0:1,t,1.0);
    if(f) this.buf(f).then(b=>{ if(!b||this.curFile!==f) return; const s=this.ctx.createBufferSource(), g=this.ctx.createGain(); s.buffer=b; s.loop=true; g.gain.value=0; g.gain.setTargetAtTime(0.9,this.ctx.currentTime,1); s.connect(g).connect(this.musicBus); s.start(); this.fileSrc={s,g}; }); }
  schedule(horizon=0.4,force=false){
    const c=this.ctx; if(!c||(!force&&c.state!=='running')) return; const root=BIOME_ROOT[this.biome]||45; const st=this.state;
    const bpm=st==='boss'?96:st==='combat'?84:58; const beat=60/bpm/2;
    const tgt=st==='explore'?320:st==='combat'?520:800; this.droneLP.frequency.setTargetAtTime(tgt,c.currentTime,1.5); this.droneGain.gain.setTargetAtTime(st==='explore'?0.045:0.06,c.currentTime,1);
    while(this.nextT<c.currentTime+horizon){ const t=this.nextT, s=this.step++;
      // sparse melody: minor pentatonic bells / plucks
      const p=st==='explore'?0.16:0.22; if(Math.random()<p){ const deg=PENTA[Math.floor(Math.random()*5)], oct=12*(1+Math.floor(Math.random()*2)); const f=mtof(root+deg+oct);
        if(Math.random()<0.6) this.bell(this.mus,f,t,2.4,0.035); else this.pluck(this.mus,f,t,0.9,0.05); }
      // low heartbeat / percussion
      if(st!=='explore'){ if(s%8===0||s%8===3) this.kick(t,st==='boss'?0.55:0.4); if(st==='boss'&&s%4===2) this.noise(this.mus,t,0.08,0.06,'highpass',4000,6000,1); if(s%16===12) this.osc(this.mus,'sawtooth',mtof(root-12+1),mtof(root-12+1),t,beat*4,0.05,0.2); }
      else if(s%32===0&&Math.random()<0.5) { this.kick(t,0.25); this.kick(t+0.28,0.18); }
      // distant drips / creaks
      if(Math.random()<0.025) this.osc(this.mus,'sine',2400+Math.random()*1200,1200,t,0.05,0.03);
      this.nextT+=beat; }
  }
  kick(t,v){ this.osc(this.mus,'sine',110,38,t,0.35,v); this.noise(this.mus,t,0.05,v*0.2,'lowpass',800,200,1); }
}
export {Audio as AudioEngine};
export const audio=new Audio();
