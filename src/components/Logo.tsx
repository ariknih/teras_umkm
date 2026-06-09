import React from 'react';

interface LogoProps {
  className?: string;
}

export function Logo({ className = '' }: LogoProps) {
  return (
    <div className={`w-24 h-32 relative ${className}`}>
        <div className="size-20 left-[9.81px] top-[8.89px] absolute bg-green-900 rounded-full shadow-[inset_0px_0px_30px_0px_rgba(0,39,21,0.60)]" />
        <div className="w-5 h-4 left-[62.19px] top-[23.11px] absolute bg-white" />
        <div className="w-3.5 h-6 left-[53.04px] top-[23.11px] absolute bg-yellow-400" />
        <div className="w-3 h-4 left-[42.11px] top-[23.11px] absolute bg-white" />
        <div className="w-3.5 h-4 left-[29.38px] top-[23.11px] absolute bg-yellow-400" />
        <div className="w-5 h-4 left-[16.65px] top-[23.11px] absolute bg-white" />
        <div className="w-3 h-2 left-[16.65px] top-[39.94px] absolute bg-blend-hard-light bg-linear-128 from-gray-600/40 to-gray-600/0" />
        <div className="w-3 h-2 left-[29.38px] top-[39.95px] absolute bg-blend-hard-light bg-linear-134 from-orange-800/40 to-orange-800/0" />
        <div className="w-3 h-2 left-[42.11px] top-[39.95px] absolute bg-blend-hard-light bg-linear-128 from-gray-600/40 to-gray-600/0" />
        <div className="w-3.5 h-2 left-[54.83px] top-[39.95px] absolute bg-blend-hard-light bg-linear-134 from-orange-800/40 to-orange-800/0" />
        <div className="w-3 h-2 left-[67.56px] top-[39.95px] absolute bg-blend-hard-light bg-linear-128 from-gray-600/40 to-gray-600/0" />
        <div className="w-12 h-5 left-[24.79px] top-[53.30px] absolute bg-white shadow-[0px_4px_8px_0px_rgba(0,39,21,0.60)]" />
    </div>
  );
}
