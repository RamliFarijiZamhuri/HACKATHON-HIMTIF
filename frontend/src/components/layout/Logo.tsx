import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 32 }) => {
  return (
    <img
      src="/assets/logo.png"
      alt="UNPAM Space Logo"
      width={size}
      height={size}
      className={`shrink-0 object-contain ${className}`}
      id="unpam-space-brand-logo"
      draggable={false}
    />
  );
};
