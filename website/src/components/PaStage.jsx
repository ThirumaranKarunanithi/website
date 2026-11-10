import { useEffect, useRef, useState } from 'react';
import paHero from '../assets/pa-hero.webp';

// The Magizhchi PA login stage, for the website: a warm spotlight, slow rays of light, gold dust drifting up, the emblem floating in
// 3D and tipping towards the pointer, a mirrored floor, and a teal-and-orange grade with a vignette and a trace of film grain.

const DUST = Array.from({ length: 26 }, (_, i) => ({
  x: (i * 37.3) % 100,
  size: 2 + (i % 4),
  dur: 8 + (i % 7) * 1.5,
  delay: -((i * 1.37) % 11),
  drift: ((i % 5) - 2) * 12,
  hue: i % 4 === 0 ? '#5EEAD4' : i % 3 === 0 ? '#FFD27A' : '#FFB04A',
}));

const GRAIN = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`;

const CSS = `
@keyframes pas-rays { to { transform: translate(-50%, -50%) rotate(360deg); } }
@keyframes pas-breathe { 0%,100% { opacity: .55; transform: translate(-50%,-50%) scale(1); } 50% { opacity: .95; transform: translate(-50%,-50%) scale(1.07); } }
@keyframes pas-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
@keyframes pas-rise { 0% { transform: translate3d(0,0,0); opacity: 0; } 12% { opacity: .95; } 100% { transform: translate3d(var(--dx), -420px, 0); opacity: 0; } }
@keyframes pas-burst { 0% { transform: translate(-50%,-50%) scale(.35); opacity: .85; } 100% { transform: translate(-50%,-50%) scale(2.2); opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .pas-stage * { animation: none !important; } }
`;

export default function PaStage() {
  const ref = useRef(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [burst, setBurst] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === 'undefined') return undefined;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return undefined;
    const move = (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      setTilt({ rx: Math.max(-14, Math.min(14, -y * 28)), ry: Math.max(-18, Math.min(18, x * 36)) });
    };
    const leave = () => setTilt({ rx: 0, ry: 0 });
    el.addEventListener('pointermove', move, { passive: true });
    el.addEventListener('pointerleave', leave);
    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="pas-stage"
      role="img"
      aria-label="The Magizhchi PA lamp and smiling genie, floating on a lit stage"
      onClick={() => setBurst((b) => b + 1)}
      style={{
        position: 'relative',
        borderRadius: 20,
        overflow: 'hidden',
        minHeight: 420,
        height: '100%',
        border: '2px solid rgba(255, 176, 74, 0.4)',
        boxShadow: '0 30px 60px rgba(0, 0, 0, 0.5)',
        background: 'radial-gradient(520px 420px at 50% 46%, #3A1A08 0%, #1A0B05 50%, #0B0504 100%)',
        cursor: 'pointer',
      }}
    >
      <style>{CSS}</style>

      {/* slow rays of light fanning out from behind the emblem */}
      <div
        style={{
          position: 'absolute', left: '50%', top: '46%', width: 1100, height: 1100,
          transform: 'translate(-50%, -50%)',
          background: 'repeating-conic-gradient(from 0deg, rgba(255,190,90,0) 0deg, rgba(255,190,90,0.14) 5deg, rgba(255,190,90,0) 11deg, rgba(255,190,90,0) 24deg)',
          maskImage: 'radial-gradient(closest-side, #000 8%, transparent 62%)',
          WebkitMaskImage: 'radial-gradient(closest-side, #000 8%, transparent 62%)',
          animation: 'pas-rays 140s linear infinite',
          mixBlendMode: 'screen',
        }}
      />
      {/* a breathing pool of light */}
      <div
        style={{
          position: 'absolute', left: '50%', top: '46%', width: 460, height: 460, borderRadius: '50%',
          background: 'radial-gradient(closest-side, rgba(255,150,40,0.5), rgba(245,138,7,0.16) 55%, transparent 72%)',
          animation: 'pas-breathe 6s ease-in-out infinite',
        }}
      />
      {/* gold dust drifting up */}
      {DUST.map((d, i) => (
        <span
          key={i}
          style={{
            position: 'absolute', left: `${d.x}%`, bottom: '-2%', width: d.size, height: d.size, borderRadius: '50%',
            background: d.hue, boxShadow: `0 0 ${d.size * 3}px ${d.hue}`, opacity: 0,
            '--dx': `${d.drift}px`, animation: `pas-rise ${d.dur}s linear ${d.delay}s infinite`,
          }}
        />
      ))}

      {/* the emblem, floating in 3D and following the pointer */}
      <div style={{ position: 'absolute', left: '50%', top: '9%', transform: 'translateX(-50%)', perspective: 1100, width: 'min(66%, 300px)' }}>
        <div style={{ animation: 'pas-float 7s ease-in-out infinite', transformStyle: 'preserve-3d' }}>
          <div
            style={{
              transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
              transition: 'transform 220ms ease-out',
              transformStyle: 'preserve-3d',
              position: 'relative',
            }}
          >
            <img
              src={paHero}
              alt=""
              draggable={false}
              style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '22%', filter: 'drop-shadow(0 28px 50px rgba(245,138,7,0.55)) drop-shadow(0 6px 12px rgba(0,0,0,0.6))' }}
            />
            {/* a glint that slides across the glass as it tips */}
            <div
              style={{
                position: 'absolute', inset: 0, borderRadius: '22%', pointerEvents: 'none', mixBlendMode: 'screen',
                background: `linear-gradient(${115 + tilt.ry * 2}deg, transparent 38%, rgba(255,255,255,0.22) 50%, transparent 62%)`,
              }}
            />
          </div>
        </div>
        {/* the floor takes a mirror image of it */}
        <img
          src={paHero}
          alt=""
          draggable={false}
          style={{
            display: 'block', width: '100%', height: 'auto', marginTop: '-2%', transform: 'scaleY(-1)', borderRadius: '22%', opacity: 0.3, filter: 'blur(1.2px)',
            maskImage: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent 44%)',
            WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent 44%)',
          }}
        />
      </div>

      {burst > 0 && (
        <div
          key={burst}
          style={{
            position: 'absolute', left: '50%', top: '38%', width: 300, height: 300, borderRadius: '50%',
            border: '2px solid rgba(255,190,90,0.8)', boxShadow: '0 0 60px rgba(255,150,40,0.6), inset 0 0 40px rgba(255,190,90,0.35)',
            animation: 'pas-burst 1.1s ease-out forwards', pointerEvents: 'none',
          }}
        />
      )}

      {/* the grade: teal in the shadows, amber in the lights, a vignette, a whisper of grain */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(135deg, rgba(20,184,166,0.14) 0%, transparent 42%, rgba(255,120,0,0.10) 100%)', mixBlendMode: 'soft-light' }} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 44%, transparent 46%, rgba(0,0,0,0.6) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: GRAIN, opacity: 0.07, mixBlendMode: 'overlay' }} />
    </div>
  );
}
