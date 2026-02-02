// Sem import React no topo!
import type { FC } from 'react'; 
import logoImg from '@/assets/logo.png';

interface LogoProps {
  showText?: boolean;
  className?: string;
  light?: boolean;
}

export const Logo: FC<LogoProps> = ({ showText = true, className = "h-12", light = false }) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <img src={logoImg} alt="Logo" className="h-full w-auto object-contain" />
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={`font-bold ${light ? 'text-white' : 'text-ap-blue-dark'}`}>ANESTESIA</span>
          <span className={`font-medium ${light ? 'text-blue-100' : 'text-ap-blue-light'}`}>PIRACICABA</span>
        </div>
      )}
    </div>
  );
};