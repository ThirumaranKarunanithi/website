import { motion } from 'framer-motion';
import { useInView } from '../hooks/useInView';
import logoMagizhchi from '../assets/logo-magizhchi-orange.png';

export default function Vision() {
  const [ref, inView] = useInView(0.2);

  return (
    <section
      id="vision"
      ref={ref}
      style={{
        background: 'linear-gradient(135deg, #FFFFFF 0%, #FFFFFF 40%, #FFFDEB 75%, #FFE8D6 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background grid */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(255,107,26,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,107,26,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        pointerEvents: 'none',
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 80,
          alignItems: 'center',
        }}
        className="vision-grid"
        >
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
          >
            <div className="section-tag">Our Vision</div>
            <h2 className="section-title">
              Empowering Businesses with{' '}
              <span className="gradient-text">Smart Digital Tools</span>
            </h2>
            <p style={{ fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 32 }}>
              To empower businesses of all sizes with easy-to-use, powerful digital tools
              that eliminate complexity and enable smarter decision-making — today and tomorrow.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                'Eliminate complexity from business operations',
                'Enable smarter, data-driven decisions',
                'Unify all tools into one seamless platform',
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    fontSize: 15,
                    color: 'var(--text-primary)',
                  }}
                >
                  <div style={{
                    width: 20, height: 20,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #FF6B1A, #FF8C42)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: 10,
                    fontWeight: 700,
                    color: 'white',
                  }}>
                    ✓
                  </div>
                  {item}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1 }}
            style={{ display: 'flex', justifyContent: 'center' }}
          >
            <div style={{
              position: 'relative',
              width: 380,
              height: 380,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {/* Rotating rings */}
              {[1, 1.3, 1.6].map((scale, i) => (
                <motion.div
                  key={i}
                  animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
                  transition={{ repeat: Infinity, duration: 20 + i * 5, ease: 'linear' }}
                  style={{
                    position: 'absolute',
                    width: 200 * scale,
                    height: 200 * scale,
                    borderRadius: '50%',
                    border: `1px solid rgba(255,107,26,${0.15 - i * 0.04})`,
                    borderTopColor: `rgba(255,107,26,${0.4 - i * 0.1})`,
                  }}
                />
              ))}

              {/* Center logo */}
              <div style={{
                width: 140, height: 140,
                borderRadius: '50%',
                background: '#FFFFFF',
                border: '1px solid rgba(255,107,26,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(255,107,26,0.15)',
              }}>
                <img src={logoMagizhchi} alt="Magizhchi" style={{ width: 80, height: 'auto', filter: 'drop-shadow(0 0 15px rgba(255,107,26,0.6))' }} />
              </div>

              {/* Orbiting dots */}
              {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                <motion.div
                  key={i}
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 15, ease: 'linear' }}
                  style={{
                    position: 'absolute',
                    width: 260,
                    height: 260,
                    borderRadius: '50%',
                    transformOrigin: 'center',
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#FF6B1A',
                    top: '50%',
                    left: '50%',
                    transform: `translate(-50%, -50%) rotate(${deg}deg) translateX(130px)`,
                    opacity: 0.7,
                    boxShadow: '0 0 8px rgba(255,107,26,0.8)',
                  }} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .vision-grid {
            grid-template-columns: 1fr !important;
            gap: 48px !important;
          }
        }
      `}</style>
    </section>
  );
}
