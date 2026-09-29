// Assembly engine: decides which parts are visible, where they are (flying in / out), ghosts and hatches.
import * as THREE from 'three';

const clamp01 = (x) => Math.max(0, Math.min(1, x));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

const _q = new THREE.Quaternion();
const _v = new THREE.Vector3();
const _p = new THREE.Vector3();

export class Assembly {
  constructor(kit, root) {
    this.kit = kit;
    this.root = root;
    this.cur = 0;
    this.anim = null;          // { step, dir, t, dur }
    this.ghost = false;
    this.edges = true;
    this.hatchT = 0;
    this.hatchTarget = 0;
    this.speed = 1;
    this.ghostMat = new THREE.MeshStandardMaterial({
      color: '#8fc0ff', transparent: true, opacity: 0.16, depthWrite: false, roughness: 0.6,
    });

    for (const p of kit.parts) {
      p.meshes = [];
      p.lines = [];
      p.obj.traverse((o) => {
        if (o.isMesh) { o.userData.mat = o.material; p.meshes.push(o); }
        if (o.isLineSegments) p.lines.push(o);
      });
      p.ghosted = false;
    }
    this.refresh();
  }

  get stepCount() { return this.kit.steps.length; }

  duration(step) {
    const n = this.kit.steps[step].parts.length;
    const a = this.kit.steps[step].assemblies.length;
    // piece by piece: roughly 0.35 s per part, capped for very large steps
    return Math.min(9, 0.6 + 0.35 * n + (a ? 0.9 : 0));
  }

  /** Navigate to step k. Adjacent steps animate; jumps animate only the target step in. */
  go(k) {
    k = Math.max(0, Math.min(this.stepCount - 1, k));
    if (k === this.cur && !this.anim) return;
    if (k === 0) {
      this.cur = 0; this.anim = null;
    } else if (k === this.cur - 1 && this.cur !== 0) {
      this.anim = { step: this.cur, dir: -1, t: 0, dur: this.duration(this.cur) * 0.7 };
      this.cur = k;
    } else {
      this.cur = k;
      this.anim = { step: k, dir: 1, t: 0, dur: this.duration(k) };
    }
    this.refresh();
  }

  replay() {
    if (this.cur === 0) return;
    this.anim = { step: this.cur, dir: 1, t: 0, dur: this.duration(this.cur) };
    this.refresh();
  }

  get busy() { return !!this.anim; }

  isVisible(p) {
    if (p.until != null) {
      // swapped-out part: visible before its removal step, and while flying away / back in
      if (this.cur === 0) return false;
      if (this.cur >= p.until) return !!(this.anim && this.anim.dir > 0 && this.anim.step === p.until && this.cur === p.until);
    }
    if (this.cur === 0) return true;
    if (p.step <= this.cur) return true;
    return !!(this.anim && this.anim.dir < 0 && p.step === this.anim.step);
  }

  /** Visibility & materials; call when the step or display options change. */
  refresh() {
    const next = this.cur + 1;
    for (const p of this.kit.parts) {
      const vis = this.isVisible(p);
      const ghost = !vis && this.ghost && this.cur !== 0 && p.step === next;
      p.obj.visible = vis || ghost;
      if (ghost !== p.ghosted) {
        for (const m of p.meshes) m.material = ghost ? this.ghostMat : m.userData.mat;
        p.ghosted = ghost;
      }
      for (const l of p.lines) l.visible = this.edges && !ghost;
    }
  }

  /** Parts that are "new" in the current step (for highlighting). */
  currentParts() {
    if (this.cur === 0) return [];
    return this.kit.steps[this.cur].parts.map((p) => p.obj);
  }
  currentAssemblies() {
    if (this.cur === 0) return [];
    return this.kit.steps[this.cur].assemblies.map((a) => a.group);
  }

  stagger(t, i, n) {
    if (n <= 1) return clamp01(t);
    const w = Math.max(0.12, Math.min(0.8, 1.6 / n));
    const start = (i / (n - 1)) * (1 - w);
    return clamp01((t - start) / w);
  }

  /** Advance animations. Returns true when a step animation just finished. */
  update(dt) {
    let finished = false;
    if (this.anim) {
      this.anim.t += (dt * this.speed) / this.anim.dur;
      if (this.anim.t >= 1) {
        this.anim = null;
        finished = true;
        this.refresh();
      }
    }
    // hatches
    const hs = dt * 1.4;
    if (this.hatchT < this.hatchTarget) this.hatchT = Math.min(this.hatchTarget, this.hatchT + hs);
    else if (this.hatchT > this.hatchTarget) this.hatchT = Math.max(this.hatchTarget, this.hatchT - hs);
    this.pose(this.cur, this.anim);
    return finished;
  }

  /** Apply transforms for (cur, anim). */
  pose(cur, anim) {
    const kit = this.kit;
    // sub-assemblies: on the bench until their join step
    for (const a of kit.assemblies) {
      let k; // 0 = final, 1 = bench
      if (cur === 0 || a.step < cur) k = 0;
      else if (a.step === cur) k = anim && anim.step === cur && anim.dir > 0 ? 1 - ease(clamp01((anim.t - 0.7) / 0.3)) : 0;
      else if (anim && anim.dir < 0 && a.step === anim.step) k = ease(clamp01(anim.t));
      else k = 1;
      a.group.position.lerpVectors(a.final, a.benchPos, k);
      a.group.quaternion.slerpQuaternions(a.finalQ, a.benchQ, k);
    }
    const he = ease(this.hatchT);
    for (const p of kit.parts) {
      let k = 0;
      if (p.until != null && anim && anim.step === p.until && cur !== 0) {
        k = anim.dir > 0 ? easeOut(clamp01(anim.t / 0.5)) : 1 - ease(clamp01(anim.t));
      } else if (anim && p.step === anim.step && cur !== 0) {
        const n = kit.steps[p.step].parts.length;
        // joins happen after the parts of the step have landed
        const tt = kit.steps[p.step].assemblies.length ? Math.min(1, anim.t / 0.75) : anim.t;
        if (anim.dir > 0) k = 1 - easeOut(this.stagger(tt, p.order, n));
        else k = ease(this.stagger(anim.t, n - 1 - p.order, n));
      }
      const o = p.obj;
      o.position.copy(p.final).addScaledVector(p.from, k);
      o.quaternion.copy(p.finalQ);
      if (p.hatch && he > 0) {
        const h = p.hatch;
        _q.setFromAxisAngle(_v.set(...h.axis).normalize(), h.angle * he);
        _p.set(...h.pivot);
        // rotate about pivot: pos = pivot + R (pos - pivot)
        o.position.sub(_p).applyQuaternion(_q).add(_p);
        o.quaternion.premultiply(_q);
      }
    }
  }

  /** World-space bounding box of what matters at the end of step k. */
  focusBox(k, focus) {
    const box = new THREE.Box3();
    this.pose(k, null);
    this.root.updateMatrixWorld(true);
    const kit = this.kit;
    let objs;
    if (k === 0 || focus === 'all') objs = kit.parts.filter((p) => k === 0 || p.step <= k).map((p) => p.obj);
    else if (focus && focus.isObject3D) {
      // a sub-assembly: everything of it that is built so far
      const inside = (o) => { for (; o; o = o.parent) if (o === focus) return true; return false; };
      objs = kit.parts.filter((p) => p.step <= k && inside(p.obj)).map((p) => p.obj);
    } else {
      objs = kit.steps[k].parts.map((p) => p.obj);
      for (const a of kit.steps[k].assemblies) objs.push(a.group);
    }
    for (const o of objs) box.expandByObject(o);
    this.pose(this.cur, this.anim);
    this.root.updateMatrixWorld(true);
    return box;
  }
}
