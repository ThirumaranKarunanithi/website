import { motion } from 'framer-motion';
import { useInView } from '../hooks/useInView';
import logoAcademy from '../assets/logo-academy-orange.png';
import mentorImage from '../assets/academy_mentor.png';
import boxLogo from '../assets/logo-magizhchi-box.png';
import cloudProfessionals from '../assets/hero_professionals.png';
import dbCommunicatorLogo from '../assets/logo-db-communicator.png';
import dashboardImage from '../assets/business_dashboard.png';
import crmLogo from '../assets/logo-magizhchi-orange.png';
import crmImage from '../assets/img_crm.png';

const features = [
  { icon: '📋', title: 'Form Management', desc: 'Smart form creation and management with drag-and-drop builder' },
  { icon: '🎯', title: 'Advanced CRM', desc: 'Lead tracking, conversion funnels, and sales pipeline management' },
  { icon: '👥', title: 'HRMS', desc: 'Complete human resource management from hiring to payroll' },
  { icon: '💰', title: 'Accounting', desc: 'Integrated financial management with GST compliance' },
  { icon: '📚', title: 'Batch Management', desc: 'Efficient batch creation and complete lifecycle management' },
  { icon: '⚙️', title: 'Workflow Automation', desc: 'End-to-end operational workflow automation and reporting' },
];

export default function CurrentSolution() {
  const [ref, inView] = useInView(0.02);

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
          <div className="section-tag" style={{ margin: '0 auto 20px' }}>Current Solutions</div>
          <h2 className="section-title">
            Our <span className="gradient-text">Products</span>
          </h2>
          <p className="section-subtitle" style={{ margin: '0 auto', color: '#1E293B', fontWeight: 500 }}>
            Discover our suite of software solutions designed to simplify and empower your operations.
          </p>
        </motion.div>

        {/* Main card 0: Magizhchi CRM */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.15, duration: 1, ease: "easeOut" }}
          style={{
            backgroundColor: '#0F1B3D',
            backgroundImage: 'radial-gradient(rgba(232, 184, 75, 0.18) 2px, transparent 2px), linear-gradient(135deg, #18294F 0%, #0A1228 100%)',
            backgroundSize: '24px 24px, 100% 100%',
            color: '#ECF0FA',
            borderRadius: 24,
            padding: 'clamp(20px, 4vw, 40px)',
            marginBottom: 40,
            boxShadow: '0 20px 60px -10px rgba(232, 184, 75, 0.22), 0 8px 24px -4px rgba(10, 18, 40, 0.5)',
            border: '1px solid rgba(232, 184, 75, 0.18)',
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: 'clamp(20px, 4vw, 40px)', alignItems: 'center' }}>

            {/* Left side content */}
            <div style={{ minWidth: 0 }}>
              <div className="current-solution-header" style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32, flexWrap: 'wrap' }}>
                <div className="cs-logo-container" style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.7) 100%)',
                  border: '1px solid rgba(232, 184, 75, 0.4)',
                  borderRadius: 16,
                  padding: '14px',
                  boxShadow: '0 6px 24px rgba(232, 184, 75, 0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 100, height: 100, flexShrink: 0, boxSizing: 'border-box'
                }}>
                  <img src={crmLogo} alt="Magizhchi CRM Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div className="cs-text-container" style={{ flex: '1 1 min-content', minWidth: '200px' }}>
                  <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 800, marginBottom: 8, color: '#FFFFFF', wordBreak: 'break-word' }}>
                    Magizhchi CRM
                  </h3>
                  <p style={{ background: 'linear-gradient(90deg, #E8B84B, #F4D27A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontSize: 16, fontWeight: 700 }}>
                    Connect · Manage · Grow — leads to collections, all in one place
                  </p>
                </div>
                <div className="cs-button-container" style={{ marginTop: 8 }}>
                  <a
                    href="https://crmapp.magizhchi.software"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: 'linear-gradient(90deg, #E8B84B, #F4D27A)',
                      color: '#0A1228',
                      textDecoration: 'none',
                      padding: '12px 28px',
                      borderRadius: 12,
                      fontSize: 14,
                      fontWeight: 800,
                      boxShadow: '0 4px 20px rgba(232, 184, 75, 0.4)',
                      display: 'inline-block',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
                  >
                    Open Magizhchi CRM →
                  </a>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  willChange: 'transform, opacity',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%)',
                  border: '1px solid rgba(232, 184, 75, 0.20)',
                  borderRadius: 16, padding: 24,
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)', marginBottom: 30
                }}
              >
                <p style={{ fontSize: 16, color: '#FFFFFF', lineHeight: 1.7, fontWeight: 700, marginBottom: 16 }}>
                  Capture every enquiry, auto-assign it to your team, never miss a follow-up, and carry the
                  customer all the way through onboarding and payments — with live reports for Sales,
                  Operations, and Accounts.
                </p>
                <p style={{ fontSize: 15, color: '#C7D0E8', lineHeight: 1.7, fontWeight: 500 }}>
                  Magizhchi CRM is a multi-tenant CRM built for coaching institutes, academies, and growing
                  businesses. From web-form / API / Excel lead capture and a smart sales pipeline to post-sale
                  Operations &amp; Accounts with batches, installments and collections — it runs your whole
                  customer journey. Unlimited users on every plan, India-first pricing with UPI, and a loud
                  follow-up alarm so no lead ever slips.
                </p>
              </motion.div>
            </div>

            {/* Right side image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.5, duration: 1, ease: [0.22, 1, 0.36, 1] }}
              style={{
                willChange: 'transform, opacity', position: 'relative',
                borderRadius: 20, overflow: 'hidden',
                border: '2px solid rgba(232, 184, 75, 0.35)',
                boxShadow: '0 30px 60px rgba(0, 0, 0, 0.4)',
                height: '100%', minHeight: 400
              }}
            >
              <img src={crmImage} alt="Magizhchi CRM dashboard" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(232, 184, 75, 0.18) 0%, rgba(15, 27, 61, 0.55) 100%)', pointerEvents: 'none' }} />
            </motion.div>

          </div>

          <div style={{ borderTop: '1px solid rgba(232, 184, 75, 0.15)', margin: '40px 0' }} />

          {/* Detailed Content Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 500px), 1fr))', gap: '40px' }}>

            {/* Left Column: Key Features */}
            <div>
              <h4 style={{ fontSize: 24, fontWeight: 800, color: '#E8B84B', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                🎯 Key Features
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                {[
                  { icon: '🎯', title: 'Lead Capture & Pipeline', points: ['Web form, API, Excel & Instagram', 'New → Working → Follow-up → Won/Lost', 'Labels, categories & campaigns'] },
                  { icon: '⚡', title: 'Smart Auto-Assign', points: ['Load-balanced to your team', 'Caps, pause & manager roles', 'Bulk assign / reassign'] },
                  { icon: '⏰', title: 'Follow-ups & Alarms', points: ['Loud, high reminder ring', 'Custom & notification sounds', 'Never miss a callback'] },
                  { icon: '🛠️', title: 'Operations & Accounts', points: ['Post-sale onboarding & batches', 'Installments & collections', 'Per-student activity log'] },
                  { icon: '📊', title: 'Live Dashboards', points: ['Sales, Operations & Accounts reports', 'Filter by member, campaign, label', 'Revenue & conversion at a glance'] },
                  { icon: '👥', title: 'Teams & Departments', points: ['Unlimited users on all plans', 'Multi-department access', 'Permissions & deal approvals'] },
                ].map((feat, i) => (
                  <motion.div
                    key={`crm-kf-${i}`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "0px" }}
                    transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
                    whileHover={{ scale: 1.03, boxShadow: '0 10px 30px rgba(232, 184, 75, 0.25)' }}
                    style={{
                      willChange: 'transform, opacity',
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%)',
                      border: '1px solid rgba(232, 184, 75, 0.20)',
                      borderRadius: 16, padding: 20,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                      display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box', cursor: 'pointer'
                    }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{feat.icon}</div>
                    <h5 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', marginBottom: 8 }}>{feat.title}</h5>
                    <ul style={{ margin: 0, paddingLeft: 20, color: '#C7D0E8', fontSize: 14, lineHeight: 1.6, fontWeight: 500, flex: 1 }}>
                      {feat.points.map((p, idx) => <li key={idx} style={{ marginBottom: 4 }}>{p}</li>)}
                    </ul>
                  </motion.div>
                ))}

                {/* Why Choose */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "0px" }}
                  transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                  whileHover={{ scale: 1.03, boxShadow: '0 10px 30px rgba(232, 184, 75, 0.25)' }}
                  style={{
                    willChange: 'transform, opacity',
                    background: 'linear-gradient(135deg, rgba(232, 184, 75, 0.15) 0%, rgba(244, 210, 122, 0.08) 100%)',
                    border: '1px solid rgba(232, 184, 75, 0.35)',
                    borderRadius: 16, padding: 20,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                    display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box', cursor: 'pointer'
                  }}>
                  <h5 style={{ fontSize: 18, fontWeight: 800, color: '#E8B84B', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    ⭐ Why Choose Magizhchi CRM?
                  </h5>
                  <ul style={{ margin: 0, paddingLeft: 20, color: '#ECF0FA', fontSize: 14, lineHeight: 1.6, fontWeight: 500, flex: 1 }}>
                    <li style={{ marginBottom: 4 }}>Unlimited users on every plan</li>
                    <li style={{ marginBottom: 4 }}>India-first pricing — pay by UPI</li>
                    <li style={{ marginBottom: 4 }}>Post-sale Operations &amp; Accounts built-in</li>
                    <li style={{ marginBottom: 4 }}>Free plan to get started — no card</li>
                    <li style={{ marginBottom: 4 }}>Backed by <strong>Magizhchi Software</strong></li>
                  </ul>
                </motion.div>

              </div>
            </div>

            {/* Right Column: How it Works, Who is it for */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>

              {/* How It Works */}
              <div>
                <h4 style={{ fontSize: 24, fontWeight: 800, color: '#E8B84B', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                  ⚙️ How It Works
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[
                    { step: '1', title: 'Capture leads', desc: 'From your website form, API, Excel, or add them manually' },
                    { step: '2', title: 'Assign & work the pipeline', desc: 'Auto-assign to the team, call/WhatsApp, set follow-ups' },
                    { step: '3', title: 'Win & hand off', desc: 'Won deals flow to Operations & Accounts for onboarding' },
                    { step: '4', title: 'Track collections & growth', desc: 'Installments, activity logs, and live department reports' }
                  ].map((item, i) => (
                    <motion.div
                      key={`crm-hiw-${i}`}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "0px" }}
                      transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
                      whileHover={{ scale: 1.02, x: 5, boxShadow: '0 10px 30px rgba(232, 184, 75, 0.25)' }}
                      style={{
                        willChange: 'transform, opacity',
                        display: 'flex', gap: 16, alignItems: 'flex-start',
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%)',
                        border: '1px solid rgba(232, 184, 75, 0.20)',
                        padding: 16, borderRadius: 16,
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)', cursor: 'pointer'
                      }}>
                      <div style={{ background: 'linear-gradient(135deg, #E8B84B, #F4D27A)', color: '#0A1228', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>{item.step}</div>
                      <div>
                        <h5 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', marginBottom: 4 }}>{item.title}</h5>
                        <p style={{ fontSize: 14, color: '#C7D0E8', margin: 0, fontWeight: 500 }}>{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Who Is It For */}
              <div>
                <h4 style={{ fontSize: 24, fontWeight: 800, color: '#E8B84B', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                  👥 Who Is It For?
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                  {[
                    { icon: '🎓', title: 'Academies & Institutes', desc: 'Admissions, batches, fee installments & collections' },
                    { icon: '🏢', title: 'Local Businesses', desc: 'Capture enquiries and convert them into customers' },
                    { icon: '📈', title: 'Sales Teams', desc: 'A shared pipeline with auto-assign and follow-ups' }
                  ].map((item, i) => (
                    <motion.div
                      key={`crm-who-${i}`}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "0px" }}
                      transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
                      whileHover={{ scale: 1.03, boxShadow: '0 10px 30px rgba(232, 184, 75, 0.25)' }}
                      style={{
                        willChange: 'transform, opacity',
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%)',
                        border: '1px solid rgba(232, 184, 75, 0.20)',
                        borderRadius: 16, padding: 16,
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                        display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box', cursor: 'pointer'
                      }}>
                      <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
                      <h5 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', marginBottom: 6 }}>{item.title}</h5>
                      <p style={{ fontSize: 14, color: '#C7D0E8', margin: 0, lineHeight: 1.5, fontWeight: 500, flex: 1 }}>{item.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </motion.div>

        {/* Main card 2: Magizhchi Box */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.2, duration: 1, ease: "easeOut" }}
          style={{
            backgroundColor: '#0EA5E9',
            backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.2) 2px, transparent 2px), linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)',
            backgroundSize: '24px 24px, 100% 100%',
            color: '#F8FAFC',
            borderRadius: 24,
            padding: 'clamp(20px, 4vw, 40px)',
            marginBottom: 40,
            boxShadow: '0 20px 60px -10px rgba(2, 132, 199, 0.3), 0 8px 24px -4px rgba(2, 132, 199, 0.1)',
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
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.3) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                  borderRadius: 16,
                  padding: '12px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 100,
                  height: 100
                }}>
                  {/* Using the new logo */}
                  <img src={boxLogo} alt="Magizhchi Box Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'multiply' }} />
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
                    Magizhchi Box
                  </h3>
                  <p style={{ color: '#0F172A', fontSize: 16, fontWeight: 600 }}>
                    Secure Cloud Storage, Simplified
                  </p>
                </div>
                <div className="cs-button-container" style={{ marginTop: 8 }}>
                  <a
                    href="https://boxapp.magizhchi.software"
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
                    Visit Magizhchi Box →
                  </a>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  willChange: 'transform, opacity',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.3) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                  borderRadius: 16,
                  padding: 24,
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                  marginBottom: 30
                }}
              >
                <p style={{ fontSize: 16, color: '#000000', lineHeight: 1.7, fontWeight: 800, marginBottom: 16 }}>
                  Store, access, and manage your files from anywhere with complete control.
                  Built for individuals and businesses who value security, simplicity, and performance.
                </p>
                <p style={{ fontSize: 15, color: '#111827', lineHeight: 1.7, fontWeight: 600 }}>
                  Magizhchi Box is a modern cloud storage platform designed to make file management effortless and secure.
                  Inspired by platforms like Dropbox and Google Drive, it goes a step further by giving users full control over device access.
                  Whether you're managing personal files or business data, Magizhchi Box ensures your data is always safe, accessible, and organized.
                </p>
              </motion.div>
            </div>

            {/* Right side image / illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.6, duration: 1, ease: [0.22, 1, 0.36, 1] }}
              style={{
                willChange: 'transform, opacity',
                position: 'relative',
                borderRadius: 20,
                overflow: 'hidden',
                border: '2px solid rgba(255,255,255,0.4)',
                boxShadow: '0 30px 60px rgba(0, 0, 0, 0.2)',
                height: '100%',
                minHeight: 400
              }}
            >
              <img src={cloudProfessionals} alt="Cloud Storage Professionals" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.2) 0%, transparent 100%)',
                pointerEvents: 'none'
              }} />
            </motion.div>

          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', margin: '40px 0' }} />

          {/* Detailed Content Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 500px), 1fr))', gap: '40px' }}>

            {/* Left Column: Key Features */}
            <div>
              <h4 style={{ fontSize: 24, fontWeight: 800, color: '#FFFFFF', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                🔐 Key Features
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                {[
                  { icon: '🔒', title: 'Secure Device Access', points: ['Only 2 devices allowed per user', 'Prevent unauthorized access', 'Full control over active sessions'] },
                  { icon: '☁️', title: 'Cloud File Storage', points: ['Upload, download & manage files', 'Fast and reliable storage', 'Powered by cloud infrastructure'] },
                  { icon: '📁', title: 'Organized Management', points: ['Structured storage for easy access', 'Clean and simple interface'] },
                  { icon: '⚡', title: 'High Performance', points: ['Quick uploads and downloads', 'Optimized for real-time access'] },
                  { icon: '🔑', title: 'Private & Protected', points: ['Secure authentication system', 'Data isolation per user'] }
                ].map((feat, i) => (
                  <motion.div
                    key={`kf-${i}`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "0px" }}
                    transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
                    whileHover={{ scale: 1.03, boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)' }}
                    style={{
                      willChange: 'transform, opacity',
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.3) 100%)',
                      border: '1px solid rgba(255, 255, 255, 0.5)',
                      borderRadius: 16,
                      padding: 20,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      boxSizing: 'border-box',
                      cursor: 'pointer'
                    }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{feat.icon}</div>
                    <h5 style={{ fontSize: 16, fontWeight: 800, color: '#000000', marginBottom: 8 }}>{feat.title}</h5>
                    <ul style={{ margin: 0, paddingLeft: 20, color: '#111827', fontSize: 14, lineHeight: 1.6, fontWeight: 600, flex: 1 }}>
                      {feat.points.map((p, idx) => <li key={idx} style={{ marginBottom: 4 }}>{p}</li>)}
                    </ul>
                  </motion.div>
                ))}

                {/* Why Choose Magizhchi Box */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "0px" }}
                  transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                  whileHover={{ scale: 1.03, boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)' }}
                  style={{
                    willChange: 'transform, opacity',
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.3) 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    borderRadius: 16,
                    padding: 20,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    boxSizing: 'border-box',
                    cursor: 'pointer'
                  }}>
                  <h5 style={{ fontSize: 18, fontWeight: 800, color: '#000000', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    ⭐ Why Choose Magizhchi Box?
                  </h5>
                  <ul style={{ margin: 0, paddingLeft: 20, color: '#111827', fontSize: 14, lineHeight: 1.6, fontWeight: 600, flex: 1 }}>
                    <li style={{ marginBottom: 4 }}>Built with security-first approach</li>
                    <li style={{ marginBottom: 4 }}>Unique device restriction system</li>
                    <li style={{ marginBottom: 4 }}>Simple and easy-to-use interface</li>
                    <li style={{ marginBottom: 4 }}>Reliable cloud storage</li>
                    <li style={{ marginBottom: 4 }}>Backed by the innovation of <strong>Magizhchi Software</strong></li>
                  </ul>
                </motion.div>

              </div>
            </div>

            {/* Right Column: How it Works, Who is it for */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>

              {/* How It Works */}
              <div>
                <h4 style={{ fontSize: 24, fontWeight: 800, color: '#FFFFFF', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                  ⚙️ How It Works
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[
                    { step: '1', title: 'Sign Up / Login', desc: 'Create your account and securely log in' },
                    { step: '2', title: 'Device Registration', desc: 'Your device is registered automatically (max 2 devices allowed)' },
                    { step: '3', title: 'Upload Files', desc: 'Store your important files safely in the cloud' },
                    { step: '4', title: 'Access Anytime', desc: 'Retrieve your files from your authorized devices' }
                  ].map((item, i) => (
                    <motion.div
                      key={`hiw-${i}`}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "0px" }}
                      transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
                      whileHover={{ scale: 1.02, x: 5, boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)' }}
                      style={{
                        willChange: 'transform, opacity',
                        display: 'flex', gap: 16, alignItems: 'flex-start',
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.3) 100%)',
                        border: '1px solid rgba(255, 255, 255, 0.5)',
                        padding: 16, borderRadius: 16,
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                        cursor: 'pointer'
                      }}>
                      <div style={{
                        background: '#0F172A', color: '#FFFFFF',
                        width: 32, height: 32, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: 14, flexShrink: 0
                      }}>{item.step}</div>
                      <div>
                        <h5 style={{ fontSize: 16, fontWeight: 800, color: '#000000', marginBottom: 4 }}>{item.title}</h5>
                        <p style={{ fontSize: 14, color: '#111827', margin: 0, fontWeight: 600 }}>{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Who Is It For */}
              <div>
                <h4 style={{ fontSize: 24, fontWeight: 800, color: '#FFFFFF', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                  👥 Who Is It For?
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                  {[
                    { icon: '👤', title: 'Individuals', desc: 'Store personal files securely and access them anytime' },
                    { icon: '👨‍💻', title: 'Developers & Freelancers', desc: 'Manage project files with controlled device access' },
                    { icon: '🏢', title: 'Businesses', desc: 'Secure company data and restrict unauthorized usage' }
                  ].map((item, i) => (
                    <motion.div
                      key={`who-${i}`}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "0px" }}
                      transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
                      whileHover={{ scale: 1.03, boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)' }}
                      style={{
                        willChange: 'transform, opacity',
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.3) 100%)',
                        border: '1px solid rgba(255, 255, 255, 0.5)',
                        borderRadius: 16,
                        padding: 16,
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        boxSizing: 'border-box',
                        cursor: 'pointer'
                      }}>
                      <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
                      <h5 style={{ fontSize: 16, fontWeight: 800, color: '#000000', marginBottom: 6 }}>{item.title}</h5>
                      <p style={{ fontSize: 14, color: '#111827', margin: 0, lineHeight: 1.5, fontWeight: 600, flex: 1 }}>{item.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </motion.div>

        {/* Main card 3: Magizhchi DB Communicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.25, duration: 1, ease: "easeOut" }}
          style={{
            backgroundColor: '#0F1426',
            backgroundImage: 'radial-gradient(rgba(238, 90, 44, 0.18) 2px, transparent 2px), linear-gradient(135deg, #131A2E 0%, #0A0E1C 100%)',
            backgroundSize: '24px 24px, 100% 100%',
            color: '#ECEEF5',
            borderRadius: 24,
            padding: 'clamp(20px, 4vw, 40px)',
            marginBottom: 40,
            boxShadow: '0 20px 60px -10px rgba(238, 90, 44, 0.25), 0 8px 24px -4px rgba(15, 20, 38, 0.4)',
            border: '1px solid rgba(238, 90, 44, 0.15)',
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
                <motion.div
                  className="cs-logo-container"
                  whileHover={{ scale: 1.04, boxShadow: '0 8px 30px rgba(238, 90, 44, 0.45)' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.7) 100%)',
                    border: '1px solid rgba(248, 183, 57, 0.4)',
                    borderRadius: 20,
                    padding: 0,
                    overflow: 'hidden',
                    boxShadow: '0 6px 24px rgba(238, 90, 44, 0.3)',
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 220,
                    height: 220,
                    flexShrink: 0
                  }}>
                  <img
                    src={dbCommunicatorLogo}
                    alt="Magizhchi DB Communicator Logo"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      transform: 'scale(1.35)'
                    }}
                  />
                </motion.div>
                <div className="cs-text-container" style={{ flex: '1 1 min-content', minWidth: '200px' }}>
                  <h3 style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: 'clamp(22px, 3vw, 30px)',
                    fontWeight: 800,
                    marginBottom: 8,
                    color: '#FFFFFF',
                    wordBreak: 'break-word'
                  }}>
                    Magizhchi DB Communicator
                  </h3>
                  <p style={{
                    background: 'linear-gradient(90deg, #EE5A2C, #F8B739)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontSize: 16,
                    fontWeight: 700
                  }}>
                    Talk to your databases in plain English — AI-powered
                  </p>
                </div>
                <div className="cs-button-container" style={{ marginTop: 8 }}>
                  <a
                    href="https://magizhchi.software/downloads/MagizhchiDBCommunicator-Setup-0.2.1.exe"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      // GA4 event — shows up under: Reports → Engagement → Events → "download"
                      if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
                        window.gtag('event', 'download', {
                          item_name: 'magizhchi_db_communicator',
                          item_version: '0.2.1',
                          file_name: 'MagizhchiDBCommunicator-Setup-0.2.1.exe',
                          platform: 'windows',
                        });
                      }
                    }}
                    style={{
                      background: 'linear-gradient(90deg, #EE5A2C, #F8B739)',
                      color: '#0A0E1C',
                      textDecoration: 'none',
                      padding: '12px 28px',
                      borderRadius: 12,
                      fontSize: 14,
                      fontWeight: 800,
                      boxShadow: '0 4px 20px rgba(238, 90, 44, 0.4)',
                      display: 'inline-block',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
                  >
                    Download for Windows →
                  </a>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  willChange: 'transform, opacity',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%)',
                  border: '1px solid rgba(248, 183, 57, 0.20)',
                  borderRadius: 16,
                  padding: 24,
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                  marginBottom: 30
                }}
              >
                <p style={{ fontSize: 16, color: '#FFFFFF', lineHeight: 1.7, fontWeight: 700, marginBottom: 16 }}>
                  Ask any question in plain English and get the right SQL — across PostgreSQL, MySQL,
                  SQL Server, Oracle, SQLite, MongoDB, Redis, and CouchDB. All powered by a local LLM.
                </p>
                <p style={{ fontSize: 15, color: '#C7C9DD', lineHeight: 1.7, fontWeight: 500 }}>
                  Magizhchi DB Communicator is a premium desktop database assistant for developers, DBAs, and
                  analysts. The AI reads your schema, understands business terms like Pareto or cohort, and
                  generates production-ready SQL — with safety checks before anything destructive runs.
                  Your data never leaves your machine.
                </p>
              </motion.div>
            </div>

            {/* Right side image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.6, duration: 1, ease: [0.22, 1, 0.36, 1] }}
              style={{
                willChange: 'transform, opacity',
                position: 'relative',
                borderRadius: 20,
                overflow: 'hidden',
                border: '2px solid rgba(238, 90, 44, 0.35)',
                boxShadow: '0 30px 60px rgba(0, 0, 0, 0.4)',
                height: '100%',
                minHeight: 400
              }}
            >
              <img src={dashboardImage} alt="Database Dashboard" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(135deg, rgba(238, 90, 44, 0.25) 0%, rgba(15, 20, 38, 0.55) 100%)',
                pointerEvents: 'none'
              }} />
            </motion.div>

          </div>

          <div style={{ borderTop: '1px solid rgba(248, 183, 57, 0.15)', margin: '40px 0' }} />

          {/* Detailed Content Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 500px), 1fr))', gap: '40px' }}>

            {/* Left Column: Key Features */}
            <div>
              <h4 style={{ fontSize: 24, fontWeight: 800, color: '#F8B739', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                🤖 Key Features
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                {[
                  { icon: '💬', title: 'Natural-language to SQL', points: ['Ask in plain English', 'AI generates the right query', 'Schema-aware suggestions'] },
                  { icon: '🗄️', title: '8 Database Engines', points: ['PostgreSQL, MySQL, Oracle, SQL Server, SQLite', 'MongoDB, Redis, CouchDB', 'One UI for all of them'] },
                  { icon: '🔒', title: 'Local-first AI (Ollama)', points: ['LLM runs on your machine', 'Your schema never leaves', 'Works fully offline'] },
                  { icon: '📊', title: 'Charts & Visualizations', points: ['Table / Bar / Pie / Line', 'One-click switch', 'Auto-detects numeric columns'] },
                  { icon: '💾', title: 'Backup & Restore', points: ['One-click pg_dump / pg_restore', 'Per-table or full database', 'Saves to your chosen folder'] },
                  { icon: '🛡️', title: 'Safety Built-in', points: ['Confirmation for DROP / DELETE', 'Validates columns before run', 'Auto-fixes hallucinations'] }
                ].map((feat, i) => (
                  <motion.div
                    key={`dbc-kf-${i}`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "0px" }}
                    transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
                    whileHover={{ scale: 1.03, boxShadow: '0 10px 30px rgba(238, 90, 44, 0.25)' }}
                    style={{
                      willChange: 'transform, opacity',
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%)',
                      border: '1px solid rgba(248, 183, 57, 0.20)',
                      borderRadius: 16,
                      padding: 20,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      boxSizing: 'border-box',
                      cursor: 'pointer'
                    }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{feat.icon}</div>
                    <h5 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', marginBottom: 8 }}>{feat.title}</h5>
                    <ul style={{ margin: 0, paddingLeft: 20, color: '#C7C9DD', fontSize: 14, lineHeight: 1.6, fontWeight: 500, flex: 1 }}>
                      {feat.points.map((p, idx) => <li key={idx} style={{ marginBottom: 4 }}>{p}</li>)}
                    </ul>
                  </motion.div>
                ))}

                {/* Why Choose */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "0px" }}
                  transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                  whileHover={{ scale: 1.03, boxShadow: '0 10px 30px rgba(238, 90, 44, 0.25)' }}
                  style={{
                    willChange: 'transform, opacity',
                    background: 'linear-gradient(135deg, rgba(238, 90, 44, 0.15) 0%, rgba(248, 183, 57, 0.08) 100%)',
                    border: '1px solid rgba(248, 183, 57, 0.35)',
                    borderRadius: 16,
                    padding: 20,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    boxSizing: 'border-box',
                    cursor: 'pointer'
                  }}>
                  <h5 style={{ fontSize: 18, fontWeight: 800, color: '#F8B739', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    ⭐ Why Choose DB Communicator?
                  </h5>
                  <ul style={{ margin: 0, paddingLeft: 20, color: '#ECEEF5', fontSize: 14, lineHeight: 1.6, fontWeight: 500, flex: 1 }}>
                    <li style={{ marginBottom: 4 }}>No SaaS — your data stays on-machine</li>
                    <li style={{ marginBottom: 4 }}>Built-in safety: confirms destructive operations</li>
                    <li style={{ marginBottom: 4 }}>Smart auto-retry when AI hallucinates a column</li>
                    <li style={{ marginBottom: 4 }}>Knows business terms (Pareto, cohort, RFM, churn)</li>
                    <li style={{ marginBottom: 4 }}>Cross-platform: Windows, macOS, Linux</li>
                  </ul>
                </motion.div>

              </div>
            </div>

            {/* Right Column: How it Works, Who is it for */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>

              {/* How It Works */}
              <div>
                <h4 style={{ fontSize: 24, fontWeight: 800, color: '#F8B739', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                  ⚙️ How It Works
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[
                    { step: '1', title: 'Connect any database', desc: 'Pick the engine, enter host/credentials — the app auto-detects schema' },
                    { step: '2', title: 'Ask in plain English', desc: 'e.g. "show me the top customers contributing 80% of revenue this year"' },
                    { step: '3', title: 'Review the SQL', desc: 'Edit if needed, copy, or run with one click — safety checks built-in' },
                    { step: '4', title: 'Visualize results', desc: 'Table, bar, pie, or line chart — pick the right view instantly' }
                  ].map((item, i) => (
                    <motion.div
                      key={`dbc-hiw-${i}`}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "0px" }}
                      transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
                      whileHover={{ scale: 1.02, x: 5, boxShadow: '0 10px 30px rgba(238, 90, 44, 0.25)' }}
                      style={{
                        willChange: 'transform, opacity',
                        display: 'flex', gap: 16, alignItems: 'flex-start',
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%)',
                        border: '1px solid rgba(248, 183, 57, 0.20)',
                        padding: 16, borderRadius: 16,
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                        cursor: 'pointer'
                      }}>
                      <div style={{
                        background: 'linear-gradient(135deg, #EE5A2C, #F8B739)', color: '#0A0E1C',
                        width: 32, height: 32, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: 14, flexShrink: 0
                      }}>{item.step}</div>
                      <div>
                        <h5 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', marginBottom: 4 }}>{item.title}</h5>
                        <p style={{ fontSize: 14, color: '#C7C9DD', margin: 0, fontWeight: 500 }}>{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Who Is It For */}
              <div>
                <h4 style={{ fontSize: 24, fontWeight: 800, color: '#F8B739', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                  👥 Who Is It For?
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                  {[
                    { icon: '🧑‍💻', title: 'Developers', desc: 'Skip the SQL grind — describe what you need, get the query, run it' },
                    { icon: '🛢️', title: 'DBAs', desc: 'Backup, restore, schema browsing, and ad-hoc reports in one tool' },
                    { icon: '📈', title: 'Data Analysts', desc: 'Get Pareto / cohort / RFM reports without remembering window-function syntax' }
                  ].map((item, i) => (
                    <motion.div
                      key={`dbc-who-${i}`}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "0px" }}
                      transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
                      whileHover={{ scale: 1.03, boxShadow: '0 10px 30px rgba(238, 90, 44, 0.25)' }}
                      style={{
                        willChange: 'transform, opacity',
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%)',
                        border: '1px solid rgba(248, 183, 57, 0.20)',
                        borderRadius: 16,
                        padding: 16,
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        boxSizing: 'border-box',
                        cursor: 'pointer'
                      }}>
                      <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
                      <h5 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', marginBottom: 6 }}>{item.title}</h5>
                      <p style={{ fontSize: 14, color: '#C7C9DD', margin: 0, lineHeight: 1.5, fontWeight: 500, flex: 1 }}>{item.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </motion.div>

        {/* Main card 1: Tech Academy Management Software */}
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
              }} />
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
