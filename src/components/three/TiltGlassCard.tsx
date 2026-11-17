import React, { useRef } from 'react';

interface TiltGlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export const TiltGlassCard: React.FC<TiltGlassCardProps> = ({ children, className = '' }) => {
  const cardRef = useRef<HTMLDivElement | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${(-y * 9).toFixed(2)}deg) rotateY(${(x * 11).toFixed(2)}deg) translateZ(6px)`;
  };

  const handleMouseLeave = () => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`glass-panel glass-card-hover rounded-2xl will-change-transform ${className}`}
    >
      {children}
    </div>
  );
};
