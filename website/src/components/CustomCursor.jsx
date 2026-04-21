import { useEffect, useRef } from 'react';

export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const pos = useRef({ x: 0, y: 0 });
  const ring = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);

  useEffect(() => {
    const onMove = (e) => {
      pos.current = { x: e.clientX, y: e.clientY };
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      }
    };

    const animate = () => {
      ring.current.x += (pos.current.x - ring.current.x) * 0.12;
      ring.current.y += (pos.current.y - ring.current.y) * 0.12;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ring.current.x}px, ${ring.current.y}px)`;
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    const onEnterLink = () => {
      if (ringRef.current) {
        ringRef.current.style.width = '48px';
        ringRef.current.style.height = '48px';
        ringRef.current.style.borderColor = 'rgba(255,107,26,0.9)';
        ringRef.current.style.background = 'rgba(255,107,26,0.1)';
      }
      if (dotRef.current) dotRef.current.style.opacity = '0';
    };

    const onLeaveLink = () => {
      if (ringRef.current) {
        ringRef.current.style.width = '28px';
        ringRef.current.style.height = '28px';
        ringRef.current.style.borderColor = 'rgba(255,107,26,0.6)';
        ringRef.current.style.background = 'transparent';
      }
      if (dotRef.current) dotRef.current.style.opacity = '1';
    };

    const attachHovers = () => {
      document.querySelectorAll('a, button, [data-hover]').forEach(el => {
        el.addEventListener('mouseenter', onEnterLink);
        el.addEventListener('mouseleave', onLeaveLink);
      });
    };

    window.addEventListener('mousemove', onMove);
    rafRef.current = requestAnimationFrame(animate);
    attachHovers();

    const observer = new MutationObserver(attachHovers);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(rafRef.current);
      observer.disconnect();
    };
  }, []);

  const shared = {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: 99999,
    borderRadius: '50%',
    top: 0,
    left: 0,
    marginLeft: '-50%',
    marginTop: '-50%',
  };

  return (
    <>
      {/* Dot */}
      <div
        ref={dotRef}
        style={{
          ...shared,
          width: 6,
          height: 6,
          marginLeft: '-3px',
          marginTop: '-3px',
          background: '#FF6B1A',
          boxShadow: '0 0 8px rgba(255,107,26,0.9)',
          transition: 'opacity 0.2s',
        }}
      />
      {/* Ring */}
      <div
        ref={ringRef}
        style={{
          ...shared,
          width: 28,
          height: 28,
          marginLeft: '-14px',
          marginTop: '-14px',
          border: '1.5px solid rgba(255,107,26,0.6)',
          transition: 'width 0.25s, height 0.25s, border-color 0.25s, background 0.25s, margin 0.25s',
          backdropFilter: 'blur(0px)',
        }}
      />
    </>
  );
}
