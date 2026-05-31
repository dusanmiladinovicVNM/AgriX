// video-common.jsx — data-driven product-flow video built on animations.jsx
// Exports window.FlowVideo({cfg}). Relies on globals from animations.jsx:
// Stage, useTime, interpolate, animate, Easing, clamp.

const FOREST = '#1E2D14', ACCENT = '#5EA135', GOLD = '#C8A84B', CREAM = '#F7F4EE';
const DISPLAY = "'Cormorant Garamond', Georgia, serif";
const BODY = "'Segoe UI', system-ui, -apple-system, sans-serif";

// timeline constants (seconds)
const INTRO = 2.6, STEP = 3.7, OUTRO = 3.2, XF = 0.45;

function timeline(cfg) {
  const n = cfg.steps.length;
  const stepsStart = INTRO;
  const stepsEnd = stepsStart + n * STEP;
  return { n, stepsStart, stepsEnd, duration: stepsEnd + OUTRO };
}
function stepWindow(tl, i) {
  const s = tl.stepsStart + i * STEP;
  return { s, e: s + STEP };
}

// ── Background ───────────────────────────────────────────────
function Bg() {
  return (
    <div style={{ position: 'absolute', inset: 0, background:
      'radial-gradient(120% 80% at 78% 12%, rgba(200,168,75,0.16), transparent 55%),' +
      'radial-gradient(90% 70% at 12% 90%, rgba(94,161,53,0.12), transparent 55%),' +
      'linear-gradient(160deg, #1d2c14 0%, #16210f 55%, #0f1709 100%)' }}>
      <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 220px rgba(8,12,5,0.6)' }} />
    </div>
  );
}

// ── Brand lockup top-left (real logo) ────────────────────────
function Brand({ cfg }) {
  return (
    <div style={{ position: 'absolute', left: 96, top: 64 }}>
      <img src={cfg.logo} alt={cfg.role} style={{ height: 56, display: 'block',
        filter: 'drop-shadow(0 3px 10px rgba(0,0,0,0.45))' }} />
    </div>
  );
}

// ── Phone with stacked screen iframes + tap layer ────────────
const SCREEN_W = 336, SCREEN_H = Math.round(336 * 800 / 380); // 707
const BEZEL = 13;
const PHONE_LEFT = 1216, PHONE_TOP = (1080 - (SCREEN_H + BEZEL * 2)) / 2 + 8;

function screenOpacities(tl, t) {
  const ops = tl ? tl.n : 0;
  const arr = new Array(ops).fill(0);
  if (t < tl.stepsStart - XF || t > tl.stepsEnd + XF) return arr;
  for (let i = 0; i < tl.n; i++) {
    const { s, e } = stepWindow(tl, i);
    let o = 0;
    if (t >= s && t <= e) o = 1;
    // fade in over [s-XF, s]
    if (t < s && t > s - XF) o = Math.max(o, (t - (s - XF)) / XF);
    // fade out over [e, e+XF] (handled by next fading in; keep last one fading)
    if (i === tl.n - 1 && t > e && t < e + XF) o = 1 - (t - e) / XF;
    arr[i] = clamp(o, 0, 1);
  }
  // crossfade at internal boundaries: ensure outgoing fades as incoming rises
  for (let i = 0; i < tl.n - 1; i++) {
    const e = stepWindow(tl, i).e;
    if (t > e - XF && t < e) {
      const f = (t - (e - XF)) / XF;
      arr[i] = Math.min(arr[i], 1 - f);
    }
  }
  return arr;
}

function Phone({ cfg, tl }) {
  const t = useTime();
  // phone enters at intro tail, exits into outro
  const appear = animate({ from: 0, to: 1, start: INTRO - 0.8, end: INTRO + 0.2, ease: Easing.easeOutCubic })(t);
  const leave = animate({ from: 0, to: 1, start: tl.stepsEnd + 0.1, end: tl.stepsEnd + 0.7, ease: Easing.easeInCubic })(t);
  const op = clamp(appear - leave, 0, 1);
  const ty = (1 - appear) * 40 + leave * -30;
  const ops = screenOpacities(tl, t);

  // current step index for tap layer
  let cur = -1;
  for (let i = 0; i < tl.n; i++) { const w = stepWindow(tl, i); if (t >= w.s && t <= w.e) { cur = i; break; } }

  return (
    <div style={{ position: 'absolute', left: PHONE_LEFT, top: PHONE_TOP, opacity: op,
      transform: `translateY(${ty}px)`, willChange: 'transform, opacity' }}>
      {/* glow */}
      <div style={{ position: 'absolute', inset: -60, borderRadius: 80,
        background: 'radial-gradient(circle at 50% 40%, rgba(200,168,75,0.20), transparent 65%)' }} />
      <div style={{ position: 'relative', width: SCREEN_W + BEZEL * 2, padding: BEZEL, borderRadius: 46,
        background: 'linear-gradient(178deg,#2c302c,#141714)',
        boxShadow: '0 50px 90px rgba(0,0,0,0.5), 0 12px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)' }}>
        <div style={{ position: 'relative', width: SCREEN_W, height: SCREEN_H, borderRadius: 34, overflow: 'hidden', background: '#0d120d' }}>
          {cfg.steps.map((st, i) => (
            <iframe key={i} src={cfg.screensSrc + '#' + st.id} loading="eager" scrolling="no"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0,
                opacity: ops[i], transition: 'none', pointerEvents: 'none' }} />
          ))}
          <TapLayer step={cfg.steps[cur]} tl={tl} idx={cur} t={t} />
        </div>
      </div>
    </div>
  );
}

// ── Tap / scan overlay (device-local coords over SCREEN_W×SCREEN_H) ──
function TapLayer({ step, tl, idx, t }) {
  if (!step || idx < 0) return null;
  const w = stepWindow(tl, idx);
  const els = [];

  // QR scan sweep — first ~1.1s of a 'scan' step
  if (step.tap && step.tap.type === 'scan') {
    const p = clamp((t - w.s) / 1.2, 0, 1);
    if (p > 0 && p < 1) {
      const y = 0.18 * SCREEN_H + p * 0.5 * SCREEN_H;
      els.push(
        <div key="scan" style={{ position: 'absolute', left: '14%', right: '14%', top: y, height: 3,
          background: GOLD, boxShadow: `0 0 16px 4px rgba(200,168,75,0.7)`, borderRadius: 2 }} />,
        <div key="scanbox" style={{ position: 'absolute', left: '14%', right: '14%', top: '18%', height: '50%',
          border: `2px solid rgba(200,168,75,0.6)`, borderRadius: 14 }} />
      );
    }
  }

  // tap ripple — ~0.75s before the step boundary
  const tapAt = w.e - 0.8;
  const tp = step.tap || { x: SCREEN_W / 2, y: SCREEN_H - 70 };
  if (t >= tapAt && t < tapAt + 0.7) {
    const lp = (t - tapAt) / 0.7;
    const ring = Easing.easeOutCubic(lp);
    els.push(
      <div key="ring" style={{ position: 'absolute', left: tp.x, top: tp.y, transform: 'translate(-50%,-50%)',
        width: 30 + ring * 70, height: 30 + ring * 70, borderRadius: '50%',
        border: `3px solid rgba(247,244,238,${0.9 * (1 - lp)})`, pointerEvents: 'none' }} />,
      <div key="dot" style={{ position: 'absolute', left: tp.x, top: tp.y, transform: `translate(-50%,-50%) scale(${1 - 0.25 * lp})`,
        width: 30, height: 30, borderRadius: '50%', background: 'rgba(247,244,238,0.85)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.4)' }} />
    );
  }
  return <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>{els}</div>;
}

// ── Captions (left panel) ────────────────────────────────────
function Captions({ cfg, tl }) {
  const t = useTime();
  const PANEL_X = 96, PANEL_W = 880, BASE_Y = 372;
  let cur = -1;
  for (let i = 0; i < tl.n; i++) { const w = stepWindow(tl, i); if (t >= w.s - XF && t <= w.e) { cur = i; } }
  if (cur < 0) return null;
  const st = cfg.steps[cur];
  const w = stepWindow(tl, cur);
  // entry/exit
  const inP = Easing.easeOutCubic(clamp((t - (w.s - 0.25)) / 0.5, 0, 1));
  const outP = clamp((t - (w.e - XF)) / XF, 0, 1);
  const op = clamp(inP - outP, 0, 1);
  const ty = (1 - inP) * 26 - outP * 18;
  const num = String(cur + 1).padStart(2, '0');
  const tot = String(tl.n).padStart(2, '0');
  return (
    <div style={{ position: 'absolute', left: PANEL_X, top: BASE_Y, width: PANEL_W, opacity: op,
      transform: `translateY(${ty}px)`, willChange: 'transform,opacity' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 22 }}>
        <span style={{ fontFamily: DISPLAY, fontSize: 30, fontWeight: 700, color: GOLD, fontVariantNumeric: 'tabular-nums' }}>{num}</span>
        <span style={{ width: 46, height: 2, background: 'rgba(200,168,75,0.5)' }} />
        <span style={{ fontFamily: BODY, fontSize: 14, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(247,244,238,0.5)', fontWeight: 700 }}>Korak {num} / {tot}</span>
      </div>
      <h2 style={{ fontFamily: DISPLAY, fontSize: 66, fontWeight: 600, lineHeight: 1.06, letterSpacing: '-0.02em', color: CREAM, margin: 0 }}>{st.title}</h2>
      <p style={{ fontFamily: BODY, fontSize: 27, lineHeight: 1.5, color: 'rgba(247,244,238,0.72)', marginTop: 22, maxWidth: 720 }}>{st.desc}</p>
    </div>
  );
}

// ── Progress dots (bottom-left) ──────────────────────────────
function Progress({ cfg, tl }) {
  const t = useTime();
  if (t < tl.stepsStart - XF || t > tl.stepsEnd + 0.6) return null;
  return (
    <div style={{ position: 'absolute', left: 96, top: 880, display: 'flex', gap: 10 }}>
      {cfg.steps.map((st, i) => {
        const w = stepWindow(tl, i);
        const active = t >= w.s - XF && t <= w.e;
        const done = t > w.e;
        return (
          <div key={i} style={{ width: active ? 40 : 16, height: 6, borderRadius: 4,
            background: active ? GOLD : done ? 'rgba(200,168,75,0.5)' : 'rgba(247,244,238,0.18)',
            transition: 'none' }} />
        );
      })}
    </div>
  );
}

// ── Subtitles (narration, bottom-center) ─────────────────────
function Subtitles({ cfg, tl }) {
  const t = useTime();
  let line = null, win = null;
  if (t < tl.stepsStart) { line = cfg.introVO; win = { s: 0.3, e: tl.stepsStart }; }
  else if (t >= tl.stepsEnd) { line = cfg.outroVO; win = { s: tl.stepsEnd + 0.2, e: tl.duration }; }
  else {
    for (let i = 0; i < tl.n; i++) { const w = stepWindow(tl, i); if (t >= w.s && t <= w.e) { line = cfg.steps[i].vo; win = w; } }
  }
  if (!line || !win) return null;
  const inP = clamp((t - win.s) / 0.4, 0, 1);
  const outP = clamp((t - (win.e - 0.35)) / 0.35, 0, 1);
  const op = clamp(inP - outP, 0, 1);
  return (
    <div style={{ position: 'absolute', left: '50%', bottom: 54, transform: 'translateX(-50%)', opacity: op,
      maxWidth: 1180, width: 'max-content', padding: '14px 26px', borderRadius: 14,
      background: 'rgba(10,15,7,0.55)', border: '1px solid rgba(247,244,238,0.12)',
      backdropFilter: 'blur(8px)' }}>
      <p style={{ margin: 0, fontFamily: BODY, fontSize: 24, lineHeight: 1.4, color: CREAM, textAlign: 'center', fontWeight: 500 }}>{line}</p>
    </div>
  );
}

// ── Intro title ──────────────────────────────────────────────
function Intro({ cfg }) {
  const t = useTime();
  if (t > INTRO + 0.1) return null;
  const inP = Easing.easeOutCubic(clamp(t / 0.7, 0, 1));
  const outP = clamp((t - (INTRO - 0.5)) / 0.5, 0, 1);
  const op = clamp(inP - outP, 0, 1);
  const ty = (1 - inP) * 30;
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', opacity: op, transform: `translateY(${ty}px)` }}>
      <div style={{ fontFamily: BODY, fontSize: 16, letterSpacing: '0.28em', textTransform: 'uppercase', color: GOLD, fontWeight: 700, marginBottom: 22 }}>{cfg.introEyebrow}</div>
      <h1 style={{ fontFamily: DISPLAY, fontSize: 92, fontWeight: 600, lineHeight: 1.04, letterSpacing: '-0.02em', color: CREAM, margin: 0, textAlign: 'center', maxWidth: 1300 }}
        dangerouslySetInnerHTML={{ __html: cfg.introTitle }} />
      <p style={{ fontFamily: BODY, fontSize: 26, color: 'rgba(247,244,238,0.7)', marginTop: 26, textAlign: 'center', maxWidth: 900 }}>{cfg.introSub}</p>
    </div>
  );
}

// ── Outro logo ───────────────────────────────────────────────
function Outro({ cfg, tl }) {
  const t = useTime();
  if (t < tl.stepsEnd - 0.2) return null;
  const lp = clamp((t - tl.stepsEnd) / 0.7, 0, 1);
  const op = Easing.easeOutCubic(lp);
  const sc = 0.92 + 0.08 * op;
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', opacity: op, transform: `scale(${sc})` }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 26 }}>
        <div style={{ position: 'absolute', width: 560, height: 360,
          background: 'radial-gradient(circle, rgba(200,168,75,0.16), transparent 62%)' }} />
        <img src={cfg.outroLogo} alt="AgriX" style={{ height: 168, position: 'relative',
          filter: 'drop-shadow(0 6px 22px rgba(0,0,0,0.5))' }} />
      </div>
      <p style={{ fontFamily: DISPLAY, fontSize: 34, fontStyle: 'italic', color: GOLD, margin: 0 }}>{cfg.outroTagline}</p>
    </div>
  );
}

// ── Per-second label for commenting ──────────────────────────
function TimeLabel({ tl }) {
  const t = useTime();
  React.useEffect(() => {
    const root = document.getElementById('vroot');
    if (root) root.setAttribute('data-screen-label', 'video @ ' + t.toFixed(0) + 's');
  }, [Math.floor(t)]);
  return null;
}

// ── Background audio bed ─────────────────────────────────────
// Plays a looping track in sync with playback. Silent unless cfg.audio is set.
function AudioBed({ src, volume = 0.45 }) {
  const { time, playing } = useTimeline();
  const ref = React.useRef(null);
  const prev = React.useRef(0);
  React.useEffect(() => {
    const a = ref.current; if (!a) return;
    a.volume = volume;
    if (playing) { a.play().catch(() => {}); } else { a.pause(); }
  }, [playing, volume]);
  React.useEffect(() => {
    const a = ref.current; if (!a) return;
    // video looped back to the start → restart the track so music re-aligns
    if (time < prev.current - 0.5) { try { a.currentTime = 0; } catch {} }
    prev.current = time;
  }, [time]);
  if (!src) return null;
  return <audio ref={ref} src={src} loop preload="auto" />;
}

function FlowVideo({ cfg }) {
  const tl = timeline(cfg);
  return (
    <Stage width={1920} height={1080} duration={tl.duration} background="#0f1709" persistKey={cfg.key || 'flowvid'}>
      <Bg />
      <Brand cfg={cfg} />
      <Intro cfg={cfg} />
      <Phone cfg={cfg} tl={tl} />
      <Captions cfg={cfg} tl={tl} />
      <Progress cfg={cfg} tl={tl} />
      <Subtitles cfg={cfg} tl={tl} />
      <Outro cfg={cfg} tl={tl} />
      <AudioBed src={cfg.audio} volume={cfg.audioVolume != null ? cfg.audioVolume : 0.45} />
      <TimeLabel tl={tl} />
    </Stage>
  );
}

Object.assign(window, { FlowVideo });
