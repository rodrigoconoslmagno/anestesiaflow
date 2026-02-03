import logoImg from '@/assets/logo.png';

interface LogoProps {
  showText?: boolean;
  className?: string;
  light?: boolean;
  // Adicionada a propriedade size que estava faltando
  size?: 'extrasmall' | 'small' | 'medium' | 'large';
}

export const Logo: React.FC<LogoProps> = ({ 
    showText = true, 
    className = "", 
    light = false,
    size = 'medium'
  }) => {
    // Mapeamento de alturas baseado no size
    const sizeClasses = {
      extrasmall: 'h-6',
      small: 'h-8',
      medium: 'h-12',
      large: 'h-16'
    };

    return (
      <div className={`flex items-center gap-3 select-none ${sizeClasses[size]} ${className}`}>
        <img 
          src={logoImg} 
          alt="Logo Anestesia Piracicaba" 
          className="h-full w-auto object-contain"
        />
  
        {showText && (
          <div className="flex flex-col justify-center leading-tight">
            <span className={`
              font-bold text-sm md:text-base lg:text-lg uppercase tracking-tighter
              ${light ? 'text-white' : 'text-[#003366]'}
            `}>
              Anestesia
            </span>
            <span className={`
              font-medium text-[10px] md:text-xs lg:text-sm -mt-1
              ${light ? 'text-blue-100' : 'text-blue-500'}
            `}>
              Piracicaba
            </span>
          </div>
        )}
      </div>
    );
};