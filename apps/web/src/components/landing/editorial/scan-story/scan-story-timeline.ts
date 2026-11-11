/**
 * Scan story — scroll-scrubbed choreography for the landing "one scan" scene.
 *
 * Pure DOM, no dependencies: a passive scroll read is written to transforms once
 * per frame. The stage is held with `position: sticky`, so native wheel, touch,
 * and momentum scrolling are never intercepted. Every beat runs backwards on the
 * way up and both ends are finished states.
 *
 * Only `transform`, `opacity`, and a handful of data-attribute state flips are
 * written here. Nothing in this file triggers layout while scrolling: all
 * measurement happens in `measure()` (mount, resize, font load).
 */

/** Device artboard — every phone is authored at this size and scaled by transform. */
const DEVICE_W = 380;
const DEVICE_H = 780;

const DESKTOP_MIN_WIDTH = 900;

export type ScanStoryHandle = {
  destroy: () => void;
  refresh: () => void;
};

type Pose = { x: number; y: number; s: number; r: number };

type Caption = {
  el: HTMLElement;
  lines: HTMLElement[];
  body: HTMLElement | null;
  enter: [number, number];
  exit: [number, number] | null;
};

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const outCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const outQuint = (t: number) => 1 - Math.pow(1 - t, 5);
const inOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const mix = (a: Pose, b: Pose, t: number): Pose => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  s: lerp(a.s, b.s, t),
  r: lerp(a.r, b.r, t),
});

/** Beat map, in scroll progress (0 → 1) across the whole track. */
const T = {
  showerRise: [0.02, 0.13],
  viewerEnter: [0.1, 0.19],
  scan: [0.19, 0.275],
  lock: 0.275,
  zoom: [0.3, 0.42],
  appIn: [0.335, 0.385],
  scrollToCard: [0.42, 0.5],
  scrollToWork: [0.53, 0.61],
  tapShow: 0.615,
  tapPress: 0.63,
  detailOpen: [0.635, 0.675],
  detailScroll: [0.675, 0.83],
  detailClose: [0.84, 0.875],
  scrollToResearch: [0.875, 0.95],
} as const;

const CAPTION_WINDOWS: Record<string, { enter: [number, number]; exit: [number, number] | null }> = {
  scan: { enter: [0.03, 0.09], exit: [0.3, 0.335] },
  you: { enter: [0.36, 0.41], exit: [0.5, 0.53] },
  work: { enter: [0.53, 0.57], exit: [0.615, 0.64] },
  open: { enter: [0.645, 0.685], exit: [0.84, 0.868] },
  papers: { enter: [0.875, 0.915], exit: null },
};

const STEP_STARTS = [0, 0.345, 0.53, 0.642, 0.872];

export function mountScanStory(root: HTMLElement): ScanStoryHandle {
  const q = <E extends HTMLElement = HTMLElement>(sel: string) =>
    root.querySelector<E>(sel);
  const qa = (sel: string) => Array.from(root.querySelectorAll<HTMLElement>(sel));

  const track = q('[data-ss="track"]');
  const stage = q('[data-ss="stage"]');
  const shower = q('[data-ss="shower"]');
  const viewer = q('[data-ss="viewer"]');
  const cam = q('[data-ss="cam"]');
  const app = q('[data-ss="app"]');
  const scanline = q('[data-ss="scanline"]');
  const finder = q('[data-ss="finder"]');
  const profile = q('[data-ss="profile"]');
  const profileScroll = q('[data-ss="profile-scroll"]');
  const detail = q('[data-ss="detail"]');
  const detailScroll = q('[data-ss="detail-scroll"]');
  const tap = q('[data-ss="tap"]');
  const shade = q('[data-ss="shade"]');

  if (
    !track ||
    !stage ||
    !shower ||
    !viewer ||
    !cam ||
    !app ||
    !profile ||
    !profileScroll ||
    !detail ||
    !detailScroll
  ) {
    return { destroy: () => undefined, refresh: () => undefined };
  }

  const captions: Caption[] = qa('[data-ss-cap]').map((el) => {
    const win = CAPTION_WINDOWS[el.dataset.ssCap ?? ''] ?? CAPTION_WINDOWS.scan!;
    return {
      el,
      lines: Array.from(el.querySelectorAll<HTMLElement>('[data-ss-line]')),
      body: el.querySelector<HTMLElement>('[data-ss-body]'),
      enter: win.enter,
      exit: win.exit,
    };
  });
  const items = qa('[data-ss-item]');
  const steps = qa('[data-ss-step]');
  const navs = qa('[data-ss-nav]');
  const firstCard = q('[data-ss-mark="card-0"]');

  /* —— Measured values (never read during scroll) —— */
  let stageW = 0;
  let stageH = 0;
  let trackTop = 0;
  let trackLen = 1;
  let poses = {
    showerOff: { x: 0, y: 0, s: 1, r: 0 },
    showerRest: { x: 0, y: 0, s: 1, r: 0 },
    viewerOff: { x: 0, y: 0, s: 1, r: 0 },
    viewerScan: { x: 0, y: 0, s: 1, r: 0 },
    viewerHero: { x: 0, y: 0, s: 1, r: 0 },
  };
  let yCard = 0;
  let yWork = 0;
  let yResearch = 0;
  let detailStops: number[] = [0, 0, 0, 0, 0];
  let finderTravel = 0;
  let tapX = 0;
  let tapY = 0;

  const markTop = (scroller: HTMLElement, name: string) => {
    const el = scroller.querySelector<HTMLElement>(`[data-ss-mark="${name}"]`);
    if (!el) return 0;
    // offsetTop is relative to the scroller (it is the offset parent).
    let top = 0;
    let node: HTMLElement | null = el;
    while (node && node !== scroller) {
      top += node.offsetTop;
      node = node.offsetParent as HTMLElement | null;
    }
    return top;
  };

  function measure() {
    stageW = stage!.clientWidth;
    stageH = stage!.clientHeight;
    const rect = track!.getBoundingClientRect();
    trackTop = rect.top + window.scrollY;
    trackLen = Math.max(1, track!.offsetHeight - stageH);

    const desktop = stageW >= DESKTOP_MIN_WIDTH;
    const W = stageW;
    const H = stageH;

    const sShow = desktop
      ? Math.min((0.62 * H) / DEVICE_H, (0.26 * W) / DEVICE_W)
      : Math.min((0.5 * H) / DEVICE_H, (0.6 * W) / DEVICE_W);
    const showTop = desktop ? 0.25 * H : 0.37 * H;
    const showX = desktop ? 0.6 * W : 0.42 * W;
    const showerRest: Pose = {
      x: showX,
      y: showTop + (DEVICE_H * sShow) / 2,
      s: sShow,
      r: -5,
    };
    const showerOff: Pose = {
      x: showX - 0.05 * W,
      y: H + DEVICE_H * sShow * 0.62,
      s: sShow,
      r: -13,
    };

    const sScan = sShow * 0.64;
    const scanX = Math.min(
      showX + (DEVICE_W * sShow) / 2 + DEVICE_W * sScan * 0.56,
      W - (DEVICE_W * sScan) / 2 - 10,
    );
    const viewerScan: Pose = {
      x: scanX,
      y: showTop + DEVICE_H * sScan * 0.3,
      s: sScan,
      r: 9,
    };
    const viewerOff: Pose = {
      x: W + DEVICE_W * sScan * 0.8,
      y: -DEVICE_H * sScan * 0.45,
      s: sScan * 0.92,
      r: 28,
    };

    const sHero = desktop
      ? Math.min(0.82 * H, 820) / DEVICE_H
      : Math.min((0.8 * W) / DEVICE_W, (0.72 * H) / DEVICE_H);
    const viewerHero: Pose = desktop
      ? { x: 0.66 * W, y: 0.535 * H, s: sHero, r: 0 }
      : { x: 0.5 * W, y: Math.max(0.3 * H, 236) + (DEVICE_H * sHero) / 2, s: sHero, r: 0 };

    poses = { showerOff, showerRest, viewerOff, viewerScan, viewerHero };

    const screenH = profile!.clientHeight;
    const maxProfile = Math.max(0, profileScroll!.scrollHeight - screenH);
    yCard = Math.min(maxProfile, Math.max(0, markTop(profileScroll!, 'card') - 96));
    yWork = Math.min(maxProfile, Math.max(0, markTop(profileScroll!, 'work') - 114));
    yResearch = Math.min(
      maxProfile,
      Math.max(0, markTop(profileScroll!, 'research') - 114),
    );

    const maxDetail = Math.max(0, detailScroll!.scrollHeight - detail!.clientHeight);
    // First stop is the project header; the rest are the four captioned parts.
    detailStops = [
      0,
      ...['deck', 'stack', 'overview', 'screens'].map((name) =>
        Math.min(maxDetail, Math.max(0, markTop(detailScroll!, name) - 112)),
      ),
    ];

    if (finder && scanline) {
      finderTravel = Math.max(0, finder.clientHeight - scanline.offsetHeight);
    }

    if (firstCard) {
      tapX = firstCard.offsetLeft + firstCard.offsetWidth * 0.62;
      tapY = markTop(profileScroll!, 'card-0') - yWork + firstCard.offsetHeight * 0.42;
    }
  }

  /* —— Writers —— */
  const setPose = (el: HTMLElement, pose: Pose) => {
    el.style.transform = `translate3d(${(pose.x - DEVICE_W / 2).toFixed(2)}px, ${(
      pose.y -
      DEVICE_H / 2
    ).toFixed(2)}px, 0) rotate(${pose.r.toFixed(3)}deg) scale(${pose.s.toFixed(4)})`;
  };

  const flag = (el: HTMLElement | null, name: string, on: boolean) => {
    if (!el) return;
    const value = on ? 'true' : 'false';
    if (el.getAttribute(name) !== value) el.setAttribute(name, value);
  };

  let lastStep = -1;
  let lastNav = '';
  let lastItem = -2;

  function render(p: number) {
    /* Presenter phone: rises with the hand, drops back out the way it came. */
    const rise = outQuint(seg(p, T.showerRise[0], T.showerRise[1]));
    const zoom = seg(p, T.zoom[0], T.zoom[1]);
    const drop = inOutCubic(clamp01(zoom / 0.7));
    const showerPose =
      zoom <= 0
        ? mix(poses.showerOff, poses.showerRest, rise)
        : mix(poses.showerRest, poses.showerOff, drop);
    setPose(shower!, showerPose);
    shower!.style.opacity = rise <= 0 || drop >= 1 ? '0' : '1';

    /* Visitor phone: arrives, scans, then becomes the stage. */
    const enter = outCubic(seg(p, T.viewerEnter[0], T.viewerEnter[1]));
    const viewerPose =
      zoom <= 0
        ? mix(poses.viewerOff, poses.viewerScan, enter)
        : mix(poses.viewerScan, poses.viewerHero, inOutCubic(zoom));
    setPose(viewer!, viewerPose);
    viewer!.style.opacity = enter <= 0 ? '0' : '1';

    /* Scan line sweeps down and back before the lock. */
    if (scanline) {
      const sweep = seg(p, T.scan[0], T.scan[1]);
      const tri = sweep < 0.5 ? sweep * 2 : 2 - sweep * 2;
      scanline.style.transform = `translate3d(0, ${(inOutCubic(tri) * finderTravel).toFixed(1)}px, 0)`;
      scanline.style.opacity = sweep > 0 && p < T.lock ? '1' : '0';
    }
    flag(viewer, 'data-locked', p >= T.lock);

    /* Camera hands over to the card. */
    const appIn = seg(p, T.appIn[0], T.appIn[1]);
    cam!.style.opacity = (1 - appIn).toFixed(3);
    app!.style.opacity = appIn.toFixed(3);

    /* Profile scroll inside the phone. */
    const toCard = inOutCubic(seg(p, T.scrollToCard[0], T.scrollToCard[1]));
    const toWork = inOutCubic(seg(p, T.scrollToWork[0], T.scrollToWork[1]));
    const toResearch = inOutCubic(
      seg(p, T.scrollToResearch[0], T.scrollToResearch[1]),
    );
    const y =
      lerp(0, yCard, toCard) +
      (yWork - yCard) * toWork +
      (yResearch - yWork) * toResearch;
    profileScroll!.style.transform = `translate3d(0, ${(-y).toFixed(1)}px, 0)`;

    /* Tap, then the project opens over the profile. */
    const openT = seg(p, T.detailOpen[0], T.detailOpen[1]);
    const closeT = seg(p, T.detailClose[0], T.detailClose[1]);
    const open = outCubic(openT) * (1 - inOutCubic(closeT));
    detail!.style.transform = `translate3d(0, ${((1 - open) * 100).toFixed(2)}%, 0)`;
    detail!.style.visibility = open <= 0 ? 'hidden' : 'visible';
    profile!.style.transform = `scale(${(1 - open * 0.05).toFixed(4)})`;
    if (shade) shade.style.opacity = (open * 0.34).toFixed(3);

    if (tap) {
      const visible = p >= T.tapShow && p < T.detailOpen[1] - 0.012;
      tap.style.transform = `translate3d(${tapX.toFixed(1)}px, ${tapY.toFixed(1)}px, 0)`;
      flag(tap, 'data-visible', visible);
      flag(tap, 'data-pressed', p >= T.tapPress && visible);
    }
    flag(firstCard, 'data-pressed', p >= T.tapPress && p < T.detailOpen[1]);

    /* Project page scroll: deck → stack → overview → screens. */
    const dp = seg(p, T.detailScroll[0], T.detailScroll[1]);
    const lastStop = detailStops.length - 1;
    const scaled = dp * lastStop;
    const index = Math.min(lastStop - 1, Math.floor(scaled));
    const local = inOutCubic(clamp01(scaled - index));
    const dy = lerp(detailStops[index] ?? 0, detailStops[index + 1] ?? 0, local);
    detailScroll!.style.transform = `translate3d(0, ${(-dy).toFixed(1)}px, 0)`;

    const activeItem = Math.min(lastStop, Math.round(scaled)) - 1;
    if (activeItem !== lastItem) {
      lastItem = activeItem;
      items.forEach((el, i) => flag(el, 'data-active', i === activeItem));
    }

    /* Captions: lines rise out of their masks, the whole block lifts away. */
    for (const cap of captions) {
      const out = cap.exit ? seg(p, cap.exit[0], cap.exit[1]) : 0;
      const span = cap.enter[1] - cap.enter[0];
      const first = seg(p, cap.enter[0], cap.enter[1]);
      cap.lines.forEach((line, i) => {
        const offset = i * span * 0.32;
        const t = outQuint(seg(p, cap.enter[0] + offset, cap.enter[1] + offset));
        line.style.transform = `translate3d(0, ${((1 - t) * 108).toFixed(2)}%, 0)`;
      });
      if (cap.body) {
        const t = outCubic(seg(p, cap.enter[0] + span * 0.55, cap.enter[1] + span * 0.7));
        cap.body.style.opacity = t.toFixed(3);
        cap.body.style.transform = `translate3d(0, ${((1 - t) * 14).toFixed(1)}px, 0)`;
      }
      cap.el.style.opacity = first <= 0 ? '0' : (1 - out).toFixed(3);
      cap.el.style.transform = `translate3d(0, ${(-out * 22).toFixed(1)}px, 0)`;
      flag(cap.el, 'data-current', first > 0 && out < 1);
    }

    /* Progress rail + in-phone nav pill. */
    let step = 0;
    for (let i = 0; i < STEP_STARTS.length; i += 1) {
      if (p >= (STEP_STARTS[i] ?? 0)) step = i;
    }
    if (step !== lastStep) {
      lastStep = step;
      steps.forEach((el, i) => {
        el.setAttribute('data-state', i === step ? 'current' : i < step ? 'done' : 'todo');
      });
    }
    const nav = toResearch > 0.55 ? 'research' : toWork > 0.55 ? 'work' : 'profile';
    if (nav !== lastNav) {
      lastNav = nav;
      navs.forEach((el) => flag(el, 'data-active', el.dataset.ssNav === nav));
    }
  }

  /* —— Driver: passive scroll read → eased progress → one write per frame —— */
  let target = 0;
  let current = -1;
  let frame = 0;
  let near = true;

  const readTarget = () => {
    target = clamp01((window.scrollY - trackTop) / trackLen);
  };

  const tick = () => {
    frame = 0;
    if (current < 0) {
      current = target;
    } else {
      const delta = target - current;
      current = Math.abs(delta) < 0.0004 ? target : current + delta * 0.2;
    }
    render(current);
    if (current !== target && near) frame = window.requestAnimationFrame(tick);
  };

  const request = () => {
    if (!frame) frame = window.requestAnimationFrame(tick);
  };

  const onScroll = () => {
    if (!near) return;
    readTarget();
    request();
  };

  const refresh = () => {
    measure();
    readTarget();
    current = target;
    render(current);
  };

  let resizeFrame = 0;
  const onResize = () => {
    if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(() => {
      resizeFrame = 0;
      refresh();
    });
  };

  const observer =
    'IntersectionObserver' in window
      ? new IntersectionObserver(
          ([entry]) => {
            near = entry ? entry.isIntersecting : true;
            root.setAttribute('data-near', near ? 'true' : 'false');
            if (near) {
              // Position can drift while off screen (images, fonts above).
              refresh();
            }
          },
          { rootMargin: '60% 0px 60% 0px' },
        )
      : null;
  observer?.observe(track);

  const resizeObserver =
    'ResizeObserver' in window ? new ResizeObserver(onResize) : null;
  resizeObserver?.observe(stage);
  resizeObserver?.observe(profileScroll);
  resizeObserver?.observe(detailScroll);

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  window.addEventListener('load', onResize);
  void document.fonts?.ready.then(onResize).catch(() => undefined);

  refresh();

  return {
    refresh,
    destroy: () => {
      if (frame) window.cancelAnimationFrame(frame);
      if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
      observer?.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('load', onResize);
    },
  };
}
