import { motion } from 'framer-motion';
import logoOrange from '../assets/logo-software-orange.png';

export default function Footer() {
  return (
    <footer style={{
      background: '#060608',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      padding: '60px 24px 32px',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr',
          gap: 48,
          marginBottom: 48,
        }}
        className="footer-grid"
        >
          {/* Brand */}
          <div>
            <img src={logoOrange} alt="Magizhchi Software" style={{ height: 44, marginBottom: 16 }} />
            <p style={{
              fontSize: 14,
              color: 'rgba(255,255,255,0.45)',
              lineHeight: 1.8,
              maxWidth: 320,
              marginBottom: 20,
            }}>
              Making Business Simple, Smart, and Scalable.
              Integrated software solutions for real-world business needs.
            </p>
            <a
              href="https://magizhchi.academy/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255,107,26,0.1)',
                border: '1px solid rgba(255,107,26,0.2)',
                borderRadius: 10,
                padding: '10px 20px',
                textDecoration: 'none',
                color: '#FF8C42',
                fontSize: 14,
                fontWeight: 600,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,107,26,0.18)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,107,26,0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              🎓 Visit Magizhchi Academy →
            </a>
          </div>

          {/* Products */}
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 20 }}>
              Products
            </h4>
            {[
              'Tech Academy Software',
              'Parkal (Dental)',
              'Vadivangal (Forms)',
              'Virpanai (CRM)',
              'Kanakku (Books)',
              'Paniyaalar (HRMS)',
            ].map(item => (
              <div key={item} style={{
                fontSize: 14,
                color: 'rgba(255,255,255,0.45)',
                marginBottom: 10,
                transition: 'color 0.2s',
                cursor: 'default',
              }}
              onMouseEnter={e => e.target.style.color = '#FF8C42'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.45)'}
              >
                {item}
              </div>
            ))}
          </div>

          {/* Company */}
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 20 }}>
              Company
            </h4>
            {[
              { label: 'About Us', href: '#vision' },
              { label: 'Our Vision', href: '#vision' },
              { label: 'Solutions', href: '#solutions' },
              { label: 'Why Choose Us', href: '#why' },
              { label: 'Academy', href: 'https://magizhchi.academy/' },
            ].map(item => (
              <a key={item.label} href={item.href} style={{
                display: 'block',
                fontSize: 14,
                color: 'rgba(255,255,255,0.45)',
                textDecoration: 'none',
                marginBottom: 10,
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => e.target.style.color = '#FF8C42'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.45)'}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.05)',
          paddingTop: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
            © {new Date().getFullYear()} Magizhchi Software. All rights reserved.
          </p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)' }}>
            Built with passion for better business
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </footer>
  );
}
