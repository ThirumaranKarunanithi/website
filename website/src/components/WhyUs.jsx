import { motion } from 'framer-motion';
import { useInView } from '../hooks/useInView';
import TiltCard from './TiltCard';
import whyEcosystem from '../assets/why_ecosystem.png';
import whyUserFriendly from '../assets/why_userfriendly.png';
import whyCustomizable from '../assets/why_customizable.png';
import whyScalable from '../assets/why_scalable.png';
import whyAutomation from '../assets/why_automation.png';
import whySecurity from '../assets/why_security.png';
import whyPromise from '../assets/why_promise.png';

const reasons = [
  {
    icon: '🔗',
    title: 'All-in-One Ecosystem',
    desc: 'No need for multiple disconnected tools. Everything your business needs in one integrated platform.',
    img: whyEcosystem,
  },
  {
    icon: '✨',
    title: 'User-Friendly Design',
    desc: 'Built for ease of use — intuitive interfaces that your team can adopt without extensive training.',
    img: whyUserFriendly,
  },
  {
    icon: '🎨',
    title: 'Customizable Solutions',
    desc: 'Tailored to your specific business needs. Every module adapts to how you work, not the other way around.',
    img: whyCustomizable,
  },
  {
    icon: '📈',
    title: 'Scalable Architecture',
    desc: 'Our platform grows with your business — from startup to enterprise, without changing your workflow.',
    img: whyScalable,
  },
  {
    icon: '⚡',
    title: 'Automation-Driven',
    desc: 'Reduce manual work and eliminate errors through intelligent workflow automation across all modules.',
    img: whyAutomation,
  },
  {
    icon: '🛡️',
    title: 'Reliable & Secure',
    desc: 'Enterprise-grade security and uptime guarantees. Your data is always protected and accessible.',
    img: whySecurity,
  },
];

export default function WhyUs() {
  const [ref, inView] = useInView(0.1);

  return (
    <section
      id="why"
      ref={ref}
      style={{
        backgroundColor: '#FB923C',
        backgroundImage: `
          radial-gradient(rgba(255, 255, 255, 0.25) 2px, transparent 2px),
          linear-gradient(135deg, #FDBA74 0%, #FB923C 100%)
        `,
        backgroundSize: '24px 24px, 100% 100%',
        position: 'relative',
        overflow: 'hidden',
        padding: '80px 0',
      }}
    >
      {/* Decorative element */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: '50%',
        transform: 'translateX(-50%)',
        width: 1200, height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
        pointerEvents: 'none',
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 64 }}
        >
          <div className="section-tag" style={{ margin: '0 auto 20px', color: '#EA580C', background: '#FFFFFF', border: '1px solid #FFFFFF', boxShadow: '0 4px 10px rgba(234, 88, 12, 0.1)' }}>Why Magizhchi</div>
          <h2 className="section-title" style={{ color: '#000000' }}>
            Built for{' '}
            <span style={{ color: '#FFFFFF', textShadow: '0 2px 10px rgba(234, 88, 12, 0.2)' }}>Real Business Needs</span>
          </h2>
          <p className="section-subtitle" style={{ margin: '0 auto', color: '#0F172A', fontWeight: 600 }}>
            Every feature we build solves a real problem. Here's what sets us apart.
          </p>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
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
                  background: 'rgba(255,255,255,0.4)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.7)',
                  borderRadius: 18,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s',
                  height: '100%',
                  boxShadow: '0 8px 30px -4px rgba(234, 88, 12, 0.1)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#FFFFFF';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.6)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.7)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.4)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Edge-to-Edge Image Header */}
                <div style={{ height: 180, width: '100%', position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.4)', flexShrink: 0 }}>
                  <img src={r.img} alt={r.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(255,255,255,0.6), transparent)' }} />
                </div>

                <div style={{ padding: '24px 28px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{
                    width: 52, height: 52,
                    borderRadius: 12,
                    background: '#FFFFFF',
                    border: '1px solid rgba(255, 255, 255, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    marginBottom: 18,
                    boxShadow: '0 4px 10px rgba(234, 88, 12, 0.05)',
                  }}>
                    {r.icon}
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 10, color: '#000000' }}>
                    {r.title}
                  </h3>
                  <p style={{ fontSize: 14, color: '#0F172A', fontWeight: 600, lineHeight: 1.7 }}>
                    {r.desc}
                  </p>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </div>

        {/* Promise section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 0.7 }}
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.3) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.7)',
            borderTop: '2px solid #FFFFFF',
            borderLeft: '2px solid #FFFFFF',
            borderRadius: 24,
            overflow: 'hidden',
            boxShadow: '0 20px 40px -10px rgba(234, 88, 12, 0.15)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
          }}
        >
          {/* Left Frame: Text Core */}
          <div style={{ padding: 'clamp(40px, 5vw, 64px)', position: 'relative', textAlign: 'left' }}>
            {/* Glossy shine */}
            <div style={{
              position: 'absolute',
              top: 0, left: '-20%',
              width: '60%', height: '100%',
              background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            <div style={{
              fontSize: 'clamp(36px, 5vw, 56px)',
              marginBottom: 16,
              filter: 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.8))',
            }}>🤝</div>

            <h2 style={{
              fontFamily: 'Poppins, sans-serif',
              fontSize: 'clamp(24px, 3.5vw, 42px)',
              fontWeight: 800,
              marginBottom: 20,
              color: '#000000',
            }}>
              Our Promise to You
            </h2>

            <p style={{
              fontSize: 'clamp(15px, 1.8vw, 18px)',
              color: '#0F172A',
              lineHeight: 1.8,
              fontWeight: 600,
              marginBottom: 36,
            }}>
              We are committed to delivering solutions that are{' '}
              <strong style={{ color: '#EA580C', fontWeight: 800 }}>simple to use</strong>,{' '}
              <strong style={{ color: '#EA580C', fontWeight: 800 }}>powerful in performance</strong>, and{' '}
              <strong style={{ color: '#EA580C', fontWeight: 800 }}>reliable in operation</strong>.
            </p>

            <div style={{
              fontSize: 'clamp(18px, 2.5vw, 26px)',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 800,
              color: '#000000',
              lineHeight: 1.3
            }}>
              With Magizhchi Software, you don't just manage your business —
              <span style={{ color: '#EA580C', display: 'block', marginTop: 4 }}>
                you transform it.
              </span>
            </div>
          </div>

          {/* Right Frame: Promise Image */}
          <div style={{ position: 'relative', minHeight: 400 }}>
             <img src={whyPromise} alt="Our Promise" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
             <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to left, transparent 20%, rgba(255,255,255,0.95))' }} />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
