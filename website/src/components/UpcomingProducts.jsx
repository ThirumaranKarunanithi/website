import { motion } from 'framer-motion';
import { useInView } from '../hooks/useInView';
import TiltCard from './TiltCard';

const products = [
  {
    id: 1,
    name: 'Magizhchi Parkal',
    subtitle: 'Dental Management Software',
    tagline: 'Modern Dental Practice, Fully Digitized',
    icon: '🦷',
    color: '#00B4D8',
    colorGlow: 'rgba(0, 180, 216, 0.15)',
    features: [
      'Patient record management',
      'Appointment scheduling',
      'Treatment tracking & history',
      'Billing and financial reports',
    ],
    badge: 'Healthcare',
  },
  {
    id: 2,
    name: 'Magizhchi Vadivangal',
    subtitle: 'Forms',
    tagline: 'Create. Customize. Collect. Analyze.',
    icon: '📝',
    color: '#7C3AED',
    colorGlow: 'rgba(124, 58, 237, 0.15)',
    features: [
      'Drag-and-drop form builder',
      'Custom branding (colors, fonts, layout)',
      'Multiple field types (text, dropdowns, combos)',
      'Auto data collection to spreadsheets',
    ],
    badge: 'Data Collection',
  },
  {
    id: 3,
    name: 'Magizhchi Virpanai',
    subtitle: 'CRM',
    tagline: 'Smart Sales Management Made Simple',
    icon: '🎯',
    color: '#FF6B1A',
    colorGlow: 'rgba(255, 107, 26, 0.15)',
    features: [
      'Lead management and tracking',
      'Team & individual lead assignment',
      'Integrated digital SIM calling',
      'Call recording and history',
    ],
    badge: 'Sales & CRM',
  },
  {
    id: 4,
    name: 'Magizhchi Kanakku',
    subtitle: 'Books — Accounting',
    tagline: 'Complete Financial Control',
    icon: '📊',
    color: '#10B981',
    colorGlow: 'rgba(16, 185, 129, 0.15)',
    features: [
      'End-to-end accounting management',
      'GST-ready compliance system',
      'Financial reports & insights',
      'Expense and income tracking',
    ],
    badge: 'Finance',
  },
  {
    id: 5,
    name: 'Magizhchi Paniyaalar',
    subtitle: 'People — HRMS',
    tagline: 'Your People, Managed with Clarity',
    icon: '👤',
    color: '#F59E0B',
    colorGlow: 'rgba(245, 158, 11, 0.15)',
    features: [
      'Employee records management',
      'Attendance tracking system',
      'Payroll processing',
      'Leave and performance management',
    ],
    badge: 'HR Management',
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
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 20,
        padding: 32,
        overflow: 'hidden',
        transition: 'border-color 0.3s',
        height: '100%',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = `${product.color}44`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
      }}
    >
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
          color: 'var(--text-primary)',
          marginBottom: 2,
        }}>
          {product.name}
        </h3>
        <span style={{ fontSize: 13, color: product.color, fontWeight: 600 }}>
          {product.subtitle}
        </span>
      </div>

      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 24, fontStyle: 'italic' }}>
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
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.4 }}>{f}</span>
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
        color: 'rgba(255,255,255,0.35)',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 100,
        padding: '5px 14px',
      }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: product.color, display: 'inline-block' }} />
        Coming Soon
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
        background: 'linear-gradient(180deg, var(--bg-main) 0%, var(--bg-card) 100%)',
        position: 'relative',
      }}
    >
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 64 }}
        >
          <div className="section-tag" style={{ margin: '0 auto 20px' }}>Upcoming Products</div>
          <h2 className="section-title">
            The Complete{' '}
            <span className="gradient-text">Business Ecosystem</span>
          </h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Five powerful products, one unified vision — covering every aspect of your business operations.
          </p>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
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
