import { useEffect, useRef } from 'react';

export default function MouseSpotlight() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    let raf;
    let target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let current = { x: target.x, y: target.y };

    const onMove = (e) => {
      target.x = e.clientX;
      target.y = e.clientY;
    };

    const animate = () => {
      current.x += (target.x - current.x) * 0.06;
      current.y += (target.y - current.y) * 0.06;
      if (el) {
        el.style.left = `${current.x}px`;
        el.style.top = `${current.y}px`;
      }
      raf = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', onMove);
    raf = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        pointerEvents: 'none',
        zIndex: 1,
        width: 600,
        height: 600,
        borderRadius: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'radial-gradient(circle, rgba(255,107,26,0.055) 0%, rgba(255,107,26,0.02) 40%, transparent 70%)',
        filter: 'blur(2px)',
        transition: 'opacity 0.3s',
      }}
    />
  );
}
