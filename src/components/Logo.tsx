import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className = '', size }: LogoProps) {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <img
        src="/images/logosaloka.svg"
        alt="Saloka.id"
        style={size ? { width: size, height: size } : undefined}
        className="w-full h-full object-contain aspect-square select-none pointer-events-none"
      />
    </div>
  );
}
