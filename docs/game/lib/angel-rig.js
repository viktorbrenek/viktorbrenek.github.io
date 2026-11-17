// Right-facing paper dolls. Coordinates are in rig units relative to the ground.
// Wings and limbs rotate around their attachment points, not their sprite centers.
const ANGELS = {
  cherub: {
    head: [1, -59, 43, 45], body: [0, -46, 39, 42],
    shoulders: [-14, 12, -52], hips: [-8, 6, -30],
    upper: [11, 17], lower: [13, 16], boot: [13, 19],
    wings: [10, -48, 40, 40], weapon: [49, 49],
  },
  seraph: {
    head: [1, -69, 39, 45], body: [0, -55, 38, 52],
    shoulders: [-13, 13, -65], hips: [-8, 7, -34],
    upper: [10, 18], lower: [16, 18], boot: [12, 22],
    wings: [9, -59, 49, 50],
  },
  arch: {
    head: [0, -59, 44, 51], body: [0, -45, 46, 51],
    shoulders: [-18, 16, -56], hips: [-10, 8, -27],
    upper: [15, 21], lower: [16, 20], boot: [18, 25],
    wings: [12, -52, 61, 61], weapon: [55, 55], farGrip: [0.71, 0.19],
  },
};

export function angelStill(core, closed) {
  if (core === 'ophan') return closed ? 'angel_ophan_closed' : 'angel_ophan_open';
  return ANGELS[core] ? `angel_${core}_full` : null;
}

export function drawCoreAngel(R, e, bx, by, k, time, tint) {
  const core = e.def?.core;
  const still = angelStill(core, e.closed);
  if (!still || !R.meta.s[still]) return false;
  const phase = time + (e.x || 0) * 0.37;
  const bob = Math.sin(phase * 3);
  if (core === 'ophan') {
    const [, , iw, ih] = R.meta.s[still];
    const h = 88 * k, w = h * iw / ih;
    const rot = e.closed ? bob * 0.035 : Math.sin(phase * 6) * 0.13;
    R.sprite(still, bx - w / 2, by - h - (6 + 2 * bob) * k, w, h, {rot, tint});
    return true;
  }

  const rig = ANGELS[core];
  const facing = e.flip ? -1 : 1;
  const mv = e._mv || 0;
  const stride = Math.sin(e._wp || 0) * mv;
  const attack = e.anim || (e.lunge && {k: 'swing', t: e.lunge.t});
  const strength = attack ? Math.sin(Math.PI * attack.t) : 0;
  const cast = Math.max(e.tele && core !== 'cherub' ? 0.58 : 0, attack?.k === 'cast' ? strength : 0);
  const dive = Math.max(e.tele && core === 'cherub' ? 0.42 : 0, attack?.k === 'dive' ? strength : 0);
  const swing = attack?.k === 'swing' ? strength : 0;
  const flap = Math.sin(phase * (core === 'cherub' ? 10 : 5)) * (0.14 + mv * 0.16);
  const lift = bob * 2 - cast * 3 - dive * 3 - (core === 'arch' ? 0 : 3);
  const lean = dive * 10 + swing * 3;
  const dark = tint.map(c => c * 0.83);

  const part = (name, x, y, w, h, px = 0.5, py = 0.5, angle = 0, shade = tint, alpha = 1) => {
    const dx = w * (0.5 - px), dy = h * (0.5 - py);
    const c = Math.cos(angle), s = Math.sin(angle);
    const cx = bx + facing * k * (x + lean + dx * c - dy * s);
    const cy = by + k * (y + lift + dx * s + dy * c);
    R.sprite(`angel_${core}_${name}`, cx - w * k / 2, cy - h * k / 2, w * k, h * k, {
      flip: facing < 0, rot: facing * angle, tint: shade, a: alpha,
    });
  };
  const wing = (name, side, x, y, w, h, angle, shade = tint) =>
    part(`${name}_${side}`, x, y, w, h, side === 'l' ? 0.83 : 0.17, 0.74, angle, shade);
  const [wx, wy, ww, wh] = rig.wings;
  if (core === 'arch') part('banner', -23, -51, 22, 49, 0.6, 0.17, 0.18 + bob * 0.12);
  wing('wing', 'r', wx, wy, ww * 0.91, wh * 0.91, flap - cast * 0.3 + dive * 0.45, dark);
  wing('wing', 'l', -wx, wy, ww, wh, -flap + cast * 0.3 - dive * 0.45);
  if (core === 'seraph') {
    wing('foot', 'r', 9 - stride * 6, -16, 24, 12, flap * 0.7, dark);
    wing('foot', 'l', -9 + stride * 6, -16, 24, 12, -flap * 0.7);
  }

  const [hx, fx, hy] = rig.hips;
  part('leg_far', fx, hy, ...rig.boot, 0.45, 0.14, stride * 0.37 + dive * 0.5, dark);
  part('leg_near', hx, hy + 1, ...rig.boot, 0.45, 0.14, -stride * 0.37 + dive * 0.6);
  const arm = (side, x, upper, bend, shade) => {
    const y = rig.shoulders[2];
    const joint = rig.upper[1] * 0.65;
    const ex = x - Math.sin(upper) * joint, ey = y + Math.cos(upper) * joint;
    const lower = upper + bend;
    part(`upper_${side}`, x, y, ...rig.upper, 0.53, 0.20, upper, shade);
    const [w, h] = rig.lower;
    const [elbowX, gripX] = side === 'far' && rig.farGrip || [0.24, 0.61];
    if (side === 'far' && rig.weapon) {
      const dx = w * (gripX - elbowX), dy = h * 0.68;
      const gx = ex + dx * Math.cos(lower) - dy * Math.sin(lower);
      const gy = ey + dx * Math.sin(lower) + dy * Math.cos(lower);
      part('weapon', gx, gy, ...rig.weapon, 0.24, 0.76, 0.37 + dive * 0.41 - swing * 1.05);
    }
    part(`lower_${side}`, ex, ey, ...rig.lower, elbowX, 0.16, lower, shade);
  };
  const [near, far] = rig.shoulders;
  arm('far', far, -0.38 - cast * 1.68 - swing * 1.2 - dive * 0.7 + stride * 0.19, -0.03, dark);
  part('body', ...rig.body, 0.5, 0.5, dive * 0.28);
  part('head', ...rig.head, 0.51, 0.82, dive * 0.22 - cast * 0.08);
  arm('near', near, 0.19 + cast * 2.04 + dive * 0.31 - stride * 0.21, -0.13, tint);
  if (core === 'seraph') {
    wing('face', 'r', 10, -82, 18, 19, flap + cast * 0.63);
    wing('face', 'l', -7, -84, 18, 19, -flap - cast * 0.63);
    if (cast > 0.1) part('cross', 32, -65, 19, 24, 0.5, 0.5, 0, tint, cast);
  }
  return true;
}
