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
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        padding: 0,
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
          width: 500, height: 500,
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
          width: 600, height: 600,
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
          gap: 40px;
          align-items: center;
        }
        /* Desktop View Enforced */
        @media (min-width: 1024px) {
          .hero-layout-grid {
            display: grid;
            grid-template-columns: 280px 1.5fr 1.2fr;
            gap: 50px;
            align-items: center;
          }
        }
        @media (min-width: 1400px) {
          .hero-layout-grid {
            grid-template-columns: 320px 1.5fr 1.2fr;
            gap: 60px;
          }
        }
      `}</style>
      <div className="container" style={{ position: 'relative', zIndex: 1, paddingTop: 80, paddingBottom: 40 }}>
        <div className="hero-layout-grid">
          {/* Section 1: Branding Column */}
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
              transition={{ duration: 0.6, y: { duration: 5, repeat: Infinity, ease: 'easeInOut' } }}
              style={{ marginBottom: 20 }}
            >
              <img
                src={logoOrange}
                alt="Magizhchi Software"
                style={{
                  height: 140,
                  width: 'auto',
                  filter: 'drop-shadow(0 10px 40px rgba(255,107,26,0.3))',
                }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: 18,
                fontWeight: 800,
                color: '#FF6B1A',
                lineHeight: 1.4,
                background: 'rgba(255, 255, 255, 0.45)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.8)',
                borderRadius: 20,
                padding: '12px 28px',
                boxShadow: '0 8px 30px rgba(255, 107, 26, 0.12)',
                display: 'inline-block',
                marginTop: 4,
              }}
            >
              Magizhchi Software
              <span style={{ fontSize: '0.85em', color: '#0F172A', fontWeight: 700, display: 'block', marginTop: 4 }}>
                (OPC) Pvt Ltd.
              </span>
            </motion.div>
          </div>

          {/* Section 2: Text Content Column */}
          <div style={{ textAlign: 'left' }}>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: 'clamp(28px, 3.5vw, 48px)',
                fontWeight: 800,
                lineHeight: 1.15,
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
                fontSize: 'clamp(15px, 1.6vw, 17px)',
                color: '#0F172A',
                fontWeight: 600,
                lineHeight: 1.6,
                maxWidth: 480,
                marginBottom: 24,
              }}
            >
              We bring all your business operations into one seamless ecosystem —
              manage, automate, and grow <strong style={{ color: '#000000', fontWeight: 800 }}>effortlessly</strong>.
              From customer acquisition to accounting, from HR to operations.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}
            >
              <a
                href="#solutions"
                style={{
                  background: 'linear-gradient(135deg, #FF6B1A, #FF8C42)',
                  color: 'var(--text-primary)',
                  textDecoration: 'none',
                  padding: '14px 28px',
                  borderRadius: 14,
                  fontSize: 15,
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
                  padding: '14px 28px',
                  borderRadius: 14,
                  fontSize: 15,
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


          </div>

            {/* Empty Right Column: Leaving space to let the background photograph shine through! */}
            <div style={{ pointerEvents: 'none' }}></div>

        </div>
      </div>
    </section>
  );
}
