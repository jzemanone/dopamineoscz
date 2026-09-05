import React from 'react';

export interface LogoProps {
  variant?: 'full' | 'icon-only';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  subtitle?: string;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
  subtitle,
}) => {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const textSizes = {
    sm: 'text-sm sm:text-base',
    md: 'text-base sm:text-lg',
    lg: 'text-lg sm:text-xl',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Neon Neural Brain SVG */}
      <div className={`relative flex items-center justify-center shrink-0 ${iconSizes[size]}`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full filter drop-shadow-[0_0_6px_rgba(249,115,22,0.6)]"
        >
          {/* Left Hemisphere */}
          <path
            d="M45 20C32 20 22 28 22 42C22 49 25 54 22 62C19 70 26 80 38 80C42 80 45 77 45 72V20Z"
            stroke="#F97316"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Right Hemisphere */}
          <path
            d="M55 20C68 20 78 28 78 42C78 49 75 54 78 62C81 70 74 80 62 80C58 80 55 77 55 72V20Z"
            stroke="#F97316"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Neural Synapse Nodes & Circuits */}
          <circle cx="34" cy="35" r="3.5" fill="#FDBA74" />
          <circle cx="30" cy="55" r="3.5" fill="#FDBA74" />
          <circle cx="40" cy="68" r="3.5" fill="#FDBA74" />
          <circle cx="66" cy="35" r="3.5" fill="#FDBA74" />
          <circle cx="70" cy="55" r="3.5" fill="#FDBA74" />
          <circle cx="60" cy="68" r="3.5" fill="#FDBA74" />

          <path
            d="M34 35L45 42M30 55L45 52M40 68L45 62"
            stroke="#F97316"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M66 35L55 42M70 55L55 52M60 68L55 62"
            stroke="#F97316"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {variant === 'full' && (
        <div className="flex flex-col min-w-0">
          <span className={`font-black tracking-tight text-white leading-tight ${textSizes[size]}`}>
            Dopamine <span className="text-orange-400">OS</span>
          </span>
          {subtitle && (
            <span className="text-[9px] sm:text-[10px] font-medium text-slate-400 leading-none truncate">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
