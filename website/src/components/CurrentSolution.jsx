import { motion } from 'framer-motion';
import { useInView } from '../hooks/useInView';
import logoAcademy from '../assets/logo-academy-orange.png';
import mentorImage from '../assets/academy_mentor.png';

const features = [
  { icon: '📋', title: 'Form Management', desc: 'Smart form creation and management with drag-and-drop builder' },
  { icon: '🎯', title: 'Advanced CRM', desc: 'Lead tracking, conversion funnels, and sales pipeline management' },
  { icon: '👥', title: 'HRMS', desc: 'Complete human resource management from hiring to payroll' },
  { icon: '💰', title: 'Accounting', desc: 'Integrated financial management with GST compliance' },
  { icon: '📚', title: 'Batch Management', desc: 'Efficient batch creation and complete lifecycle management' },
  { icon: '⚙️', title: 'Workflow Automation', desc: 'End-to-end operational workflow automation and reporting' },
];

export default function CurrentSolution() {
  const [ref, inView] = useInView(0.15);

  return (
    <section
      id="solutions"
      ref={ref}
      style={{
        backgroundColor: '#BAE6FD',
        backgroundImage: `
          linear-gradient(rgba(14, 165, 233, 0.08) 1px, transparent 1px),
          linear-gradient(90deg, rgba(14, 165, 233, 0.08) 1px, transparent 1px),
          linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)
        `,
        backgroundSize: '32px 32px, 32px 32px, 100% 100%',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        padding: '80px 0'
      }}
    >
      {/* Radial glow */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 800, height: 400,
        borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(0,212,255,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 1, width: '100%' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 40 }}
        >
          <div className="section-tag" style={{ margin: '0 auto 20px' }}>Current Solution</div>
          <h2 className="section-title">
            Tech Academy{' '}
            <span className="gradient-text">Management Software</span>
          </h2>
          <p className="section-subtitle" style={{ margin: '0 auto', color: '#1E293B', fontWeight: 500 }}>
            A complete, all-in-one solution tailored for training institutes and academies.
            Ensuring your operations run smoothly, transparently, and efficiently.
          </p>
        </motion.div>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.7 }}
          style={{
            backgroundColor: '#FB923C',
            backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.3) 2px, transparent 2px), linear-gradient(135deg, #FDBA74 0%, #F97316 100%)',
            backgroundSize: '24px 24px, 100% 100%',
            color: '#020617',
            borderRadius: 24,
            padding: 'clamp(20px, 4vw, 40px)',
            marginBottom: 0,
            boxShadow: '0 20px 60px -10px rgba(249, 115, 22, 0.3), 0 8px 24px -4px rgba(249, 115, 22, 0.1)',
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: 'clamp(20px, 4vw, 40px)', alignItems: 'center' }}>
            {/* Left side content */}
            <div style={{ minWidth: 0 }}>
            <div className="current-solution-header" style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              marginBottom: 32,
              flexWrap: 'wrap',
            }}>
            <div className="cs-logo-container" style={{
              background: 'rgba(255, 255, 255, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.8)',
              borderRadius: 16,
              padding: '16px',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)',
              maxWidth: '100%',
              boxSizing: 'border-box'
            }}>
              <img src={logoAcademy} alt="Tech Academy" style={{ height: 'auto', maxHeight: 80, maxWidth: '100%', objectFit: 'contain' }} />
            </div>
            <div className="cs-text-container" style={{ flex: '1 1 min-content', minWidth: '200px' }}>
              <h3 style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: 'clamp(22px, 3vw, 30px)',
                fontWeight: 800,
                marginBottom: 8,
                color: '#000000',
                wordBreak: 'break-word'
              }}>
                Magizhchi Tech Academy Platform
              </h3>
              <p style={{ color: '#0F172A', fontSize: 16, fontWeight: 600 }}>
                Powering training institutes with end-to-end management
              </p>
            </div>
            <div className="cs-button-container" style={{ marginTop: 8 }}>
              <a
                href="https://magizhchi.academy/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: '#0F172A',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  padding: '12px 28px',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 700,
                  boxShadow: '0 4px 20px rgba(15,23,42,0.2)',
                  display: 'inline-block',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
              >
                Visit Academy →
              </a>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
            gap: 20,
          }}>
            {features.map((feat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.3 + i * 0.07, duration: 0.5 }}
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.2) 100%)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.6)',
                  borderTop: '1px solid #FFFFFF',
                  borderLeft: '1px solid #FFFFFF',
                  borderRadius: 14,
                  padding: '20px 22px',
                  transition: 'all 0.3s',
                  cursor: 'default',
                  boxShadow: '0 12px 32px rgba(15, 23, 42, 0.15)',
                }}
                whileHover={{
                  borderColor: '#FFFFFF',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.4) 100%)',
                  y: -6,
                  boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2), inset 0 0 10px rgba(255,255,255,0.7)',
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 10 }}>{feat.icon}</div>
                <h4 style={{ fontSize: 15, fontWeight: 800, marginBottom: 6, color: '#000000' }}>
                  {feat.title}
                </h4>
                <p style={{ fontSize: 13, color: '#0F172A', lineHeight: 1.6, fontWeight: 600 }}>
                  {feat.desc}
                </p>
              </motion.div>
            ))}
              </div>
            </div>

            {/* Right side image */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.4, duration: 0.7 }}
              style={{
                position: 'relative',
                borderRadius: 20,
                overflow: 'hidden',
                border: '2px solid rgba(255,255,255,0.6)',
                boxShadow: '0 30px 60px rgba(0, 0, 0, 0.1)',
                height: '100%',
                minHeight: 400
              }}
            >
              <img src={mentorImage} alt="Academy Mentor" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 100%)',
                pointerEvents: 'none'
              }}/>
            </motion.div>
          </div>
        </motion.div>
      </div>
      <style>{`
        .current-solution-header {
          justify-content: center;
          text-align: center;
        }
        .cs-button-container {
          margin-left: 0;
        }
        @media (min-width: 768px) {
          .current-solution-header {
            justify-content: flex-start;
            text-align: left;
          }
          .cs-button-container {
            margin-left: auto;
          }
        }
      `}</style>
    </section>
  );
}
