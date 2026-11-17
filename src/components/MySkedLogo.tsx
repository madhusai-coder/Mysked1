import React from 'react';

interface MySkedLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const MySkedLogo: React.FC<MySkedLogoProps> = ({ size = 'md', showText = true }) => {
  const iconDims = size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-10 h-10' : 'w-8 h-8';
  const textDims = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';

  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 select-none">
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${iconDims} shrink-0`}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="mysked-grad" x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="50%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#A855F7" />
          </linearGradient>
        </defs>
        <rect x="3" y="6" width="34" height="31" rx="9" fill="url(#mysked-grad)" fillOpacity="0.14" stroke="url(#mysked-grad)" strokeWidth="2.2" />
        <path d="M3 15.5H37" stroke="url(#mysked-grad)" strokeWidth="2" />
        <path d="M13 3.5V9.5M27 3.5V9.5" stroke="url(#mysked-grad)" strokeWidth="2.4" strokeLinecap="round" />
        <path
          d="M14 25.5L18.2 29.5L26.5 21"
          stroke="url(#mysked-grad)"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showText && (
        <span className={`font-display font-extrabold tracking-tight ${textDims} text-slate-900 dark:text-white`}>
          My<span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">Sked</span>
        </span>
      )}
    </span>
  );
};
