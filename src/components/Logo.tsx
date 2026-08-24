import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  variant?: 'full' | 'icon' | 'text';
  alt?: string;
}

export function Logo({ className = '', size, variant = 'icon', alt = 'Saloka.id' }: LogoProps) {
  const getSrc = () => {
    switch (variant) {
      case 'full':
        return '/images/Variant=Full.webp';
      case 'text':
        return '/images/Variant=Text.webp';
      case 'icon':
      default:
        return '/images/Variant=Icon.webp';
    }
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <img
        src={getSrc()}
        alt={alt}
        style={size ? { width: size, height: size } : undefined}
        className="w-full h-full object-contain select-none pointer-events-none"
      />
    </div>
  );
}

