import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import logoOrange from '../assets/logo-software-orange.png';

function Particles() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.5 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 107, 26, ${p.alpha})`;
        ctx.fill();
      });

      // Draw connections
      particles.forEach((a, i) => {
        particles.slice(i + 1).forEach(b => {
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(255, 107, 26, ${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}

export default function Hero() {
  return (
    <section
      id="hero"
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        padding: 0,
        background: 'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(255,107,26,0.12) 0%, rgba(250,244,235,0) 70%), var(--bg-main)',
      }}
    >
      <Particles />

      {/* Glowing orbs */}
      <div style={{
        position: 'absolute',
        top: '20%', left: '10%',
        width: 400, height: 400,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,107,26,0.08) 0%, transparent 70%)',
        filter: 'blur(40px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%', right: '5%',
        width: 500, height: 500,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,140,66,0.06) 0%, transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 1, paddingTop: 80, paddingBottom: 40 }}>
        <div style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center' }}>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            style={{ marginBottom: 16 }}
          >
            <img
              src={logoOrange}
              alt="Magizhchi Software"
              style={{
                height: 140,
                width: 'auto',
                filter: 'drop-shadow(0 10px 40px rgba(255,107,26,0.25))',
              }}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="section-tag"
            style={{ margin: '0 auto 20px' }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF6B1A', display: 'inline-block' }} />
            Magizhchi Software
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            style={{
              fontFamily: 'Poppins, sans-serif',
              fontSize: 'clamp(28px, 4vw, 56px)',
              fontWeight: 800,
              lineHeight: 1.2,
              marginBottom: 16,
              letterSpacing: '-0.5px',
            }}
          >
            Making Business{' '}
            <span className="gradient-text">Simple,</span>
            <br />
            Smart &amp; Scalable
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6 }}
            style={{
              fontSize: 'clamp(16px, 2vw, 20px)',
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
              maxWidth: 680,
              margin: '0 auto 32px',
            }}
          >
            We bring all your business operations into one seamless ecosystem —
            manage, automate, and grow <strong style={{ color: 'var(--text-primary)' }}>effortlessly</strong>.
            From customer acquisition to accounting, from HR to operations.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <a
              href="#solutions"
              style={{
                background: 'linear-gradient(135deg, #FF6B1A, #FF8C42)',
                color: 'var(--text-primary)',
                textDecoration: 'none',
                padding: '16px 36px',
                borderRadius: 14,
                fontSize: 16,
                fontWeight: 700,
                boxShadow: '0 8px 32px rgba(255,107,26,0.4)',
                transition: 'all 0.3s',
                display: 'inline-block',
              }}
              onMouseEnter={e => {
                e.target.style.transform = 'translateY(-3px)';
                e.target.style.boxShadow = '0 12px 40px rgba(255,107,26,0.55)';
              }}
              onMouseLeave={e => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 8px 32px rgba(255,107,26,0.4)';
              }}
            >
              Explore Solutions
            </a>
            <a
              href="https://magizhchi.academy/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'rgba(255,107,26,0.05)',
                backdropFilter: 'blur(10px)',
                color: 'var(--text-primary)',
                textDecoration: 'none',
                padding: '16px 36px',
                borderRadius: 14,
                fontSize: 16,
                fontWeight: 600,
                border: '1px solid rgba(255,107,26,0.15)',
                transition: 'all 0.3s',
                display: 'inline-block',
              }}
              onMouseEnter={e => {
                e.target.style.transform = 'translateY(-3px)';
                e.target.style.borderColor = 'rgba(255,107,26,0.3)';
              }}
              onMouseLeave={e => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.borderColor = 'rgba(255,107,26,0.15)';
              }}
            >
              Visit Academy
            </a>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            style={{
              display: 'flex',
              gap: 0,
              justifyContent: 'center',
              marginTop: 48,
              borderTop: '1px solid var(--border)',
              paddingTop: 32,
              flexWrap: 'wrap',
            }}
          >
            {[
              { num: '6+', label: 'Software Products' },
              { num: '1', label: 'Unified Ecosystem' },
              { num: '100%', label: 'Business Coverage' },
            ].map((stat, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  minWidth: 160,
                  textAlign: 'center',
                  padding: '0 24px',
                  borderRight: i < 2 ? '1px solid var(--border)' : 'none',
                }}
              >
                <div style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: 'clamp(32px, 4vw, 48px)',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #FF6B1A, #FF8C42)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  lineHeight: 1.1,
                }}>
                  {stat.num}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, fontWeight: 500, letterSpacing: '0.5px' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

    </section>
  );
}
