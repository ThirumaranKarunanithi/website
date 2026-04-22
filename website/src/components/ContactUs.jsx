import { motion } from 'framer-motion';
import { useInView } from '../hooks/useInView';
import TiltCard from './TiltCard';

export default function ContactUs() {
  const [ref, inView] = useInView(0.1);

  return (
    <section id="contact" ref={ref} style={{
      backgroundColor: '#FFF7ED',
      backgroundImage: `
        radial-gradient(rgba(249, 115, 22, 0.15) 2px, transparent 2px),
        linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)
      `,
      backgroundSize: '24px 24px, 100% 100%',
      position: 'relative',
      overflow: 'hidden',
      padding: '100px 0',
    }}>
      <div className="container" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
          gap: 32,
        }}>
          {/* Left Side */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
          >
            <TiltCard
              intensity={8}
              gloss={true}
              style={{
                background: 'linear-gradient(135deg, rgba(254, 215, 170, 0.8) 0%, rgba(251, 146, 60, 0.4) 100%)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(251, 146, 60, 0.3)',
                borderTop: '1px solid #FFFFFF',
                borderLeft: '1px solid #FFFFFF',
                borderRadius: 24,
                padding: 'clamp(32px, 5vw, 64px)',
                color: '#000000',
                height: '100%',
                boxShadow: '0 20px 40px rgba(234, 88, 12, 0.1)',
                display: 'flex',
                justifyContent: 'center'
              }}
              className="contact-card-left"
            >
              <h2 style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: 'clamp(32px, 4vw, 48px)',
                fontWeight: 800,
                lineHeight: 1.1,
                marginBottom: 20,
                color: '#000000'
              }}>
                Let's Build Your<br/>Business Together.
              </h2>
              <p style={{
                fontSize: 16,
                lineHeight: 1.6,
                color: '#0F172A',
                fontWeight: 600,
                marginBottom: 48,
                maxWidth: 400
              }}>
                One call could change your entire trajectory. Reach out to us directly.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                {/* Call */}
                <div className="contact-item" style={{ display: 'flex', gap: 20 }}>
                  <div style={{
                    width: 48, height: 48,
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.6)',
                    border: '1px solid rgba(255,255,255,0.8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, flexShrink: 0,
                    boxShadow: '0 4px 10px rgba(234, 88, 12, 0.1)',
                  }}>📞</div>
                  <div>
                    <div style={{ fontSize: 12, color: '#0F172A', fontWeight: 700, letterSpacing: 1, opacity: 0.8, marginBottom: 4, textTransform: 'uppercase' }}>Call Us</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#000000' }}>+91 79049 96609</div>
                  </div>
                </div>

                {/* Email */}
                <div className="contact-item" style={{ display: 'flex', gap: 20 }}>
                  <div style={{
                    width: 48, height: 48,
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.6)',
                    border: '1px solid rgba(255,255,255,0.8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, flexShrink: 0,
                    boxShadow: '0 4px 10px rgba(234, 88, 12, 0.1)',
                  }}>✉️</div>
                  <div>
                    <div style={{ fontSize: 12, color: '#0F172A', fontWeight: 700, letterSpacing: 1, opacity: 0.8, marginBottom: 4, textTransform: 'uppercase' }}>Email</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#000000', wordBreak: 'break-word' }}>thirumarankarunanithi@<br/>magizhchi.academy</div>
                  </div>
                </div>

                {/* Location */}
                <div className="contact-item" style={{ display: 'flex', gap: 20 }}>
                  <div style={{
                    width: 48, height: 48,
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.6)',
                    border: '1px solid rgba(255,255,255,0.8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, flexShrink: 0,
                    boxShadow: '0 4px 10px rgba(234, 88, 12, 0.1)',
                  }}>📍</div>
                  <div>
                    <div style={{ fontSize: 12, color: '#0F172A', fontWeight: 700, letterSpacing: 1, opacity: 0.8, marginBottom: 4, textTransform: 'uppercase' }}>Visit Us</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#000000', lineHeight: 1.5, maxWidth: 280 }}>
                      Pooja building Plot No: 17,<br/>
                      Vaithiyanatha Iyer Street,<br/>
                      Shenoy nagar, Madurai
                    </div>
                  </div>
                </div>
              </div>
            </TiltCard>
          </motion.div>

          {/* Right Side */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
          >
            <TiltCard
              intensity={8}
              gloss={true}
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.4) 100%)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.6)',
                borderTop: '1px solid #FFFFFF',
                borderLeft: '1px solid #FFFFFF',
                borderRadius: 24,
                padding: 'clamp(32px, 5vw, 64px)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                height: '100%',
                boxShadow: '0 20px 40px rgba(15, 23, 42, 0.05)'
              }}
            >
              <h2 style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: 'clamp(28px, 3.5vw, 40px)',
                fontWeight: 800,
                color: '#000000',
                marginBottom: 16
              }}>
                Ready to Start Your Journey?
              </h2>
              <p style={{
                fontSize: 16,
                color: '#0F172A',
                fontWeight: 600,
                lineHeight: 1.6,
                marginBottom: 40,
                maxWidth: 380
              }}>
                Book a free demo class and discover how we can transform your business.
              </p>

              <motion.a
                href="https://magizhchi.academy/"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  background: 'linear-gradient(135deg, #020617, #0F172A)',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  padding: '16px 40px',
                  borderRadius: 100,
                  fontSize: 18,
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 32,
                  boxShadow: '0 10px 25px rgba(15,23,42,0.2)'
                }}
              >
                Enroll Now <span style={{ color: '#F97316' }}>→</span>
              </motion.a>

              <p style={{
                fontSize: 13,
                color: '#0F172A',
                opacity: 0.8,
                fontWeight: 600
              }}>
                Fill out a quick form and our mentor will get in touch with you.
              </p>
            </TiltCard>
          </motion.div>
        </div>
      </div>
      <style>{`
        @media (max-width: 767px) {
          .contact-card-left {
            align-items: center;
            text-align: center;
          }
          .contact-card-left > div {
            align-items: center;
          }
          .contact-card-left .contact-item {
            flex-direction: column;
            text-align: center;
            gap: 12px !important;
          }
        }
      `}</style>
    </section>
  );
}
