import { motion } from 'framer-motion';
import { useInView } from '../hooks/useInView';
import TiltCard from './TiltCard';

const reasons = [
  {
    icon: '🔗',
    title: 'All-in-One Ecosystem',
    desc: 'No need for multiple disconnected tools. Everything your business needs in one integrated platform.',
  },
  {
    icon: '✨',
    title: 'User-Friendly Design',
    desc: 'Built for ease of use — intuitive interfaces that your team can adopt without extensive training.',
  },
  {
    icon: '🎨',
    title: 'Customizable Solutions',
    desc: 'Tailored to your specific business needs. Every module adapts to how you work, not the other way around.',
  },
  {
    icon: '📈',
    title: 'Scalable Architecture',
    desc: 'Our platform grows with your business — from startup to enterprise, without changing your workflow.',
  },
  {
    icon: '⚡',
    title: 'Automation-Driven',
    desc: 'Reduce manual work and eliminate errors through intelligent workflow automation across all modules.',
  },
  {
    icon: '🛡️',
    title: 'Reliable & Secure',
    desc: 'Enterprise-grade security and uptime guarantees. Your data is always protected and accessible.',
  },
];

export default function WhyUs() {
  const [ref, inView] = useInView(0.1);

  return (
    <section
      id="why"
      ref={ref}
      style={{
        background: 'var(--bg-main)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative element */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: '50%',
        transform: 'translateX(-50%)',
        width: 1200, height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(255,107,26,0.3), transparent)',
        pointerEvents: 'none',
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 64 }}
        >
          <div className="section-tag" style={{ margin: '0 auto 20px' }}>Why Magizhchi</div>
          <h2 className="section-title">
            Built for{' '}
            <span className="gradient-text">Real Business Needs</span>
          </h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Every feature we build solves a real problem. Here's what sets us apart.
          </p>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 24,
          marginBottom: 80,
        }}>
          {reasons.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.08, duration: 0.5 }}
            >
              <TiltCard
                intensity={10}
                gloss={true}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 18,
                  padding: '28px 28px',
                  transition: 'border-color 0.3s',
                  height: '100%',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,107,26,0.3)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                }}
              >
                <div style={{
                  width: 52, height: 52,
                  borderRadius: 12,
                  background: 'rgba(255,107,26,0.1)',
                  border: '1px solid rgba(255,107,26,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  marginBottom: 18,
                }}>
                  {r.icon}
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10, color: 'var(--text-primary)' }}>
                  {r.title}
                </h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>
                  {r.desc}
                </p>
              </TiltCard>
            </motion.div>
          ))}
        </div>

        {/* Promise section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.5, duration: 0.6 }}
          style={{
            background: 'linear-gradient(135deg, rgba(255,107,26,0.12) 0%, rgba(255,140,66,0.06) 100%)',
            border: '1px solid rgba(255,107,26,0.25)',
            borderRadius: 24,
            padding: 'clamp(40px, 5vw, 72px)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Glossy shine */}
          <div style={{
            position: 'absolute',
            top: 0, left: '-20%',
            width: '60%', height: '100%',
            background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.03) 50%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{
            fontSize: 'clamp(36px, 5vw, 56px)',
            marginBottom: 20,
            filter: 'drop-shadow(0 0 20px rgba(255,107,26,0.3))',
          }}>🤝</div>

          <h2 style={{
            fontFamily: 'Poppins, sans-serif',
            fontSize: 'clamp(24px, 3vw, 38px)',
            fontWeight: 700,
            marginBottom: 16,
            color: 'var(--text-primary)',
          }}>
            Our Promise to You
          </h2>

          <p style={{
            fontSize: 'clamp(15px, 1.8vw, 18px)',
            color: 'rgba(255,255,255,0.65)',
            lineHeight: 1.8,
            maxWidth: 600,
            margin: '0 auto 32px',
          }}>
            We are committed to delivering solutions that are{' '}
            <strong style={{ color: '#FF8C42' }}>simple to use</strong>,{' '}
            <strong style={{ color: '#FF8C42' }}>powerful in performance</strong>, and{' '}
            <strong style={{ color: '#FF8C42' }}>reliable in operation</strong>.
          </p>

          <div style={{
            fontSize: 'clamp(18px, 2.5vw, 26px)',
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}>
            With Magizhchi Software, you don't just manage your business —
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #FF6B1A, #FF8C42)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              you transform it.
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
