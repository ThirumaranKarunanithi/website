import { motion } from 'framer-motion';
import { useInView } from '../hooks/useInView';
import logoAcademy from '../assets/logo-academy-orange.png';

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
      style={{ background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)', position: 'relative', overflow: 'hidden' }}
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

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 60 }}
        >
          <div className="section-tag" style={{ margin: '0 auto 20px' }}>Current Solution</div>
          <h2 className="section-title">
            Tech Academy{' '}
            <span className="gradient-text">Management Software</span>
          </h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
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
            backgroundColor: '#FFFFFF',
            backgroundImage: 'radial-gradient(rgba(14, 165, 233, 0.15) 1.5px, transparent 1.5px)',
            backgroundSize: '24px 24px',
            border: '1px solid #E2E8F0',
            borderRadius: 24,
            padding: 'clamp(32px, 4vw, 56px)',
            marginBottom: 40,
            boxShadow: '0 20px 60px -10px rgba(0,212,255,0.08), 0 8px 24px -4px rgba(0,212,255,0.03)',
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            marginBottom: 48,
            flexWrap: 'wrap',
          }}>
            <div style={{
              background: 'rgba(0,212,255,0.12)',
              border: '1px solid rgba(0,212,255,0.25)',
              borderRadius: 16,
              padding: 16,
            }}>
              <img src={logoAcademy} alt="Tech Academy" style={{ height: 50, width: 'auto' }} />
            </div>
            <div>
              <h3 style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: 'clamp(22px, 3vw, 30px)',
                fontWeight: 700,
                marginBottom: 8,
              }}>
                Magizhchi Tech Academy Platform
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
                Powering training institutes with end-to-end management
              </p>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <a
                href="https://magizhchi.academy/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: 'linear-gradient(135deg, #00D4FF, #3ce8ff)',
                  color: '#0F172A',
                  textDecoration: 'none',
                  padding: '12px 28px',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 700,
                  boxShadow: '0 4px 20px rgba(0,212,255,0.35)',
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
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 20,
          }}>
            {features.map((feat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.3 + i * 0.07, duration: 0.5 }}
                style={{
                  background: '#F0FBFF',
                  border: '1px solid #6bd9f2',
                  borderRadius: 14,
                  padding: '20px 22px',
                  transition: 'all 0.3s',
                  cursor: 'default',
                  boxShadow: '0 4px 12px rgba(0, 212, 255, 0.05)',
                }}
                whileHover={{
                  borderColor: '#00D4FF',
                  background: '#E0F9FF',
                  y: -4,
                  boxShadow: '0 12px 24px rgba(0, 212, 255, 0.15)',
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 10 }}>{feat.icon}</div>
                <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: '#0094cd' }}>
                  {feat.title}
                </h4>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {feat.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
