import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import logoOrange from '../assets/logo-software-orange.png';
import heroImage from '../assets/hero_professionals.png';

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
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      r: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.25 + 0.05,
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
          if (dist < 80) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(255, 107, 26, ${0.04 * (1 - dist / 80)})`;
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
        height: '100vh',
        maxHeight: '100vh',
        minHeight: '620px',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        padding: 0,
        boxSizing: 'border-box',
        backgroundImage: `linear-gradient(90deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.95) 58%, rgba(255, 255, 255, 0.4) 80%, transparent 100%), url(${heroImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center right',
        backgroundAttachment: 'scroll',
      }}
    >
      <Particles />

      {/* Glowing orbs */}
      <motion.div
        animate={{
          y: [0, -30, 0],
          scale: [1, 1.05, 1],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          top: '20%', left: '10%',
          width: 450, height: 450,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,107,26,0.06) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
          zIndex: 0,
        }} 
      />
      <motion.div
        animate={{
          y: [0, 30, 0],
          scale: [1, 1.08, 1],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        style={{
          position: 'absolute',
          bottom: '10%', right: '5%',
          width: 500, height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,140,66,0.05) 0%, transparent 70%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
          zIndex: 0,
        }} 
      />

      <style>{`
        .hero-layout-grid {
          display: flex;
          flex-direction: column;
          gap: 24px;
          align-items: center;
        }
        /* Desktop View Enforced */
        @media (min-width: 1024px) {
          .hero-layout-grid {
            display: grid;
            grid-template-columns: 240px 1.5fr 1fr;
            gap: 40px;
            align-items: center;
          }
        }
        @media (min-width: 1400px) {
          .hero-layout-grid {
            grid-template-columns: 280px 1.5fr 1fr;
            gap: 50px;
          }
        }
      `}</style>
      <div className="container" style={{ position: 'relative', zIndex: 1, paddingTop: 72, paddingBottom: 16, width: '100%' }}>
        <div className="hero-layout-grid">
          {/* Section 1: Branding Column */}
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1, y: [0, -6, 0] }}
              transition={{ duration: 0.6, y: { duration: 5, repeat: Infinity, ease: 'easeInOut' } }}
              style={{ marginBottom: 12 }}
            >
              <img
                src={logoOrange}
                alt="Magizhchi Software"
                style={{
                  height: 'clamp(90px, 9vw, 115px)',
                  width: 'auto',
                  filter: 'drop-shadow(0 10px 30px rgba(255,107,26,0.25))',
                }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: 15,
                fontWeight: 800,
                color: '#FF6B1A',
                lineHeight: 1.3,
                background: 'rgba(255, 255, 255, 0.6)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.9)',
                borderRadius: 16,
                padding: '10px 22px',
                boxShadow: '0 6px 24px rgba(255, 107, 26, 0.12)',
                display: 'inline-block',
              }}
            >
              Magizhchi Software
              <span style={{ fontSize: '0.85em', color: '#0F172A', fontWeight: 700, display: 'block', marginTop: 2 }}>
                (OPC) Pvt Ltd.
              </span>
            </motion.div>
          </div>

          {/* Section 2: Text Content Column */}
          <div style={{ textAlign: 'left' }}>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.7 }}
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: 'clamp(24px, 3vw, 40px)',
                fontWeight: 800,
                lineHeight: 1.15,
                marginBottom: 12,
                letterSpacing: '-0.5px',
              }}
            >
              Power Your Team with{' '}
              <span className="gradient-text">Magizhchi Meet,</span>
              <br />
              &amp; Unified Cloud Suite
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6 }}
              style={{
                fontSize: 'clamp(14px, 1.3vw, 15px)',
                color: '#0F172A',
                fontWeight: 600,
                lineHeight: 1.5,
                maxWidth: 500,
                marginBottom: 18,
              }}
            >
              Meet, teach, proctor, and collaborate in real-time with <strong style={{ color: '#FF6B1A', fontWeight: 800 }}>Magizhchi Meet</strong>. Connected seamlessly with CRM, Cloud Storage, AI Data &amp; Desktop sync solutions.{' '}
              Sign in once with your <strong style={{ color: '#FF6B1A', fontWeight: 800 }}>Magizhchi ID</strong> — one account, one password for every product.
            </motion.p>

            {/* Main Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.5 }}
              style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}
            >
              <a
                href="https://meet.magizhchi.software"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: 'linear-gradient(135deg, #FF6B1A, #FF8C42)',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  padding: '12px 24px',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 800,
                  boxShadow: '0 6px 24px rgba(255,107,26,0.35)',
                  transition: 'all 0.3s',
                  display: 'inline-block',
                  textAlign: 'center',
                }}
                onMouseEnter={e => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 10px 32px rgba(255,107,26,0.5)';
                }}
                onMouseLeave={e => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 6px 24px rgba(255,107,26,0.35)';
                }}
              >
                Open Magizhchi Meet →
              </a>
              <a
                href="https://magizhchi.academy/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: 'rgba(255, 107, 26, 0.08)',
                  backdropFilter: 'blur(10px)',
                  color: '#FF6B1A',
                  textDecoration: 'none',
                  padding: '12px 24px',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 700,
                  border: '1px solid rgba(255, 107, 26, 0.25)',
                  transition: 'all 0.3s',
                  display: 'inline-block',
                  textAlign: 'center',
                }}
                onMouseEnter={e => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.background = 'rgba(255, 107, 26, 0.15)';
                  e.target.style.borderColor = '#FF6B1A';
                }}
                onMouseLeave={e => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.background = 'rgba(255, 107, 26, 0.08)';
                  e.target.style.borderColor = 'rgba(255, 107, 26, 0.25)';
                }}
              >
                Visit Academy ↗
              </a>
              <a
                href="#solutions"
                style={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  color: '#0F172A',
                  textDecoration: 'none',
                  padding: '12px 24px',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 700,
                  border: '1px solid rgba(15, 23, 42, 0.15)',
                  transition: 'all 0.3s',
                  display: 'inline-block',
                  textAlign: 'center',
                }}
                onMouseEnter={e => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.borderColor = 'rgba(255,107,26,0.5)';
                }}
                onMouseLeave={e => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.borderColor = 'rgba(15, 23, 42, 0.15)';
                }}
              >
                Explore All Products ↓
              </a>
            </motion.div>

            {/* Subtle Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65, duration: 0.5 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
                fontSize: 12,
                color: '#475569',
                fontWeight: 600,
              }}
            >
              <span>🔒 Bank-grade Security</span>
              <span>•</span>
              <a href="#product-id" style={{ color: 'inherit', textDecoration: 'none', borderBottom: '1px dashed #FF6B1A' }} title="One account and one password for every Magizhchi product">🔑 One Magizhchi ID — one login for everything</a>
              <span>•</span>
              <span>🇮🇳 Made in India</span>
            </motion.div>


          </div>

          {/* Empty Right Column: Leaving space to let the background photograph shine through! */}
          <div style={{ pointerEvents: 'none' }}></div>

        </div>
      </div>
    </section>
  );
}
