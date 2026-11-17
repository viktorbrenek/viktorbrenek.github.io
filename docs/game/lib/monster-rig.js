// Right-facing paper dolls for dungeon monsters.
const RIGS = {
  rat: {id: 'rat', height: 52, pose: drawRat},
  capling_r: {id: 'capling', height: 100, pose: drawCapling},
  spore_blob: {id: 'blob', height: 94, pose: drawBlob},
  gob_shroom: {id: 'gob', height: 97, pose: drawHumanoid},
  gob3: {id: 'archer', height: 100, pose: drawHumanoid},
  shaman1: {id: 'shaman', height: 108, pose: drawHumanoid},
  spore_mine: {id: 'mine', height: 94, pose: drawMine},
  crawler: {id: 'crawler', height: 100, pose: drawCrawler},
  stalker: {id: 'stalker', height: 101, pose: drawStalker},
  witch1: {id: 'witch', height: 114, pose: drawHumanoid},
  moth: {id: 'moth', height: 88, pose: drawMoth},
  tentacle: {id: 'tentacle', height: 106, pose: drawTentacle},
  spore_octo: {id: 'octo', height: 99, pose: drawOcto},
  burster: {id: 'burster', height: 99, pose: drawBurster},
  maw: {id: 'maw', height: 102, pose: drawMaw},
};
const SPORES = [[-39, -58, 8, 0], [30, -83, 7, 2.2], [44, -50, 6, 4.7]];
const HUMANOIDS = {
  gob: {head: [64, 53], body: [42, 46], weapon: [40, 44, .24, .76]},
  archer: {head: [73, 44], body: [41, 46], weapon: [29, 61, .76, .5]},
  shaman: {head: [65, 64], body: [46, 49], weapon: [18, 70, .5, .5]},
  witch: {head: [63, 68], body: [46, 49], weapon: [17, 71, .5, .53], cape: true, farGrip: [.73, -8]},
};

export function monsterStill(sprite) {
  const rig = RIGS[sprite];
  return rig ? `monster_${rig.id}_full` : null;
}

export function drawClassicMonster(R, sprite, e, bx, by, height, time, tint) {
  const rig = RIGS[sprite];
  if (!rig || !R.meta.s[monsterStill(sprite)]) return false;
  const scale = height / rig.height;
  const facing = e.flip ? -1 : 1;
  const dark = tint.map(value => value * 0.77);
  const cycle = e._wp || 0;
  const move = e._mv || 0;
  const stride = Math.sin(cycle) * move;
  const attack = e.lunge ? Math.sin(Math.PI * e.lunge.t) : 0;
  const phase = time + (e.x || 0) * 0.31 + (e.y || 0) * 0.49;

  // The local origin of each sprite is its attachment point on the body.
  const part = (name, x, y, w, h, px, py, angle = 0, shade = tint, a = 1, mirror = false) => {
    const c = Math.cos(angle), s = Math.sin(angle);
    const dx = w * (0.5 - px), dy = h * (0.5 - py);
    const cx = bx + facing * scale * (x + dx * c - dy * s);
    const cy = by + scale * (y + dx * s + dy * c);
    R.sprite(`monster_${rig.id}_${name}`, cx - w * scale / 2, cy - h * scale / 2, w * scale, h * scale, {
      flip: (facing < 0) !== mirror, rot: angle * facing, tint: shade, a,
    });
  };
  rig.pose(part, {id: rig.id, phase, move, stride, attack, anim: e.anim, dark, tele: e.tele?.kind});
  return true;
}

function drawRat(part, {phase, stride, attack, dark}) {
  const back = Math.sin(phase * 6) * 0.08 + stride * 0.1;
  const rise = -Math.abs(stride) * 2 + Math.sin(phase * 4) * 0.8;
  const reach = attack * 6;
  part('tail', -25 + reach, -22 + rise, 42, 17, 0.92, 0.32, back);
  part('foreleg', 12 + reach, -18, 15, 19, 0.43, 0.24, stride * 0.5, dark);
  part('hindleg', -21 + reach, -22, 23, 24, 0.49, 0.23, -stride * 0.46, dark);
  part('body', -6 + reach, -26 + rise, 62, 37, 0.5, 0.5, -attack * 0.08);
  part('hindleg', -14 + reach, -20, 23, 25, 0.49, 0.23, stride * 0.52);
  part('foreleg', 16 + reach, -17, 15, 21, 0.43, 0.24, -stride * 0.55 - attack * 0.55);
  part('head', 16 + reach, -29 + rise, 37, 34, 0.25, 0.61, Math.sin(phase * 5) * 0.04 - attack * 0.16);
}

function drawCapling(part, {phase, stride, attack, dark}) {
  const rise = -Math.abs(stride) * 3 + Math.sin(phase * 3) * 1.4;
  const reach = attack * 5;
  part('leg_far', 9, -21, 15, 21, 0.42, 0.14, stride * 0.47, dark);
  part('leg_near', -9, -20, 16, 22, 0.43, 0.14, -stride * 0.5);
  part('arm_far', 16 + reach, -49 + rise, 17, 30, 0.46, 0.18, -0.22 - stride * 0.31 - attack * 1.45, dark);
  part('body', reach, -39 + rise, 40, 43, 0.5, 0.5, attack * 0.15);
  part('head', 1 + reach, -51 + rise, 82, 75, 0.49, 0.79, stride * 0.07 + attack * 0.2);
  part('arm_near', -16 + reach, -44 + rise, 18, 30, 0.5, 0.19, 0.25 + stride * 0.39 - attack * 0.82);
}

function drawBlob(part, {phase, move, stride, dark, tele}) {
  const alert = tele === 'burst';
  const beat = Math.sin(phase * (alert ? 21 : 4.4));
  const puff = alert ? 0.19 + beat * 0.04 : beat * 0.045;
  const bounce = -Math.abs(stride) * 5;
  part('leg_far', 13, -18 + bounce, 15, 22, 0.48, 0.15, stride * 0.48, dark);
  part('leg_near', -11, -17 + bounce, 16, 22, 0.48, 0.15, -stride * 0.5);
  part('body', 0, -14 + bounce, 77 * (1 + puff), 68 * (1 + puff - move * 0.04), 0.5, 0.94, stride * 0.13);
  // Loose spores drift at distinct phases around the same body.
  for (const [x, y, size, offset] of SPORES) {
    const drift = Math.sin(phase * 3 + offset);
    part('spore', x * (1 + puff) + drift * 3, y + bounce - drift * 5, size, size, 0.5, 0.5, 0, undefined, 0.72 + drift * 0.2);
  }
}

function drawHumanoid(part, {id, phase, stride, attack, anim, dark}) {
  const rig = HUMANOIDS[id];
  const caster = id === 'shaman' || id === 'witch';
  const draw = id === 'archer' && anim?.k === 'shoot' ? Math.cos(anim.t * Math.PI / 2) ** 2 : 0;
  const cast = caster && anim?.k === 'cast' ? Math.sin(Math.PI * (0.2 + anim.t * 0.8)) : 0;
  const rise = -Math.abs(stride) * 2 + Math.sin(phase * 3) - cast * 2;
  const lean = attack * 4 - draw * 2;
  const shoulder = -49 + rise;
  const nearArm = .24 + stride * .35 - draw * 1.59 - cast * 1.34 - attack * .28;
  const farArm = (caster ? -.86 : -.28) - stride * .30 - draw * 1.24 - cast * .63 - attack * 1.35;

  if (rig.cape) part('cape', -8 + lean, -57 + rise, 53, 60, .62, .14, .06 + stride * .13 + cast * .24, dark);
  part('leg_far', 8, -22, 18, 25, .47, .16, stride * .45, dark);
  part('leg_near', -9, -21, 19, 25, .47, .16, -stride * .45);
  // Draw the weapon and its gripping hand behind the torso on either facing.
  const fx = 15 + lean, fy = shoulder - (rig.cape ? 4 : 0);
  const [shoulderX, handDx] = rig.farGrip ?? [.48, 3];
  const handX = fx + handDx * Math.cos(farArm) - 22 * Math.sin(farArm);
  const handY = fy + handDx * Math.sin(farArm) + 22 * Math.cos(farArm);
  const weaponAngle = id === 'gob' ? .1 - attack * 1.03 : id === 'archer' ? .34 - draw * .08 : .2 + cast * .25;
  part('weapon', handX, handY, ...rig.weapon, weaponAngle);
  part('arm_far', fx, fy, 19, 33, shoulderX, .16, farArm, dark);
  part('body', lean, -39 + rise, ...rig.body, .5, .5, attack * .12);
  part('head', 1 + lean, -57 + rise, ...rig.head, .48, .83, stride * .045 - draw * .1 + attack * .11);
  part('arm_near', -16 + lean, shoulder + 3, 21, 34, .46, .16, nearArm);
}

function drawMine(part, {phase, dark, tele}) {
  const armed = tele === 'mine';
  const breath = Math.sin(phase * 3.8);
  const throb = Math.sin(phase * 22);
  const swell = armed ? 1.2 + throb * .07 : 1 + breath * .045;
  const shift = armed ? Math.sin(phase * 37) * 2 : 0;
  const crownY = -13 - 60 * swell;
  const lift = armed ? .37 + throb * .13 : breath * .08;
  part('root', -11, -15, 18, 18, .59, .19, .1 + lift * .18, dark, 1, true);
  part('root', 11, -15, 18, 18, .41, .19, -.1 - lift * .18);
  part('tendril', shift - 24 * swell, -47, 19, 34, .75, .2, .42 + lift, dark, 1, true);
  part('horn_far', shift - 13 * swell, crownY + 7, 16, 22, .59, .82, -lift, dark);
  part('horn_near', shift + 12 * swell, crownY + 7, 17, 25, .42, .82, lift);
  part('tendril', shift + 28 * swell, -42, 18, 35, .25, .2, -.42 - lift);
  part('body', shift, -12, 64 * swell, 65 * swell, .5, .91, shift * .025);
  if (armed) {
    part('spore', shift + 32, crownY + 3 + throb * 4, 8, 8, .5, .5, 0, undefined, .85);
    part('spore', shift - 29, crownY + 8 - throb * 6, 6, 6, .5, .5, 0, undefined, .7);
  }
}

function drawCrawler(part, {phase, stride, attack, dark}) {
  const bob = -.9 * Math.abs(stride) + Math.sin(phase * 4) * 1.1;
  const lean = attack * 8;
  const shoulder = -25 + bob;
  part('hindleg', -19 + lean, shoulder - 4, 18, 25, .66, .2, -stride * .46, dark);
  part('foreleg', 17 + lean, shoulder, 16, 24, .38, .18, stride * .5 - attack * .25, dark);
  part('hindleg', -14 + lean, shoulder - 2, 21, 26, .66, .18, stride * .53);
  part('foreleg', 14 + lean, shoulder + 1, 17, 24, .38, .18, -stride * .56 - attack * .65);
  part('antenna', lean - 3, -58 + bob, 26, 47, .35, .89, stride * .17 + Math.sin(phase * 5) * .14 + attack * .5);
  part('feeler', 20 + lean, -42 + bob, 15, 14, .21, .62, -stride * .13 - attack * .32);
  part('body', lean, -37 + bob, 57, 54, .5, .5, attack * .12);
  part('spore', lean - 22, -71 + Math.sin(phase * 3) * 4, 6, 6, .5, .5, 0, undefined, .67);
}

function drawStalker(part, {phase, stride, attack, dark}) {
  const bob = -Math.abs(stride) * 2.5 + Math.sin(phase * 3.8) * 1.25;
  const lean = attack * 7;
  const base = -24 + bob;
  const curl = Math.sin(phase * 4) * .12 + attack * .38;
  part('arm_far', -18 + lean, -39 + bob, 33, 31, .8, .76, curl - stride * .23, dark);
  part('hindleg', -9 + lean, base - 2, 23, 24, .61, .19, -stride * .5, dark);
  part('foreleg', 14 + lean, base - 2, 20, 24, .43, .18, stride * .53, dark);
  part('hindleg', -13 + lean, base, 26, 28, .61, .19, stride * .5);
  part('foreleg', 11 + lean, base, 24, 27, .43, .18, -stride * .53 - attack * .39);
  part('arm_near', 18 + lean, -37 + bob, 30, 31, .19, .77, -curl + stride * .27 - attack * .51);
  part('body', lean, -40 + bob, 48, 49, .5, .5, attack * .16);
  part('cap', lean, -58 + bob, 74, 47, .5, .76, -stride * .13 + attack * .26);
}

function drawMoth(part, {phase, move, attack, dark}) {
  const bob = Math.sin(phase * 7) * 3 - move * 3 - attack * 5;
  const flap = Math.sin(phase * (24 + move * 8));
  const spread = .74 + Math.abs(flap) * .26;
  const turn = .2 + flap * .27 - attack * .24;
  const reach = attack * 9;
  part('hind_l', reach - 8, -40 + bob, 32 * spread, 24, .83, .22, -turn * .8, dark);
  part('hind_r', reach + 9, -41 + bob, 34 * spread, 24, .16, .21, turn * .8);
  part('wing_l', reach - 9, -47 + bob, 46 * spread, 29, .85, .76, -turn, dark);
  part('wing_r', reach + 9, -48 + bob, 46 * spread, 29, .15, .76, turn);
  part('body', reach - 3, -42 + bob, 29, 33, .49, .22, -attack * .4);
  part('head', reach + 3, -48 + bob, 34, 42, .49, .83, .07 + attack * .25);
}

function drawTentacle(part, {phase, stride, attack, dark}) {
  const curl = Math.sin(phase * 4.8) * .17;
  const bend = Math.sin(phase * 3) * .1 + stride * .13 + attack * .91;
  const stemX = -2 + attack * 3, stemY = -23;
  const sin = Math.sin(bend), cos = Math.cos(bend);
  const topX = stemX + sin * 38 + cos * 4, topY = stemY - cos * 38 + sin * 4;
  part('arm_far', -11, -23, 36, 47, .82, .84, curl + attack * .3, dark);
  part('arm_near', 10, -20, 37, 48, .19, .86, -curl - attack * .69);
  part('stem', stemX, stemY, 35, 55, .5, .89, bend);
  part('head', topX, topY, 44, 46, .47, .87, bend * .74);
  part('base', 0, -12, 63, 25, .5, .5, stride * .06);
  if (attack > .45) part('spore', topX + 25, topY - 9, 7, 7, .5, .5, 0, undefined, attack * .72);
}

function drawOcto(part, {phase, stride, attack, anim, tele, dark}) {
  const cast = anim?.k === 'cast' ? Math.sin(Math.PI * (.2 + anim.t * .8)) : 0;
  const power = Math.max(cast, tele === 'puddle' ? .63 : 0);
  const sway = Math.sin(phase * 5);
  const bob = -Math.abs(stride) * 2 + sway * 1.4 - power * 4;
  const lean = attack * 6;
  part('leg_far', -12 + lean, -19, 24, 23, .61, .17, stride * .47, dark);
  part('leg_near', 13 + lean, -18, 24, 23, .4, .18, -stride * .47);
  part('arm_far', lean - 23 - power * 4, -30 + bob, 29, 28, .79, .72, -sway * .14 - power * .4, dark);
  part('arm_near', lean + 23 + power * 4, -30 + bob, 32, 31, .21, .72, sway * .14 + power * .45 + attack * .25);
  part('body', lean, -22 + bob, 62 * (1 + power * .055), 68 * (1 + power * .10), .5, .91, stride * .07 + attack * .20);
  if (power > .1) {
    part('spore', lean + 36, -60 + bob - sway * 2, 9, 9, .5, .5, 0, undefined, power);
    part('spore', lean - 31, -51 + bob + sway * 4, 6, 6, .5, .5, 0, undefined, power * .8);
  }
}

function drawBurster(part, {phase, stride, dark, tele}) {
  const warning = tele === 'burst';
  const wave = Math.sin(phase * (warning ? 24 : 4));
  const swell = warning ? 1.18 + wave * .075 : 1 + wave * .045;
  const shift = warning ? Math.sin(phase * 39) * 2.5 : 0;
  const bounce = -Math.abs(stride) * 2;
  part('hindleg', -18, -32 + bounce, 24, 32, .66, .18, stride * .40, dark);
  part('foreleg', 17, -29 + bounce, 24, 32, .33, .16, -stride * .39, dark);
  part('hindleg', -13, -27 + bounce, 26, 33, .66, .18, -stride * .47);
  part('foreleg', 14, -26 + bounce, 26, 33, .33, .17, stride * .47);
  part('body', shift, -29 + bounce, 56 * (1 + (swell - 1) * .5), 31, .50, .5, shift * .02);
  part('bulb', shift, -34 + bounce, 62 * swell, 58 * swell, .5, .83, stride * .09 + shift * .04);
  part('spore', 35 * swell, -67 - wave * 4, 8, 8, .5, .5, 0, undefined, warning ? 1 : .72);
  if (warning) part('cinder', -31 * swell, -71 + wave * 6, 10, 12, .5, .5, wave * .45);
}

function drawMaw(part, {phase, stride, attack, dark}) {
  const bob = -Math.abs(stride) * 2 + Math.sin(phase * 3.6) * 1.5;
  const reach = attack * 8;
  const open = .08 + attack * .66;
  part('leg', -11, -20, 20, 23, .51, .16, -stride * .40, dark);
  part('leg', 13, -21, 20, 23, .51, .16, stride * .40);
  part('arm', -19 + reach, -45 + bob, 22, 36, .65, .17, .14 + stride * .39, dark, 1, true);
  part('arm', 20 + reach, -45 + bob, 24, 36, .35, .17, -.12 - stride * .39 - attack * .70);
  part('body', reach, -35 + bob, 54, 46, .5, .5, attack * .1);
  part('mouth', reach + 8, -40 + bob, 48, 30 + open * 21, .53, .52, open * .07);
  part('jaw', reach - 20, -39 + bob, 54, 26, .10, .16, open * .49);
  part('head', reach - 20, -48 + bob, 64, 47, .14, .8, -.05 - open * .36);
}
