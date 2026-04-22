import { motion } from 'framer-motion';
import { useInView } from '../hooks/useInView';
import TiltCard from './TiltCard';
import dashboardImage from '../assets/business_dashboard.png';
import imgDental from '../assets/img_dental.png';
import imgForms from '../assets/img_forms.png';
import imgCrm from '../assets/img_crm.png';
import imgAccounting from '../assets/img_accounting.png';
import imgHrms from '../assets/img_hrms.png';

const products = [
  {
    id: 1,
    name: 'Magizhchi Parkal',
    subtitle: 'Dental Management Software',
    tagline: 'Modern Dental Practice, Fully Digitized',
    icon: '🦷',
    color: '#F97316',
    colorGlow: 'rgba(249, 115, 22, 0.15)',
    features: [
      'Patient record management',
      'Appointment scheduling',
      'Treatment tracking & history',
      'Billing and financial reports',
    ],
    badge: 'Healthcare',
    img: imgDental,
  },
  {
    id: 2,
    name: 'Magizhchi Vadivangal',
    subtitle: 'Forms',
    tagline: 'Create. Customize. Collect. Analyze.',
    icon: '📝',
    color: '#EA580C',
    colorGlow: 'rgba(234, 88, 12, 0.15)',
    features: [
      'Drag-and-drop form builder',
      'Custom branding (colors, fonts, layout)',
      'Multiple field types (text, dropdowns, combos)',
      'Auto data collection to spreadsheets',
    ],
    badge: 'Data Collection',
    img: imgForms,
  },
  {
    id: 3,
    name: 'Magizhchi Virpanai',
    subtitle: 'CRM',
    tagline: 'Smart Sales Management Made Simple',
    icon: '🎯',
    color: '#F59E0B',
    colorGlow: 'rgba(245, 158, 11, 0.15)',
    features: [
      'Lead management and tracking',
      'Team & individual lead assignment',
      'Integrated digital SIM calling',
      'Call recording and history',
    ],
    badge: 'Sales & CRM',
    img: imgCrm,
  },
  {
    id: 4,
    name: 'Magizhchi Kanakku',
    subtitle: 'Books — Accounting',
    tagline: 'Complete Financial Control',
    icon: '📊',
    color: '#D97706',
    colorGlow: 'rgba(217, 119, 6, 0.15)',
    features: [
      'End-to-end accounting management',
      'GST-ready compliance system',
      'Financial reports & insights',
      'Expense and income tracking',
    ],
    badge: 'Finance',
    img: imgAccounting,
  },
  {
    id: 5,
    name: 'Magizhchi Paniyaalar',
    subtitle: 'People — HRMS',
    tagline: 'Your People, Managed with Clarity',
    icon: '👤',
    color: '#FB923C',
    colorGlow: 'rgba(251, 146, 60, 0.15)',
    features: [
      'Employee records management',
      'Attendance tracking system',
      'Payroll processing',
      'Leave and performance management',
    ],
    badge: 'HR Management',
    img: imgHrms,
  },
];

function ProductCard({ product, index, inView }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.1, duration: 0.6 }}
    >
    <TiltCard
      intensity={10}
      gloss={true}
      style={{
        background: 'linear-gradient(135deg, rgba(255, 237, 213, 0.8) 0%, rgba(253, 186, 116, 0.5) 100%)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(251, 146, 60, 0.3)',
        borderTop: '1px solid #FFFFFF',
        borderLeft: '1px solid #FFFFFF',
        borderRadius: 20,
        overflow: 'hidden',
        transition: 'all 0.3s',
        height: '100%',
        boxShadow: '0 12px 32px rgba(234, 88, 12, 0.08)',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = product.color;
        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(254, 215, 170, 0.9) 0%, rgba(251, 146, 60, 0.8) 100%)';
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.boxShadow = `0 20px 48px ${product.colorGlow}, inset 0 0 10px rgba(255,255,255,0.7)`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(251, 146, 60, 0.3)';
        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 237, 213, 0.8) 0%, rgba(253, 186, 116, 0.5) 100%)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 12px 32px rgba(234, 88, 12, 0.08)';
      }}
    >
      {/* Dynamic Image Header */}
      <div style={{
        height: 220,
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        borderBottom: `2px solid ${product.color}40`,
        flexShrink: 0
      }}>
        <img 
          src={product.img} 
          alt={product.name} 
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }} 
        />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(to top, ${product.color}25, transparent)`,
          pointerEvents: 'none'
        }} />
      </div>

      <div style={{ padding: 28, flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute',
          top: 0, right: 0,
          width: 200, height: 200,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${product.colorGlow} 0%, transparent 70%)`,
          transform: 'translate(30%, -30%)',
          pointerEvents: 'none',
        }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{
          width: 56, height: 56,
          borderRadius: 14,
          background: `${product.colorGlow}`,
          border: `1px solid ${product.color}33`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 26,
        }}>
          {product.icon}
        </div>
        <span style={{
          background: `${product.colorGlow}`,
          border: `1px solid ${product.color}44`,
          borderRadius: 100,
          padding: '4px 12px',
          fontSize: 11,
          fontWeight: 600,
          color: product.color,
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
        }}>
          {product.badge}
        </span>
      </div>

      {/* Title */}
      <div style={{ marginBottom: 8 }}>
        <h3 style={{
          fontFamily: 'Poppins, sans-serif',
          fontSize: 20,
          fontWeight: 700,
          color: '#000000',
          marginBottom: 2,
        }}>
          {product.name}
        </h3>
        <span style={{ fontSize: 13, color: product.color, fontWeight: 600 }}>
          {product.subtitle}
        </span>
      </div>

      <p style={{ fontSize: 14, color: '#0F172A', fontWeight: 600, marginBottom: 24, fontStyle: 'italic' }}>
        "{product.tagline}"
      </p>

      {/* Features */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {product.features.map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 18, height: 18,
              borderRadius: 4,
              background: `${product.colorGlow}`,
              border: `1px solid ${product.color}55`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              color: product.color,
              flexShrink: 0,
              fontWeight: 700,
            }}>✓</div>
            <span style={{ fontSize: 13, color: '#0F172A', fontWeight: 600, lineHeight: 1.4 }}>{f}</span>
          </div>
        ))}
      </div>

      {/* Coming soon badge */}
      <div style={{
        marginTop: 24,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 12,
        color: '#A16207',
        background: 'rgba(250, 204, 21, 0.2)',
        border: '1px solid rgba(250, 204, 21, 0.5)',
        borderRadius: 100,
        padding: '5px 14px',
        fontWeight: 600,
      }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: product.color, display: 'inline-block' }} />
        Coming Soon
      </div>
      </div>
    </TiltCard>
    </motion.div>
  );
}

export default function UpcomingProducts() {
  const [ref, inView] = useInView(0.1);

  return (
    <section
      id="products"
      ref={ref}
      style={{
        backgroundColor: '#FFF7ED',
        position: 'relative',
        padding: '120px 0',
        overflow: 'hidden'
      }}
    >
      {/* Blended high-def background image */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        backgroundImage: `url(${dashboardImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        opacity: 0.25,
      }} />
      {/* Texture mask overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        backgroundImage: `
          repeating-linear-gradient(45deg, rgba(249, 115, 22, 0.04) 0px, rgba(249, 115, 22, 0.04) 1px, transparent 1px, transparent 12px),
          linear-gradient(135deg, rgba(255, 247, 237, 0.9) 0%, rgba(255, 237, 213, 0.8) 100%)
        `,
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 64 }}
        >
          <div className="section-tag" style={{ margin: '0 auto 20px', color: '#EA580C', background: '#FFEDD5', border: '1px solid #FDBA74' }}>Upcoming Products</div>
          <h2 className="section-title" style={{ color: '#000000' }}>
            The Complete{' '}
            <span style={{ 
              background: 'linear-gradient(90deg, #F97316, #EA580C)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Business Ecosystem</span>
          </h2>
          <p className="section-subtitle" style={{ margin: '0 auto', color: '#0F172A', fontWeight: 600 }}>
            Five powerful products, one unified vision — covering every aspect of your business operations.
          </p>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
          gap: 24,
        }}>
          {products.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} inView={inView} />
          ))}
        </div>
      </div>
    </section>
  );
}
