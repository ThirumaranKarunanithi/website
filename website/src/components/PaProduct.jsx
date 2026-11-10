import { motion } from 'framer-motion';
import paLogo from '../assets/logo-magizhchi-pa.webp';
import PaStage from './PaStage';

// Magizhchi PA: the owner's personal assistant. The logo is the lamp and genie; the slogan is "Your wish, done."
const FEATURES = [
  { icon: '🗣️', title: 'Say it, it is done', points: ['Voice, camera or text, in English or Tamil', 'Set alarms, make calls, draft mail, save contacts', 'Plans your day, tasks and reminders'] },
  { icon: '🏢', title: 'Your whole company in one place', points: ['Every action in CRM, Meet, Box and Forms', 'Follow-ups done, rooms opened, files shared', 'Marked when something needs you'] },
  { icon: '✅', title: 'Approve from one screen', points: ['Form ownership, leave requests, close requests', 'Let people into a Meet room', 'Or just say "approve the ownership requests"'] },
  { icon: '🌦️', title: 'Knows where you are going', points: ['Rain, storm and heat warnings for your place', 'Warns about weather at your meeting spot', 'Gold and silver city rates on Home'] },
  { icon: '🔔', title: 'Tells you, so you need not look', points: ['Morning and evening summaries', 'Staff attendance, fees due, uncalled leads', 'Real notifications on phone and computer'] },
  { icon: '📱', title: 'On every screen you use', points: ['Android app and Windows app', 'Opens in any browser', 'One Magizhchi ID for the whole suite'] },
];

export default function PaProduct() {
  return (
    <motion.div
      id="product-pa"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0 }}
      transition={{ delay: 0.15, duration: 1, ease: 'easeOut' }}
      style={{
        backgroundColor: '#0B0504',
        backgroundImage: 'radial-gradient(rgba(255, 176, 74, 0.16) 2px, transparent 2px), radial-gradient(900px 520px at 85% 10%, #3A1A08 0%, #140A05 55%, #0B0504 100%)',
        backgroundSize: '24px 24px, 100% 100%',
        color: '#FFF3E4',
        borderRadius: 24,
        padding: 'clamp(20px, 4vw, 40px)',
        marginBottom: 40,
        boxShadow: '0 20px 60px -10px rgba(245, 138, 7, 0.45), 0 8px 24px -4px rgba(11, 5, 4, 0.6)',
        border: '1px solid rgba(255, 176, 74, 0.45)',
        width: '100%',
        boxSizing: 'border-box',
        scrollMarginTop: 90,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute', top: 0, right: 30,
          background: 'linear-gradient(90deg, #F58A07, #FFC145)', color: '#1A0B03',
          fontWeight: 800, fontSize: 11, letterSpacing: '1px', textTransform: 'uppercase',
          padding: '6px 18px', borderRadius: '0 0 12px 12px',
          boxShadow: '0 4px 15px rgba(245, 138, 7, 0.45)', zIndex: 2,
        }}
      >
        🧞 Your personal assistant
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: 'clamp(20px, 4vw, 40px)', alignItems: 'center' }}>
        <div style={{ minWidth: 0 }}>
          <div className="current-solution-header" style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32, flexWrap: 'wrap' }}>
            <div
              className="cs-logo-container"
              style={{
                borderRadius: 24, overflow: 'hidden', width: 100, height: 100, flexShrink: 0, boxSizing: 'border-box',
                boxShadow: '0 10px 30px rgba(245, 138, 7, 0.55), 0 0 0 1px rgba(255, 176, 74, 0.5)',
              }}
            >
              <img src={paLogo} alt="Magizhchi PA logo: a golden lamp with a smiling genie" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
            <div className="cs-text-container" style={{ flex: '1 1 min-content', minWidth: '200px' }}>
              <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 800, marginBottom: 8, color: '#FFFFFF', wordBreak: 'break-word' }}>
                Magizhchi PA
              </h3>
              <p
                style={{
                  background: 'linear-gradient(90deg, #FFE08A, #FFB04A 45%, #FF7A1A)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                  fontSize: 'clamp(18px, 2.4vw, 22px)', fontWeight: 800, fontStyle: 'italic', letterSpacing: '0.2px',
                }}
              >
                Your wish, done.
              </p>
            </div>
            <div className="cs-button-container" style={{ marginTop: 8 }}>
              <a
                href="https://pa.magizhchi.software"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: 'linear-gradient(90deg, #F58A07, #FFC145)', color: '#1A0B03', textDecoration: 'none',
                  padding: '12px 28px', borderRadius: 12, fontSize: 14, fontWeight: 800,
                  boxShadow: '0 4px 20px rgba(245, 138, 7, 0.45)', display: 'inline-block', whiteSpace: 'nowrap', transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => (e.target.style.transform = 'translateY(-2px)')}
                onMouseLeave={(e) => (e.target.style.transform = 'translateY(0)')}
              >
                Open Magizhchi PA →
              </a>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0 }}
            transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            style={{
              willChange: 'transform, opacity',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.07) 0%, rgba(255, 255, 255, 0.02) 100%)',
              border: '1px solid rgba(255, 176, 74, 0.28)', borderRadius: 16, padding: 24,
            }}
          >
            <p style={{ fontSize: 16, color: '#FFFFFF', lineHeight: 1.7, fontWeight: 700, marginBottom: 16 }}>
              The company owner opens one app and sees everything. Tell Magizhchi PA what you want, by voice or text,
              and it gets done across all your Magizhchi apps.
            </p>
            <p style={{ fontSize: 15, color: '#E8D2BC', lineHeight: 1.7, fontWeight: 500 }}>
              It keeps your calendar, tasks and reminders, and watches CRM, Meet, Box and Forms for you: a follow-up done,
              a class opened, a form changed, a leave request waiting. What needs you is marked, and you can approve it right
              there. It warns you when rain is on the way to your next meeting, shows today&apos;s gold and silver rate for your
              city, and works on Android, Windows and the web with the same Magizhchi ID as the rest of the suite.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0 }}
          transition={{ delay: 0.5, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          style={{ willChange: 'transform, opacity', minWidth: 0 }}
        >
          <PaStage />
        </motion.div>
      </div>

      <div style={{ borderTop: '1px solid rgba(255, 176, 74, 0.22)', margin: '40px 0' }} />

      <div>
        <h4 style={{ fontSize: 24, fontWeight: 800, color: '#FFB04A', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>✨ Key Features</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 16 }}>
          {FEATURES.map((feat, i) => (
            <motion.div
              key={`pa-kf-${i}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '0px' }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: 'easeOut' }}
              whileHover={{ scale: 1.03, boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)' }}
              style={{
                willChange: 'transform, opacity',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.07) 0%, rgba(255, 255, 255, 0.02) 100%)',
                border: '1px solid rgba(255, 176, 74, 0.28)', borderRadius: 16, padding: 20,
                display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 8 }}>{feat.icon}</div>
              <h5 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', marginBottom: 8 }}>{feat.title}</h5>
              <ul style={{ margin: 0, paddingLeft: 20, color: '#E8D2BC', fontSize: 14, lineHeight: 1.6, fontWeight: 500, flex: 1 }}>
                {feat.points.map((p, idx) => <li key={idx} style={{ marginBottom: 4 }}>{p}</li>)}
              </ul>
            </motion.div>
          ))}
        </div>

        <div
          style={{
            marginTop: 24, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16,
            background: 'linear-gradient(135deg, rgba(245, 138, 7, 0.2) 0%, rgba(255, 255, 255, 0.03) 100%)',
            border: '1px solid rgba(255, 176, 74, 0.38)', borderRadius: 16, padding: '20px 24px',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px' }}>
            {['Android, Windows and web', 'Speaks English and Tamil', 'One Magizhchi ID for the suite'].map((t, i) => (
              <span key={`pa-gs-${i}`} style={{ display: 'inline-flex', alignItems: 'flex-start', gap: 8, fontSize: 14, color: '#FFF3E4', fontWeight: 600, lineHeight: 1.5 }}>
                <span style={{ color: '#FFB04A', fontWeight: 800 }}>✓</span>{t}
              </span>
            ))}
          </div>
          <a
            href="https://pa.magizhchi.software/download"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: 'linear-gradient(90deg, #F58A07, #FFC145)', color: '#1A0B03', textDecoration: 'none',
              padding: '10px 22px', borderRadius: 12, fontSize: 14, fontWeight: 800, whiteSpace: 'nowrap',
            }}
          >
            Get the app →
          </a>
        </div>
      </div>
    </motion.div>
  );
}
